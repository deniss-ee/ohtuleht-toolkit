# Marketing tools

Two helpers in the **Tools** section for the marketing team. Direct links: `?section=tools&tool=article-scraper` and `?section=tools&tool=picture-converter`. Both end with a strip of buttons to the Brand manual (colours, logos, fonts).

## Article scraper

1. Install the bookmark once: drag **Scrape article** from the tool page to the bookmarks bar (or copy the code into a new bookmark by hand).
2. Open an article on ohtuleht.ee and click the bookmark.
3. The toolkit opens in a new tab with four cards, each with its own Copy button: **title**, **lead text**, **article link**, **picture link**. **Copy all** copies the four, **Copy banner snippet** copies the snippet the banner maker accepts.

| Field | Source on the article page |
|---|---|
| Title | `og:title`, else `twitter:title`, else the page title |
| Lead text | first paragraph of `.article-main--content.article-main--excerpt.formatted--content` (shown as "not found" when missing) |
| Article link | `https://www.ohtuleht.ee/<id>/` from the first 6+ digit part of the path, else `og:url` / canonical |
| Picture link | `og:image` / `twitter:image`, size number replaced by `/webp/54/` |

How it works: the bookmark (`tools/bookmarklet/article-scraper.js`) packs the fields into the address after `#a=` and opens the toolkit. The part after `#` is never sent to a server. The bookmark always opens the live site, `https://deniss-ee.github.io/ohtuleht-toolkit/` (`LIVE_URL` in `apps/generator/src/lib/bookmarklet.ts`; change it if the site moves). It works only once the version with the scraper is published.

The **Article number** field is a placeholder: fetching an article by its number needs a Cloudflare Worker (issue #119), because ohtuleht.ee does not allow browser pages to read it.

## Picture link converter

Paste picture links from the CMS (one per line). Both forms are accepted: `/webp/53/i/...` (site) and `/53/i/...` (CMS). The tool gives the same links with `/webp/54/` (desktop banner) and `/webp/48/` (mobile banner). The result is always the `/webp/54/` and `/webp/48/` form. A link with no size at all (`https://p.ohtuleht.ee/i/...`) gets one. Any other line is reported by its line number and skipped. The rule lives in `withPictureSize` in `apps/generator/src/lib/image.ts`.

## Open items

- Worker for "article by number" (#119).
- Once the Worker exists, the same call can fill the banner maker's "add by article number".

## Tracking links (UTM)

Tools, Tracking links. Paste one or more web addresses (one per line), fill source, medium and campaign (content and term are optional), copy the links. Existing `?` and `#` parts are kept, labels already in the link are replaced. "Tidy the labels" (on by default) makes them lower case with hyphens, so "Spring Sale" and "spring sale" do not become two campaigns. The labels are remembered in the browser. Code: `lib/utm.ts`, `pages/UtmBuilder.tsx`.

## Home search

The Home page has a search box (press `/` to jump to it) that filters all cards by name and text.
