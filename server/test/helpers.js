import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const sqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/sql");

// Fresh schema plus a small, predictable data set:
// 250 complete manga, one id-only stub (9999) like the import script leaves
// behind, a few genres, and recommendations from manga 1 to manga 2 and the stub.
export async function resetDatabase(db) {
  await db.query("drop schema public cascade; create schema public;");
  for (const file of fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql")).sort(sqlOrder)) {
    await db.query(fs.readFileSync(path.join(sqlDir, file), "utf8"));
  }
  await db.query(`
    insert into manga (id, title, english_title, popularity, mean, media_type, main_picture_large)
    select i, 'Title ' || i, 'English ' || i, i, 9 - i / 100.0, 'manga', 'https://example.com/' || i || 'l.jpg'
    from generate_series(1, 250) as i;
    insert into manga (id) values (9999);
    insert into genre (id, name, type) values
      (1, 'Action', 'genre'), (2, 'Adventure', 'genre'),
      (3, 'Cars', 'theme'), (15, 'Kids', 'demographic');
    insert into manga_genre (manga_id, genre_id) select i, 1 from generate_series(1, 10) as i;
    insert into recommendation (manga_id, recommendation_id) values (1, 2), (1, 9999);
  `);
}

// structure.sql must run before users.sql (users_favorites references manga).
function sqlOrder(a, b) {
  const rank = (f) => (f === "structure.sql" ? 0 : 1);
  return rank(a) - rank(b) || a.localeCompare(b);
}

export function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}/api` });
    });
  });
}

// A tiny cookie-keeping client, like a browser tab.
export function createAgent(base, { ip } = {}) {
  let cookie = "";
  return async function request(method, url, body) {
    const headers = { "content-type": "application/json" };
    if (cookie) headers.cookie = cookie;
    if (ip) headers["x-forwarded-for"] = ip;
    const res = await fetch(base + url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie();
    if (setCookie.length > 0) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    const text = await res.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON, keep the text
    }
    return { status: res.status, data, headers: res.headers };
  };
}
