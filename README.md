# Õhtuleht Toolkit

A modular set of internal tools for the Õhtuleht newsroom and ad sales. Each tool is a self-contained module; new ones are added over time. The interface is in English and Estonian (EN / ET switch).

## What you can do with it

| Section | What it makes |
|---|---|
| **Home** | The first page: short intro, cards for every banner, tool and brand page, tips, and "Continue where you left off" |
| **Content marketing** | Article banners (desktop 1250x400 and mobile) and the header bar for theme pages, as zips for the ad server |
| **Tools** | **Image cropper** (any picture to a 1920x1080 JPG) and **Movie banner** (video on a picture, two zips) |
| **Brand manual** | Brand colours (copy in many formats) and logos (SVG, PNG) |

Try it: run it locally (below) or open the published site once it is set up ([docs/DEPLOY.md](docs/DEPLOY.md)).

**Working on this with an AI assistant?** Start with [CLAUDE.md](CLAUDE.md) and [docs/HANDOFF.md](docs/HANDOFF.md). They hold the rules, the current state and ready-made start prompts.

## Modules

| Module | Purpose | Status |
|---|---|---|
| Banner generator: Articles 1250x400 | Form, live preview, article cards, zip export and re-open. Slider without Swiper | **Built** ([docs](docs/BANNERS.md)) |
| Banner generator: mobile articles | Swipeable cards with dots, as wide as the phone | **Built** ([docs](docs/BANNERS.md)) |
| Banner generator: other formats | Static ad, image slider | Planned (issues #35, #36) |
| Old Swiper zip import | Open banners made before this tool (articles type), edit, export without Swiper | **Built** ([docs](docs/BANNERS.md#opening-old-swiper-banners)) |
| Header bar | The 100% wide, 46 px bar for theme pages (iframe): html + css zip, iframe code | **Built** ([docs](docs/HEADER-BAR.md)) |
| Brand manual | Colours (copy as HEX/RGB/HSL/CSS/Tailwind, contrast, token export), 6 logo variants (SVG, PNG, safe zone, sizes) and the 3 brand fonts (samples, weights, Estonian letters, CSS) | **Colours, logos and fonts built** ([docs](docs/BRAND-MANUAL.md)); ad formats planned (#18) |
| Tools: Image cropper | Any picture onto a 1920x1080 canvas (fit, fill, original, custom width, blurred or colour background), JPG | **Built** ([docs](docs/IMAGE-CROPPER.md)) |
| Tools: Movie banner | Video on a background picture, two zips (1250 and 1280) for the ad server | **Built** ([docs](docs/MOVIE-BANNER.md)) |
| Interface languages | English and Estonian, EN/ET switch in every top bar | **Built** ([docs](docs/LANGUAGES.md)) |
| Article bookmarklet v2 | Copy an article as a snippet from the live site | **Built** ([docs](docs/BOOKMARKLET.md)) |
| Article API (Cloudflare Worker) | Fetch article title and picture from a URL | Planned, Phase 2 |
| Hosted banners + login | Banners served by URL, Microsoft login | Planned, Phase 3 |
| Task tracker | Unified briefs for banner requests, optional Outlook sync | Planned, Phase 4 ([spec](docs/TASK-TRACKER.md)) |
| Legacy tools | Two-article story generator, CapCut template, video ZIP, podcast story, article scrapper | Exist in `tools/`, migrated one by one. The image cropper and movie banner are rebuilt in the toolkit (their old folders stay as reference) |

Full plan: [docs/ROADMAP.md](docs/ROADMAP.md).

## Direct links

The address after the `?` follows the app, so any place can be sent to a colleague. Add it to the site address (for example `https://deniss-ee.github.io/ohtuleht-toolkit/`):

| Link | Opens |
|---|---|
| *(nothing, or `?section=home`)* | The Home page: what is here, one click to everything |
| `?section=content` | Content marketing |
| `?section=content&make=header-bar` | A new header bar (also `articles-1250x400`, `articles-mobile`) |
| `?section=tools` | Tools |
| `?section=tools&tool=image-cropper` | Image cropper (also `movie-banner`) |
| `?section=brand&tab=colours` | Brand manual, colours (or `tab=logos`, `tab=fonts`) |
| add `&lang=et` | Estonian for that visit (`lang=en` for English) |

Example: `?section=tools&tool=movie-banner&lang=et`. The address changes by itself while you click around, so you can also just copy it from the address bar. The browser Back button works.

## Documentation

| Document | Read it to... |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Give an AI assistant the project rules and commands |
| [docs/HANDOFF.md](docs/HANDOFF.md) | See the current state, next steps, start prompts, new-computer checklist |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Learn the daily git flow (issue, branch, PR) with exact commands |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Understand repo layout, the banner zip format, and how to add a module |
| [docs/BANNERS.md](docs/BANNERS.md) | See each banner format's rules, sizes, weight limits, ad-server notes |
| [docs/HEADER-BAR.md](docs/HEADER-BAR.md) | Make the header bar for theme pages and get its iframe code |
| [docs/BRAND-MANUAL.md](docs/BRAND-MANUAL.md) | See the brand manual, the colour and logo rules, and `brand.json` |
| [docs/LANGUAGES.md](docs/LANGUAGES.md) | Add or change interface text in English and Estonian |
| [docs/IMAGE-CROPPER.md](docs/IMAGE-CROPPER.md) | Use the image cropper (1920x1080 JPG) |
| [docs/MOVIE-BANNER.md](docs/MOVIE-BANNER.md) | Make the movie banner (video on a picture, two zips) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Publish the toolkit online with GitHub Pages |
| [docs/BOOKMARKLET.md](docs/BOOKMARKLET.md) | Install and use the article bookmarklet |
| [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md) | Follow working advice and checklists |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Know the rules for changes and reviews |
| [CHANGELOG.md](CHANGELOG.md) | See what changed and when |

## Repository layout

```
apps/generator/            the web app (React, Vite, Tailwind v4, shadcn/ui)
packages/banner-runtime/   slider script for banners (about 1.7 KB gzip)
packages/templates/        banner and header-bar templates, colour logic
packages/brand/            brand.json and the logo SVGs
tools/bookmarklet/         the article bookmarklet
tools/, category/   legacy tools (kept as they are)
docs/                      documentation
```

## Run locally

Requires Node.js 20+ and Yarn 1. Use Yarn only; never `npm` or `npx`.

```bash
yarn install
yarn dev
```

Open http://localhost:5173. `yarn dev` first builds the banner runtime, which is inlined into every banner.

Other useful commands:

```bash
yarn typecheck                                  # generator
yarn workspace @ohtuleht/templates typecheck    # also banner-runtime and brand
yarn workspace @ohtuleht/banner-runtime dev     # slider test page, port 5174
yarn workspace @ohtuleht/banner-runtime size    # runtime size budget (3 KB gzip)
```

## Build

```bash
yarn build
```

## What to upload

On GitHub Pages this happens by itself ([docs/DEPLOY.md](docs/DEPLOY.md)). By hand:

The **contents of `apps/generator/dist/`** to a static host. No server code is needed yet. The banners and header bars the tool produces are separate zips that go to the ad server or to `b.ohtuleht.ee`.

## Environment variables

None so far. Phase 2 (Cloudflare Worker) will document its variables in `apps/api/.env.example`. Real `.env` files are never committed.

## Server settings

| Setting | Value |
|---|---|
| HTTPS | Required (ad servers and the bookmarklet need it) |
| CORS | The static app needs none. The Phase 2 Worker will allow only the toolkit's own origin |
| Caching | `index.html`: `no-cache`. Hashed files in `assets/`: `max-age=31536000, immutable` |
| Fallback | A static `feed.json` will always work if the API is down |

## Open items

See [docs/HANDOFF.md](docs/HANDOFF.md#open-questions-for-the-user), [docs/ROADMAP.md](docs/ROADMAP.md#open-questions) and the GitHub issues list.
