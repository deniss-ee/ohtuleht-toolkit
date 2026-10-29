# Toolkit web app (generator)

Web app of the toolkit, in English and Estonian (EN/ET switch). Sections: **Content marketing** (Articles 1250x400, Articles mobile, Header bar), **Tools** (Image cropper, Movie banner) and **Brand manual** (colours and logos). Other banner types are listed on the start screen as "Coming soon".

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

The Header bar, Image cropper, Movie banner and Brand manual work the same way; see [HEADER-BAR.md](../../docs/HEADER-BAR.md), [IMAGE-CROPPER.md](../../docs/IMAGE-CROPPER.md), [MOVIE-BANNER.md](../../docs/MOVIE-BANNER.md) and [BRAND-MANUAL.md](../../docs/BRAND-MANUAL.md). Interface text: [LANGUAGES.md](../../docs/LANGUAGES.md).

**Load example** fills a sample campaign for trying things out.

## Environment variables

None.

## Server settings

HTTPS. No CORS needs; the app is fully static. Article images are loaded from `p.ohtuleht.ee` by the banner itself.

## Open items

- Old Swiper banners open (articles type). Old mobile banners and image sliders do not yet (#36); a static ad on an old banner is left out (#35).
- Fetching an article by URL needs the Phase 2 Worker.
- Other banner types: static ad (#35), image slider (#36).
- Header font and size options (#64). Brand typography and ad formats pages (#18).
- The Estonian wording is a first draft: a native speaker should read it.
