// Imported first by every test file, before anything loads server/.env.
// dotenv never overwrites a variable that is already set, so pointing
// DATABASE_URL at the test database here keeps the real one out of reach.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Start a throwaway database with `npm run test:db` " +
      "and run `TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:55432/manga_test npm test`.",
  );
}
// The tests drop and recreate the whole schema, so refuse anything remote.
if (!LOCAL_HOSTS.has(new URL(testUrl).hostname)) {
  throw new Error("TEST_DATABASE_URL must point at a local database; the tests wipe it.");
}

process.env.DATABASE_URL = testUrl;
process.env.SESSION_SECRET = "test-session-secret";
process.env.PEPPER = "test-pepper";
process.env.NODE_ENV = "test";
delete process.env.VERCEL;
