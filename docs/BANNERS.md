# Banners

Specification for every banner format the generator produces.

## Delivery constraints

| Item | Rule |
|---|---|
| Delivery | Zip with `index.html` at the root, or a hosted URL tag (Phase 3) |
| Weight | About 100 KB without images (soft limit). The generator shows the live total |
| External requests | Fonts (Google Fonts) and article images from `p.ohtuleht.ee` only |
| ClickTag | Fixed helper in every template; never edited by hand. See [ARCHITECTURE.md](ARCHITECTURE.md#clicktag) |
| Libraries | None. Swiper is removed |
| Browsers | Current Chrome, Safari, Firefox, Edge; iOS Safari; Android Chrome |
| Accessibility | Arrows are `<button>` with labels, keyboard focus visible. Autoplay ignores the OS "reduce motion" setting by default (as existing banners do); `respectMotion` and `pauseOnHover` are opt-in switches |
| Dark mode | Supported through `prefers-color-scheme: dark` |

## Format 1: Articles 1250x400 (first to build)

Reference: `content-marketing/st_KultuurSygis_2710-1250x400`, rebuilt without Swiper, light and dark.

**Layout**

| Part | Value |
|---|---|
| Banner width | 1250 px (content max 1248 px) |
| Header | 46 px high, image or solid colour, links to a campaign URL |
| Gap under header | 16 px |
| Card image | 215 px high, 6 px radius, cover |
| Badge | Over the image bottom-left, text per campaign (default "Sisuturundus") |
| Title | Fira Sans Condensed 700, 20/24, up to the card width |
| Card gap | 16 px |

**Behaviour**

| Rule | Value |
|---|---|
| Minimum articles | 2 (generator blocks export below this) |
| Visible at once | up to 4 |
| More than 4 | Arrows appear; slider with autoplay and infinite loop |
| 4 or fewer | Static row, no arrows, no autoplay |
| Shuffle | On by default (checkbox in generator). Runs in the banner on each view |
| Autoplay | Default delay 2500 ms, speed 250 ms; editable |
| Click | Whole card opens the article via ClickTag; header opens the header link |

**Per-campaign colours (all editable, light and dark)**

Badge colour, hover colour, header background (image or colour), title colour, page background. The Kultuurisügis values (`#9500b2`, `#e3000f`, `#003784`) are only this campaign's preset.

## Format 2: Articles 1250x400 with static ad

Reference: `content-marketing/st_Autopay0810_1250x400`.

- A fixed ad image with its own ClickTag URL next to a slider of 3 visible articles (instead of 4).
- Side and size of the ad: from Figma (open question).
- Mobile: every Nth slide is the ad (N to be decided).

## Format 3: Image slider (client banners)

Reference: `content-marketing/dacia_ol-1250x400-noswiper`.

- Client background image plus a set of slide images (desktop example: 300x250 on a 1250x400 canvas; mobile: 600x500).
- Each slide has its own URL; the background has its own URL.
- Slider position and size are form fields (x, y, width, height, gap, visible count).
- Transition: `slide` (default), `fade`, `cube` (CSS 3D, about 1 KB).
- Drag and touch supported; arrows optional.

## Format 4: Articles 600x500 mobile

Design is changing; build after the new Figma exists.

- Full-bleed image, bottom gradient, white badge and title, arrows.
- Fonts per brand manual (Inter proposed for mobile; provisional).

## Figma to banner handoff

1. Name colours and text styles like tokens (`badge`, `hover`, `title`).
2. Provide the header as an image or a solid colour, with its link URL.
3. Provide light and dark values.
4. State the format size and card counts.
5. Export imagery as WebP or optimised JPEG; SVG through SVGO.
6. Animations are exported from Figma (SVG or Lottie); the runtime only triggers them.

## QA checklist per banner

- [ ] Exact pixel size correct
- [ ] 2, 4 and 5+ articles tested
- [ ] Shuffle on and off
- [ ] Light and dark
- [ ] Arrows, drag, keyboard
- [ ] ClickTag test with `?clickMacro=...` and `?clickTag=...`
- [ ] No console errors
- [ ] File weight recorded in the PR
