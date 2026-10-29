# Publishing the toolkit online (GitHub Pages)

The generator is a static site, so GitHub Pages can host it. The workflow `.github/workflows/pages.yml` builds it and publishes `apps/generator/dist` every time `develop` changes (or by hand).

## One-time setup (repository owner)

1. GitHub, this repository, **Settings**, **Pages**.
2. **Source**: choose **GitHub Actions**.
3. Open the **Actions** tab, workflow **Publish to GitHub Pages**, **Run workflow** (branch `develop`). After about two minutes the address appears in the run summary and under Settings, Pages.

The address looks like `https://deniss-ee.github.io/ohtuleht-toolkit/`. The build uses relative paths, so no extra setting is needed for that sub-folder.

## Read this before publishing

- **A Pages site is public on the internet**, even when the repository is private. Anyone with the link can open it. The tool has no login and holds no secrets, but it contains the Õhtuleht brand assets and the tool itself.
- Pages for a **private** repository needs a paid GitHub plan (Pro, Team or Enterprise). Without it, make the repository public, or host `dist/` on the company server instead (see the README, "What to upload").
- To keep it internal, the long-term answer is Phase 3: host behind company login (Cloudflare Access / Microsoft login).

## Update or take it down

- Update: merge to `develop`; the site refreshes by itself.
- Take down: Settings, Pages, **Unpublish site**.
