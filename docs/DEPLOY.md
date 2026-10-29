# Publishing the toolkit online (GitHub Pages)

The generator is a static site, so GitHub Pages can host it. Live address: `https://deniss-ee.github.io/ohtuleht-toolkit/`. The build uses relative paths, so it works from that sub-folder with no extra setting.

## How it is published today (by hand)

GitHub Actions is not available on the owner's personal account (billing lock: jobs do not start), so the site is published from a branch called `gh-pages`. Settings, Pages, Source is **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

To update the site after a change reached `develop`:

```bash
git checkout develop && git pull
yarn build
```

Then copy the contents of `apps/generator/dist/` (plus an empty file `.nojekyll`) into a fresh orphan branch and force-push it:

```bash
git worktree add --detach ../ol-pages HEAD
cd ../ol-pages
git checkout --orphan gh-pages && git rm -rqf .
cp -r ../ohtuleht-toolkit/apps/generator/dist/. . && touch .nojekyll
echo "toolkit.example.com" > CNAME   # only when a custom domain is set (see below); keep the same name
git add -A && git commit -m "Publish build of develop"
git push -f origin gh-pages
cd ../ohtuleht-toolkit && git worktree remove --force ../ol-pages
```

Pages refreshes in one or two minutes. Claude can do this when asked to "republish".

## Custom domain

Settings, Pages, **Custom domain** (saving it writes a `CNAME` file into `gh-pages`). Every republish must contain that same `CNAME` file, otherwise the domain is dropped.

At the DNS host (for example Zone.eu):

| Domain type | Record |
|---|---|
| **Subdomain** (recommended, for example `toolkit.yourdomain.eu`) | `CNAME`, host `toolkit`, destination `deniss-ee.github.io` (no repository name) |
| Main domain (`yourdomain.eu`) | four `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (this replaces any existing `A` record, so the current website of that domain stops working) |

Then press **Check again** in Settings, Pages (DNS can take up to 24 hours, usually minutes) and tick **Enforce HTTPS** when it becomes available.

## Your own server in a sub-folder (for example linkdesign.eu/ohtuleht-toolkit)

GitHub Pages cannot serve a project under a path of a domain that has another website. For that, upload the build to the web hosting instead (the build uses relative paths, so any folder works):

1. `yarn build`.
2. In the hosting file manager or over SFTP, open the web root of the domain (on Zone.eu usually `htdocs`) and create the folder `ohtuleht-toolkit`.
3. Upload the **contents** of `apps/generator/dist/` into it (`index.html` and the `assets` folder).
4. Open `https://linkdesign.eu/ohtuleht-toolkit/`.

The rest of the domain stays untouched. If a custom domain is also set on GitHub Pages, remove it (Settings, Pages, Remove) so `deniss-ee.github.io/ohtuleht-toolkit` does not redirect to it. To update the site, repeat steps 1 to 3.

## Automatic way (when Actions works)

`.github/workflows/pages.yml` builds and publishes `apps/generator/dist` whenever `develop` changes, or by hand (Actions tab, Run workflow). To use it: Settings, Pages, Source **GitHub Actions**. It needs a GitHub account without a billing lock.

## Read this

- The repository is **public**, and so is the site and the git history. Never commit secrets or customer material; the tool itself has no login and no secrets.
- To keep the tool internal later, the answer is Phase 3: host it behind company login (Cloudflare Access / Microsoft login).
- Take down: Settings, Pages, **Unpublish site**.
