# Õhtuleht Toolkit: instructions for Claude

Read this first in every new session. Then read `docs/HANDOFF.md` (state, next steps, start prompts).

## The project

Internal toolkit for the Õhtuleht newsroom and ad sales. Modules so far: banner generator (Content marketing), header bar tool, brand manual. Planned: Cloudflare Worker article API, hosted banners and login, task tracker. Repo: `github.com/deniss-ee/ohtuleht-toolkit` (private). Full plan: `docs/ROADMAP.md`.

## The user

- Designer at Õhtuleht, not a trained developer. Builds in Figma, ships to production fast. Ad sales (non-technical people) use the tools, so everything must be plain, friendly and obvious.
- **Reply in English only**, even when the user writes Russian. Short, structured, scannable. Questions to the user: numbered, at most 3.
- Always leave a way to test: a running dev server plus the URL and the exact restart command.
- End work with: what was built, how to preview, how to publish.

## Rules

- **Yarn only** (`yarn`, `yarn add`). Never npm or npx. Never create `package-lock.json`. Commit `yarn.lock`.
- Git: issue, branch from `develop`, PR into `develop`, squash merge. `main` is for releases. Branch names `feat/<issue>-slug`. Merge only when the user says so. Commits end with the Co-Authored-By line given by the session.
- Check current docs and versions of libraries before using them. Banners have **zero dependencies**; the generator app may use libraries.
- All UI text lives in `apps/generator/src/content.ts` (English now, Estonian later). Banner text is Estonian.
- **Brand text rule**: on brand colours, steps 50 to 500 get black text, 600 and up get white (`brand.json` is the single source). Other colours: white unless the colour is light (luminance above 0.55). Buttons use brand red 600 only.
- Never use the native browser colour picker; use `components/editor/ColorPicker.tsx`.
- Preview frames must not flicker: use `components/editor/SwapFrame.tsx`.
- Never commit `.env`, tokens or keys. Never put secrets in browser code.

## Layout

```
apps/generator/            React + Vite + Tailwind v4 + shadcn/ui (port 5173)
  src/pages/               ContentMarketingHome, BannerEditor, HeaderBarEditor, BrandManual
  src/components/editor/   ArticleList, Preview, SwapFrame, ColorPicker, HoverPill ...
  src/lib/                 banner.ts, header.ts, zip.ts, logos.ts, snippets.ts, image.ts
  src/content.ts           every UI string
packages/banner-runtime/   vanilla slider script, 1.7 KB gzip (budget 3 KB); test page on port 5174
packages/templates/        banner and header-bar HTML/CSS templates, colour logic, validation
packages/brand/            brand.json (colours, logos, clear space) + optimised logo SVGs
tools/bookmarklet/         article-snippet.js (bookmarklet v2)
content-marketing/, tools/, category/   legacy banners and tools, kept as fixtures
docs/                      ROADMAP, WORKFLOW, ARCHITECTURE, BANNERS, HEADER-BAR, BRAND-MANUAL, BOOKMARKLET, HANDOFF
```

## Commands

```bash
yarn install
yarn dev                                          # generator, http://localhost:5173 (builds the runtime first)
yarn typecheck                                    # generator only
yarn workspace @ohtuleht/templates typecheck      # also: banner-runtime, brand
yarn build
yarn workspace @ohtuleht/banner-runtime dev       # runtime test page, port 5174
yarn workspace @ohtuleht/banner-runtime size      # fails above the 3 KB budget
yarn workspace @ohtuleht/templates example        # writes example-output/, then: ... serve (port 5175)
```

## Gotchas learned the hard way

- Shell: long `python - <<EOF` blocks with quotes often fail to parse. Write the script to a file with the Write tool, then run it.
- The dev server can serve a stale copy after new files or fast edits (blank page, odd errors): stop and start it again.
- The browser test pane throttles timers to about 1 per second when hidden, and screenshots can lag a repaint. Measure with JavaScript instead of trusting timing.
- The preview iframes are sandboxed: read their HTML from the `srcdoc` attribute, or build an unsandboxed copy to measure.
- Figma: very large frames break `get_metadata`. Use `use_figma` (read-only scripts) to find nodes by name, `get_design_context` for the design and asset URLs. Skills `figma:figma-use` and `figma:figma-design-to-code` must be loaded first.
- Deleting a PR's base branch closes PRs stacked on it. Stack on `develop` instead.
- After a squash merge, rebase any branch that carried the old commits (`git rebase --onto origin/develop <old tip> <branch>`).
- The GitHub token is fine-grained and expires on 2026-11-05. It needs: Administration, Contents, Issues, Pull requests, Workflows (read and write) on this repo.
