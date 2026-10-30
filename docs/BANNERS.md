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
| File names | Every generated file carries the date: `name_1250x400_30oct26.zip`, `name_mobile_30oct26.zip` (banners, header bars, movie banner zips, cropped pictures, brand eye files) |
| Browsers | Current Chrome, Safari, Firefox, Edge; iOS Safari; Android Chrome |
| Accessibility | Arrows are `<button>` with labels, keyboard focus visible. Autoplay ignores the OS "reduce motion" setting by default (as existing banners do); `respectMotion` and `pauseOnHover` are opt-in switches |
| Dark mode | Supported through `prefers-color-scheme: dark` |

## Unfinished work is kept

The banner or header bar being edited is saved in the browser (`localStorage`, key `ol-work`, one slot) a moment after every change and when you press Back. The start screen of Content marketing then shows **Continue where you left off** with Continue and Discard. A header picture is kept too (if it is too big for the browser's storage, the text work is kept without it). Closing the tab with changes that were not downloaded asks for confirmation. **Ctrl+S** downloads the zip when the top bar says it is ready. The same card also shows on the Home page.

## Format 1: Articles 1250x400 (built)

Rebuilt without Swiper, light and dark. Template: `packages/templates/src/articles-1250x400.ts`.

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

**Logo (optional).** A logo can sit on the right of the header, on desktop and mobile alike: 30 px high, always right-aligned with the same 16 px from the edge as the campaign name has on the left (the header's side padding), at most 45 % of the header width. PNG, SVG, WebP or JPG; it is optimised in the browser (a vector logo stays as it is) and written as `logo.*` next to `index.html`. The header link covers the logo too.

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

Badge colour (and per-article badge colour), hover colour (red `#e3000f` by default: titles always turn red on hover), header background (image or colour), title colour, page background. These values are only starting points: every campaign sets its own.

### Opening old Swiper banners

Upload the old zip in the same place as new zips. Needs `index.html`, `style.css` and the header picture; Swiper files are ignored. The files may be at the top of the zip or inside a folder (or two): the shallowest `index.html` is used. This works for every zip the tool opens (banners and header bars).

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

**Old phone banners** (the 600x500 "Kuubik" cube of article pictures, slides in the page or made by a script from `const articles = [...]`) open as the new **mobile articles banner**: articles, links and pictures are read, the cube turn becomes a swipe. They had no header, so the header link and picture are added by hand (or taken from the desktop banner of the same campaign).

**Fixed row of articles in a script** (`array.js` with `var arr = [{ image, url, header, category }]`, as in the Tamrex banner) opens as the normal articles banner: articles, header picture and its link, label colour. Retargeting pixels are not carried over (the dialog says so). The output is always one of the two existing banners, never a new style.

Not opened yet: old mobile image sliders (#36); the tool says so. Static-ad banners (`img.banner-img` with a `getClickTag` link) open with the ad kept: picture, link and width. The slider then shows 3 articles, and the dialog says the ad was kept.

## Format 2: Articles 1250x400 with static ad (built, #35)

Not a separate banner type: a switch **Static ad** in the editor (desktop size only) adds an ad to the Articles 1250x400 banner. Template: the same `articles-1250x400.ts`, config field `ad` (`src`, `href`, `width`). Taken from the old Autopay banner (`st_Autopay0810_1250x400`).

| Part | Value |
|---|---|
| Ad position | Right of the slider, top edge level with the cards (header 46 px + 16 px gap) |
| Ad size | 338 px high (400 minus header and gap); width follows the picture's shape (650x890 gives 247 px). Never cropped |
| Gap | 16 px between slider and ad; 6 px rounded corners |
| Slider | 3 articles visible (instead of 4); the slider takes the rest of the width (985 px with a 247 px ad) |
| Click | The ad has its own ClickTag link; the validation asks for the picture and the link when the switch is on |
| Files | `ad.jpg` (or `.png`) next to `index.html` in the zip; counted in the weight shown at the top |
| Mobile | Ignored: the mobile banner has no ad (open: every Nth slide as an ad) |

Best ad picture size: twice the shown size for sharp screens, for example 494x676 px.

## Format 3: Image slider, desktop 1250x400 and mobile 600x500 (built, #36)

Client banners: a background picture with a slider of pictures on top. Made from the Dacia and Renault banners (`renault_ol-1250x400`). Template: `packages/templates/src/image-slider.ts`; editor: `apps/generator/src/pages/SliderEditor.tsx`. Zips carry `kind: "image-slider"` in their embedded config, so they open again in the tool.

**One campaign, two sizes.** Like the articles banner, a switch at the top (Desktop 1250x400 / Mobile 600x500) turns one into the other and keeps everything shared: campaign name, slides, links and slider behaviour. Each size has its own arrows and effect. Only the desktop size has a background picture (with its link) and a slider position and size; the phone banner has neither, its pictures fill the whole banner. Download each size separately (`name_1250x400.zip`, `name_600x500.zip`).

| Part | Desktop 1250x400 | Mobile 600x500 |
|---|---|---|
| Canvas | Fixed 1250x400 | Fills the page width, keeps the 6:5 shape; every size inside scales with it (CSS container units) |
| Background | Required. 1250x400, or 2500x800 for sharp screens; optionally clickable | None: no picture, option or link |
| Slides | Pictures of 300x250 or 600x500 (same 6:5 shape); at least 2; placed in the order of their file names, then moved by hand. The same pictures serve both sizes | same (600x500 pictures fit the phone banner exactly) |
| Slider box | Form fields; defaults: from the left 165, from the top 100, 920x250, gap 10, 3 visible (each slide 300x250) | Fixed, not editable: 0, 0, 600x500, one picture at a time, no gap. Each picture is full width and full height, with square corners |
| Arrows | 36 px, 46 px outside the slider (on top of its edges when there is no room); on by default | Off by default (swipe) |
| Effects | **Slide** (sideways) or **Arc** | **Slide** or **Cube** |

**Common behaviour.** Autoplay 2 s, speed 500 ms, loop, drag and swipe, keys; shuffle off. Everything fits (slides <= visible): plain row, no arrows. A click on the slider area never reaches the background link.

**Links.** *One link for all* slides or *a link for each*. The background has its own link (or none). An empty link means "the link set in the ad system" (`clickTag`), as in the old banners. Every other link goes through `clickMacro`.

**Arc (desktop).** A carousel: the slides stand on a real ring that turns around its middle, seen from outside. The front slide is straight, the ones next to it are tilted back (45 degrees or less per step), the next ones curve away round the edges and the back of the ring is hidden. A step turns the ring by one slide (arrows, keys, autoplay), and dragging turns it with the finger. The ring has at least 8 cells; with fewer slides each slide is repeated (4 slides: each twice). The slide size comes from the slider box (width, gap, slides shown), so choose 3 slides shown (choosing Arc sets at least 3). Runs in `dist/fx.js` (see below).

**Cube (mobile).** One slide at a time, turning like a cube (90 degrees per step, perspective). Arrows, keys, swipe and autoplay work; a swipe turns one step (the cube does not follow the finger). Runs in `dist/fx.js`, the script for the 3D effects (ring and cube, about 1.7 KB gzip), inlined only into banners that use one. With a single slide it shows the picture and does not turn.

**Pictures.** Optimised in the browser (see below); in the zip as `bg.png`/`bg.jpg` and `1.jpg`, `2.jpg` ...

**Opening old banners.** An old desktop image slider zip (the Dacia/Renault kind: `.slider-track > .slide`, `style.css`, `script.js`) opens with the background and its link, every slide with its link (one shared link when all are the same), position and size, gap, visible count, delay, speed and arrows. A dialog lists what to check (campaign name from the page title, links, position, optimised pictures, extra scripts such as `ads.js` that are not carried over, shuffle off). The mobile size needs no extra work: the same pictures fill the phone banner. Old mobile 600x500 slider banners (`.st-wrapper`) still cannot be opened: no sample was available.

## Format 4: Articles mobile (built, #37)

Design: Figma "Õhtuleht - Brand hub", frame "Mobile Content". Format id `articles-mobile`.

- **Width is not fixed.** The banner fills the page (8 px margin each side). A narrow phone (iPhone SE, 375 px) shows a sliver of the next card, a wide one shows more.
- **Everything inside has a fixed size:** header 46 px, 16 px gap, cards 267x400 (about 2:3) with 8 px between, 28 px gap, dots 8 px. Height is 498 px. The banner is centred vertically in the page.
- Card: picture, black gradient behind the title (216 px), title in Fira Sans Condensed Bold 18/23, white. No hover colour.
- **Category label** above the title (Figma "Article Label"): chip on the label colour, Inter Bold 12/15, uppercase, 4 px radius, 4 x 6 px padding, 4 px above the title. Same data as the desktop banner: the campaign label (default Sisuturundus), a different text or colour per article. The chip is the main colour with white text (brand rule: white on red 600 and darker, black on lighter), or the label colour set in Colours or on the article.
- Pagination: 6 dots in the design, one per article here; the active one is solid, the others 30 %. Black on light, white on dark. Dots are clickable (16 px touch area).
- **Pictures:** the banner uses the `/webp/48/` version of each picture (cropped, higher resolution) whatever size was pasted: `/webp/54/` becomes `/webp/48/` when the banner is written. The form keeps the pasted address.
- Swipe, drag, autoplay, loop and shuffle as in the desktop banner. No arrows.
- Theme: light background white, dark background `#1c1c1c`. Header colour and picture work as on desktop. Title and hover colours do not apply, so the editor hides them.
- The editor preview has a phone width switch (375, 390, 430).
- **Desktop and mobile are one campaign.** The editor has a Desktop 1250x400 / Mobile switch at the top: one click turns the banner into the other size and keeps everything (campaign, header, articles, colours, behaviour). Download each size separately. The dark background follows the format unless it was changed by hand.
- The preview frame is 514 px high (8 px above and below the 498 px banner) so the dots are never cut by the frame edge. In the ad system give the slot at least 498 px.
- Open: best header picture size for mobile (the hint still names the desktop size), 1 px line height rounding (18 x 1.3 = 23.4 is 23 px).

## Picture optimiser

Pictures chosen in the form (header, ad) and the pictures of an old zip are optimised in the browser with **jSquash**, the codecs of the Squoosh app as WebAssembly (`@jsquash/jpeg` MozJPEG, `@jsquash/oxipng`, `@jsquash/resize`). Nothing is uploaded. Code: `apps/generator/src/lib/optimise.ts`.

| Picture | What happens |
|---|---|
| JPEG | Scaled down (Lanczos) when bigger than twice the shown size (header 2496x92, ad 800x676), then MozJPEG quality 75 |
| PNG | Scaled down the same way, then OxiPNG level 3 (lossless) |
| SVG, WebP | Left as they are |
| Result not smaller | The original is kept, so a picture is never made bigger |

The app tells the person what was saved. Measured on the Autopay ad (46.2 KB): quality 75 gives 41.1 KB, 70 gives 37.1 KB, 60 gives 31.2 KB. The original was already tight, so the gain is modest; photos straight from a camera or Figma shrink much more. The old Squoosh CLI (`@squoosh/cli`) is abandoned (2023), which is why jSquash is used instead. WebP output would be about 30% smaller than JPEG but ad servers may refuse `.webp` in a zip, so JPEG stays.

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
