# Contributing

How to change this project safely. The git steps with exact commands are in [docs/WORKFLOW.md](docs/WORKFLOW.md); the layout is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The short version

1. Pick or create an issue.
2. Branch from `develop`: `feat/<issue>-slug`, `fix/...`, `docs/...`, `chore/...`.
3. Commit with `type: description`.
4. Open a pull request into `develop` with `Closes #<issue>` and how to check it.
5. A second person reviews; squash and merge. Once CI exists (issues #5 and #6) it must be green.
6. `develop` is released to `main` through a release pull request ([docs/WORKFLOW.md](docs/WORKFLOW.md#7-release)).

## Rules

- **Yarn only.** `yarn install`, `yarn add`. Never `npm` or `npx`. Commit `yarn.lock`; never create `package-lock.json`.
- **No secrets, no personal data, no customer material** in the repository or in browser code ([SECURITY.md](SECURITY.md)).
- **All interface text** lives in `apps/generator/src/content.en.ts` and `content.et.ts`, with the same keys in both (the type check enforces it). Components read it through `content.ts` and never hard-code text ([docs/LANGUAGES.md](docs/LANGUAGES.md)).
- **Data apart from code.** Texts, colours, article lists live in JSON or content files.
- **Banners have zero dependencies** and a weight budget (the slider script stays under 3 KB gzip: `yarn workspace @ohtuleht/banner-runtime size`). The web app may use libraries; check the current docs and version of any library before using it.
- **Brand:** colours, logos and fonts come from `packages/brand/brand.json`. Text on brand colours: black on steps 50 to 500, white on 600 and darker. Buttons use brand red 600 only.
- **Interface:** works down to 375 px, every control reachable by keyboard with visible focus, respects `prefers-reduced-motion`. Use our own `ColorPicker`, never the browser's colour input. Preview frames use `SwapFrame` so they do not flicker.
- **Update the docs and `CHANGELOG.md`** in the same pull request as the change.

## Habits that keep it healthy

1. Small pull requests, one idea each, reviewable in ten minutes.
2. Write the issue first, even for small things; bundle tiny related tasks in one issue.
3. Describe in the pull request how to check the change.
4. Pick the simplest option that works; say why when you pick something heavier.
5. Take design from Figma, not from memory; if something is not in the design, ask.
6. Animations are made in Figma and exported (SVG or Lottie); code only embeds and triggers them. No animation libraries.

## Banners (extra care)

- Check at the exact pixel size, in light and dark, with 2, 4 and 5 or more articles.
- Record the file weight in the pull request. Compress images (WebP or AVIF), run SVGs through SVGO.
- Test ClickTag with and without `clickMacro`.
- Never test with real production campaign or email endpoints.

## Review checklist

- [ ] Issue linked, how-to-check written
- [ ] Docs and changelog updated
- [ ] `yarn typecheck` and `yarn build` pass (and CI, when it exists)
- [ ] Banners: weight reported; light, dark and 2/4/5+ articles checked
- [ ] App: 375 px and keyboard checked; both languages have the new text
- [ ] No secrets, no personal data, no `package-lock.json`

## Ideas to consider later

- A banner QA checker tool that audits a zip.
- Visual regression screenshots for each template in CI.
- Automatic image compression inside the generator.
- Release notes generated from merged pull request titles.
