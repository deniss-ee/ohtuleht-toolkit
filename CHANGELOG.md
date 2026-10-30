# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Articles banners: the slider arrows are neutral (a dark translucent square with a white chevron, 36 px, inside the first and last card), the same as in the image slider, instead of squares in the main colour. One shared definition in `packages/templates/src/arrows.ts`.
## [0.2.1] - 2026-10-30

Fix: old phone banners keep their own slide timing when converted.

- Fixed: old phone banners opened with a 3 ms delay between slides (the importer read Swiper's own default `delay:3e3` as `3`) and a 300 ms transition. The importer now ignores the Swiper library and any delay under half a second, so the banner's own 2500 ms and 500 ms are kept.
## [0.2.0] - 2026-10-30

Date stamps in file names, old phone and fixed-row banners open in the tool, and a logo on the right of the header.

- Articles banners: an optional **logo on the right of the header** (desktop and mobile), 30 px high, always right-aligned with the same 16 px padding as the text on the left.
- Every generated file has the date in its name (`name_1250x400_30oct26.zip`): articles, image slider and header bar zips, movie banner zips, cropped pictures and brand eye files.
- Old banners open in the tool: the old phone banners (600x500 "Kuubik", also when a script makes the slides) become the new mobile articles banner; a fixed row of articles listed in `array.js` (Tamrex) becomes the normal articles banner. The old "cannot open the mobile banner" message is gone.

## [0.1.0] - 2026-10-30

First release: banner generator (articles desktop and mobile, static ad), image slider (desktop and mobile), header bar, tools (image cropper, movie banner, article scraper, picture link converter), brand manual (colours, logos, fonts, eye), Estonian interface, picture optimiser, home page.

- **Image slider** banner (#36), desktop 1250x400 and mobile 600x500 in one campaign (switch with the monitor and phone icons). A background picture with a slider of 300x250 or 600x500 pictures; one link for all slides or a link per slide; a link on the background; an empty link uses the ad system's `clickTag`. Slider position, size, gap, slides shown and arrows are editable. The phone banner has no background: each picture fills the whole 600x500 banner. Effects: **Arc** (a carousel, the slides stand on a ring that turns; desktop) and **Cube** (mobile), in a separate 1.7 KB script `fx.js` only banners that use them carry. Old Dacia/Renault image slider zips open in the tool (background, slides, links, position).
- **Static ad** (#35): a switch on the desktop articles banner adds a fixed ad on the right with its own link; the slider then shows 3 articles. Old banners with an ad open with it kept.
- **Picture optimiser**: header, ad, background and slide pictures, and the pictures of old zips, are optimised in the browser with jSquash (the codecs of the Squoosh app); the original is kept when the result is not smaller.
- Editors: the desktop / phone switch is two icons with a clear active state; switching sizes does not move the page; loading indicators for the preview, pictures, the example and opening a zip; no movement animations; round, centred icon buttons on phones. Home, Content marketing and Tools use the same card with aligned buttons; banner types are named "..., desktop" and "..., mobile" and sit in pairs.

- Brand manual: **Eye** tab, a generator for the brand eye (filled or outline, looks, turns, peeking, PNG and SVG, safety rules). (#121)

- Tools: **Article scraper** (bookmark gives title, lead, link and picture link with Copy buttons) and **Picture link converter** (CMS picture links to /54/ and /48/), with a Brand manual strip. New Marketing group on Home. (#117, #118)

### Removed
- The custom "Publish to GitHub Pages" workflow (it failed on every push). The site is served from the `gh-pages` branch by GitHub's own Pages job.

### Added
- Home page (issue #115): the site opens on an intro with cards for every banner, tool and brand page, tips and the "Continue" card; a plain address always opens it (the app no longer jumps to the last used section). New menu item "Home", link `?section=home`.
- Fonts tab polish (issue #111): rules on top in a highlighted box, direct font downloads (zip with TTF files and license), cards aligned on shared rows, the comparison and example blocks removed.
- Brand manual: **Fonts** tab (issue #109) with Fira Sans, Fira Sans Condensed and Inter: samples, weights, Estonian letters, copyable CSS, a narrow-column comparison, a news card in use and rules of thumb. Fira Sans Condensed is added to the app (`@fontsource/fira-sans-condensed`).
- Direct links (issue #105): the address follows the section, tool, brand tab and language (`?section=tools&tool=movie-banner&lang=et`); a link can open a new banner of a given type; browser Back and Forward work. See README, "Direct links".
- Interface helpers (issue #103): unfinished banner or header bar is kept in the browser with "Continue where you left off" and a warning before leaving; Ctrl+S downloads; the last section is remembered. Image cropper: paste with Ctrl+V, wheel/pinch/slider zoom, JPG size on the button. Movie banner: drop files, zip size check, remembered settings, **pause button** next to mute, and the banner link is now required (the second version may have its own).
- Brand manual: logo cards have room under the size line; the clear-space note is plain text (issue #101). Blurred background of the image cropper also works in browsers without canvas filters. Pages publishing by hand (`docs/DEPLOY.md`).
- Same page header (icon, title, intro) on Content marketing, Tools and Brand manual; the three steps on Content marketing sit in their own band (issue #97).
- GitHub Pages workflow and `docs/DEPLOY.md` (needs a one-time setup by the repository owner).
- Estonian interface with an EN/ET switch in every top bar (issue #95): navigation, banner editor, header bar, brand manual, tools, messages and problem lists. English stays. Choice is remembered. See docs/LANGUAGES.md.
- Movie banner tool (issue #92): video on a background picture, two zips (1250 and 1280), live preview, mute button. Replaces `tools/movie banner generator` (old folder kept).
- Tools section in the side navigation. Image cropper (issue #91): picture onto 1920x1080 with 4 modes, drag, blurred or colour background, JPG download. Replaces `tools/image cropper` (old folder kept).
- Mobile articles banner (issue #37): full-width page, fixed 267x400 cards with the next card peeking in, pagination dots, light and dark; phone width switch in the preview; Desktop/Mobile switch in the editor keeps all content. Runtime gains optional dots. Category label on every card, as on desktop.
- Opening old Swiper banner zips (issue #34): slides, colours, header and slider options are read; a dialog lists what to check; header option "The picture already has the text on it" for pictures with baked-in text.
- Banner generator for Articles 1250x400, dependency-free runtime without Swiper (1.7 KB gzip), bookmarklet v2.
- Header bar tool: 100% x 46 px bar for theme pages, preview at three widths, iframe code, zip re-open.
- Brand manual: 33 colour swatches (copy, contrast, token export) and 6 logo variants (SVG, PNG, safe zone, zip).
- Brand fonts and colours in the interface; light and dark theme; own colour picker.
- `CLAUDE.md` and `docs/HANDOFF.md`: rules, state, next steps, start prompts, new-computer checklist, compact instructions.
- Task tracker module spec and roadmap Phase 4.
- Documentation set: README, roadmap, workflow, architecture, banner specs, brand manual, header bar, bookmarklet guide, recommendations.
- Issue and pull request templates.
- Legacy banners and tools imported unchanged.

### Changed
- Final review: unused import and unused texts removed, shared helpers for file sizes and copying, the compiler now rejects unused code (`noUnusedLocals`, `noUnusedParameters`).
- Editor stays short with many articles: each article is one line until opened (one open at a time); on wide screens the articles sit on the left and the campaign, header and advanced settings on the right, and the article list scrolls inside its own box.
- Example banner is now as plain as possible (solid colour header, default labels). Default slide time is 3 seconds.
- Automatic header text colour: brand rule on brand colours; other colours get white unless they are light (luminance above 0.55 or HSL lightness above 0.78).
- Documentation brought in line with the built state (2026-10-29).
