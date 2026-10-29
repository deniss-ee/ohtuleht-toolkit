# Roadmap

Each phase ends in something usable. Work is tracked as GitHub issues grouped in milestones that match the phases below.

> **Status (2026-10-29):** see the table. Next: lint/CI (#5, #6), then static-ad template (#35). Details in [HANDOFF.md](HANDOFF.md).

| Phase | Status |
|---|---|
| 0 Foundation | Done except lint, format, tests, CI (#5, #6), release process (#8), branch protection check (#3), podcast bundle flag (#7) |
| 0b Brand manual | Colours and logos **built**. Typography and ad formats open (#18), scattered assets open (#11) |
| 1 Static generator | Articles 1250x400, runtime, bookmarklet v2, header bar tool **built**. Old zip import (#34) and mobile articles (#37) **built**. Tools section: image cropper **built** (#91), movie banner **built** (#92), marketing article scraper and picture link converter **built** (#117, #118); Worker for article by number planned (#119). Estonian interface with EN/ET switch **built** (#95). Open: static ad (#35), image slider (#36), header font options (#64), accessibility pass (#38), IT README (#39) |
| 2 Worker | Not started (#40 to #43) |
| 3 Hosted and login | Not started (#44 to #47) |
| 4 Task tracker | Spec only (#50 to #58) |

## Phase 0: Foundation and documentation (M0)

- Repository (now public), `develop` integration branch, `main` release branch.
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
- Typography and ad-format reference (not built yet, #18).

Can run in parallel with Phase 1.

## Phase 1: Static banner generator (M1)

Spec: [BANNERS.md](BANNERS.md).

No backend. Output is a zip an ad-server accepts.

1. Tiny runtime replacing Swiper (loop, drag, arrows, autoplay, shuffle). **Built.**
2. First template: **Articles 1250x400** (light and dark), without Swiper. **Built.**
3. Generator app: upload an existing zip or start new, edit campaign data, add articles (snippet paste, manual form), reorder, remove, preview, download zip. **Built.**
4. Header bar tool (page header iframe, [HEADER-BAR.md](HEADER-BAR.md)). **Built.**
5. Bookmarklet v2 (JSON snippet). **Built.**
6. Open old Swiper zips (#34). **Built.**
7. Further templates: 1250x400 with static ad (#35), image slider with client background and 600x500 images; slide, fade, cube transitions (#36).
8. Mobile articles template (#37). **Built.**

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
- Microsoft login for the whole toolkit (the Estonian interface is already built, #95).

## Phase 4: Task tracker (M4)

Spec: [TASK-TRACKER.md](TASK-TRACKER.md).

A unified brief for banner and campaign requests across three departments: banner list with formats and placements, texts, images, links, optional Outlook/Exchange sync, Microsoft login. Depends on Phase 3 login. Starts with design work (interviews, brief schema) and can be prepared earlier.

## Future module ideas

| Idea | Notes |
|---|---|
| Category / theme headers | Existing `category/rubriik-4dimensioon` generalised into a generator |
| Story split builder | Existing `tools/two article generator` |
| Image resizer | **Built** in the Tools section (#91); the old `tools/image cropper` is kept |
| Video banner / ZIP packager | Movie banner **built** (#92); `tools/video html generator` still to migrate |
| CapCut template generator | Existing `tools/capcut template generator` |
| Banner QA checker | Upload a zip, report size, clickTag usage, console errors, dark mode |
| Campaign report | Impressions/clicks from ad server export |
| Chart / data embeds | Light inline SVG charts from CSV |

## Open questions

1. ~~With only 2 or 3 articles on desktop, stretch or keep width?~~ Decided: the cards stretch to the full width.
2. Static-ad variant: side, size, and the mobile "every Nth slide is an ad" rule. Waiting for Figma.
3. Header: v1 uses an uploaded image or a solid colour per campaign. Generated headers from logo + name later.
4. Bookmarklet distribution: a hosted loader may be blocked by the site's content security policy.
5. Cloudflare account, Worker domain, and who owns them.
6. ~~Branch protection on a private repository may need a paid GitHub plan.~~ The repository is public now, so protection is free (issue #3).
7. Figma library link and Figma MCP authorisation for the brand manual.
8. Which fonts are final (list is provisional and lives in `brand.json`).
