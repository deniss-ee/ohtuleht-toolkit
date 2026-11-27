# Architecture

How the toolkit is put together today (2026-11-16). Where it is heading: [REFACTOR.md](REFACTOR.md).

## Principles

1. **Simplest thing that works.** Banners are plain HTML, CSS and vanilla JS with zero dependencies. React is used only in the app that makes them; it is never shipped to an ad server.
2. **Everything runs in the browser.** The banner tools need no server: pictures are optimised, zips are built and opened on the person's own computer.
3. **Data apart from code.** Interface text, brand values and guide text live in their own files.
4. **A banner zip is self-describing.** Its `index.html` carries the settings it was made from, so it can be opened and changed again.
5. **Static first, dynamic later.** Every planned dynamic feature keeps a static fallback.
6. **Yarn only.**

## Layout

```
apps/
  generator/        The web app: React 19 + Vite + Tailwind v4 + shadcn/ui. One app, static dist/
  api/              Cloudflare Worker + D1 database: briefs, clients, guide values (test mode, no login yet)
packages/
  banner-runtime/   Vanilla TS compiled to one small script (slider), plus fx.js for the 3D effects
  templates/        HTML/CSS templates of every banner kind, colour logic, validation, messages, types
  brand/            brand.json (colours, logos, fonts, clear space), optimised logo SVGs, helpers
tools/
  bookmarklet/      Sources of the two bookmarks (article snippet, article scraper)
  legacy/           Archived old stand-alone tools (not part of the build)
  *.mjs             Scripts for the documents (guide tables, link check)
docs/               Documentation (index: docs/README.md)
```

## How the pieces talk

```
browser (the static app)  ->  api Worker  ->  D1 database
        |                          ^
        |  (planned) Microsoft login: the app gets a token, the Worker checks it
        +--> Microsoft Graph /me/sendMail  (planned: send mail as the person)
```

Only briefs, clients and guide values use the API ([CLOUDFLARE.md](CLOUDFLARE.md)). Everything else is local.

## Inside the app

| Part | Where | What it does |
|---|---|---|
| Shell | `src/App.tsx`, `src/layout/AppShell.tsx` | Which page is open, which draft is being edited, the menu, the address |
| Address | `src/lib/route.ts` | `?section=...&tool=...&tab=...&make=...&topic=...&step=...&lang=...`; the list of pages comes from `nav` in `content.en.ts` (`ready: false` switches a page off) |
| Text | `src/content.en.ts`, `content.et.ts`, read through `content.ts` | Every interface string, same keys in both ([LANGUAGES.md](LANGUAGES.md)) |
| Pages | `src/pages/` | One file per page or tool |
| Shared parts | `src/components/editor/` | Article list, preview frame (`SwapFrame`), colour picker, editor frame (`ToolShell`), form parts |
| Logic | `src/lib/` | One module per banner kind, plus zip, storage, picture optimiser, old-zip readers |
| Saved work | `src/lib/storage.ts` | One slot in `localStorage` (`ol-work`): the banner being edited, kept between visits |

### The five banner kinds

Each kind has a **draft** (the settings plus the chosen files), a **template** that turns the settings into `index.html`, an **editor** page, and functions to build and open its zip.

| Kind | Formats | Draft and zip code | Template | Editor |
|---|---|---|---|---|
| `banner` | `articles-1250x400`, `articles-mobile` | `lib/banner.ts`, `lib/zip.ts` | `articles-1250x400.ts`, `articles-mobile.ts` | `BannerEditor` |
| `slider` | `image-slider-1250x400`, `image-slider-600x500` | `lib/slider.ts` | `image-slider.ts` | `SliderEditor` |
| `frames` | `frame-banner` (picture loop) | `lib/frames.ts` | `frame-banner.ts` | `FrameBannerEditor` |
| `responsive` | `responsive-banner` | `lib/responsive.ts` | `responsive-banner.ts` | `ResponsiveBannerEditor` |
| `header` | `header-bar` | `lib/header.ts` | `header-bar.ts` | `HeaderBarEditor` |

Old Swiper zips made before this tool are read by `lib/legacy.ts`, `legacyExtra.ts` and `legacySlider.ts`; they return a draft plus notes for the person to check ([BANNERS.md](BANNERS.md)).

The kinds were built one after another and repeat each other (five draft shapes, five importers tried in turn in `App.tsx`). Unifying them is phase 2 of [REFACTOR.md](REFACTOR.md).

### Adding a banner type (today)

