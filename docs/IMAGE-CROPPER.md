# Image cropper

Tools section of the generator. Puts any picture on a **1920x1080** canvas and saves it as a JPG. Rebuilt from the old `tools/image cropper` (issue #91). Runs fully in the browser; nothing is uploaded.

## How to use

1. Tools, then **Image cropper**.
2. Drop a picture on the canvas or click it.
3. Pick how the picture fits and the background.
4. Drag the picture (or click it and use the arrow keys, Shift for bigger steps).
5. **Download JPG**. The file is named `<original name>_ol.jpg`.

## Modes

| Mode | Size of the picture | Can be moved |
|---|---|---|
| Fit completely | Whole picture visible | No |
| Fill the canvas | Covers the canvas, edges cut off | Yes, on the axis that overflows |
| Original size | Not scaled | Only on an axis where it is bigger than the canvas |
| Custom width | Width 100 to 3000 px, ratio kept | Only on an axis where it is bigger than the canvas |

The picture can never leave a gap on an axis where it is bigger than the canvas. Changing mode centres it again.

## Background

- **Blurred picture** (default): the picture enlarged to fill the canvas, blurred (48 px) and darkened 25%. Same as the old tool.
- **One colour**: white by default, any colour via the toolkit colour picker (new; the old tool only had white).

## Output

JPG, 1920x1080, quality 95. Weight depends on the picture; typical photos are 300 KB to 1 MB.

## Code

| File | What |
|---|---|
| `apps/generator/src/lib/cropper.ts` | Sizes, movement limits, blur, drawing (pure, no React) |
| `apps/generator/src/pages/ImageCropper.tsx` | The page |
| `apps/generator/src/content.en.ts` and `content.et.ts` (`imageCropper`) | Every text |

## Dropped from the old tool

- The unused "automatic" mode of the old code.
- Fixed bottom panel on phones: the panel now simply sits under the canvas.
