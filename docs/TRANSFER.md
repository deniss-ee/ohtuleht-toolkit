# Taking over the Õhtuleht Toolkit

For the people who will own and run this project from now on (IT). Written when the repository was handed over by its author, a designer at Õhtuleht; the project was built with an AI assistant. Read this once, then use [README.md](README.md) as the index.

## In one minute

- A web app with banner makers, small tools, the brand manual and a new-employee guide. React + Vite, built to static files. No server needed for the tools themselves.
- One small API on Cloudflare (Worker + D1 database) stores briefs, clients and private guide values. It is in **test mode without login**.
- The site is **public** today (GitHub Pages) and so is the repository.
- **Not done:** Microsoft login, sending mail as the person, Scoro link, lint/tests/CI, a final home for the site.

## What exists, and who owns it

Fill in the "After" column during the handover.

| Thing | Today | After |
|---|---|---|
| Source code, issues, pull requests | GitHub repository `deniss-ee/ohtuleht-toolkit` (public), personal account of the author | |
| The website | GitHub Pages, branch `gh-pages`, `https://deniss-ee.github.io/ohtuleht-toolkit/`, published by hand | |
| API and database | Cloudflare account of the author's company login; Worker `ohtuleht-api`, D1 database `ohtuleht-db` | |
| Address of the API | `https://ohtuleht-api.ohtuleht-api.workers.dev` (free `workers.dev` address) | |
| Domain / DNS | None for the toolkit yet | |
| Microsoft Entra app registration | None yet | |
| Scoro | No access yet; clients are kept by hand (CSV import ready) | |
| Design source | Figma (brand hub and header designs), see the table at the end | |

## Secrets and personal access

There are **no secrets in the repository** (checked 2026-11-02) and none are needed by the running site. What exists outside the repository:

| What | Where it is | What to do |
|---|---|---|
| A fine-grained GitHub token used by the AI assistant (personal, expires 2026-11-05) | The author's computer and chat history | The author revokes it: GitHub, Settings, Developer settings, Personal access tokens |
| Cloudflare login used with `wrangler login` | The author's computer (OAuth token in the user profile) | Invite IT as members of the Cloudflare account first, then the author runs `yarn wrangler logout` |
| Cloudflare account membership | The author's company e-mail | Move to a shared/company-owned owner (see below) |
| `ALLOWED_ORIGINS`, `AUTH_MODE` (Worker variables) | `apps/api/wrangler.jsonc` | Not secret; change when the site address changes |
| Future: Entra client IDs | Not created | Not secrets (see [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)); a client secret, if ever used, goes into `wrangler secret put`, never into the repository |

## Moving the repository (stays on GitHub, new owner)

1. In the repository: Settings, General, bottom of the page, **Transfer ownership**. Give the new organisation. GitHub keeps issues, pull requests, labels, milestones and the history, and redirects the old address.
2. Make the new owners admins; the author becomes a normal contributor (or leaves).
3. **Change the addresses that contain the old owner name** (search for `deniss-ee`):
   - `apps/generator/src/lib/bookmarklet.ts`: `LIVE_URL` (the bookmarks open this site).
   - `apps/api/wrangler.jsonc`: `ALLOWED_ORIGINS` (the origin of the new site).
   - `apps/generator/src/lib/sync.ts`: `API_URL` if the API address changes.
   - Documents that name the old site address ([README.md](../README.md), [DEPLOY.md](DEPLOY.md), [CLOUDFLARE.md](CLOUDFLARE.md), [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)).
   - The `@deniss-ee` in `.github/CODEOWNERS`, if you enable it.
4. GitHub Pages: after a transfer the address becomes `https://<new-owner>.github.io/ohtuleht-toolkit/`. If the site moves to Cloudflare (below) this does not matter.
5. Turn on **branch protection** for `develop` and `main` (pull request required, no direct pushes). Public repository: free.
6. Decide the **licence** (there is no `LICENSE` file). For internal-only code a "no licence, all rights reserved" note in the README is enough; an open licence must be an explicit decision.

## Moving the API (Cloudflare)

