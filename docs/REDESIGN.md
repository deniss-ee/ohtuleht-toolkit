# Redesign plan

Status: **step 1, choosing a direction** (2026-11-27). The owner marks three directions hot, warm or cold on a comparison page; the next round mixes what was liked.

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
