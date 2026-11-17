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

**The page is the card.** The PDF and the picture are what they are: a plain printout and a plain picture for a letter. Nothing is drawn around the card, nothing is cut out, there is no shadow and no card lying on a background. The type is Fira Sans (the header) and Inter (everything else), as in the brand manual.

| | Printed card (A4) | E-mail picture (600x400) |
|---|---|---|
| Contents, top to bottom | Label `KINKEKAART`, logo, header (both lines), the **code block**, what to do (with the e-mail address), valid until | The **logo** and the **code block**. Nothing else: how long, until when and what to do are in the letter |
| Layout | One column, centred, in the middle of the page, with the same gap (36 pt) between all parts. Everything is drawn **1.2 times larger** than the first design (the page stays A4): code 65 pt, header up to 48 pt, code block 82 % of the page wide | The same, with a 36 px gap; the code is 64 px |

**The code block** is a rounded box with a **dashed outline**; the small word `SALAKOOD` and the code stand in it, both centred (by the real edges of the letters, not by their advance widths) with the same room above and below. The code gets as large as the box allows. Without a code the block is left out (on the picture the logo then stands alone, larger).

**Two looks, one layout.** Only the colours change, nothing moves (a test checks that every letter and logo path is at the same place):

- **Light:** the page is the title's colour at 98 % lightness (a clean pale tint; mixing a little of a dark colour into white goes grey); the header, the label, the dashed line and the **e-mail address** are in the title's colour; the code box is white.
- **Colour:** the page is the title's colour; text is white or black by the brand rule (white where it reads at 3:1; Ripsik's orange is set to white by hand, `textOnColour` in `titles.json`); the code block is a lighter tint with a dashed line in the text colour. The e-mail address is yellow where yellow reads. **The logo's colours are never changed on their own.** How each logo goes on the colour is set for each title (`onColour` in `titles.json`):
  - **white:** the white version made by the design team (Õhtuleht, Tiiu, Avesta, Ristiku Sudoku, Ripsik).
  - **original:** the logo in its own colours, as designed, with only a **thin white edge** around it so that it stands out from a page of its own colour (the whole ristik family, Teleleht, Õhtulehe ristsõnad, Tiiu ristsõnad).
  - **swap:** the title colour and white exchanged, so a box becomes a white box with letters in the title colour and yellow and other colours stay. **Only** Naisteleht, Naisteleht 55+ and Naistelehe ristsõnad (yellow RISTSÕNAD on pink with a white label), because the owner asked for exactly these. A test fails if another title is set to swap.

- **Words** (Estonian) are in `apps/generator/src/giftcard-content.ts`: the label, `SALAKOOD`, the sentences of the printed card, the second-line buttons and the suggested header of each title. A part without a value is left out: no code, no "and the code"; no address, no "to the e-mail"; no date, no validity line.
- **Flat colours only:** no gradients, no transparency, no shadows. That keeps the PDF plain and the PNG small when it is reduced to 256 colours.

How it was reached: the first drafts used circles, panels and a card with a shadow and a slot, which looked decorated and changed shape between the looks. The final design keeps the toolkit's calm style: full page, one column, one dashed block.

## The files

- **PDF:** A4 exactly (595.276 x 841.89 pt, 210 x 297 mm). Vector, flat colours, no pictures, no fonts to embed: the text is drawn as shapes, so it looks the same everywhere and cannot be selected or searched. About 30 KB a page. **The whole PDF is CMYK** (DeviceCMYK): pure black is **0,0,0,100** (black ink only), every grey is black ink only (no mixing of four inks), pure white is 0,0,0,0 (the paper). Other colours are converted from their screen colour with a plain formula: a saturated colour gets no black ink (the brand red `#F50000` becomes 0,100,100,0), a dull or dark colour gets some in proportion to how unsaturated it is. That is not a colour profile: it lands within a few percent of a print shop's converter, but **exact brand colours should be given as CMYK by the brand owner** and checked on a proof. `renderPdf(pages, { colour: "rgb" })` writes RGB for a PDF meant for the screen. The picture for e-mail is screen only and keeps the toolkit's ink grey.
- **Picture:** PNG, 600x400 (or 1200x800). It is already as small as Squoosh makes it: the colours are reduced to a palette of at most 256 (the flat artwork has only 50 to 100 different colours, so nothing changes: the largest difference from the drawing is 1 of 255) and the file is squeezed by OxiPNG, the Squoosh codec, in the browser (`apps/generator/src/lib/png.ts`). **4 to 6 KB at 600x400** (the browser's own PNG is 17 to 24 KB), 14 to 18 KB at 1200x800 (61 to 72 KB). A batch (more than three pictures) is made a little less thoroughly to be quicker. The tool tells the size after the download. Convert if the mail program wants JPG. The code is inside the picture: put it in the text of the letter too, because many mail programs block pictures at first.
- File names: `kinkekaart_<title>_<date>.pdf`, `kinkekaart_<title>_<code>_600x400_<date>.png`.

## Logos of the titles

`packages/brand/titles/` holds, for each of the 16 titles, the coloured logo (`<id>.svg`) and its white and black versions (`<id>-white.svg`, `<id>-black.svg`), and `titles.json` (name, size, main colour). They come from the design team's zips through `packages/brand/scripts/import-titles.mjs` (`yarn workspace @ohtuleht/brand import-titles <folder with the unzipped logo folders>`): SVGO-optimised, **the old red `#E3000F` replaced by the brand red `#F50000`**. To add a title: add a line to the list in that script, run it, and add its suggested header to `HEADERS` in `giftcard-content.ts`.

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

- The looks are variants of one function per size in `giftcard.ts` (`printCard`, `emailCard`, each with `"white"` or `"colour"`, colours from `paletteOf`); another look is one more name in `PRINT_STYLES` / `EMAIL_STYLES`, a branch in `paletteOf` and the interface texts. The layout is shared, so a new look cannot move anything.
- The code is not checked for being unique or stored anywhere: it is only printed.
- Logos with arcs in their paths are refused (`import-titles.mjs` writes none).
- The CMYK values of the title colours are computed, not the brand owner's own. To use the brand owner's exact values, add a `cmyk` field to a title in `packages/brand/titles.json`, for example `"cmyk": [100, 95, 5, 15]` (percent, for its `main` colour); the print PDF then uses it instead of the formula for that colour (not for a colour changed by hand). A new run of `import-titles` keeps these fields.
