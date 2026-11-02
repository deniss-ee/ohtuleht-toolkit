# Õhtuleht Toolkit

Internal tools for the Õhtuleht newsroom, ad sales and marketing, in one web app: banner makers, small helpers, the brand manual and a handbook for new employees. The interface is in English and Estonian (EN / ET switch).

> **Status: work in progress.** The banner tools and the brand manual are in daily use. The Guide is being finished. Banner request and Task tracker are built but switched off until Microsoft login exists. See [docs/ROADMAP.md](docs/ROADMAP.md).

**Taking over this repository?** Start with [docs/TRANSFER.md](docs/TRANSFER.md). Everything else is indexed in [docs/README.md](docs/README.md).

## What is in it

| Section | What you can do | State |
|---|---|---|
| **Home** | One page with a card for everything, a search box (press `/`), "continue where you left off" | Live |
| **Content marketing** | Make banner zips for the ad server: articles banner (desktop 1250x400, optional static ad; mobile), image slider (desktop and mobile), **picture loop** (pictures that fade into each other instead of a GIF, fixed or responsive), header bar for theme pages. Open and convert old Swiper banners | Live |
| **Tools** | Image cropper (1920x1080 JPG), Movie banner (video on a picture), Article scraper and Picture link converter (marketing), Email signature, Tracking links (UTM) | Live |
| **Brand manual** | Colours (copy in many formats), logos (SVG, PNG), fonts, the brand eye generator | Live |
| **Guide** | Handbook for new employees: first-days checklist, steps with screenshot placeholders | In progress ([docs/GUIDE.md](docs/GUIDE.md)) |
| **Banner request**, **Task tracker** | Unified request for banner jobs, a board with clients, one tidy email text | Built, **switched off** ([docs/TASK-TRACKER.md](docs/TASK-TRACKER.md)) |

## Where it runs

| Part | Where | How it is updated |
|---|---|---|
| The web app (static files) | GitHub Pages, `https://deniss-ee.github.io/ohtuleht-toolkit/` today. The target is Cloudflare ([docs/DEPLOY.md](docs/DEPLOY.md)) | By hand from `develop` |
| The API (briefs, clients, guide values) | Cloudflare Worker `ohtuleht-api` with a D1 database, in **test mode without login** ([docs/CLOUDFLARE.md](docs/CLOUDFLARE.md)) | `yarn wrangler deploy` in `apps/api` |
| Microsoft login and sending mail | Not built. Plan and options: [docs/AUTH-MICROSOFT.md](docs/AUTH-MICROSOFT.md) | |

The repository and the current site are **public**. Never commit secrets, customer material or real personal data ([SECURITY.md](SECURITY.md)).

## Run it locally

Needs Node.js 20 or newer and Yarn 1. Use Yarn only; never `npm` or `npx`.

```bash
yarn install
yarn dev            # http://localhost:5173
```

| Command | What it does |
|---|---|
| `yarn build` | Builds the app into `apps/generator/dist/` (upload that folder) |
| `yarn typecheck` | Type check of the app |
| `yarn workspace @ohtuleht/banner-runtime dev` | Slider test page, port 5174 |
| `yarn workspace @ohtuleht/banner-runtime size` | Fails when the slider script is over its 3 KB budget |
| `yarn guide:docs` | Rebuilds the guide's screenshot table and key list in `docs/` |
| `yarn docs:check` | Checks every link and anchor in the Markdown files |
| `cd apps/api && yarn wrangler dev` | Runs the API locally (needs no account) |

## Repository layout

```
apps/
  generator/            the web app: React 19, Vite, Tailwind v4, shadcn/ui
  api/                  Cloudflare Worker + D1 database (briefs, clients, guide values)
packages/
  banner-runtime/       the slider script inside every banner (about 1.7 KB gzip)
  templates/            banner and header-bar HTML/CSS templates, colour logic, validation
  brand/                brand.json (colours, logos, fonts) and the logo SVGs
tools/
  bookmarklet/          source of the two bookmarks (article snippet, article scraper)
  legacy/               old stand-alone tools, archived (see its README)
  guide-docs.mjs        generates docs/GUIDE-SCREENSHOTS.md and docs/GUIDE-VALUES.md
docs/                   documentation (index: docs/README.md)
.github/                issue and pull request templates
```

## Direct links

The address follows the app, so any place can be sent to a colleague. Add it to the site address:

| Link | Opens |
|---|---|
| *(nothing)* | Home |
| `?section=content&make=header-bar` | A new header bar (also `articles-1250x400`, `articles-mobile`, `image-slider-1250x400`, `image-slider-600x500`, `frame-banner`) |
| `?section=tools&tool=image-cropper` | A tool (also `movie-banner`, `article-scraper`, `picture-converter`, `email-signature`, `utm-builder`) |
| `?section=brand&tab=colours` | Brand manual (also `logos`, `fonts`, `eye`) |
| `?section=guide&topic=esimene-paev&step=3` | A topic of the guide, scrolled to its step |
| add `&lang=et` | Estonian (`lang=en` for English) |

## How we work

Issue, branch from `develop`, pull request into `develop`, squash merge. `main` is for releases. Details in [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/WORKFLOW.md](docs/WORKFLOW.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

The project was built with an AI assistant (Claude Code). The rules it follows are in [CLAUDE.md](CLAUDE.md); you do not need it to work on the code ([docs/AI-ASSISTANT.md](docs/AI-ASSISTANT.md)).
