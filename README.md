# Õhtuleht Toolkit

A modular set of internal tools for the Õhtuleht newsroom and ad sales: banner generators, a brand manual, and small automation utilities. Each tool is a self-contained module; new ones are added over time.

## Modules

| Module | Purpose | Status |
|---|---|---|
| Banner generator | Build content-marketing banner zips (articles slider, static ad, image slider) without Swiper | Planned, Phase 1 |
| Brand manual | Copy colours (HEX, RGB, HSL...), download logos (SVG, PNG, black, white) | Planned, Phase 0b |
| Article bookmarklet | Copy an article as a snippet from the live site | Exists (legacy), v2 planned |
| Article API (Cloudflare Worker) | Fetch article title/image from a URL | Planned, Phase 2 |
| Hosted banners + login | Banners served by URL, Microsoft login | Planned, Phase 3 |
| Task tracker | Unified briefs for banner requests, optional Outlook sync | Planned, Phase 4 ([spec](docs/TASK-TRACKER.md)) |
| Legacy tools | Image cropper, two-article story generator, CapCut template, movie banner, video ZIP, podcast story | Exist in `tools/`, migrated one by one |

Full plan: [docs/ROADMAP.md](docs/ROADMAP.md).

## Documentation

| Document | Read it to... |
|---|---|
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Learn the daily git flow (issue, branch, PR) with exact commands |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Understand repo layout, the banner zip format, and how to add a module |
| [docs/BANNERS.md](docs/BANNERS.md) | See each banner format's rules, sizes, weight limits, ad-server notes |
| [docs/BRAND-MANUAL.md](docs/BRAND-MANUAL.md) | See the brand manual spec and the `brand.json` data format |
| [docs/BOOKMARKLET.md](docs/BOOKMARKLET.md) | Install and use the article bookmarklet |
| [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md) | Follow working advice and checklists |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Know the rules for changes and reviews |
| [CHANGELOG.md](CHANGELOG.md) | See what changed and when |

## Run locally

Requires Node.js 20+ and Yarn. Use Yarn only; never `npm` or `npx`.

```bash
yarn install
yarn dev
```

> The app code is not scaffolded yet. These commands start working once the Phase 0 workspace issue is merged. Until then the repo holds documentation and legacy files.

## Build

```bash
yarn build
```

## What to upload

Upload the **contents of `dist/`** (each app builds its own `dist/`) to a static host. No server code is needed for Phases 0-1.

## Environment variables

None in Phases 0-1. Phase 2 (Cloudflare Worker) will document its variables in `apps/api/.env.example`. Real `.env` files are never committed.

## Server settings

| Setting | Value |
|---|---|
| HTTPS | Required (ad servers and bookmarklet need it) |
| CORS | Static apps need none. Phase 2 Worker allows only the toolkit's own origin |
| Caching | `index.html`: `no-cache`. Hashed assets in `assets/`: `max-age=31536000, immutable` |
| Fallback | A static `feed.json` always works if the API is down |

## Open items

See [docs/ROADMAP.md](docs/ROADMAP.md#open-questions) and the GitHub issues list.
