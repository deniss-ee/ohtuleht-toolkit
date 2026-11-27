# One articles banner for desktop and mobile (design note)

Status: **built** (2026-11-27): the **Download desktop + mobile** button in the articles banner editor, template `packages/templates/src/articles-both.ts`. The separate desktop and mobile downloads stay until the combined one has run on the site.

## Answer: yes

The desktop banner is never narrower than 1248 px, and the mobile one is a phone width (320 to about 700 px). The two never overlap, so the width of the frame the site gives the banner is enough to pick the layout. One zip, one `index.html`, both layouts inside:

- `@media (min-width: 1248px)` shows the desktop layout (header, 4 cards, arrows, optional ad); below it the mobile layout (header, 267x400 cards, dots).
- **Pictures:** each layout keeps its own picture size (`/webp/54/` desktop, `/webp/48/` or the article's own mobile picture). They are CSS backgrounds, and browsers do not download the background of a hidden element, so a phone downloads only the phone pictures.
- **Slider script:** the same runtime drives both sliders. It already measures again when its size changes (`ResizeObserver` in `packages/banner-runtime/src/slider.ts`), so the hidden one starts correctly when a window is resized across 1248 px.
- **Weight:** the HTML is about twice the text of one banner (a few KB); the runtime is shared once. Still far below the budget.

## What has to be built

1. `packages/templates/src/articles-one.ts`: renders both layouts into one page. The two templates use the same class names (`.header`, `.title`, `.badge`), so each layout's CSS is wrapped in its own scope (`.d …` and `.m …`), and the page rules (`html, body`) are merged: no `min-width:1248px` on the page, the dark backgrounds follow the theme.
2. Golden file and tests: the desktop part at 1250 px equals today's desktop banner, the mobile part at 375 px today's mobile banner (same cards, same pictures, same sizes).
3. Editor: the Desktop / Mobile switch stays (it chooses which half the preview shows and which pictures you edit), and the download makes one zip for both. The mobile own pictures and the ad (desktop only) work as today.
4. Old zips of either size open into the combined draft.
5. Docs (`BANNERS.md`), changelog, guide text.

About one working session. The existing two formats stay until the combined one has run on the site.

## Open question for the owner

1. **Does the ad system accept the same zip for the desktop and the mobile placement?** If each placement needs its own upload, the one file is uploaded twice, which is still simpler than two different banners.

# Interface review of the five banner editors (2026-11-27)

Everything works, but the five editors grew one by one and differ in small ways that people notice:

| Seen | Where | Proposal |
|---|---|---|
| Two different top bars: Articles, Image slider and Header bar have their own; Picture loop and Responsive use `ToolShell` | `BannerEditor`, `SliderEditor`, `HeaderBarEditor` | One `EditorShell` for all five (back, name, "to fix" pill, weight, example, download in the same places) |
| Header bar uses plain cards, the others the `Section` blocks with a coloured icon | `HeaderBarEditor` | **Done:** `Section` everywhere |
| Up / down buttons: chevrons in Articles, arrows elsewhere; two button sizes | lists | **Done:** arrows and the small size in every list; grip and big picture on hover in every list. Still to do: One row component for every list (grip, number, picture with zoom, name, up, down, remove), started with `useDragSort` and `ZoomPicture` |
| "Try an example" appears in different places | top bars | In the shared top bar, same place everywhere |

These are behaviour-preserving refactors (phase 3 of [REFACTOR.md](REFACTOR.md), "one editor frame"); each is one small pull request.
