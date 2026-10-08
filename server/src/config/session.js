import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import db from "./db.js";
import "./env.js";

const PgStore = connectPgSimple(session);

// Serverless functions do not share memory, so the default in-memory session
// store would forget every login between requests. Sessions live in Postgres
// instead (table defined in sql/sessions.sql).
const sessionConfig = {
  store: new PgStore({
    pool: db,
    tableName: "session",
    createTableIfMissing: false,
    // No background timer in a function; expired rows are harmless.
    pruneSessionInterval: false,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // The site and the API share one origin (/api), so Lax is enough and
    // no cross-site cookie is needed any more.
    sameSite: "lax",
    maxAge: 3600 * 1000 * 24 * 7, // 7 days
  },
};

export { session, sessionConfig };
