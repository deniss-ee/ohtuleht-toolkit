# Cloudflare: API and database

`apps/api` is a Cloudflare Worker (`ohtuleht-api`) with a D1 database (`ohtuleht-db`). It stores briefs and clients so the site can share them between people.

- **Endpoints**: `GET /api/health`, `GET /api/briefs`, `PUT /api/briefs/:id`, `DELETE /api/briefs/:id`, same for `/api/clients`. `PUT` replaces the whole record (last write wins). Code: `apps/api/src/index.ts`. Tables: `apps/api/migrations/`.
- **Safety now**: `AUTH_MODE` is `open` (no login yet), so **only test data**. Browsers on other sites are refused (`ALLOWED_ORIGINS`). A body over 64 KB is refused. Nothing secret is in the repository.
- **Safety later**: `AUTH_MODE=entra` will require a Microsoft login token from the company tenant (waits for IT, see below).
- **Free plan limits** (read 2026-10-30): 100,000 Worker requests per day; D1 5 million rows read and 100,000 rows written per day, 5 GB.

## Set up (once)

```bash
yarn install
cd apps/api
yarn wrangler login                       # browser opens, click Allow
yarn wrangler d1 create ohtuleht-db       # prints a database_id
```

Put the printed `database_id` into `apps/api/wrangler.jsonc` (it is not a secret). Then:

```bash
yarn wrangler d1 migrations apply ohtuleht-db --remote
yarn wrangler deploy                      # prints the address, https://ohtuleht-api.<account>.workers.dev
```

Check: open `<address>/api/health`; it should show `{"ok":true,...}`.

## Local test (no account needed)

```bash
cd apps/api
yarn wrangler d1 migrations apply ohtuleht-db --local
yarn wrangler dev --port 8788
```

## Open items (waiting for IT)

1. Microsoft 365 or an Exchange server? (Graph needs Microsoft 365.)
2. App registration in Entra: single-page app, this tenant only, redirects `https://deniss-ee.github.io/ohtuleht-toolkit/` and `http://localhost:5173/`, delegated `User.Read` and `Mail.Send`. Needed back: Application (client) ID and Directory (tenant) ID (not secrets).
3. Company address for the API (for example `api.ohtuleht.ee`).
