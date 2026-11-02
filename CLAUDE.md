# Õhtuleht Toolkit: instructions for Claude

Read this first in every new session. Then read `docs/TRANSFER.md` (state, owners, decisions) and `docs/ROADMAP.md`. Everything is indexed in `docs/README.md`.

## The project

Internal toolkit for the Õhtuleht newsroom, ad sales and marketing: banner makers, small tools, the brand manual, a guide for new employees. React + Vite static app (`apps/generator`) and a Cloudflare Worker with a D1 database (`apps/api`, test mode, no login yet). The repository and the site are **public**. Microsoft login and sending mail are planned (`docs/AUTH-MICROSOFT.md`). Banner request and Task tracker are built but switched off (`ready: false` in `nav`).

## The user

- Designer at Õhtuleht, not a trained developer; the repository is being handed to IT. Ad sales (non-technical people) use the tools, so everything must be plain, friendly and obvious.
- **Reply in English only**, even when the user writes Russian. Short, structured, scannable. Questions to the user: numbered, at most 3.
- Always leave a way to test: a running dev server plus the URL and the exact restart command.
- End work with: what was built, how to preview, how to publish.

## Rules

- **Yarn only** (`yarn`, `yarn add`). Never npm or npx. Never create `package-lock.json`. Commit `yarn.lock`.
- Git: issue, branch from `develop`, PR into `develop`, squash merge. `main` is for releases. Branch names `feat/<issue>-slug`. Merge only when the user says so. After changes reach `develop`, republish the site (`docs/DEPLOY.md`) unless told not to. Commits end with the Co-Authored-By line given by the session.
- Check current docs and versions of libraries before using them. Banners have **zero dependencies**; the app may use libraries.
- All UI text lives in `apps/generator/src/content.en.ts` and `content.et.ts` (same keys in both, typecheck enforces it). Components read it through `content.ts`, never hard-code text. Guide text is `guide-content.ts`. See `docs/LANGUAGES.md`.
- **Never commit** `.env`, keys, tokens, names, phone numbers, passwords or customer material; the repository is public (`SECURITY.md`). Private guide values are `[[key]]` placeholders.
- **Brand text rule**: on brand colours, steps 50 to 500 get black text, 600 and up get white (`brand.json` is the single source). Buttons use brand red 600 only. Interface font is Inter (DM Mono for codes); Fira only in brand previews and banners.
- Never use the native browser colour picker (`components/editor/ColorPicker.tsx`). Preview frames use `components/editor/SwapFrame.tsx`.

## Layout

```
apps/generator/            React + Vite + Tailwind v4 + shadcn/ui (port 5173)
  src/pages/               Home, ContentMarketingHome, BannerEditor, SliderEditor, HeaderBarEditor, ToolsHome, ImageCropper, MovieBanner,
                           ArticleScraper, PictureConverter, SignatureGenerator, UtmBuilder, BrandManual, BrandFonts, BrandEye, Guide,
                           BannerRequest, TaskTracker
  src/components/editor/   ArticleList, Preview, SwapFrame, ColorPicker, BriefPage, DatePicker, ClientCombobox, ShotPlaceholder ...
  src/lib/                 banner.ts, header.ts, slider.ts, movie.ts, cropper.ts, zip.ts, storage.ts, route.ts (direct links), sync.ts (API),
                           tracker.ts, clients.ts, guide.tsx, signature.ts, utm.ts, eye.ts ...
  src/content.*.ts         every UI string (en, et) + content.ts picker;  src/guide-content.ts  the guide
apps/api/                  Cloudflare Worker + D1 (briefs, clients, guide values), wrangler.jsonc, migrations/
packages/banner-runtime/   vanilla slider script (budget 3 KB gzip); test page on port 5174
packages/templates/        banner and header-bar templates, colour logic, validation
packages/brand/            brand.json (colours, logos, fonts) + logo SVGs
tools/bookmarklet/         sources of the two bookmarks;  tools/legacy/  archived old tools;  tools/guide-docs.mjs
docs/                      index in docs/README.md
```

## Commands

```bash
yarn install
yarn dev                                          # app, http://localhost:5173 (builds the runtime first)
yarn typecheck                                    # app only
yarn workspace @ohtuleht/api typecheck            # also: templates, banner-runtime, brand
yarn build
yarn guide:docs                                   # regenerate docs/GUIDE-SCREENSHOTS.md and GUIDE-VALUES.md
yarn workspace @ohtuleht/banner-runtime size      # fails above the 3 KB budget
cd apps/api && yarn wrangler dev --port 8788      # API locally
```

## Gotchas

See `docs/AI-ASSISTANT.md` ("Things learned the hard way"). The GitHub token used by the assistant is fine-grained, personal and expires; renew it, never write it into a file.
