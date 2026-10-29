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

**Text on colours (brand rule):** on every scale, steps 50 to 500 take black text and steps 600 and up take white text. The Brand manual swatches, the interface buttons (white on red 600), the generated banner header and the header bar all follow it. For colours that are not brand colours, the text colour is picked automatically for contrast.

Interface mapping: light mode uses white surfaces, Ink 950 text, Ink 200 borders and Red 600 for actions; dark mode uses Ink 950 as the page, slightly lifted surfaces (a mix of Ink 950 and white) and Red 500 for actions. Sizes are not taken from the hub yet.

Banners keep their own font (Fira Sans Condensed) until the banner design says otherwise.

## Colours (built)

- Three scales (Primary Red, Secondary Yellow, Ink Gray), 11 steps each, 33 swatches.
- One-click copy as HEX, RGB, HSL, CSS variable or Tailwind class; the chosen format is remembered.
- Each swatch shows the better text colour, its contrast ratio and WCAG level (AA, AA large, AAA).
- Export buttons: `ohtuleht-colors.css`, a Tailwind v4 `@theme` file, a JSON file.

## Logos (built)

- Six variants: wordmark red, white, black; logomark square, round, rounded square.
- Safe zone toggle; SVG (optimised with SVGO) and PNG (128 to 2048 px or a custom width of 16 to 8192; background transparent, white or black), rendered in the browser from the SVG.
- One zip with everything, with and without the safe zone.

The SVG is the only stored source; PNGs are generated.

## Typography (not built, issue #18)

Fonts are already in `brand.json` and used by the interface: Fira Sans, Inter, DM Mono (table above). A page with sizes, line heights and copyable CSS is still to do, once the hub defines sizes. Banners keep Fira Sans Condensed until the banner design changes.

## Ad formats reference (not built, issue #18)

A table of standard formats (1250x400, 600x500, 300x250...) with size, weight limit and notes. Today these rules live in [BANNERS.md](BANNERS.md).

## Where it lives

- Data: `packages/brand/brand.json` (colours, logos, clear space, fonts) and `packages/brand/logos/*.svg`.
- Page: **Brand manual** in the generator menu, with two tabs (Colours, Logos). Code: `apps/generator/src/pages/BrandManual.tsx`.

### Logo rules (from the hub)

| Variant | Use |
|---|---|
| Wordmark, red | Primary. On pure white and light backgrounds (50 to 300), or pure black and dark (950) |
| Wordmark, white | Any other contrasted background |
| Wordmark, black | Single colour: print, embossing, single-ink |
| Logomark (square, round, rounded square) | Favicon, app icon, social profile picture |

**Safe zone (clear space).** One full logo height on every side, as drawn in the hub's diagram (a 64 px tall logo gets 64 px on each side). Set by `clearSpace.ratio` (1) in `brand.json`. The hub's text mentions about 8 px on a 32 px logo, which does not match its diagram; the diagram is followed.

### Adding or changing a logo

1. Export the SVG from Figma.
2. `yarn workspace @ohtuleht/brand optimize-logo <input.svg> <name.svg>` (SVGO; keeps the viewBox, drops fixed sizes).
3. Add the file to `brand.json` under `logos`.

## Data format (`brand.json`, simplified)

Top-level keys today: `v`, `source`, `colors` (three scales with steps), `clearSpace`, `logos`, `fonts`. The sketch below shows the idea; read the file for exact fields. `adFormats` is not in the file yet.

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

Values were read from the Figma Brand hub (via the Figma connector) and written into `brand.json`. Scattered assets that are not in the hub are tracked in issue #11. The banner generator reads the same file for its text-colour rule and brand swatches.

## Acceptance

- Copy works with keyboard and mouse, shows a confirmation.
- All logo variants download as SVG and PNG.
- Works at 375 px wide and on desktop.
- Page weight is small; no framework needed beyond the toolkit build.
