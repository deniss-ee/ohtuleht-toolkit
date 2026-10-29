# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/). Versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Mobile articles banner (issue #37): full-width page, fixed 267x400 cards with the next card peeking in, pagination dots, light and dark; phone width switch in the preview; Desktop/Mobile switch in the editor keeps all content. Runtime gains optional dots.
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
- Example banner is now as plain as possible (solid colour header, default labels). Default slide time is 3 seconds.
- Automatic header text colour: brand rule on brand colours; other colours get white unless they are light (luminance above 0.55 or HSL lightness above 0.78).
- Documentation brought in line with the built state (2026-10-29).
