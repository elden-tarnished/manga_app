import "./setup-env.js";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { format } from "node:util";
import app from "../src/app.js";
import db from "../src/config/db.js";
import { createAgent, resetDatabase, startServer } from "./helpers.js";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STRONG_PASSWORD = "Sup3r#Secret";

let server;
let base;

before(async () => {
  await resetDatabase(db);
  ({ server, base } = await startServer(app));
});

after(async () => {
  server.close();
  await db.end();
});

async function signupAndLogin(username, ip) {
  const request = createAgent(base, { ip });
  const signup = await request("POST", "/user/signup", {
    username,
    email: `${username}@example.com`,
    password: STRONG_PASSWORD,
  });
  assert.equal(signup.status, 201, JSON.stringify(signup.data));
  const login = await request("POST", "/user/login", { username, password: STRONG_PASSWORD });
  assert.equal(login.status, 200, JSON.stringify(login.data));
  return request;
}

describe("health check", () => {
  test("reports a working database", async () => {
    const res = await createAgent(base)("GET", "/health");
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, { ok: true, database: true });
  });

  test("does not show the raw database error to visitors", async () => {
    // A second copy of the app pointed at a port where nothing listens.
    const child = spawn(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const { default: app } = await import("./src/app.js");
         const s = app.listen(0, "127.0.0.1", async () => {
           const r = await fetch("http://127.0.0.1:" + s.address().port + "/api/health");
           console.log(JSON.stringify({ status: r.status, body: await r.text() }));
           process.exit(0);
         });`,
      ],
      {
        cwd: serverDir,
        env: {
          ...process.env,
          DATABASE_URL: "postgres://nobody:wrong@127.0.0.1:1/nothing",
          TEST_DATABASE_URL: "",
        },
      },
    );
    let out = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    await new Promise((resolve) => child.on("exit", resolve));
    const { status, body } = JSON.parse(out.trim().split("\n").pop());
    assert.equal(status, 503);
    assert.doesNotMatch(body, /ECONNREFUSED|127\.0\.0\.1|nobody/);
  });
});

describe("unknown URLs", () => {
  test("answer with JSON, not an HTML error page", async () => {
    const res = await createAgent(base)("GET", "/does-not-exist");
    assert.equal(res.status, 404);
    assert.deepEqual(res.data, { error: "Not found" });
  });
});

describe("login and signup", () => {
  test("logging in never writes the password to the logs", async () => {
    const lines = [];
    const originals = {};
    for (const level of ["log", "info", "warn", "error", "debug"]) {
      originals[level] = console[level];
      console[level] = (...args) => lines.push(format(...args));
    }
    try {
      await signupAndLogin("logcheck", "198.51.100.1");
      await createAgent(base, { ip: "198.51.100.1" })("POST", "/user/login", {
        username: "logcheck",
        password: "Wrong#Pass99",
      });
    } finally {
      Object.assign(console, originals);
    }
    const logs = lines.join("\n");
    assert.ok(!logs.includes(STRONG_PASSWORD), "the correct password was logged");
    assert.ok(!logs.includes("Wrong#Pass99"), "a wrong password was logged");
  });

  test("the signup page can check a password without being logged in", async () => {
    const res = await createAgent(base)("POST", "/user/validate-password", { password: "short" });
    assert.equal(res.status, 200);
    assert.equal(res.data.valid, false);
    assert.ok(res.data.errors.length > 0);
  });

  test("too many login attempts from one address are slowed down", async () => {
    const request = createAgent(base, { ip: "203.0.113.7" });
    const statuses = [];
    for (let i = 0; i < 12; i++) {
      const res = await request("POST", "/user/login", { username: "nobody", password: "Wrong#Pass99" });
      statuses.push(res.status);
    }
    assert.equal(statuses[0], 401);
    assert.equal(statuses.at(-1), 429, `statuses: ${statuses.join(",")}`);
    // Another visitor is not affected.
    const other = await createAgent(base, { ip: "203.0.113.8" })("POST", "/user/login", {
      username: "nobody",
      password: "Wrong#Pass99",
    });
    assert.equal(other.status, 401);
  });

  test("signup rejects an email address without a domain", async () => {
    const res = await createAgent(base, { ip: "198.51.100.9" })("POST", "/user/signup", {
      username: "mailcheck",
      email: "not-an-email",
      password: STRONG_PASSWORD,
    });
    assert.equal(res.status, 400);
  });

  test("login keeps working before the rate_limit table exists", async () => {
    await db.query("alter table rate_limit rename to rate_limit_hidden");
    const originalError = console.error;
    console.error = () => {};
    try {
      const res = await createAgent(base, { ip: "198.51.100.10" })("POST", "/user/login", {
        username: "nobody",
        password: "Wrong#Pass99",
      });
      assert.equal(res.status, 401);
    } finally {
      console.error = originalError;
      await db.query("alter table rate_limit_hidden rename to rate_limit");
    }
  });

  test("a session whose user was deleted acts like being logged out", async () => {
    const request = await signupAndLogin("ghost", "198.51.100.2");
    await db.query("delete from users where username = 'ghost'");
    const list = await request("GET", "/manga?limit=5");
    assert.equal(list.status, 200);
    const me = await request("GET", "/user/user");
    assert.equal(me.status, 401);
  });
});

describe("manga list paging", () => {
  const get = (url) => createAgent(base)("GET", url);

  test("a non-number limit falls back to the default", async () => {
    const res = await get("/manga?limit=abc");
    assert.equal(res.status, 200);
    assert.equal(res.data.page.length, 50);
  });

  test("a negative page becomes page 1", async () => {
    const res = await get("/manga?page=-3&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.data.pageNum, 1);
    assert.equal(res.data.page[0].id, 1);
  });

  test("a page past the end returns the last page, not an empty one", async () => {
    const res = await get("/manga?page=99999&limit=60");
    assert.equal(res.status, 200);
    assert.equal(res.data.maxPageNum, 5);
    assert.equal(res.data.pageNum, 5);
    assert.equal(res.data.page.length, 10);
  });

  test("a huge limit is capped", async () => {
    const res = await get("/manga?limit=100000");
    assert.equal(res.status, 200);
    assert.ok(res.data.page.length <= 200, `got ${res.data.page.length} rows`);
  });

  test("totalCount is a number and id-only rows are not listed", async () => {
    const res = await get("/manga?limit=10");
    assert.equal(res.data.totalCount, 250);
  });

  test("genre filters still work", async () => {
    const res = await get("/manga?genre=Action&limit=60");
    assert.equal(res.status, 200);
    assert.equal(res.data.totalCount, 10);
  });

  test("an id-only row has no detail page and is not recommended", async () => {
    assert.equal((await get("/manga/9999")).status, 404);
    const detail = await get("/manga/1");
    assert.equal(detail.status, 200);
    assert.deepEqual(
      detail.data.recommendedManga.map((m) => m.id),
      [2],
    );
  });
});

describe("search", () => {
  test("% and _ are searched literally, not as wildcards", async () => {
    const res = await createAgent(base)("GET", "/search?q=%25");
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, []);
  });

  test("normal search still works", async () => {
    const res = await createAgent(base)("GET", "/search?q=title%2012");
    assert.equal(res.status, 200);
    assert.ok(res.data.some((m) => m.title === "Title 12"));
  });
});

describe("profile update", () => {
  test("a failed update is rolled back completely, even when the server is busy", async () => {
    // Make any update that sets this e-mail fail inside the database, after
    // the username update in the same request has already run.
    await db.query(`
      create or replace function reject_boom() returns trigger language plpgsql as $$
      begin
        if new.email = 'boom@example.com' then raise exception 'boom'; end if;
        return new;
      end $$;
      create trigger users_reject_boom before update on users
        for each row execute function reject_boom();
    `);
    const request = await signupAndLogin("alice", "198.51.100.3");
    const browse = createAgent(base);

    for (let round = 0; round < 10; round++) {
      // Other visitors keep every pooled connection busy until the update is done,
      // so each freed connection is handed straight to someone else's query.
      let busy = true;
      const visitor = async () => {
        while (busy) await browse("GET", "/manga?limit=24");
      };
      const traffic = Array.from({ length: 20 }, visitor);
      const res = await request("PATCH", "/user", {
        username: `alice_${round}`,
        email: "boom@example.com",
      });
      busy = false;
      await Promise.all(traffic);
      assert.equal(res.status, 500);
      const { rows } = await db.query("select username from users where email = 'alice@example.com'");
      assert.equal(rows[0].username, "alice", `round ${round}: half of a failed update was saved`);
    }

    const { rows } = await db.query(
      "select count(*)::int as n from pg_stat_activity where state like 'idle in transaction%'",
    );
    assert.equal(rows[0].n, 0, "a pooled connection was left inside an open transaction");
    await db.query("drop trigger users_reject_boom on users");
  });

  test("a valid update is saved", async () => {
    const request = await signupAndLogin("bob", "198.51.100.4");
    const res = await request("PATCH", "/user", { username: "bobby" });
    assert.equal(res.status, 200);
    const me = await request("GET", "/user/user");
    assert.equal(me.data.username, "bobby");
  });
});
