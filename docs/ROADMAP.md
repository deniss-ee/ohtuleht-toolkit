# Roadmap

Each phase ends in something usable. Work is tracked as GitHub issues grouped in milestones that match the phases below.

## Phase 0: Foundation and documentation (M0)

- Private repository, `develop` integration branch, `main` release branch.
- Labels, milestones, issue and PR templates.
- Documentation set in this repo (this folder).
- Yarn workspace scaffold, lint, format, type check.
- GitHub Actions: build, test, size budget.
- Legacy files imported unchanged.

Done when: a newcomer can read `README.md` and `docs/WORKFLOW.md` and ship a change.

## Phase 0b: Brand manual (M0b)

Spec: [BRAND-MANUAL.md](BRAND-MANUAL.md).

- `brand.json` data file filled from the Figma library.
- Colour swatches with one-click copy in many formats, contrast badges, token export.
- Logo gallery, colour/black/white variants, SVG/PNG/ZIP downloads.
- Typography and ad-format reference.

Can run in parallel with Phase 1.

## Phase 1: Static banner generator (M1)

Spec: [BANNERS.md](BANNERS.md).

No backend. Output is a zip an ad-server accepts.

1. Tiny runtime replacing Swiper (loop, drag, arrows, autoplay, shuffle).
2. First template: **Kultuurisügis 1250x400** (light and dark), rebuilt without Swiper.
3. Generator app: upload an existing zip or start new, edit campaign data, add articles (snippet paste, manual form), reorder, remove, preview, download zip.
4. Further templates: 1250x400 with static ad, image slider (client background plus 600x500 images; slide, fade, cube transitions).
5. Bookmarklet v2 (JSON snippet).
6. Mobile 600x500 article template once the new Figma design exists.

Done when: ad sales can produce a correct 1250x400 banner zip alone, in under five minutes, with no code edits.

## Phase 2: Article API on Cloudflare Workers (M2)

- `/api/article?url=` returns title, image, canonical URL for any ohtuleht.ee article (the site sends no CORS headers, so browsers cannot do this directly).
- Optional feed from `https://www.ohtuleht.ee/rss`.
- "Paste article URL" works in the generator.
- A static `feed.json` is always the fallback.

## Phase 3: Hosted banners and login (M3)

- Banners served by URL (ad servers accept URL tags), articles refreshed automatically, with embedded fallback articles if the API is unreachable.
- Campaign storage.
- Microsoft login (Entra ID; Cloudflare Access is the lowest-code route).
- Estonian interface.

## Phase 4: Task tracker (M4)

Spec: [TASK-TRACKER.md](TASK-TRACKER.md).

A unified brief for banner and campaign requests across three departments: banner list with formats and placements, texts, images, links, optional Outlook/Exchange sync, Microsoft login. Depends on Phase 3 login. Starts with design work (interviews, brief schema) and can be prepared earlier.

## Future module ideas

| Idea | Notes |
|---|---|
| Category / theme headers | Existing `category/rubriik-4dimensioon` generalised into a generator |
| Story split builder | Existing `tools/two article generator` |
| Image resizer | Existing `tools/image cropper` |
| Video banner / ZIP packager | Existing `tools/video html generator`, `tools/movie banner generator` |
| CapCut template generator | Existing `tools/capcut template generator` |
| Banner QA checker | Upload a zip, report size, clickTag usage, console errors, dark mode |
| Campaign report | Impressions/clicks from ad server export |
| Chart / data embeds | Light inline SVG charts from CSV |

## Open questions

1. With only 2 or 3 articles on desktop, should cards stretch to full width or keep the 4-column card width? Proposed default: keep card width, left aligned.
2. Static-ad variant: side, size, and the mobile "every Nth slide is an ad" rule. Waiting for Figma.
3. Header: v1 uses an uploaded image or a solid colour per campaign. Generated headers from logo + name later.
4. Bookmarklet distribution: a hosted loader may be blocked by the site's content security policy.
5. Cloudflare account, Worker domain, and who owns them.
6. Branch protection on a private repository may need a paid GitHub plan.
7. Figma library link and Figma MCP authorisation for the brand manual.
8. Which fonts are final (list is provisional and lives in `brand.json`).
