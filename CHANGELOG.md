# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
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
- Editor stays short with many articles: each article is one line until opened (one open at a time); on wide screens the articles sit on the left and the campaign, header and advanced settings on the right, and the article list scrolls inside its own box.
- Example banner is now as plain as possible (solid colour header, default labels). Default slide time is 3 seconds.
- Automatic header text colour: brand rule on brand colours; other colours get white unless they are light (luminance above 0.55 or HSL lightness above 0.78).
- Documentation brought in line with the built state (2026-10-29).