1. Cloudflare dashboard, Manage account, Members: invite the IT administrators as **Super Administrator**.
2. Better: create the account under a shared company e-mail and move the Worker there: deploy again from `apps/api` with `yarn wrangler deploy` (step by step in [CLOUDFLARE.md](CLOUDFLARE.md)), export and import the data:
   ```bash
   yarn wrangler d1 export ohtuleht-db --remote --output=backup.sql
   ```
3. The `workers.dev` address contains the account's subdomain name. A new account means a new address: update `API_URL` and `ALLOWED_ORIGINS` (see above).
4. Put the real data behind login **before** anybody enters customer data. Until then use test data only.

## Decisions IT has to make

| Question | Options and notes |
|---|---|
| Who may see the site and the repository? | Public as today, or internal only. See the comparison in [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#1-who-may-see-what) |
| Where does the site live? | GitHub Pages cannot hide anything from the public. For an internal site: Cloudflare Workers static assets + Cloudflare Access, or a company server with single sign-on ([DEPLOY.md](DEPLOY.md)) |
| Is the mail Microsoft 365 (Exchange Online) or a server? | Sending as the person uses Microsoft Graph, which needs Exchange Online |
| Entra app registration | Needed for login and sending mail: values in [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#3-what-it-needs-to-create) |
| Company address for the site and the API | For example `toolkit.<company domain>` and `/api` on the same address |
| Scoro | Read access to clients (API key) through the Worker; until then CSV import |
| CI | Typecheck, build and the 3 KB runtime budget on every pull request (issues #5, #6) |

## Known limits and risks

- **The API has no login** (`AUTH_MODE=open`). Anyone who knows its address can read and change briefs and clients. Private guide values are not stored or served in this mode on purpose. Test data only.
- **Publishing is manual** (a script of git commands in [DEPLOY.md](DEPLOY.md)). Automate it once the final host is chosen.
- **No automated tests and no CI.** Checks are `yarn typecheck`, `yarn build`, the runtime size budget, and looking at the result.
- **Estonian interface text** is a first draft, not read by a native speaker.
- **Banner request and Task tracker** are switched off (`ready: false` in `nav`, see [TASK-TRACKER.md](TASK-TRACKER.md)).
- **Guide**: screenshots are placeholders; names, phone numbers, passwords and amounts exist only as `[[keys]]` and must be filled in the private backend after login ([GUIDE.md](GUIDE.md)).
- **Old tools** are archived in `tools/legacy/` (not maintained). The tag `legacy-tools-final` has the older ones that were rebuilt.
- Issues #9 and #11 are open although their core work is done: close them when you agree.

## First week

1. Read this file and [ARCHITECTURE.md](ARCHITECTURE.md); run `yarn install && yarn dev`.
2. Transfer the repository and the Cloudflare account (above). Revoke the author's token.
3. Turn on branch protection; add a simple CI (issues #5, #6).
4. Decide visibility and hosting, then follow [DEPLOY.md](DEPLOY.md) and [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md).
5. Create the Entra app registration and tell the author the IDs.
6. Look through the open issues and close or re-plan them (`gh issue list`).

## Where things are

| Need | Look at |
|---|---|
| Brand colours, logos, fonts | `packages/brand/brand.json` is the single source; shown in the app's Brand manual |
| All interface text | `apps/generator/src/content.en.ts` and `content.et.ts` ([LANGUAGES.md](LANGUAGES.md)) |
| Guide text | `apps/generator/src/guide-content.ts` ([GUIDE.md](GUIDE.md)) |
| Banner templates and checks | `packages/templates` |
| The API | `apps/api` ([CLOUDFLARE.md](CLOUDFLARE.md)) |
| What is planned | [ROADMAP.md](ROADMAP.md) and the GitHub issues |

## Figma references

| What | File key | Node |
|---|---|---|
| Brand hub (colours, fonts, logos) | `Rj3ouvoH1d3YsRLTn0crxA` | `212:333` (logo section frame `212:490`) |
| Ohtuleht 3.0: header designs, page "Rubriigipäised" | `U2Uh9SCqFvHertL18t8nQc` | `83:311`; header `ikea-header-for-claude` = `809:9` |

Figma access is separate from this repository: ask the Õhtuleht design team.
