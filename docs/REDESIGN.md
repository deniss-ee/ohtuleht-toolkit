# Redesign plan

Status: **step 2, the look for approval** (2026-11-27). Step 1 is done: the votes are below.

## Why

The toolkit works, but it looks like a default component library and has grown screen by screen. The audit:

| Seen | Effect |
|---|---|
| Red everywhere: a red "Open" button on every card, red icon chips, red tinted strips | Red no longer marks the one important action |
| Boxes in boxes: cards inside cards, dashed and tinted strips, the same border on every block | Nothing leads; screens feel busy |
| Long editor forms | Most visits only change articles or pictures (now helped by Quick edit) |
| Crowded top bars (back, title, size switch, weight, "to fix", example, language, theme, downloads) | Hard to scan, wraps on laptops |
| Five editors built one by one | Small differences people notice ([ONE-ARTICLES-BANNER.md](ONE-ARTICLES-BANNER.md#interface-review-of-the-five-banner-editors-2026-11-27)) |

## The three directions

| | A. Quiet studio | B. Soft canvas | C. Newsroom |
|---|---|---|---|
| Feels like | Linear, Vercel, Notion settings | Figma, Framer, Apple apps | A news front page; pro tools for editors |
| Ground | White, thin grey lines, no shadows | Soft grey with white floating panels | White pages, black top bar, dark editors |
| Home | A calm list grouped by task, search on top | Tiles with a small picture of each banner | A front page: the main job big, the rest smaller |
| Editor | Preview on top, list left, settings in tabs right | Banner in the middle "on a desk", tools floating around | Dark panels around the white banner |

Small details asked about separately (they fit any direction): whole card clickable instead of red "Open" buttons; pictures of the banners on Home; settings in tabs; denser layout; always-dark editors; small motion.

## Votes (step 1)

| Choice | Vote |
|---|---|
| A. Quiet studio | warm |
| B. Soft canvas | **hot** |
| C. Newsroom | cold |
| Pictures of the banners on Home | **hot** |
| Settings in tabs | **hot** |
| Small motion | **hot** |
| Whole card clickable, no red "Open" buttons | warm |
| Denser layout | warm |
| Editors always dark | warm |

## The chosen look (step 2, for approval)

- **Base: B, Soft canvas.** A soft grey ground (`#f2f2f4`; dark `#111113`), white floating panels (radius 18 px, a light two-layer shadow, a hairline edge), fields and switches slightly sunken. No boxes inside boxes.
- **From A: calm.** Brand red 600 only on the main action of a screen (Download); every other button neutral grey. Thin lines inside panels, quiet labels.
- **Navigation:** a slim top bar with the sections as a pill switch, instead of the side menu.
- **Home:** a title and search, then **tiles with a small drawing of each banner**; on the right, Continue, the zip drop area and the tools list.
- **Editor:** three columns: the list on the left (articles or pictures, Ctrl+V box on top), the banner in the middle on a dotted "desk", **settings in tabs** on the right (Campaign, Header, Colours, Behaviour). Status, weight and downloads in the top bar.
- **Small motion:** tiles lift 3 px on hover, buttons 1 px, 150 to 180 ms; off when the system asks for less motion.
- **Warm votes kept as they are today:** normal density; editors follow the theme (dark only in dark mode); tiles are clickable as a whole.

The look with real-size screens in light and dark is on a private comparison page (`Toolkit v2 design system`, shared in the chat on 2026-11-27).

## Rules that stay, whatever is chosen

- Brand colours from `packages/brand/brand.json`; buttons only brand red 600; one primary button per group (`CLAUDE.md`).
- Interface font Inter (DM Mono for codes); Fira only in brand previews and banners.
- Light and dark themes, keyboard use with visible focus, 375 px phones.
- Every text in the content files, Estonian and English.
- No new animation library (plain CSS only); no new UI library: the existing shadcn/ui parts are restyled through the tokens in `apps/generator/src/index.css`.

## Steps

1. **Direction** (now): hot / warm / cold on the comparison page; up to three questions.
2. **Design system**: the chosen mix as tokens (colours, type scale, spacing, radius, shadows) and the base parts (button, card, list row, top bar, side panel, tabs), shown on one page for approval. Optionally in Figma.
3. **Two key screens** built for real: Home and the articles banner editor, published next to the live site at `.../ohtuleht-toolkit/v2/` (`bash tools/publish.sh v2`) to try with real work.
4. **The rest, screen by screen**: Content marketing, the other four editors (with the shared editor frame of [REFACTOR.md](REFACTOR.md) phase 3), Tools, Brand manual, Guide. One pull request per screen; banners themselves do not change (golden files stay byte-identical).
5. **Switch**: when every screen is done, `/v2/` becomes the site; the old look is kept under a tag (`archive/old-look`).

Each step ends with screenshots at 1440 px and 375 px, light and dark.
