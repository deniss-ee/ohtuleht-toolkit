# Cloudflare: API and database

`apps/api` is a Cloudflare Worker (`ohtuleht-api`) with a D1 database (`ohtuleht-db`). It stores briefs, clients and the private values of the guide so the site can share them between people. The web app calls it through `apps/generator/src/lib/sync.ts`.

> **Test mode.** `AUTH_MODE` is `open`: there is **no login**, so anybody who knows the address can read and change briefs and clients. **Use test data only** until Microsoft login is built ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)). Private guide values are neither stored nor served in this mode.

## What it does

| Endpoint | Meaning |
|---|---|
| `GET /api/health` | `{ "ok": true, "auth": "open" }` |
| `GET /api/briefs`, `PUT /api/briefs/:id`, `DELETE /api/briefs/:id` | Briefs. `PUT` replaces the whole record (last write wins) |
| `GET /api/clients`, `PUT /api/clients/:id`, `DELETE /api/clients/:id` | Clients. A name that already exists (any letter case) answers 409 |
| `GET /api/values`, `PUT /api/values/:key`, `DELETE /api/values/:key` | Private guide values (names, phones, passwords...). **`{}` and refusals while `AUTH_MODE` is `open`** |

Code: `apps/api/src/index.ts`. Tables: `apps/api/migrations/` (`0001_init.sql`: `briefs`, `clients`; `0002_guide_values.sql`: `guide_values`). A record is kept as JSON in a `data` column; the other columns serve sorting.

Safety already built in: browsers on other websites are refused (`ALLOWED_ORIGINS` in `wrangler.jsonc`); a body over 64 KB is refused; ids and keys are checked; nothing secret is in the repository.

## Where it runs today

| | |
|---|---|
| Address | `https://ohtuleht-api.ohtuleht-api.workers.dev` (free `workers.dev` address of the account) |
| Database | `ohtuleht-db`; its id is in `apps/api/wrangler.jsonc` (not secret) |
| Account | The author's company Cloudflare login. To be moved ([TRANSFER.md](TRANSFER.md#moving-the-api-cloudflare)) |
| Free plan limits (read 2026-10-30, check again) | 100,000 Worker requests per day; D1 5 million rows read and 100,000 rows written per day, 5 GB in total, 500 MB per database, 10 databases; KV 100,000 reads and 1,000 writes per day. At the limit D1 refuses queries until 00:00 UTC; the free plan has no surprise bill |

## Work on it

Local (needs no account):

```bash
cd apps/api
yarn wrangler d1 migrations apply ohtuleht-db --local
yarn wrangler dev --port 8788          # http://localhost:8788/api/health
```

Deploy and database:

```bash
cd apps/api
yarn wrangler login                    # once: a browser opens, click Allow
yarn wrangler d1 migrations apply ohtuleht-db --remote
yarn wrangler deploy
yarn wrangler d1 export ohtuleht-db --remote --output=backup.sql    # a backup
```

A new migration is a new numbered file in `apps/api/migrations/`; never edit one that was applied.

Set up from nothing (a new account): `yarn wrangler d1 create ohtuleht-db`, put the printed `database_id` into `wrangler.jsonc`, then apply the migrations and deploy as above. The first request to a new `workers.dev` address can fail for a minute while the certificate is made.

Remove test records: `DELETE /api/briefs/<id>`, `DELETE /api/clients/<id>`.

## How the site uses it

`lib/sync.ts` sends every change of briefs and clients, fetches the lists when the Task tracker opens, when the tab gets the focus again and every 30 seconds, and keeps an outbox for changes made offline. The address is `API_URL` (override with `VITE_API_URL` at build time). Rules for merging are in the comment at the top of that file.

## Becoming the whole site (target)

The same Worker can also serve the built app (Workers static assets) and answer `/api/*`, so the app and the API share one address and need no CORS. Sketch, hosting options, and Cloudflare Access: [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#hosting-that-fits-design-a-cloudflare-workers) and [DEPLOY.md](DEPLOY.md).

## Open items

1. Microsoft login: `authorised()` in `apps/api/src/index.ts` must check the token and set `AUTH_MODE=entra` ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)).
2. A company address for the API, and the final owner of the Cloudflare account.
3. The article-by-number route (issues #40 and #119): `GET /api/article?id=` that reads an ohtuleht.ee article (the site sends no CORS headers, so browsers cannot do it themselves).
4. The Scoro route ([TASK-TRACKER.md](TASK-TRACKER.md#scoro)).
