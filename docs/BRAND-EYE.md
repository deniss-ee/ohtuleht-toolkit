# Brand eye generator

Brand manual tab **Eye** (`?section=brand&tab=eye`). Makes the eye in the letter Õ as PNG or SVG. Design: Figma "Õhtuleht - Brand hub", page Eye (node 39:230).

## What you can set

| Control | Notes |
|---|---|
| Version | **Filled** (red, any background, also photos) or **Outline** (white lines, plain dark or red backgrounds). Outline is always white, filled is always red |
| Start from | Straight, looks left, looks down, turned right, turned left, peeks from top left, peeks from bottom right (the Figma variants) |
| Turn, size, position | Turn: drag the round button on the preview (or arrow keys), or the slider. Size slider. Move: drag the letter. Exact position sliders are under More options |
| Where the eye looks | Drag the dark part of the eye (sliders under More options). The iris always keeps a gap of white to the edge of the eye (`IRIS_GAP` in `eye.ts`) |
| More options (closed) | Picture shape (default 1:1; also 4:3, 3:4, 16:9, 9:16), background (default transparent), exact position and look sliders |
| Keyboard | Arrow keys on the picture move the letter (Shift: bigger steps); arrow keys on the round button turn it; Ctrl+S saves the PNG |
| Download | SVG, or PNG at 512, 1024 or 2048 px wide. PNG and SVG keep a transparent background unless one is chosen |

## Safety rules

Checked live on sample points of each shape (a fraction of a millisecond, so dragging stays smooth) (`checkSafety` in `apps/generator/src/lib/eye.ts`). The letter moves freely. When a rule is broken, a red cross is drawn over the picture and names the broken rule, and the PNG and SVG download is blocked until all four rules are met. (The iris is the exception: it cannot leave the eye, because of its gap.)

| Rule | Limit |
|---|---|
| Iris and its highlight | 100% visible |
| Top of the letter (cap) | 100% visible, never cut |
| White of the eye | at least 80% visible |
| The letter as a whole | at least 55% visible |

The Figma peeking variants show 77 to 81% of the letter, so the 55% limit leaves room. To change a limit, edit `LIMITS` in `eye.ts`.

White outline on a light or transparent background shows a warning (contrast under 3).

## How it is built

- All shapes are the Figma paths, copied into `eye.ts` (filled and outline sets). Colours come from `packages/brand/brand.json` (red 600 and red 950).
- One SVG (`eyeSvg`) is the source of the preview, the SVG file and the PNG (drawn through a canvas).
- Angles are clockwise. Figma's tilted variants are -131.44 and 87.22 degrees counter-clockwise.

## Open items

- Colours follow the brand manual (`brand.json`): red 600 `#F50000` for the body and cap, red 950 `#520000` for the iris. Decided by the user; the Figma file variable reads slightly differently (`#F20312`), the manual wins.
- Custom canvas size in pixels.
