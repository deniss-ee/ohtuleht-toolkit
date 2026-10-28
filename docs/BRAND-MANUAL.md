# Brand manual

A static page in the toolkit where anyone can copy colours and download logos. All content comes from one data file, `packages/brand/brand.json`, so updates never need code changes.

## Colours

- Swatches grouped: primary, neutrals, accents, campaign presets. Each shows name and role.
- One-click copy in these formats; the chosen format is remembered:

| Format | Example |
|---|---|
| HEX | `#9500B2` |
| RGB | `rgb(149, 0, 178)` |
| RGBA | `rgba(149, 0, 178, 1)` |
| HSL | `hsl(289, 100%, 35%)` |
| CSS variable | `var(--color-badge)` |
| Tailwind token | `text-badge` |

- Contrast badge against white and black (WCAG AA / AAA).
- Light and dark values shown together when both exist.
- Export buttons: `tokens.css`, `tokens.json`, Tailwind v4 `@theme` block.

## Logos

- One card per logo family; notes on clear space and minimum size.
- Variants: full colour, black, white, single colour; previewed on light and dark backgrounds.
- Download per variant:
  - **SVG** (optimised with SVGO)
  - **PNG** at 1x, 2x or a custom width, rendered in the browser from the SVG
  - **ZIP** with the whole family
- Transparent background by default; optional solid background.

The SVG is the only stored source; PNGs are generated.

## Typography

Fonts, weights, sizes and where each is used (desktop or mobile), with copyable CSS and sample text. The list is provisional: currently Fira Sans Condensed, Roboto, and Inter for mobile. Changing it is a data edit.

## Ad formats reference

Table of standard formats (1250x400, 600x500, 300x250...) with size, weight limit and notes.

## Data format (`brand.json`, draft)

```json
{
  "v": 1,
  "colors": [
    {
      "id": "badge",
      "name": "Sisuturundus purple",
      "group": "accents",
      "role": "Badge text",
      "light": "#9500b2",
      "dark": "#9500b2"
    }
  ],
  "logos": [
    {
      "id": "ohtuleht",
      "name": "Õhtuleht",
      "minWidthPx": 80,
      "clearSpace": "Height of the letter Õ on all sides",
      "variants": [
        { "id": "color", "file": "logos/ohtuleht-color.svg" },
        { "id": "black", "file": "logos/ohtuleht-black.svg" },
        { "id": "white", "file": "logos/ohtuleht-white.svg" }
      ]
    }
  ],
  "fonts": [
    { "family": "Fira Sans Condensed", "weights": [700], "usage": "Headlines", "platform": "desktop" }
  ],
  "adFormats": [
    { "id": "billboard-1250x400", "width": 1250, "height": 400, "maxKbWithoutImages": 100 }
  ]
}
```

## Source of truth

Values are read from the Figma library (via Figma MCP once authorised) and written into `brand.json`. Missing or scattered assets are collected in a tracking issue. The banner generator reads the same file, so its colour pickers offer brand swatches.

## Acceptance

- Copy works with keyboard and mouse, shows a confirmation.
- All logo variants download in every listed format.
- Works at 375 px wide and on desktop.
- Page weight is small; no framework needed beyond the toolkit build.
