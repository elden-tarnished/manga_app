// Creates the tables on an empty database: node scripts/init-db.js
// Reads DATABASE_URL (or DB_* variables) from server/.env, runs the SQL files
// in order, and skips a file whose tables already exist, so it is safe to rerun.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../src/config/db.js";

const sqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/sql");
const files = ["structure.sql", "users.sql", "sessions.sql", "rate_limit.sql"];
const DUPLICATE_TABLE = "42P07";

try {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), "utf8");
    try {
      await db.query(sql);
      console.log(`ok       ${file}`);
    } catch (error) {
      if (error.code !== DUPLICATE_TABLE) throw error;
      console.log(`skipped  ${file} (tables already exist)`);
    }
  }
} finally {
  await db.end();
}
