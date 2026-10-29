# Brand eye generator

Brand manual tab **Eye** (`?section=brand&tab=eye`). Makes the eye in the letter ы as PNG or SVG. Design: Figma "Õhtuleht - Brand hub", page Eye (node 39:230).

## What you can set

| Control | Notes |
|---|---|
| Version | **Filled** (red, any background, also photos) or **Outline** (white lines, plain dark or red backgrounds). Outline is always white, filled is always red |
| Start from | Straight, looks left, looks down, turned right, turned left, peeks from top left, peeks from bottom right (the Figma variants) |
| Turn, size, position | Sliders, or drag the letter on the preview |
| Where the eye looks | Two sliders, or drag the dark part of the eye. The iris stays inside the eye |
| Picture shape | 1:1, 4:3, 3:4, 16:9, 9:16 (short side is 1200 units) |
| Background | Transparent (default), white, brand red, dark, yellow, or any colour (own colour picker) |
| Download | SVG, or PNG at 512, 1024 or 2048 px wide. PNG and SVG keep a transparent background unless one is chosen |

## Safety rules

Checked live by counting pixels (`checkSafety` in `apps/generator/src/lib/eye.ts`). A control stops where a rule would break, and says which.

| Rule | Limit |
|---|---|
| Iris and its highlight | 100% visible |
| Top of the letter (cap) | 100% visible, never cut |
| White of the eye | at least 90% visible |
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
