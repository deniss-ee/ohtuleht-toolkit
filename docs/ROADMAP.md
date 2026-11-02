# Roadmap

What is done, what is next, and what is only an idea. Work is tracked as GitHub issues grouped in milestones that match the phases below. Status as of **2026-11-02**.

## At a glance

| Phase | State |
|---|---|
| 0 Foundation | Done, except lint, format, tests and CI (#5, #6), release process (#8), branch protection (#3), the podcast bundle in `tools/legacy` (#7) |
| 0b Brand manual | **Done**: colours, logos, fonts, brand eye. Open: ad-format reference (#18), scattered assets (#11), brand.json schema (#9) |
| 1 Static generators and tools | **Done**: articles banner (desktop, mobile, with static ad), image slider (desktop and mobile), header bar, old Swiper import, picture optimiser, image cropper, movie banner, article scraper, picture link converter, email signature, tracking links, guide. Open: header font options (#64), accessibility pass (#38), IT README (#39 is this handover) |
| 2 API on Cloudflare | **Started**: Worker with D1 for briefs, clients and guide values, test mode. Open: article by number (#40, #119), paste article URL in the generator (#42), feed (#41), final domain and account (#43) |
| 3 Login and hosting | **Next**: Microsoft login, one address for app and API, private data behind login ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)); hosted banners and campaign storage (#44 to #47) |
| 4 Banner request and Task tracker | **Built, switched off** until login; Scoro link and mail sending planned ([TASK-TRACKER.md](TASK-TRACKER.md)) |

## Next steps (suggested order)

1. **Handover** ([TRANSFER.md](TRANSFER.md)): transfer the repository and the Cloudflare account, revoke the author's token, branch protection.
2. **CI** (#5, #6): lint, format, type check, build, the 3 KB runtime budget on every pull request; then publish on merge.
3. **Hosting and visibility decision**, then **Microsoft login** and the Worker's token check ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md)).
4. Switch on **Banner request** and **Task tracker**; add mail sending from the person's mailbox; Scoro clients.
5. Fill the **Guide**: screenshots ([GUIDE-SCREENSHOTS.md](GUIDE-SCREENSHOTS.md)) and the private values.
6. A native speaker reads the Estonian interface text (`content.et.ts`).
7. Article by number (#119): the Worker route and the field in the article scraper.

## Phase 0: Foundation (M0)

Repository, `develop` and `main`, labels and milestones, issue and pull request templates, the documentation set, a Yarn workspace. Open: lint, format, tests, CI (#5, #6).

Done when: a newcomer can read the README and [WORKFLOW.md](WORKFLOW.md) and ship a change.

## Phase 0b: Brand manual (M0b)

Spec: [BRAND-MANUAL.md](BRAND-MANUAL.md). `brand.json` filled from the Figma library; colour swatches with one-click copy, contrast badges, token export; logo gallery and downloads; fonts; brand eye generator. Open: ad-format reference (#18).

## Phase 1: Static banner generators and tools (M1)

Spec: [BANNERS.md](BANNERS.md). No backend; the output of the banner tools is a zip an ad server accepts.

Built: the slider runtime without Swiper, the articles banner (desktop, with a static ad, mobile), the image slider, the header bar, the bookmarks, old Swiper zip import, the picture optimiser, the Tools section and the interface in English and Estonian.

Done when: ad sales can produce a correct banner zip alone, in under five minutes, with no code edits.

## Phase 2: Cloudflare API (M2)

Started ([CLOUDFLARE.md](CLOUDFLARE.md)). To do: `GET /api/article?id=` and `?url=` returning title, lead, picture and canonical URL for any ohtuleht.ee article; an optional feed from the site's RSS; "paste article URL" in the generator. A static `feed.json` is always the fallback.

## Phase 3: Login and hosting (M3)

Microsoft login for the toolkit, the app and API under one address, private content only after login, hosted banners served by URL with embedded fallback articles, campaign storage. Plan and options: [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md).

## Phase 4: Banner request and Task tracker (M4)

Built as prototypes ([TASK-TRACKER.md](TASK-TRACKER.md)). To do after login: switch on, send mail from the person's mailbox, Scoro clients, roles, assignee and comments, reports.

## Ideas (not planned)

| Idea | Notes |
|---|---|
| Story split builder | The old `tools/legacy/two-article-generator` |
| CapCut template generator | The old `tools/legacy/capcut-template-generator` |
| Banner QA checker | Upload a zip; report size, ClickTag use, console errors, dark mode |
| Visual regression screenshots | One per template in CI |
| Campaign report | Impressions and clicks from an ad-server export |
| Chart and data embeds | Light inline SVG charts from CSV |
| Release notes from pull request titles | |

## Open questions

1. Visibility, hosting and the final addresses ([TRANSFER.md](TRANSFER.md#decisions-it-has-to-make)).
2. Exchange Online or an Exchange server (decides how mail can be sent).
3. Which departments use the request form, and who owns its required fields.
4. Which fonts are final (the list lives in `brand.json`).
5. Header: pictures or colours per campaign today; generated headers from a logo and a name later.
6. Bookmarks: a hosted loader may be blocked by the site's content security policy, so the bookmark holds its own code.
