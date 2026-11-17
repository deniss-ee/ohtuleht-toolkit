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

Plain, like the rest of the toolkit: nothing around the card, a page that is a **6 % tint of the title's colour** (so it is not sterile white), and the colour itself in one big shape. The look of the printed card and of the e-mail picture is chosen separately (**Look** in the form); the preview changes at once.

**Printed card (A4)**: label `KINKEKAART`, the header, the logo and the details sit in one tight column in the middle of the page. The details are the sentence (what to do, with the e-mail address), the code in a white box and "valid until".

| Style | What it is |
|---|---|
| **Circle** (first) | The details lie on one full circle in the title's colour, right under the logo |
| **Panel** | The details lie on one rounded panel, like a card of the toolkit |
| **Top circle** | The title (label, header, logo on a white plate) is on a circle running off the top; the details are under it on the page |

**E-mail picture (600x400)**: only the **logo, how long and the code**, all big (on a phone the picture is about 60 % of its size). How long is the header without its first line (the logo already says the title). There is no sentence, no date and no address: those belong in the letter. No second `KINKEKAART`.

| Style | What it is |
|---|---|
| **Circle** (first) | Logo and how long on the left, the code in a big circle on the right with a second soft circle behind it |
| **Centre** | One column: logo, how long, the code in a big box; soft circles run off two corners |
| **Split** | The logo and how long on the left, a panel in the title's colour on the right with the code |

Without a code the picture falls back to **Centre** (nothing to put in the circle or the panel).

- **Fonts:** Fira Sans semibold for the header, Inter for everything else (as in the brand manual).
- **Text colour on the colour:** white or black by the brand rule (white from step 600; for other colours white when it reads at 3:1, else black). Values (address, date) are yellow on dark colours where yellow reads, otherwise bold. The header is the title's colour, made a little darker only if it is too pale to read.
- **Words** (Estonian) are in `apps/generator/src/giftcard-content.ts`: the label, `SALAKOOD`, the sentences of the printed card, the second-line buttons and the suggested header of each title. A part without a value is left out: no code, no "and the code"; no address, no "to the e-mail"; no date, no validity line.
- **Flat colours only:** no gradients, no outlines, no shadows. That also keeps the PNG small when it is reduced to 256 colours.

How the looks were chosen: a short look at what is common (clean layouts with white space, bold sans-serif type, simple palettes, the code in a large bold face; for e-mail one column, big type, small image) and then three tries of each, compared in the app. The research found little that is specific to gift cards, so treat the styles as a starting point and drop the ones that are not used.

## The files

- **PDF:** A4 exactly (595.276 x 841.89 pt, 210 x 297 mm). Vector, flat **RGB** colours, no pictures, no fonts to embed: the text is drawn as shapes, so it looks the same everywhere and cannot be selected or searched. About 30 KB a page. For a print shop that needs CMYK the PDF has to be converted there.
- **Picture:** PNG, 600x400 (or 1200x800). Flat colours and text stay clean in PNG, and a palette reduction (256 colours, for example in Squoosh) shrinks it a lot. Convert if the mail program wants JPG. The code is inside the picture: put it in the text of the letter too, because many mail programs block pictures at first.
- File names: `kinkekaart_<title>_<date>.pdf`, `kinkekaart_<title>_<code>_600x400_<date>.png`.

## Logos of the titles

`packages/brand/titles/` holds the coloured logo of each of the 16 titles and `titles.json` (name, size, main colour). They come from the design team's zips through `packages/brand/scripts/import-titles.mjs` (`yarn workspace @ohtuleht/brand import-titles <folder with the unzipped logo folders>`): SVGO-optimised, **the old red `#E3000F` replaced by the brand red `#F50000`**. To add a title: add a line to the list in that script, run it, and add its suggested header to `HEADERS` in `giftcard-content.ts`.

## How it is built

One drawing, three outputs: the card is laid out once as filled shapes (the logo's paths, the text as outlines, the circle), and the preview (canvas), the PNG (canvas) and the PDF (a small writer) all just fill those shapes, so they cannot disagree.

| Part | Where |
|---|---|
| Layout (the looks), text, path reading, fonts interface | `packages/templates/src/giftcard.ts` |
| PDF writer (PDF 1.4, one content stream per page, deflate) | `packages/templates/src/pdf.ts` |
| Page and form | `apps/generator/src/pages/GiftCard.tsx` |
| Fonts (opentype.js reads the `.woff` files of Fira Sans and Inter), logos, painting, files | `apps/generator/src/lib/giftcard.ts` |
| Texts and presets | `apps/generator/src/giftcard-content.ts`; interface text in `content.en.ts` / `content.et.ts` (`giftCard`) |
| Tests | `packages/templates/test/giftcard.test.ts` (stand-in font; stored copy of the layout in `test/golden/giftcard-*.txt`) |
| A quick look without the app | `yarn workspace @ohtuleht/templates giftcard [title id] [code]` writes one PDF per look into `packages/templates/example-output/` |

The tool loads about 245 KB of script (`opentype.js`, only when it is opened) and, when it starts, 4 fonts and the chosen logo.

## Limits and ideas

- Each look is one function in `giftcard.ts` (`printDisc`, `printPanel`, `printTop`, `emailDisc`, `emailCentre`, `emailSplit`); adding a look is one more function and one more name in `PRINT_STYLES` / `EMAIL_STYLES` and in the interface texts.
- The code is not checked for being unique or stored anywhere: it is only printed.
- Logos with arcs in their paths are refused (`import-titles.mjs` writes none).
- The PDF is RGB; a print-ready CMYK version needs a converter.