1. Template, types, validation and messages in `packages/templates/src/`; export them in `index.ts`.
2. `apps/generator/src/lib/<kind>.ts`: draft, new draft, example, preview and export render, zip build and import, zip name.
3. `apps/generator/src/pages/<Kind>Editor.tsx`, built on `ToolShell`.
4. Wire it in: `App.tsx` (new work, open zip, render), `lib/storage.ts` (the `Work` type, save, load), `lib/route.ts` (`MAKE_IDS`), `components/editor/ContinueCard.tsx`, `pages/Home.tsx`, `pages/ContentMarketingHome.tsx`.
5. Texts in both content files (`bannerTypes`, the editor's own section, home items).
6. A document in `docs/`, a row in [docs/README.md](README.md), [BANNERS.md](BANNERS.md) and the root README, a line in `CHANGELOG.md`.

Adding a **tool** (no zip to reopen) is simpler: a page in `src/pages/`, an entry in `tools` in the content files, the page switch in `App.tsx`, a card in `Home.tsx`.

## Banner zip format

```
my-campaign_1250x400_16nov26.zip
  index.html     CSS and JS inlined, the settings embedded
  header.webp    Header picture (when the header is a picture)
  logo.svg       Header logo (optional)
  ad.jpg         Static ad picture (desktop articles banner with an ad)
  pic-ab12cd.jpg A picture uploaded for one article (optional, any number)
```

Other kinds carry their own files (slides, frames, videos with their stills); each tool's document lists them. `index.html` contains a machine-readable block:

```html
<script type="application/json" id="ol-banner">{ ...the settings... }</script>
```

The banner itself never reads it. **Upload zip** reads it and restores the form exactly. The header bar uses the id `ol-header`. Zips without the block are treated as old banners.

## The articles banner settings

```json
{
  "v": 1,
  "format": "articles-1250x400",
  "campaign": "Example campaign",
  "primary": "#f50000",
  "header": { "type": "image", "src": "header.webp", "avg": "#8a0aa6", "href": "https://example.com/campaign" },
  "theme": {
    "light": { "bg": "#ffffff", "text": "#272727", "hover": "#e3000f" },
    "dark":  { "bg": "#0f0f0f", "text": "#ffffff", "hover": "#e3000f" }
  },
  "badge": "Sisuturundus",
  "behavior": { "shuffle": true, "autoplay": true, "delayMs": 3000, "speedMs": 250, "loop": true },
  "articles": [
    { "url": "https://www.ohtuleht.ee/1169772/", "title": "...", "image": "https://p.ohtuleht.ee/webp/54/i/2026/10/26/t1ovwidw.aju.jpg", "imageMobile": "pic-ab12cd.jpg", "badge": "Kontsert", "badgeColor": "#0a7a3d" }
  ]
}
```

- `primary` drives the header and the default label colour. In each theme `badge` and `headerBg` are optional overrides; without them the label colour is the main colour lightened or darkened until it is readable (contrast 4.5:1).
- Each article may carry its own `badge` text and `badgeColor`.
- **Pictures:** `image` is the desktop picture; `imageMobile` (optional) is the phone picture. Either is a web address or the name of an uploaded file in the zip (`pic-<id>.<ext>`). Without `imageMobile` the phone banner uses the `/webp/48/` form of `image`; the desktop banner never uses `/webp/48/`. The full rule: [BANNERS.md](BANNERS.md#article-pictures).
- `header.textInPicture` exists only in banners opened from old zips (the picture already has the name on it).
- Fields are checked by `packages/templates/src/validate.ts`, which returns plain-language problems with the form field they belong to.

## ClickTag

The ad server passes `clickMacro` and `clickTag` in the query string. Every template includes the same fixed helper (`packages/templates/src/clicktag.ts`):

```js
var olBanner = {
  getQueryStringValue: function (key) { /* reads the query string */ },
  getClickTag: function (url) { /* clickMacro + url, or clickTag */ }
};
```

It is never typed by hand and cannot be edited in the app. Every clickable element calls `olBanner.getClickTag(url)`.

## Banner runtime

One small script, no dependencies, inlined into the banners that slide.

| Feature | Rule |
|---|---|
| Shuffle | Fisher-Yates on load, before first paint, when `behavior.shuffle` is true |
| Slider | Active only when there are more articles than fit (4 on desktop) |
| Loop | Infinite, with cloned edge items and `transform` |
| Input | Arrow buttons, touch swipe, mouse drag, keyboard, dots (mobile) |
| Motion | Autoplay runs by default; `respectMotion` and `pauseOnHover` are opt-in |
| Theme | CSS variables; dark values under `prefers-color-scheme: dark` |
| 3D effects | Ring and cube for the image slider live in a second script (`fx.js`), inlined only when used |
| Budget | 3 KB gzip (1.7 KB today): `yarn workspace @ohtuleht/banner-runtime size` |

The picture loop and the pictures of the responsive banner use no script at all: their fade is pure CSS ([FRAME-BANNER.md](FRAME-BANNER.md)).

## Editor flow

```
Start -> [Upload zip | New banner | Continue where you left off] -> Form -> Preview -> Download zip
```

- Below 1024 px one column; from 1024 px the form on the left and the preview on the right.
- "To fix" links open the field that has the problem (the `ol-reveal` event, see `goTo`).
- The preview is an iframe of the real banner (`SwapFrame` swaps two frames so it never flickers), with light and dark and the sizes of the format.
- The weight pill shows the zip's page and files against the budget.
- Pictures chosen in a form are optimised in the browser (`lib/optimise.ts`, jSquash WebAssembly, loaded only when needed).

## Where article data comes from

1. The bookmark (runs on the article page, so no CORS problem) gives a snippet to paste ([BOOKMARKLET.md](BOOKMARKLET.md)).
2. Typing by hand.
3. Planned: paste an article address, read by the Worker (issues #119, #42).

## Technology choices

| Need | Choice | Why |
|---|---|---|
| Banner | Plain HTML/CSS/JS | Ad servers need tiny files |
| App | React 19 + Vite + Tailwind v4 + shadcn/ui (Radix) | Much state: forms, lists, live preview |
| Zip | JSZip | Mature, runs in the browser |
| Picture optimiser | jSquash (MozJPEG, OxiPNG) | The Squoosh codecs, nothing is uploaded |
| Icons | lucide-react | Tree-shaken, one style |
| Backend | Cloudflare Worker + D1 | Free tier is enough, the site is already behind Cloudflare |
| Login (planned) | Microsoft Entra ID | Company accounts |

Check the current version and documentation of a library before adding or upgrading it.
