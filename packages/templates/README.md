# Banner templates

Turns a banner config into one self-contained `index.html` (CSS, ClickTag helper and runtime inlined).

## Formats

| Template | Status |
|---|---|
| `articles-1250x400` | Built. Desktop slider without Swiper, light and dark, optional static ad on the right |
| `articles-mobile` | Built. Swipeable cards with dots, as wide as the phone |
| `image-slider` | Built. Desktop 1250x400 and mobile 600x500; arc and cube effects |
| `header-bar` | Built. 100% x 46 px page-header bar (`index.html` + `style.css`), iframe code |
| `movie-banner` | Built. A video on a background picture (two zips) |

Also here: `arrows.ts` (the one definition of the slider arrows), `colors.ts` (text-colour rules, readable label colours), `validate.ts` (plain-language problems), `messages.ts` (the problems in English and Estonian), `clicktag.ts`, `escape.ts`, `types.ts`.

## Run locally

```bash
yarn workspace @ohtuleht/banner-runtime build
yarn workspace @ohtuleht/templates example
yarn workspace @ohtuleht/templates serve
```

Open `http://localhost:5175/`. `example-output/` is generated and not committed.

## What to upload

A banner zip is `index.html` plus the header picture (if the header is a picture). The generator app builds this zip itself (`apps/generator/src/lib/zip.ts`).

## Notes

- Colours are per campaign (`theme.light` / `theme.dark`); the example uses the defaults.
- `validate()` requires at least 2 articles.
- The ClickTag helper is fixed text in `src/clicktag.ts`; every click goes through it.
- Weight of the example: run the script, it prints it, without article images (budget about 100 KB).

## Open items

- 2 or 3 articles: cards keep the 4-column width, left aligned (open question in docs/ROADMAP.md).
- Header as image uses the legacy 2496x92 PNG; a colour-only header is supported but untested visually.
