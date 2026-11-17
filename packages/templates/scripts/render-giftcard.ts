// Renders an example gift card in every style (print and e-mail picture, as PDFs) into example-output/ with the real fonts and logos.
// Run: yarn workspace @ohtuleht/templates giftcard [title id] [secret code]   (ids are in packages/brand/titles.json)
// A quick way to see the layout without the app: open the PDFs, or turn them into pictures with pdftoppm.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";
import { EMAIL_STYLES, PRINT_STYLES, faceFrom, layoutBack, layoutCard, renderPdf } from "../src/index.ts";
import type { Fonts, GiftCardSpec } from "../src/index.ts";
import { COPY, suggestHeader } from "../../../apps/generator/src/giftcard-content.ts";

const [id = "ripsik", code = "M_1"] = process.argv.slice(2);
const titles = JSON.parse(readFileSync(new URL("../../brand/titles.json", import.meta.url), "utf8")) as { id: string; name: string; file: string; main: string }[];
const title = titles.find((t) => t.id === id);
if (!title) throw new Error(`No title "${id}". Ids: ${titles.map((t) => t.id).join(", ")}`);

const { parse } = opentype;
const font = (family: string, name: string) => {
  const b = readFileSync(new URL(`../../../node_modules/@fontsource/${family}/files/${family}-${name}-normal.woff`, import.meta.url));
  return parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
};
// Fira Sans semibold for the header, Inter for the rest (as in the app: apps/generator/src/lib/giftcard.ts)
const face = (family: string, w: number) => faceFrom([font(family, `latin-${w}`), font(family, `latin-ext-${w}`)]);
const fonts: Fonts = { title: face("fira-sans", 600), regular: face("inter", 400), semibold: face("inter", 600), bold: face("inter", 700) };

const spec: GiftCardSpec = {
  header: suggestHeader(title.id, title.name),
  logo: readFileSync(new URL(`../../brand/titles/${title.file}`, import.meta.url), "utf8"),
  color: title.main,
  code,
  email: "nimi@example.com",
  until: "31.12.2026",
  copy: COPY,
};

const out = new URL("../example-output/", import.meta.url);
mkdirSync(out, { recursive: true });
// one PDF page per style of the printed card, and one per style of the picture for e-mail (the picture as a 600x400 page)
for (const style of PRINT_STYLES) writeFileSync(new URL(`giftcard-${id}-print-${style}.pdf`, out), await renderPdf([layoutCard("print", { ...spec, printStyle: style }, fonts)], { title: "Kinkekaart" }));
for (const style of EMAIL_STYLES) writeFileSync(new URL(`giftcard-${id}-email-${style}.pdf`, out), await renderPdf([layoutCard("email", { ...spec, emailStyle: style }, fonts)], { title: "Kinkekaart (e-kiri)" }));
writeFileSync(new URL(`giftcard-${id}-back.pdf`, out), await renderPdf([layoutBack(spec)], { title: "Kinkekaart (tagakülg)" }));
console.log(`example-output/giftcard-${id}-print-*.pdf (A4), -email-*.pdf (600x400), -back.pdf`);
