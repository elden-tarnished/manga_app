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
node scripts/init-db.js                       # tables + session table (safe to rerun)
node src/apiFetching/db_fetching_promise.js   # fills manga from MyAnimeList
```

Free tiers hold about 500 MB, so load a few thousand titles rather than everything.

### 3. Configure Vercel
- **Settings → General → Root Directory**: change `client` to the repository root (empty).
- **Settings → Environment Variables** (Production and Preview):
  - `DATABASE_URL` — the same connection string
  - `SESSION_SECRET` — a long random string
  - `PEPPER` — any random string (the database is new, so no old hashes depend on it)
- Push this branch and open the preview URL first.

### 4. Check it
Open `https://<your-domain>/api/health`. You should see `{"ok":true,"database":true}`.
If `database` is false, the `error` field says why (wrong URL, firewall, SSL).

## Running locally

```bash
cd server && npm run dev        # API on :3000 (also answers on /api)
cd client && npm run dev        # set VITE_API_URL=http://localhost:3000 in .env.development
```
