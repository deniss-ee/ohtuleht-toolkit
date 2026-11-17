# Õhtuleht Toolkit: instructions for Claude

Read this first in every session. Then, depending on the task: `docs/REFACTOR.md` (the current main work), `docs/TRANSFER.md` (state, owners), `docs/ROADMAP.md`. Everything is indexed in `docs/README.md`.

## The project

Internal toolkit for the Õhtuleht newsroom, ad sales and marketing: banner makers, small tools, the brand manual, a guide for new employees. A static React + Vite app (`apps/generator`) and a Cloudflare Worker with a D1 database (`apps/api`, test mode, no login yet). The repository and the site are **public**. Live: `https://deniss-ee.github.io/ohtuleht-toolkit/`.

**Now:** the refactor in `docs/REFACTOR.md` is under way (its "Progress" table says what is done). A risky step can be tested next to the live site first: `bash tools/publish.sh v2` puts the current branch at `.../ohtuleht-toolkit/v2/`. Banner request and Task tracker were removed (tag `archive/request-tracker`); another in-house app does that job.

## The user

- A designer at Õhtuleht who builds with AI; not a trained developer. The repository is being handed to IT. Ad sales (non-technical people) use the tools, so everything must be plain, friendly and obvious.
- **Reply in English only**, even when the user writes Russian. Short, structured, scannable. Questions: numbered, at most 3.
- Messages are often dictated and may be cut off or garbled. Work out the meaning from the project; if it is still unclear, say what you understood and ask one question before building.
- Always leave a way to test: a running dev server, the URL and the exact restart command.
- End work with: what was built, how to preview, how to publish. Say plainly what was tested and what was not.

## Rules

- **Yarn only** (`yarn`, `yarn add`). Never npm or npx. Never create `package-lock.json`. Commit `yarn.lock`.
- **Git:** issue, branch from `develop`, PR into `develop`, squash merge. `main` is for releases. Branch names `feat/<issue>-slug`, `fix/...`, `docs/...`. **Merge only when the user says so** ("Merge and publish"). After a merge into `develop`, republish the site (`docs/DEPLOY.md`) and check that the live build changed. Commits end with the Co-Authored-By line given by the session.
- **GitHub access:** use the token only through `GH_TOKEN` in the command, never write it into a file. Prefer `gh auth login` on the user's machine over a token pasted into the chat.
- **Never commit** `.env`, keys, tokens, names, phone numbers, passwords or customer material (`SECURITY.md`). Private guide values are `[[key]]` placeholders.
- **Text:** all interface text lives in `apps/generator/src/content.en.ts` and `content.et.ts` (same keys in both, the type check enforces it). Components read it through `content.ts`, never hard-code text. Guide text is `guide-content.ts` (Estonian only for now). Banner text is Estonian. See `docs/LANGUAGES.md`.
- **Brand:** colours, logos and fonts come from `packages/brand/brand.json`. On brand colours, steps 50 to 500 get black text, 600 and up white. Buttons use brand red 600 only. Highlights are light neutral grey. Interface font is Inter (DM Mono for codes); Fira only in brand previews and banners.
- **Components:** never the native colour picker (`components/editor/ColorPicker.tsx`). Preview frames use `components/editor/SwapFrame.tsx` (no flicker).
- **Banners have zero dependencies** and a weight budget (runtime under 3 KB gzip). The app may use libraries: check the current docs and version first, and prefer no new library.
- **Article pictures:** the desktop banner uses `/webp/54/` and never `/webp/48/`; the mobile banner uses `/webp/48/` unless the article has its own mobile picture (`imageMobile`, a link or an uploaded `pic-<id>.<ext>`). Details in `docs/BANNERS.md`.
- **Refactoring:** behaviour-preserving pull requests only, one idea each, generated banners byte-identical unless the PR says why (`docs/REFACTOR.md`, "Rules for the whole refactor").
- **Docs:** a change people can notice updates the matching document and `CHANGELOG.md` in the same PR. Run `yarn docs:check`.

## Layout

```
apps/generator/            React 19 + Vite + Tailwind v4 + shadcn/ui (port 5173)
  src/App.tsx              the shell: which page, which draft, the address
  src/pages/               Home, ContentMarketingHome, the five editors (Banner, Slider, FrameBanner, ResponsiveBanner, HeaderBar),
                           tools (ImageCropper, MovieBanner, ArticleScraper, PictureConverter, SignatureGenerator, UtmBuilder, GiftCard),
                           BrandManual, BrandFonts, BrandEye, Guide
  src/components/editor/   shared parts: ArticleList, Preview, SwapFrame, ToolShell, ColorPicker, FormParts, Fields ...
  src/lib/                 one module per draft kind (banner, slider, frames, responsive, header), work (new, open zip), zip, storage + saved (saved work),
                           route (direct links), optimise (pictures), legacy* (old zips), sync (API) ...
  src/content.*.ts         every UI string (en, et) + content.ts picker;  src/guide-content.ts  the guide
apps/api/                  Cloudflare Worker + D1 (guide values; the briefs and clients routes are unused now), wrangler.jsonc, migrations/
packages/banner-runtime/   vanilla slider script inside the banners; test page on port 5174
packages/templates/        banner and header-bar HTML/CSS templates, the gift card drawing and PDF writer (giftcard.ts, pdf.ts), colour logic, validation, messages
packages/brand/            brand.json (colours, logos, fonts) + logo SVGs; titles/ = logos of the 16 titles (old red already the brand red)
tools/bookmarklet/         sources of the two bookmarks;  tools/legacy/  archived old tools;  tools/*.mjs  doc scripts
docs/                      index in docs/README.md
```

## Commands

```bash
yarn install
yarn dev                                          # app, http://localhost:5173 (builds the runtime first)
yarn typecheck                                    # app only
yarn test                                         # golden banners and rule tests (packages/templates)
yarn workspace @ohtuleht/templates typecheck      # also: api, banner-runtime, brand
yarn build                                        # writes apps/generator/dist/
yarn docs:check                                   # every link and anchor in the Markdown files
yarn guide:docs                                   # regenerate docs/GUIDE-SCREENSHOTS.md and GUIDE-VALUES.md
yarn workspace @ohtuleht/banner-runtime size      # fails above the 3 KB budget
cd apps/api && yarn wrangler dev --port 8788      # API locally
```

Tests exist for the templates (`yarn test`: every banner format against a golden file, plus the picture, colour and fade rules). A deliberate template change: `yarn workspace @ohtuleht/templates test -u`, then explain the golden diff in the PR. There is no lint or CI yet, and no tests for the app: typecheck, build, and check the change in the browser (375 px and desktop, console clean).

## Which model for what

- **Planning, design notes, reviews of a whole area:** the strongest model available.
- **Building a planned step, refactors guarded by tests, docs:** Sonnet.
- **Hard design or debugging (draft model, login, a bug that survived one fix):** Opus.
- **One-line fixes and text changes:** Haiku is enough.

One task per session; start a new session after a merged PR. The repository carries the memory, not the chat.

## Gotchas

See `docs/AI-ASSISTANT.md` ("Things learned the hard way"): write long scripts to a file instead of a heredoc, restart a stale dev server, measure with JavaScript in a hidden browser pane, read preview iframes from `srcdoc`.
