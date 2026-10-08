# Deploying Mangaso on Vercel (frontend + API + free Postgres)

> The React app and the Express API now live on one Vercel project. The API runs as a serverless function at `/api`, sessions are stored in Postgres, and only Vercel talks to the database.

_Last updated: 2026-10-08_

## How it fits together

```text
browser ──► mangaso.vercel.app/            React app (client/dist)
        └─► mangaso.vercel.app/api/...     api/index.mjs ──► server/src/app.js ──► Postgres
```

- `vercel.json` builds the client and rewrites `/api/*` to the function.
- `VITE_API_URL=/api` (client/.env.production) makes the app call its own domain, so no CORS and no cross-site cookies.
- Visitors never connect to the database host. Only the function does.

## One-time setup

### 1. Create a free Postgres database
Use Neon (neon.tech) or Supabase. Copy the **pooled** connection string, which looks like
`postgres://user:password@host/dbname?sslmode=require`.

### 2. Create the tables and load the data (on your machine)
Add to `server/.env` (keep your existing `CLIENT_ID` for MyAnimeList):

```env
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
```

Then:

```bash
cd server
node scripts/init-db.js                       # tables, sessions, rate limits (safe to rerun)
node src/apiFetching/db_fetching_promise.js   # fills manga from MyAnimeList
```

Free tiers hold about 500 MB, so load a few thousand titles rather than everything.

Import settings (environment variables, all optional):

| Variable | Default | Meaning |
|---|---|---|
| `ETL_BATCH` | 3 | titles per batch |
| `ETL_CONCURRENCY` | 3 | requests to MyAnimeList at the same time |
| `ETL_TIMEOUT_MS` | 20000 | how long to wait for MyAnimeList (it can take 10+ s over a VPN) |

### 3. Configure Vercel
- **Settings → General → Root Directory**: change `client` to the repository root (empty).
- **Settings → Environment Variables** (Production and Preview):
  - `DATABASE_URL` — the same connection string
  - `SESSION_SECRET` — a long random string
  - `PEPPER` — any random string (the database is new, so no old hashes depend on it)
  - `DB_SSL` — leave unset. The database certificate is checked by default; set
    `no-verify` only for a provider whose certificate is signed by a private CA.
- Push this branch and open the preview URL first.

### 4. Check it
Open `https://<your-domain>/api/health`. You should see `{"ok":true,"database":true}`.
If `database` is false, the `error` field says why (wrong URL, firewall, SSL).

## Upgrading an existing database

Rerun `node scripts/init-db.js` after pulling changes that add a SQL file. It skips
the files whose tables already exist and creates only the new ones (for example
`rate_limit.sql`). Until it runs, login rate limiting is off but everything else works.

## Running locally

```bash
cd server && npm run dev        # API on :3000 (also answers on /api)
cd client && npm run dev        # set VITE_API_URL=http://localhost:3000 in .env.development
```

## Tests

The API tests start the real Express app against a throwaway Postgres in Docker.
They wipe that database, so they refuse to run against anything but localhost.

```bash
cd server
npm run test:db                     # starts postgres:16-alpine on 127.0.0.1:55432 (data in RAM)
TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:55432/manga_test npm test
npm run test:db:stop
```

Client checks: `cd client && npm run lint && npm run build`.
