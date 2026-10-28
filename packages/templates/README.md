# Banner templates

Turns a banner config into one self-contained `index.html` (CSS, ClickTag helper and runtime inlined).

## Formats

| Template | Status |
|---|---|
| `articles-1250x400` | Built. Rebuild of Kultuurisügis without Swiper, light and dark |
| 1250x400 with static ad, image slider, 600x500 mobile | Planned (see issues) |

## Run locally

```bash
yarn workspace @ohtuleht/banner-runtime build
yarn workspace @ohtuleht/templates example
yarn workspace @ohtuleht/templates serve
```

Open `http://localhost:5175/`. `example-output/` is generated and not committed.

## What to upload

The contents of `example-output/` zipped: `index.html` and `header.png`. The generator app will build this zip itself.

## Notes

- Colours are per campaign (`theme.light` / `theme.dark`); the example uses the Kultuurisügis values.
- `validate()` requires at least 2 articles.
- The ClickTag helper is fixed text in `src/clicktag.ts`; every click goes through it.
- Weight of the example: about 16 KB without article images (budget about 100 KB).

## Open items

- 2 or 3 articles: cards keep the 4-column width, left aligned (open question in docs/ROADMAP.md).
- Header as image uses the legacy 2496x92 PNG; a colour-only header is supported but untested visually.
