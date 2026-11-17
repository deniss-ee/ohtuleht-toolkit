# Gift card

Tools, **Gift card**. Makes a gift card for any title of the publisher: an **A4 PDF** to print and a **600x400 picture** to put into an e-mail. The person from marketing fills in a short form; nothing else is needed.

## Using it

1. **Title**: choose the logo from the list. The main colour of the card comes with it (change it if needed).
2. **Header**: what the card is for, two lines work best: `Ristsõnaajakirja Ripsik` and `kuue kuu tellimus`. Changing the title fills in a suggestion until you write your own text. Three buttons set the second line (`kolme kuu`, `kuue kuu`, `aastane tellimus`).
3. **Secret code and number of cards**: write the code once (for example `M`). With more than one card the tool adds `-1`, `-2`, ... itself: `M-1`, `M-2`, `M-3`. One card keeps the code as written; no code gives a card without one.
4. **E-mail for the order** (printed card only) and **valid until** (a date box).
5. **Download PDF** (top right): one A4 page per card. **E-mail picture**: a PNG; with several cards a zip with one PNG per code. Optional: a back page with the logo for printing on both sides; the e-mail picture twice as sharp (1200x800, shown at 600x400).

The form is remembered in the browser. The preview shows the card and the picture; with several codes a box chooses which code to look at.

## What the card looks like

Plain, like the rest of the toolkit: a white page, nothing around it, and the title's colour in **one big circle at the bottom** (the circle of the existing cards).

| Part | Printed card (A4) | E-mail picture (600x400) |
|---|---|---|
| Label `KINKEKAART` | Inter semibold, spaced, grey, centred | Same, top left |
| Header | Fira Sans semibold in the title's colour, every line the same size, as large as fits (up to 42 pt) | Same, top left, up to 38 px |
| Logo | Centred, between header and circle | Top right |
| Circle | Title colour, its top edge crosses the page at 53 % of the height | Same, across the bottom from 190 px |
| In the circle | What to do (with the e-mail address), the code in a white box, valid until, all centred | The words and the date on the left, the code box on the right. Big type: the picture is small on a phone |

- **Fonts:** Fira Sans for the header, Inter for everything else (as in the brand manual).
- **Text colour on the circle:** white or black by the brand rule (white from step 600; for other colours white when it reads at 3:1, else black). The values (address, date) are yellow on dark colours where yellow reads, otherwise just bold. The header is the title's colour, made a little darker only if it is too pale to read on white.
- **Words** (Estonian) are in `apps/generator/src/giftcard-content.ts`: the label, `SALAKOOD`, the sentences, the second-line buttons and the suggested header of each title. The printed card says "send the data and the code to the e-mail"; the picture for e-mail says "reply to this mail and add the code" (the person already has the mail, so no address). A part without a value is left out: no code, no "and the code"; no address, no "to the e-mail"; no date, no validity line.

## The files

- **PDF:** A4 exactly (595.276 x 841.89 pt, 210 x 297 mm). Vector, flat **RGB** colours, no pictures, no fonts to embed: the text is drawn as shapes, so it looks the same everywhere and cannot be selected or searched. About 30 KB a page. For a print shop that needs CMYK the PDF has to be converted there.
- **Picture:** PNG, 600x400 (or 1200x800). Pictures for e-mail are not JPG here because flat colours and text stay clean in PNG; convert if the mail program wants JPG.
- File names: `kinkekaart_<title>_<date>.pdf`, `kinkekaart_<title>_<code>_600x400_<date>.png`.

## Logos of the titles

`packages/brand/titles/` holds the coloured logo of each of the 16 titles and `titles.json` (name, size, main colour). They come from the design team's zips through `packages/brand/scripts/import-titles.mjs` (`yarn workspace @ohtuleht/brand import-titles <folder with the unzipped logo folders>`): SVGO-optimised, **the old red `#E3000F` replaced by the brand red `#F50000`**. To add a title: add a line to the list in that script, run it, and add its suggested header to `HEADERS` in `giftcard-content.ts`.

## How it is built

One drawing, three outputs: the card is laid out once as filled shapes (the logo's paths, the text as outlines, the circle), and the preview (canvas), the PNG (canvas) and the PDF (a small writer) all just fill those shapes, so they cannot disagree.

| Part | Where |
|---|---|
| Layout, text, path reading, fonts interface | `packages/templates/src/giftcard.ts` |
| PDF writer (PDF 1.4, one content stream per page, deflate) | `packages/templates/src/pdf.ts` |
| Page and form | `apps/generator/src/pages/GiftCard.tsx` |
| Fonts (opentype.js reads the `.woff` files of Fira Sans and Inter), logos, painting, files | `apps/generator/src/lib/giftcard.ts` |
| Texts and presets | `apps/generator/src/giftcard-content.ts`; interface text in `content.en.ts` / `content.et.ts` (`giftCard`) |
| Tests | `packages/templates/test/giftcard.test.ts` (stand-in font; stored copy of the layout in `test/golden/giftcard-*.txt`) |
| A quick look without the app | `yarn workspace @ohtuleht/templates giftcard [title id] [code]` writes PDFs into `packages/templates/example-output/` |

The tool loads about 245 KB of script (`opentype.js`, only when it is opened) and, when it starts, 4 fonts and the chosen logo.

## Limits and ideas

- The layout is fixed (one design). A second layout (for example horizontal print) would be a second function next to `printCard`.
- The code is not checked for being unique or stored anywhere: it is only printed.
- Logos with arcs in their paths are refused (`import-titles.mjs` writes none).
- The PDF is RGB; a print-ready CMYK version needs a converter.
