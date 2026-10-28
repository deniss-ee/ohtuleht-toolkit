# Article bookmarklet

A browser bookmark that runs on an ohtuleht.ee article page and copies that article as one **snippet** (JSON) for the banner generator.

## Why a bookmarklet

ohtuleht.ee does not allow other websites to read its pages (no CORS headers). A bookmarklet runs inside the article page itself, so it can read the title, image and label directly.

## Install (once)

In the generator: open a banner, then in **Articles** click **How do I get a snippet?**. Drag the **Copy article** button onto the bookmarks bar (Ctrl+Shift+B shows it). If dragging does not work, use **Copy code instead** and paste the code as the address of a new bookmark.

## Use

1. Open an article on ohtuleht.ee.
2. Click the bookmark. A small message in the corner says "Copied: <title>". If the browser blocks clipboard access, a box opens with the snippet to copy by hand.
3. Go back to the generator, paste into **Paste article snippets here**, press **Add articles**.

You can paste several snippets at once, one per line.

## Snippet format

```json
{"url":"https://www.ohtuleht.ee/1169772/","title":"...","image":"https://p.ohtuleht.ee/webp/54/i/2026/10/26/t1ovwidw.aju.jpg","badge":"Sisuturundus"}
```

| Field | Source |
|---|---|
| `url` | Article ID from the address, as `https://www.ohtuleht.ee/<id>/` (falls back to `og:url`) |
| `title` | `og:title` meta tag |
| `image` | `og:image`, with `/59/` replaced by `/54/` |
| `badge` | `<meta name="articleSection">`, for example "Sisuturundus" |

The generator also accepts `"badgeColor":"#rrggbb"` and the old HTML slide snippets.

## Source

`tools/bookmarklet/article-snippet.js` is the readable source (about 1.2 KB once minified). The generator turns it into the bookmark at runtime (`apps/generator/src/lib/bookmarklet.ts`), so there is nothing to build or keep in sync. Keep the file free of regex literals and of double spaces inside strings, because the conversion collapses whitespace.

## Older tools

`tools/article scrapper/` holds the earlier versions (separate mobile and desktop HTML snippets, and the one-article banner download). They stay until the mobile template is rebuilt; the new bookmarklet serves the desktop 1250x400 banner only for now.

## Limits

- Works only on the article page you are viewing.
- If the site changes its meta tags the snippet will have empty fields (the generator then shows what to fix). Open an issue.
- If the site later adds a strict Content Security Policy, bookmarklets may stop working; fall back to adding articles by hand or the Phase 2 article address feature.

## Ideas

- Collect several articles with repeated clicks and copy them together.
- Mobile 600x500 banner fields once that template exists.
