# Responsive banner (200 px high)

Content marketing, **Responsive banner, 200 px**. A banner that is always **200 px high** and as wide as its place, **320 to 700 px**. It has two versions of its content and picks one by **its own width**, so it also works in a narrow column or an iframe, not only by the width of the window:

| Version | Made as | Shown when the banner is | Safe zone (always visible, in the middle) |
|---|---|---|---|
| **Small** | **540 x 200** (or 1080 x 400 for sharp screens) | 320 to **540** px wide | **320** px |
| **Large** | **700 x 200** (or 1400 x 400) | **541** to 700 px wide | **540** px |

Each version is one of:

- **A video**: plays by itself, **muted, in a loop, without buttons** (nothing to set). MP4 (H.264) works everywhere; WebM is accepted too. The first frame is taken as a still picture (a `poster`) that shows until the video plays, and stays if the browser blocks autoplay.
- **Pictures**: one picture stays still; two or more **fade into each other** in a loop (the same solid fade as in the [picture loop](FRAME-BANNER.md#the-fade-and-why-nothing-jumps): the background never shows between two pictures). Time per picture (default 3 s) and fade length (default 0.8 s) are set once for the banner.

A version can also stay empty: the other one is then used at every width. At least one must have content.

## Making the pictures and videos (a guide for designers)

1. Make the small one **540 x 200** and the large one **700 x 200**. Pictures can be made at twice the size (**1080 x 400** and **1400 x 400**) for sharp screens: the tool accepts both and tells you if a file has another shape (it would be cropped).
2. **The sides are cropped.** The picture or video is centred and fills the 200 px height; when the banner is narrower than the file, the edges are cut off equally on both sides.
3. **Keep everything that matters in the safe zone**: text, logos, faces, the product. In the **540 px picture the middle 320 px** is always visible; in the **700 px picture the middle 540 px**. The editor can draw this zone over the preview (the checkbox "Show the safe zone") at every width.
4. Backgrounds and decoration may use the whole width.
5. Keep it light: a visitor downloads only the version he sees, not both. A video of about 150 KB is typical. The weight meter shows the page plus the files of each version.

## How it behaves

- The banner is `width: 100%` between 320 and 700 px, 200 px high, centred, content `object-fit: cover`.
- The version is chosen from the banner's **measured width, rounded** (a 540 px slot measured as 540.35 on a zoomed screen is still "small"), at the start and again when the width changes (`ResizeObserver`). Up to and including 540 = small.
- Only the shown version's files are loaded; the other is never downloaded. When the width changes to the other version the video starts or the pictures start their fade again from the first one.
- The whole banner is one click area. The link uses the ad server's ClickTag like the other banners; an empty link means the ad server's own click address.
- Pictures do not use any script for the fade (CSS). The only script chooses the version and starts the video, and the fixed ClickTag helper.

## The zip

```
my-banner-700x200_02nov26.zip
  index.html     CSS and script inlined, the settings embedded as <script type="application/json" id="ol-banner">
  540.mp4        small video          or  540-1.jpg, 540-2.jpg ...  small pictures
  540-poster.webp  still of the small video (made from its first frame)
  700.mp4        large video          or  700-1.jpg ...             large pictures
  700-poster.webp  still of the large video
```

Opening the zip again in Content marketing, **Upload zip**, restores the form. The saved unfinished work in the browser keeps the pictures but **not the videos** (they are too big for the browser's storage): add the video again after coming back.

## Code

`packages/templates/src/responsive-banner.ts` (the HTML, the chooser script and the checks; the fade is `groupAnimationCss` from `frame-banner.ts`), `apps/generator/src/lib/responsive.ts` (the draft, zip, import, poster from the first video frame), `apps/generator/src/pages/ResponsiveBannerEditor.tsx`, texts in `content.*.ts` (`responsiveEditor`).

## Checked

Behaviour was tested in a browser with two real banners (a two-video one and a pictures one): at 320, 539, 540, 541 and 700 px the right version was chosen, only its video was loaded and playing (muted, looped, no controls, with a still), a live resize switched the version, pictures at 1080x400 and 1400x400 were accepted, the fade never left a moment without a solid picture (1520 sampled moments), lazy loading kept the other version's files unloaded, and the zip opened again.

## Limits

- The breakpoint (540) and the height (200) are fixed in the template; there is nothing to set for them.
- Pictures and videos are not converted or optimised.
- Two versions only.
