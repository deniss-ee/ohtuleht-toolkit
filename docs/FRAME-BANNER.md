# Picture loop banner

Content marketing, **Picture loop**. Several pictures (PNG, JPG, WebP) that fade into each other, in place of an animated GIF. It is lighter and sharper than a GIF, keeps PNG transparency, and can be a fixed size or **responsive** (as wide as its slot).

Code: `packages/templates/src/frame-banner.ts` (the banner HTML and the checks), `apps/generator/src/lib/frames.ts` (the draft, zip, import), `apps/generator/src/pages/FrameBannerEditor.tsx` (the editor), texts in `content.*.ts` (`frameEditor`).

## What you can set

| Setting | Meaning |
|---|---|
| Pictures | Two or more, shown in the order of the list (added in the order of their file names). A small time box per picture overrides the common time |
| Each picture stays | Seconds a picture is fully shown (at least 0.3) |
| Fade | Seconds of the soft change between two pictures. 0 = a plain cut |
| Repeat | Forever, or a number of rounds; after the last round the banner stays on the first picture |
| Pause when the mouse is over it | Optional |
| Show only the first picture to people who asked their system for less motion | Optional (off by default, like the other banners) |
| Size | **Fixed** (width and height in pixels, with buttons for 300x250, 300x600, 728x90, 970x250, 320x100, 600x500, 1250x400) or **Responsive** (100% wide; the two numbers only give the ratio, for example 970:250). The size of the first picture is taken automatically for the first set of pictures; a button takes it again |
| How a picture fills the banner | **Fill** (covers, crops the edges), **Whole picture** (may leave bars), **Stretch** (changes the shape) |
| Background | A colour and/or a picture that lies under the pictures. Needed for transparent PNGs, for example **one background and changing pictures on top** |
| Link | Where a click leads. Empty = the ad server's own click address (ClickTag, the same fixed helper as every other banner) |

## The fade, and why nothing jumps

The pictures are stacked. The next picture fades in **on top of** the one before it, and the old one **stays fully solid** underneath until the new one is completely there. So the background is never seen between two pictures (a plain "one fades out while the other fades in" would dip to the background in the middle). Only after the new picture is solid does the old one fade out; with opaque pictures nobody sees that, and with transparent PNGs it makes the old shapes disappear smoothly instead of jumping away. After the last picture, the first one fades in over it, so a round repeats without a seam.

It is pure CSS: one `@keyframes` for opacity and one for stacking order per picture (`frameTimeline`, `frameStops`, `frameAnimationCss` in `frame-banner.ts`). A plain cut still overlaps the pictures by 2 ms, so even the instant of a cut cannot show the background. The only script in the banner is the fixed ClickTag helper.

Checked in a real browser by stepping the CSS animations through two full rounds, thousands of moments, for opaque pictures (fade, plain cut, fade as long as the hold) and transparent PNGs on a background: there was never a moment without a fully solid picture.

## The zip

```
my-loop-300x250_02nov26.zip
  index.html     CSS inlined, the settings embedded as <script type="application/json" id="ol-banner">
  1.png, 2.jpg   The pictures, as they were (a PNG keeps its transparency; nothing is converted)
  bg.jpg         The background picture, when there is one
```

Opening the zip again in Content marketing, **Upload zip**, restores the form exactly. Name: `<campaign>_<width>x<height>_<date>.zip`, always with the size, also for a responsive banner (where the size is the design size, for example 970x250).

## Responsive banners

`.ol-frames{width:100%;aspect-ratio:W/H}`: the banner is as wide as the page or iframe it is in, and the height follows the ratio. Try it in the editor with the preview widths (the design width, 600 and 320). An ad slot with a fixed height shows only as much as that height allows; use a fixed banner there.

## Limits and ideas

- Pictures are **not** optimised or converted (so transparency and quality stay). The weight meter shows the total against a 150 KB guide; heavy PNGs make a heavy banner. An optional "optimise" step (lossless PNG, JPG re-encode) can be added like the image slider has.
- The banner ends on the first picture after a limited number of rounds (not on the last one).
- One size per banner. Several sizes from the same pictures means making several banners (**Upload zip** of one, change the size, download).
- No test automation yet; the timeline can be checked by stepping the animations as described above.
