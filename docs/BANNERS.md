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

## Format 1: Articles 1250x400 (built)

Reference: `content-marketing/st_KultuurSygis_2710-1250x400`, rebuilt without Swiper, light and dark. Template: `packages/templates/src/articles-1250x400.ts`.

**Layout**

| Part | Value |
|---|---|
| Banner width | Fixed 1248 px content in a 1250 px banner; never shrinks when the window is narrower |
| Header | 46 px high, 6 px rounded corners, links to a campaign URL. A colour or a picture, with the campaign name always written on it (see below). Font and size options are planned (issue #64) |
| Gap under header | 16 px |
| Card image | 215 px high, 6 px radius, cover |
| Badge | Over the image bottom-left. Campaign default text (usually "Sisuturundus") and colour; each article can override both |
| Title | Fira Sans Condensed 700, 20/24, up to the card width |
| Card gap | 16 px |

**Header (Figma "ikea-header-for-claude", node 809:9 in the Ohtuleht 3.0 file)**

Bar 1248x46 with 6 px corners, filled with the main colour or with a background picture (picture without text, best 2496x92, scaled to cover). The campaign name is always written on it: Fira Sans Condensed Bold, 16 px, line height 16 px, uppercase, 16 px from the left, vertically centred. The text colour is automatic: on a brand colour the brand rule (black on steps 50 to 500, white from 600 up); on any other colour white, unless the colour is light (relative luminance above 0.55 or HSL lightness above 0.78), then a dark tint of the colour; on a picture, the same choice from the picture's average colour on the left third and can be set by hand in Advanced, Colours. The Figma example is yellow `#FFDB00` with black text.

**Behaviour**

| Rule | Value |
|---|---|
| Minimum articles | 2 (generator blocks export below this) |
| Visible at once | up to 4 |
| More than 4 | Arrows appear; slider with autoplay and infinite loop |
| 4 or fewer | Static row; the cards share the full width (2 articles = two wide cards); no arrows, no autoplay |
| Shuffle | On by default (checkbox in generator). Runs in the banner on each view |
| Autoplay | Default delay 3000 ms, speed 250 ms; editable |
| Click | Whole card opens the article via ClickTag; header opens the header link |

**Per-campaign colours (all editable, light and dark)**

Badge colour (and per-article badge colour), hover colour (red `#e3000f` by default: titles always turn red on hover), header background (image or colour), title colour, page background. The Kultuurisügis values (`#9500b2`, `#e3000f`, `#003784`) are only this campaign's preset.

### Opening old Swiper banners

Upload the old zip (for example `content-marketing/st_KultuurSygis_2710-1250x400`) in the same place as new zips. Needs `index.html`, `style.css` and the header picture; Swiper files are ignored. The files may be at the top of the zip or inside a folder (or two): the shallowest `index.html` is used. This works for every zip the tool opens (banners and header bars).

| Read from | Becomes |
|---|---|
| `.swiper-slide` items: `getClickTag('URL')`, `.img` background, `p.badge`, `p.title` | Articles (link, picture, label, title). The most common label becomes the campaign label |
| `.badge` colour in `style.css` | Main colour. A different dark-mode colour becomes the dark label colour |
| `.header` background colour and `.header` picture | Header colour (shown behind the picture) and header picture |
| `.article:hover .title`, `.title`, dark block (`--bg-color`, `--text-color`) | Hover, title, dark background and text colours |
| `delay`, `speed`, `loop`, `autoplay`, `slidesPerView` in the inline script | Slider settings (visible count above 4 is shortened to 4 by the new template) |
| Page `<title>` without its size | Campaign name (checked by the person) |

**Header text.** Old header pictures have the campaign name baked in. They open with the header option **The picture already has the text on it** ticked, so the name is not written again. Untick it to write the name on top. The option is stored in the zip (`header.textInPicture`) and is shown only for banners opened this way, never for new ones.

After opening, a dialog lists what to check (campaign name, colours, shuffle off like the old banner, header picture, ad skipped, visible count).

Not opened yet: old mobile banners and image sliders (#36); the tool says so. Static-ad banners open but the ad picture is left out until format 2 exists (#35).

## Format 2: Articles 1250x400 with static ad (not built, #35)

Reference: `content-marketing/st_Autopay0810_1250x400`.

- A fixed ad image with its own ClickTag URL next to a slider of 3 visible articles (instead of 4).
- Side and size of the ad: from Figma (open question).
- Mobile: every Nth slide is the ad (N to be decided).

## Format 3: Image slider (client banners) (not built, #36)

Reference: `content-marketing/dacia_ol-1250x400-noswiper`.

- Client background image plus a set of slide images (desktop example: 300x250 on a 1250x400 canvas; mobile: 600x500).
- Each slide has its own URL; the background has its own URL.
- Slider position and size are form fields (x, y, width, height, gap, visible count).
- Transition: `slide` (default), `fade`, `cube` (CSS 3D, about 1 KB).
- Drag and touch supported; arrows optional.

## Format 4: Articles mobile (built, #37)

Design: Figma "Õhtuleht - Brand hub", frame "Mobile Content". Format id `articles-mobile`.

- **Width is not fixed.** The banner fills the page (8 px margin each side). A narrow phone (iPhone SE, 375 px) shows a sliver of the next card, a wide one shows more.
- **Everything inside has a fixed size:** header 46 px, 17 px gap, cards 267x400 (about 2:3) with 8 px between, 28 px gap, dots 8 px. Height is 499 px. The banner is centred vertically in the page.
- Card: picture, black gradient behind the title (216 px), title in Fira Sans Condensed Bold 18/23, white. No label, no hover colour.
- Pagination: 6 dots in the design, one per article here; the active one is solid, the others 30 %. Black on light, white on dark. Dots are clickable (16 px touch area).
- **Pictures:** the banner uses the `/webp/48/` version of each picture (cropped, higher resolution) whatever size was pasted: `/webp/54/` becomes `/webp/48/` when the banner is written. The form keeps the pasted address.
- Swipe, drag, autoplay, loop and shuffle as in the desktop banner. No arrows.
- Theme: light background white, dark background `#1c1c1c`. Header colour and picture work as on desktop. Title and label colours do not apply, so the editor hides them.
- The editor preview has a phone width switch (375, 390, 430).
- **Desktop and mobile are one campaign.** The editor has a Desktop 1250x400 / Mobile switch at the top: one click turns the banner into the other size and keeps everything (campaign, header, articles, colours, behaviour). Download each size separately. The dark background follows the format unless it was changed by hand.
- The preview frame is 515 px high (8 px above and below the 499 px banner) so the dots are never cut by the frame edge. In the ad system give the slot at least 499 px.
- Open: best header picture size for mobile (the hint still names the desktop size), 1 px line height rounding (18 x 1.3 = 23.4 is 23 px).

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
