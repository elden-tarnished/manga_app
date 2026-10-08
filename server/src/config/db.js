import pg from "pg";
import "./env.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

// Accept either one DATABASE_URL (what Neon / Supabase hand out) or the older
// DB_HOST / DB_USER / ... variables. `sslmode` is stripped from the URL because
// pg-connection-string would otherwise override the `ssl` option set below.
function readTarget() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return {
      host: process.env.DB_HOST,
      config: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      },
    };
  }
  const url = new URL(rawUrl);
  url.searchParams.delete("sslmode");
  return { host: url.hostname, config: { connectionString: url.toString() } };
}

// DB_SSL=false      no TLS (a local database)
// DB_SSL=no-verify  TLS without checking the certificate (only for a provider
//                   whose certificate is signed by its own private CA)
// default           local hosts: no TLS; remote hosts: TLS and the certificate
//                   must be valid, so nobody in between can pose as the database
function sslOption(host) {
  const mode = process.env.DB_SSL ?? (LOCAL_HOSTS.has(host) ? "false" : "verify");
  if (mode === "false") return false;
  return { rejectUnauthorized: mode !== "no-verify" };
}

function createPool(overrides = {}) {
  const { host, config } = readTarget();

  const pool = new pg.Pool({
    ...config,
    // Every serverless instance opens its own pool, so keep it small.
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 30000,
    // A cold function talking to a remote database needs more than 2 s.
    connectionTimeoutMillis: 10000,
    ssl: sslOption(host),
    ...overrides,
  });

  // An error on an idle client must not crash the process.
  pool.on("error", (error) => {
    console.error("Postgres pool error:", error.message);
  });

  return pool;
}

// Runs `work(client)` inside one transaction on ONE connection.
// pool.query() may pick a different connection for every call, so BEGIN,
// the statements and COMMIT must all go through the same checked-out client.
async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    client.release();
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
      client.release();
    } catch (rollbackError) {
      // The connection is in an unknown state: throw it away, not back in the pool.
      client.release(rollbackError);
    }
    throw error;
  }
}

const db = createPool();

export { createPool, withTransaction };
export default db;
