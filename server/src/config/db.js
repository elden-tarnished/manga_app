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

function createPool(overrides = {}) {
  const { host, config } = readTarget();
  const useSsl = process.env.DB_SSL !== "false" && !LOCAL_HOSTS.has(host);

  const pool = new pg.Pool({
    ...config,
    // Every serverless instance opens its own pool, so keep it small.
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 30000,
    // A cold function talking to a remote database needs more than 2 s.
    connectionTimeoutMillis: 10000,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    ...overrides,
  });

  // An error on an idle client must not crash the process.
  pool.on("error", (error) => {
    console.error("Postgres pool error:", error.message);
  });

  return pool;
}

const db = createPool();

export { createPool };
export default db;
