# Toolkit web app (generator)

The web app of the toolkit, in English and Estonian (EN/ET switch): a static React 19 + Vite + Tailwind v4 + shadcn/ui site. Sections: **Home**, **Content marketing** (articles banners, image sliders, header bar), **Tools** (image cropper, movie banner, article scraper, picture link converter, email signature, tracking links), **Brand manual** (colours, logos, fonts, eye), **Guide** (new-employee handbook), and, switched off for now, **Banner request** and **Task tracker**. The overview with links to every document is in the [root README](../../README.md) and [docs/README.md](../../docs/README.md).

## Run locally

```bash
yarn install
yarn dev
```

Open `http://localhost:5173`. `yarn dev` first builds the banner runtime (`packages/banner-runtime`) because it is inlined into every banner.

## Build

```bash
yarn build
```

## What to upload

The contents of `apps/generator/dist/` to a static host.

## How to use

1. Content marketing -> **Create** on a banner type, or **Upload zip** to edit a banner made with this tool.
2. Fill in campaign name, header (image or colour, plus link), badge text, colours (light and dark), behaviour.
3. Add articles: paste snippets (JSON lines or the old HTML slide snippets), or add manually; reorder or remove.
4. Check the live preview (light/dark) and the file weight meter.
5. **Download zip**. The button enables when there are no problems listed.

The other tools work the same way and each has its document in [docs/README.md](../../docs/README.md). Interface text: [LANGUAGES.md](../../docs/LANGUAGES.md); guide text: [GUIDE.md](../../docs/GUIDE.md).

**Load example** fills a sample campaign for trying things out.

## Environment variables

None are required. Optional, set at build time (not secret, they end up in the build): `VITE_API_URL` (address of the API, default is the Worker in `lib/sync.ts`).

## Server settings

HTTPS. The app is static. It calls the API (`lib/sync.ts`), which must allow the site's address (`ALLOWED_ORIGINS` in `apps/api/wrangler.jsonc`). Article images are loaded from `p.ohtuleht.ee` by the banner itself.

## Open items

- Fetching an article by number needs a Worker route (#119, [CLOUDFLARE.md](../../docs/CLOUDFLARE.md)).
- Microsoft login, then switching on Banner request and Task tracker ([AUTH-MICROSOFT.md](../../docs/AUTH-MICROSOFT.md)).
- Header font and size options (#64). Ad-format reference in the brand manual (#18).
- The Estonian wording is a first draft: a native speaker should read it.
- No automated tests yet (#5, #6).
