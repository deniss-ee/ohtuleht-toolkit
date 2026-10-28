# Banner generator (Content marketing)

Web app for building content-marketing banner zips. Currently builds **Articles 1250x400**. Other banner types are listed on the start screen as "Soon".

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

**Load example** fills a sample campaign for trying things out.

## Environment variables

None.

## Server settings

HTTPS. No CORS needs; the app is fully static. Article images are loaded from `p.ohtuleht.ee` by the banner itself.

## Open items

- Legacy Swiper zips (made before this tool) cannot be opened yet (issue #34).
- Bookmarklet v2 that copies JSON snippets (issue #30); today paste works with JSON and the old HTML snippets.
- Fetching an article by URL needs the Phase 2 Worker.
- Other banner types and the 600x500 mobile template.
- Interface is English only; Estonian comes with Phase 3.
