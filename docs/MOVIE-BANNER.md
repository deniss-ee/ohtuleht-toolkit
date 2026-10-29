# Movie banner

Tools section of the generator. A looping video on top of a background picture, delivered as **two zips** (one for each picture size the client sends: 1250 px and 1280 px wide). Rebuilt from the old `tools/movie banner generator` (issue #92). Runs fully in the browser.

## How to use

1. Tools, then **Movie banner**.
2. Choose the video (MP4 or WebM).
3. Set video height (default 360), where it sits (left, centre, right) and the distance from the edge.
4. For each version choose the background picture. The banner is exactly as big as the picture.
5. Optional: a link per version. Empty means the address the ad server gives (`clickTag`).
6. Check the preview (tabs switch between the versions), then **Download both zips**.

If only one zip arrives, the browser blocked the second download: allow multiple downloads for the site.

## What is in each zip

```
<background name>_1250.zip
  index.html          CSS and JS inlined, ClickTag helper
  background.<ext>    the background picture
  video.<ext>         the video (same file in both zips)
```

- Whole banner is one click area (ClickTag, same fixed helper as every banner).
- Video: autoplay, loop, muted, plays inline. A speaker button (top right) turns sound on and off without triggering the click.
- Zip name = background picture name plus `_1250` or `_1280`, as in the old tool.

## Weight

Weight is the picture plus the video; the HTML is about 2 KB. The file list shows the size of each chosen file, and after the download a message shows the size of both zips. Compress the video before uploading it (the zips do not compress it further).

## Changes from the old tool

- Files are named `background.<ext>` and `video.<ext>` (old: original picture name, always `video.mp4` even for WebM).
- The button has a label for screen readers and works with the keyboard.
- Live preview scales to the screen and has a tab per version.
- Same top bar as the banner editors (Back, "things left to do" pill that jumps to the field, theme switch, Download).
- Page `lang` is `et`.
- The old `sound.html` was only a sample output and is not rebuilt.

## Code

| File | What |
|---|---|
| `packages/templates/src/movie-banner.ts` | HTML template (no dependencies) and validation |
| `apps/generator/src/lib/movie.ts` | Draft, preview html, zip building |
| `apps/generator/src/pages/MovieBanner.tsx` | The page |
| `apps/generator/src/content.ts` (`movieBanner`) | Every text |

The preview frame uses `allow-same-origin` (option `sameOrigin` of `SwapFrame`) because the picture and video are local files shown by in-browser addresses; only this page uses it.
