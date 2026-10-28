# Article bookmarklet

A browser bookmark that runs on an ohtuleht.ee article page and copies that article's data so it can be pasted into the banner generator.

## Why a bookmarklet

ohtuleht.ee does not allow other websites to read its pages (no CORS headers). A bookmarklet runs inside the article page itself, so it can read the title and image directly.

## Existing version (legacy)

Files in `tools/article scrapper/`:

| File | Purpose |
|---|---|
| `ol-article-snippets.bookmarklet.txt` | Minified bookmarklet, ready to use |
| `ol-article-snippets.js` | Readable source of the same |
| `ol-article-scraper.js` | Downloads a one-article banner HTML |

Today it opens a tab with two ready HTML slide snippets (desktop and mobile) to paste into a banner's HTML by hand.

## Install

1. Open `tools/article scrapper/ol-article-snippets.bookmarklet.txt`.
2. Copy the line starting with `javascript:`.
3. Create a new bookmark in your browser; paste the line into the **URL** field; name it "Copy article".

## Use

1. Open an article on ohtuleht.ee.
2. Click the bookmark.
3. Copy the snippet from the new tab (current version).

## Version 2 (planned)

Clicking the bookmark copies one JSON snippet to the clipboard, for example:

```json
{"v":1,"url":"https://www.ohtuleht.ee/1169772/","title":"...","image":"https://p.ohtuleht.ee/webp/54/i/2026/10/26/t1ovwidw.aju.jpg","badge":"Sisuturundus"}
```

In the generator: open the banner, press **Paste snippet**, paste. Repeat for each article, or paste many at once. Old HTML snippets still work.

## Data extracted

| Field | Source |
|---|---|
| `title` | `og:title` meta tag |
| `url` | Article ID from the address, as `https://www.ohtuleht.ee/<id>/` |
| `image` | `og:image`, with `/webp/59/` replaced by `/webp/54/` |
| `badge` | Fixed "Sisuturundus" unless changed in the generator |

## Limits

- Works only on the article page you are viewing.
- The site may change its meta tags; if the bookmarklet reports "Title not found", open an issue.
- A hosted self-updating bookmarklet may be blocked by the site's content security policy (open question); the fallback is a static bookmarklet.
