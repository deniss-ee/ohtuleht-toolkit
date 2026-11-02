# Security

This repository and the site built from it are **public today**. That is fine as long as the rules below hold. When visibility changes ([docs/AUTH-MICROSOFT.md](docs/AUTH-MICROSOFT.md)), the rules stay.

## Rules

1. **No secrets in the repository.** No `.env` files, API keys, tokens, passwords, client secrets, private keys. `.gitignore` blocks `.env*`, `*.pem` and the folder of client banners. A secret that was committed once is leaked: change it, do not just delete the commit.
2. **No secrets in browser code.** Everything in `apps/generator` is downloaded by every visitor. Secrets belong in the Worker (`yarn wrangler secret put NAME`), never in a `VITE_` variable.
3. **No personal or customer data in the repository.** The new-employee guide shows people, phone numbers, passwords, Wi-Fi and amounts as `[[key]]` placeholders; the real values live in the private database table `guide_values` and are served only after login ([docs/GUIDE.md](docs/GUIDE.md)).
4. **No real customer material.** Client banners, pictures, contracts and campaign data are never committed (`/banners*/` is ignored). Use made-up samples.
5. **Test data only until login exists.** The API runs with `AUTH_MODE=open`. Do not enter real clients or briefs ([docs/CLOUDFLARE.md](docs/CLOUDFLARE.md)).
6. **Never send test data to real production endpoints** (real mail, campaign or ad-server APIs).

## What is not secret (and may be in the repository)

- The Cloudflare Worker address and the D1 database id.
- Microsoft Entra **client (application) ID** and **tenant (directory) ID** of a single-page app. They identify the app; they cannot sign anyone in on their own.
- The brand colours, logos and fonts.

## Checks before a pull request

```bash
git grep -nIiE "github_pat_|ghp_|BEGIN (RSA|PRIVATE)|client_secret|password ?[:=]" -- . ':!docs/*' ':!*.lock'
```

Nothing should come out except placeholder wording. Also read the diff for names, phone numbers, personal e-mail addresses and amounts.

## Reporting a problem

If you find a secret or personal data in the repository: tell the owners (IT) at once, **do not** open a public issue with the details, rotate the secret first, and only then clean the history.

## Known limits (2026-11-02)

- The API has no login. Anyone with its address can read and change briefs and clients.
- GitHub Pages cannot hide the site from the public.
- There is no automated security scan or dependency update bot yet (turn on GitHub Dependabot alerts after the transfer).
