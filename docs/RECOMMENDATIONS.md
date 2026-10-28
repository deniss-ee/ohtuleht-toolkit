# Recommendations

Short advice for working on the toolkit. Follow it unless you have a reason not to.

## Working habits

1. Small PRs, one idea each.
2. Write the issue first, even for tiny things; bundle tiny related tasks in one issue.
3. Describe in the PR how to check the change.
4. Keep data (texts, colours, article lists) in JSON/config files, not inside code.
5. Pick the simplest option that fits; explain it in the PR when you pick something heavier.
6. Check the current docs and version of any library before using it.

## Design to code

1. Take everything from Figma; do not reuse colours or fonts from earlier projects.
2. Name Figma styles like code tokens.
3. Every campaign defines its own colours (badge, hover, header) in light and dark.
4. If something is not in the design, ask.
5. Animations are made in Figma and exported (SVG or Lottie). Code only embeds and triggers them.

## Banners

- Check at the exact pixel size, in light and dark, with 2, 4 and 5+ articles.
- Record the file weight in the PR.
- Compress images (WebP or AVIF), run SVGs through SVGO.
- Test ClickTag with and without `clickMacro`.
- Never test with real production campaign or email endpoints.

## Responsive and accessible

- Generator UI works down to 375 px.
- All controls reachable by keyboard; visible focus.
- Respect `prefers-reduced-motion`.

## Security

- Never commit `.env`, keys or tokens.
- Never put secrets in browser code; use the Worker.
- The repository is private; still treat content as if it could leak.

## Review checklist

- [ ] Issue linked
- [ ] Docs updated
- [ ] CI green
- [ ] Weights reported (banners)
- [ ] Light and dark checked
- [ ] 375 px checked (apps)
- [ ] No secrets, no `package-lock.json`

## Ideas to consider later

- A banner QA checker tool that audits a zip.
- Visual regression screenshots for each template in CI.
- A "campaign presets" library in `brand.json`.
- Automatic image compression inside the generator.
- Release notes generated from merged PR titles.

## Learning resources inside the repo

- [WORKFLOW.md](WORKFLOW.md) for git.
- [ARCHITECTURE.md](ARCHITECTURE.md) for how pieces fit.
- [BANNERS.md](BANNERS.md) for format rules.
