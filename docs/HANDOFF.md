# Handoff: where we are and how to continue

For a new session or a new computer. Claude reads `CLAUDE.md` automatically; this file is the longer story.

## Where we are (2026-10-29)

All pull requests so far (#93, #94, #96, #98 and the docs clean-up) are merged into `develop`. The site is live on GitHub Pages and is updated by hand, see [DEPLOY.md](DEPLOY.md).

Built and merged into `develop`:

| Module | What it does | Docs |
|---|---|---|
| Banner generator, **Articles 1250x400** | Form, live preview (light/dark), article cards with pictures, bookmarklet snippets, per-article label, main colour, header (picture or colour, campaign name on top), zip export and re-open | `docs/BANNERS.md` |
| Banner runtime | Slider without Swiper: loop, arrows, autoplay, drag, keys, shuffle, 4 or fewer articles share the width | `packages/banner-runtime/README.md` |
| **Old banner import** | Upload an old Swiper zip (articles type): form filled from its slides, colours, header and slider options; a dialog lists what to check; checkbox for header pictures with baked-in text | `docs/BANNERS.md` |
| **Header bar** tool | 100% x 46 px bar for theme pages (index.html + style.css), preview at 3 widths, iframe code | `docs/HEADER-BAR.md` |
| **Brand manual** | 33 colour swatches (copy as HEX/RGB/HSL/CSS/Tailwind, contrast, token export), 6 logo variants as SVG/PNG, safe zone, sizes, zip | `docs/BRAND-MANUAL.md` |
| **Tools: Image cropper** | Picture onto 1920x1080, 4 modes, drag, blur or colour background, JPG | `docs/IMAGE-CROPPER.md` |
| **Tools: Movie banner** | Video on a picture, two zips, preview | `docs/MOVIE-BANNER.md` |
| **Estonian interface** | EN/ET switch in every top bar; all text in `content.en.ts` and `content.et.ts` | `docs/LANGUAGES.md` |
| **GitHub Pages site** | Live from the `gh-pages` branch; republished by hand | `docs/DEPLOY.md` |
| Bookmarklet v2 | Copies an article as a JSON snippet (title, link, picture, label) | `docs/BOOKMARKLET.md` |

Not built yet (GitHub issues, milestones M0 to M4): 1250x400 with static ad (#35), image slider (#36), header font and size options (#64), brand typography and ad formats (#18), lint/format/CI (#5, #6), accessibility pass (#38), IT handoff README (#39), Cloudflare Worker (M2), hosted banners and login (M3), task tracker (M4, spec in `docs/TASK-TRACKER.md`).

Doc status: all `docs/*.md`, package READMEs and the generator README were checked against the code on 2026-10-29. Issues #9 (brand.json schema) and #11 (scattered assets) are open on GitHub although their core work is done; close or keep them when the user decides.

## Decisions already made (do not re-ask)

- Interface is English and Estonian with an EN/ET switch (`docs/LANGUAGES.md`); Microsoft login comes with Phase 3. Static feed and zip are always the fallback.
- Banners: ClickTag code is fixed in the templates; ad server accepts zip or URL; weight budget about 100 KB without images (soft); only Google Fonts as an external request besides article pictures from `p.ohtuleht.ee`.
- Runtime shuffle on by default; autoplay ignores the OS "reduce motion" setting and hover-pause is off (like the old Dacia banner), both available as options.
- Header is a picture or a colour, and the campaign name is **always** written on it (Fira Sans Condensed 700, 16 px, uppercase). Pictures must not contain text.
- Colours are per campaign (main colour drives header, arrows, labels). Defaults: brand red `#F50000`, hover `#E3000F`.
- Interface uses the Brand hub: Fira Sans (headlines), Inter (interface), DM Mono (code); buttons brand red 600 only.
- Logo safe zone = one full logo height on every side.
- Colour pickers: our own (react-colorful), never the native one.

## Open questions for the user

1. (Decided) Old banner headers have text baked in: the header option "The picture already has the text on it" is ticked on import; new banners never show it.
2. Static-ad banner (#35): which side, what size, and the mobile rule. Needs the Figma link.
3. Cloudflare account and domain for Phase 2.
4. IT: where `dist/` is hosted; branch protection can now be switched on (the repo is public, so it is free; issue #3).

## Next steps

1. Merge the PR stack above; set up GitHub Pages ([DEPLOY.md](DEPLOY.md), read the privacy note first).
2. Have a native speaker read the Estonian text (`content.et.ts`).
3. Lint, format, tests and CI (issues #5, #6): see the start prompt below.
4. Static-ad banner (#35): needs the Figma link for the ad side and size.
5. Image slider (#36), mobile image slider, header font options (#64), brand typography (#18).
6. Move the remaining legacy tools (`tools/`) into the Tools section one by one.

Old banner import is built (`apps/generator/src/lib/legacy.ts`). The old banner folders (`content-marketing/`) were removed from the repo; they are still in git history (before the commit that removed them). There are no automated tests yet: when adding Vitest tests for `legacy.ts` with the #5/#6 work, take a real old zip from the user as a sample (the Vite dev server rewrites CSS when fetched, so test with real files, not through the browser).

## Start prompts (paste into a new session)

**Continue in general**

```
Read CLAUDE.md and docs/HANDOFF.md in this repo, then run `git status`, `git pull` on develop and `gh issue list --state open --limit 30`. Tell me in 5 lines where we are and propose the next step. Do not start building until I answer.
```

**Lint, format and CI first**

```
Read CLAUDE.md and docs/HANDOFF.md. Do issues #5 and #6: ESLint, Prettier, Vitest, and GitHub Actions (typecheck, build, test, runtime size budget). Branch feat/5-lint-ci from develop, PR into develop. Keep the existing code style; do not reformat everything in one huge commit: format only touched files or do one clearly labelled format-only commit.
```

**Static-ad banner template**

```
Read CLAUDE.md and docs/HANDOFF.md. Build issue #35 (1250x400 with static ad). I will give you the Figma link for the ad side and size now: <paste link>. Read it with the Figma tools, build the template and form fields, test, open a PR.
```

## New computer checklist (nothing is synced except GitHub)

1. Install Git, Node 20 or newer, Yarn 1 (`npm install -g yarn` is the one allowed use of npm), GitHub CLI, Claude Code.
2. `gh auth login` as `deniss-ee`. For the AI to create issues and PRs it needs a fine-grained token with Administration, Contents, Issues, Pull requests, Workflows (read and write) on `ohtuleht-toolkit`.
3. `git clone https://github.com/deniss-ee/ohtuleht-toolkit.git`, `cd ohtuleht-toolkit`, `git checkout develop`, `yarn install`.
4. Open Claude Code in the folder. Authorise the Figma connector (`/mcp`).
5. Check: `yarn dev`, open http://localhost:5173.
6. Paste a start prompt above. The memory files of the AI are local to each computer; `CLAUDE.md` and this file replace them.

## Figma references

| What | File key | Node |
|---|---|---|
| Brand hub (colours, fonts, logos) | `Rj3ouvoH1d3YsRLTn0crxA` | `212:333` (logo section frame `212:490`) |
| Ohtuleht 3.0: header designs, page "Rubriigipäised" | `U2Uh9SCqFvHertL18t8nQc` | `83:311`; header `ikea-header-for-claude` = `809:9` |

## Compact or new session?

| | Compact | New session |
|---|---|---|
| What it does | Replaces the long chat with a short summary and continues in the same session | Starts empty |
| What survives | The repo, `CLAUDE.md` (reloaded automatically), a rough summary of the chat | Only the repo and `CLAUDE.md` |
| What is lost | Details: exact numbers, measurements, why a choice was made, the wording of your instructions | Everything in the chat |
| Risk | The summary can be wrong or miss a detail, and later work builds on it | None, but you re-orient with the start prompt |
| Best for | Continuing the same task in the middle | A new task, or after a merged PR |

**Before you compact:**

1. Make sure all work is committed and pushed (`git status` is clean, PRs are open or merged). Nothing important should live only in the chat.
2. If something matters and is not in the repo (a decision, a hex colour, an open question), ask the AI to write it into `docs/HANDOFF.md` first.

**After you compact**, paste one short message so the AI re-checks reality instead of trusting the summary:

```
We just compacted. Read CLAUDE.md and docs/HANDOFF.md, run `git status` and `gh pr list`, and tell me in 5 lines what is done and what you think the next step is. Do not start building until I confirm.
```

Dev servers keep running and the repo is untouched. Compacting does not change files.

## Session hygiene

- Start a **new session** (or Compact) at each natural break: after a merged PR, or when the AI starts re-explaining things. The repo carries the memory.
- Keep one task per session, and say "do not merge until I say so" if you want to review.
- Ask for the test URL and restart command at the end of every task; the AI should always give them.
