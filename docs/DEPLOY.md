# Publishing the site

The web app is a **static site**: `yarn build` writes `apps/generator/dist/` (an `index.html` and an `assets/` folder), and any static host can serve it. The build uses relative paths, so it works from a sub-folder as well as from the root of a domain.

| Option | Today | Hides the site from the public? |
|---|---|---|
| **A. GitHub Pages** (branch `gh-pages`) | **In use**: `https://deniss-ee.github.io/ohtuleht-toolkit/` | No (never, on any plan that is free) |
| **B. Cloudflare Workers with static assets** | Target; see [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#hosting-that-fits-design-a-cloudflare-workers). One address for the app and the API; login can be put in front with Cloudflare Access | Yes, with Access |
| **C. A company web server** | Possible: upload the contents of `dist/` | Yes, with the server's own single sign-on |

HTTPS is required (ad servers and the bookmarks need it). Cache settings for any host: `index.html` `no-cache`; the hashed files in `assets/` `max-age=31536000, immutable`.

## A. GitHub Pages (how it is published today, by hand)

The site is served from the branch `gh-pages` (Settings, Pages, Source: **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`). A custom Actions workflow was tried and removed because it kept failing. After a change reached `develop`:

```bash
git checkout develop && git pull
yarn install && yarn build
git branch -D gh-pages 2>/dev/null                       # a leftover local branch would make the next step fail
git worktree add --detach ../ol-pages HEAD
cd ../ol-pages
git checkout --orphan gh-pages && git rm -rqf .
cp -r ../ohtuleht-toolkit/apps/generator/dist/. . && touch .nojekyll
# echo "toolkit.example.com" > CNAME                     # only when a custom domain is set (below); keep the same name every time
git add -A && git commit -m "Publish build of develop"
git push -f origin gh-pages
cd ../ohtuleht-toolkit && git worktree remove --force ../ol-pages && git branch -D gh-pages
```

Pages refreshes in one or two minutes. Check by opening the site and pressing Ctrl+F5.

**Custom domain.** Settings, Pages, Custom domain (saving it writes a `CNAME` file into `gh-pages`; every publish must contain the same file, otherwise the domain is dropped). At the DNS host: for a subdomain a `CNAME` record to `<owner>.github.io` (no repository name); for a main domain four `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (this replaces an existing `A` record, so that domain's present website stops working, so prefer a subdomain). Then "Check again" in Settings, Pages, and tick Enforce HTTPS.

**Take down:** Settings, Pages, Unpublish site.

## B. Cloudflare Workers (target)

Use the Worker in `apps/api` to also serve the built app (`assets.directory` pointing to `apps/generator/dist`), and deploy both with `yarn build` and `yarn wrangler deploy`. Cloudflare's documentation says to start new projects on Workers rather than Pages. Details, the config sketch and the login in front of it: [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#hosting-that-fits-design-a-cloudflare-workers). Automate the publish with a pull-request check and a deploy on merge once the host is decided (issue #6).

When the address of the site changes, change these (search the repository for the old address):

| Where | What |
|---|---|
| `apps/api/wrangler.jsonc` | `ALLOWED_ORIGINS` |
| `apps/generator/src/lib/bookmarklet.ts` | `LIVE_URL` (the bookmarks open this address) |
| `apps/generator/src/lib/sync.ts` | `API_URL`, unless the app and the API share one address |
| Documents | [README.md](../README.md), this file, [CLOUDFLARE.md](CLOUDFLARE.md), [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md) |
| Entra app registration | The redirect addresses ([AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#3-what-it-needs-to-create)) |
| The signature logo | `LOGO_URL` in `lib/signature.ts` points to the logo file on the live site; mail programs need a full web address |

## C. A web server in a sub-folder

1. `yarn build`.
2. Create the folder (for example `ohtuleht-toolkit`) in the web root, over SFTP or the hosting file manager.
3. Upload the **contents** of `apps/generator/dist/` into it.
4. Open the address. The rest of the domain stays untouched. To update, repeat steps 1 to 3.

## Read this

- The repository, the site and the git history are **public** today. Never commit secrets or customer material ([SECURITY.md](../SECURITY.md)).
- To keep the tool internal, host it behind company login (B with Access, or C with single sign-on). The choice and its trade-offs: [AUTH-MICROSOFT.md](AUTH-MICROSOFT.md#1-who-may-see-what).
