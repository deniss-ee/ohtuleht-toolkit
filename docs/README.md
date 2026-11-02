# Documentation

Pick what you need. New to the project? Read the first group in order.

## Start here (taking over the project)

| Document | Read it to... |
|---|---|
| [TRANSFER.md](TRANSFER.md) | Take over: what exists, who owns what, secrets and accounts, first-week plan |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Understand the layout, the banner zip format and how to add a module |
| [DEPLOY.md](DEPLOY.md) | Publish the site (GitHub Pages today, Cloudflare as the target) |
| [CLOUDFLARE.md](CLOUDFLARE.md) | Run the API and the database (Worker + D1) |
| [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md) | Add Microsoft login, send mail from the person's own mailbox, show different content to signed-in people |
| [ROADMAP.md](ROADMAP.md) | See what is done and what is planned |

## Working on the code

| Document | Read it to... |
|---|---|
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Know the rules for changes, review checklist, good habits |
| [WORKFLOW.md](WORKFLOW.md) | Follow the git flow step by step (issue, branch, PR, release) |
| [LANGUAGES.md](LANGUAGES.md) | Add or change interface text in English and Estonian |
| [AI-ASSISTANT.md](AI-ASSISTANT.md) | Work with an AI assistant on this repository (optional) |
| [../SECURITY.md](../SECURITY.md) | Keep the public repository safe |

## The tools (how each one works)

| Tool | Document |
|---|---|
| Banners: articles, static ad, image slider, mobile, old Swiper import, picture optimiser | [BANNERS.md](BANNERS.md) |
| Picture loop banner (pictures that fade into each other, instead of a GIF) | [FRAME-BANNER.md](FRAME-BANNER.md) |
| Header bar for theme pages | [HEADER-BAR.md](HEADER-BAR.md) |
| Image cropper | [IMAGE-CROPPER.md](IMAGE-CROPPER.md) |
| Movie banner | [MOVIE-BANNER.md](MOVIE-BANNER.md) |
| Article scraper, Picture link converter, Tracking links | [MARKETING-TOOLS.md](MARKETING-TOOLS.md) |
| Article bookmarks | [BOOKMARKLET.md](BOOKMARKLET.md) |
| Email signature | [EMAIL-SIGNATURE.md](EMAIL-SIGNATURE.md) |
| Brand manual (colours, logos, fonts) | [BRAND-MANUAL.md](BRAND-MANUAL.md) |
| Brand eye generator | [BRAND-EYE.md](BRAND-EYE.md) |
| Guide for new employees | [GUIDE.md](GUIDE.md), generated: [GUIDE-SCREENSHOTS.md](GUIDE-SCREENSHOTS.md), [GUIDE-VALUES.md](GUIDE-VALUES.md) |
| Banner request and Task tracker (switched off) | [TASK-TRACKER.md](TASK-TRACKER.md) |

Package READMEs: [banner-runtime](../packages/banner-runtime/README.md), [templates](../packages/templates/README.md), [the web app](../apps/generator/README.md), [legacy tools](../tools/legacy/README.md).

Other: [../CHANGELOG.md](../CHANGELOG.md) lists what changed in each release.

## Keeping the docs true

- A change that users or developers can notice updates the matching document in the same pull request.
- `GUIDE-SCREENSHOTS.md` and `GUIDE-VALUES.md` are generated (`yarn guide:docs`); do not edit them by hand.
- Facts that go out of date (prices, limits, versions) carry the date they were checked.
