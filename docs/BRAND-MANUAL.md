# Brand manual

A static page in the toolkit where anyone can copy colours and download logos. All content comes from one data file, `packages/brand/brand.json`, so updates never need code changes.

## Brand source (Figma)

Colours and fonts come from the Figma file **Õhtuleht - Brand hub** (frame `212:333`, "manual-old"). The toolkit's own interface uses them as tokens in `apps/generator/src/index.css`.

| Scale | Steps (50 to 950) | Base |
|---|---|---|
| Primary Red | `#FFF5F5 #FFEBEB #FFD6D6 #FFB8B8 #FF8F8F #FF6161 #F50000 #C70000 #A00303 #860909 #520000` | 600 `#F50000`: logos, CTAs, links, active states |
| Secondary Yellow | `#FFF9D6 #FFEFA8 #FFDF42 #FAC500 #E0A600 #D68800 #C26800 #A74A02 #8D3B07 #70300A #471900` | Highlights, promos, premium content (no base step named in the hub) |
| Ink Gray | `#F7F7F8 #EFEFF1 #DFDFE2 #C9CACF #AFB1B6 #9799A0 #7D7E87 #67686F #545459 #464649 #2A2A2D` | Text, borders, surfaces, backgrounds (no base step named in the hub) |

| Role | Font | Weights |
|---|---|---|
| Display: headlines, titles, pull quotes | Fira Sans | 500, 600 (400 for H3) |
| Interface: body, labels, navigation, meta | Inter | 400, 500, 700 |
| Code, tokens, HEX values | DM Mono | 400, 500 |

Interface mapping: light mode uses white surfaces, Ink 950 text, Ink 200 borders and Red 600 for actions; dark mode uses Ink 950 as the page, slightly lifted surfaces (a mix of Ink 950 and white) and Red 500 for actions. Sizes are not taken from the hub yet.

Banners keep their own fonts (Fira Sans Condensed, Roboto) until the banner design says otherwise.

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

## Where it lives and what it does today

- Data: `packages/brand/brand.json` (colours, logos, clear space, fonts) and `packages/brand/logos/*.svg`.
- Page: **Brand manual** in the generator menu, with two tabs.
- **Colours**: all three scales, 33 swatches. Click copies the colour as HEX, RGB, HSL, CSS variable or Tailwind class (choice remembered). Each swatch shows the better text colour (white or black), its contrast ratio and WCAG level. Buttons download `ohtuleht-colors.css`, a Tailwind `@theme` file and a JSON file.
- **Logos**: six variants (wordmark red, white, black; logomark square, round, rounded square). Toggle **safe zone**; download each as SVG or PNG at 128 to 2048 px or any width from 16 to 8192; PNG background transparent, white or black; one zip with everything, with and without the safe zone.

### Logo rules (from the hub)

| Variant | Use |
|---|---|
| Wordmark, red | Primary. On pure white and light backgrounds (50 to 300), or pure black and dark (950) |
| Wordmark, white | Any other contrasted background |
| Wordmark, black | Single colour: print, embossing, single-ink |
| Logomark (square, round, rounded square) | Favicon, app icon, social profile picture |

**Safe zone (clear space).** The hub says: clear space is defined by the cap-height, about 8 px on a 32 px logo. The tool uses 25% of the logo's height on all four sides (`clearSpace.ratio` in `brand.json`). The hub's diagram draws the clear space as one full logo height, so this needs confirming with the brand owner; changing the ratio is one number.

### Adding or changing a logo

1. Export the SVG from Figma.
2. `yarn workspace @ohtuleht/brand optimize-logo <input.svg> <name.svg>` (SVGO; keeps the viewBox, drops fixed sizes).
3. Add the file to `brand.json` under `logos`.

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
