// Gift card tool: loads what the drawing needs (fonts, the title's logo), paints it, and makes the files.
// The drawing itself (layout, the PDF writer) is in packages/templates: the preview, the PDF and the PNG all come from one drawing.
import { parse } from "opentype.js";
import { titles, type Title } from "@ohtuleht/brand";
import { EMAIL, EMAIL_STYLES, PRINT_STYLES, faceFrom, renderPdf, type Drawing, type EmailStyle, type FontStyle, type Fonts, type PrintStyle } from "@ohtuleht/templates";
import firaLatin600 from "@fontsource/fira-sans/files/fira-sans-latin-600-normal.woff?url";
import firaExt600 from "@fontsource/fira-sans/files/fira-sans-latin-ext-600-normal.woff?url";
import interLatin400 from "@fontsource/inter/files/inter-latin-400-normal.woff?url";
import interLatin600 from "@fontsource/inter/files/inter-latin-600-normal.woff?url";
import interLatin700 from "@fontsource/inter/files/inter-latin-700-normal.woff?url";
import interExt400 from "@fontsource/inter/files/inter-latin-ext-400-normal.woff?url";
import interExt600 from "@fontsource/inter/files/inter-latin-ext-600-normal.woff?url";
import interExt700 from "@fontsource/inter/files/inter-latin-ext-700-normal.woff?url";
import { DEFAULT_PERIOD, suggestHeader } from "@/giftcard-content";
import { stampedName } from "@/lib/format";
import { download } from "@/lib/zip";

export { EMAIL_STYLES, PRINT_STYLES, titles, type Title };

// ---- Fonts and logos (fetched when the tool is opened, not before) ------------------------------------------------------------
const FONT_URLS: Record<FontStyle, string[]> = {
  title: [firaLatin600, firaExt600], // the header: Fira Sans semibold
  regular: [interLatin400, interExt400], // everything else: Inter
  semibold: [interLatin600, interExt600],
  bold: [interLatin700, interExt700],
};

let fonts: Promise<Fonts> | null = null;

// Fira Sans (the header) and Inter (the rest) as outlines: Latin first, then Latin Extended (for letters such as š and ž).
export function loadFonts(): Promise<Fonts> {
  fonts ??= (async () => {
    const face = async (style: FontStyle) => faceFrom(await Promise.all(FONT_URLS[style].map(async (url) => parse(await (await fetch(url)).arrayBuffer()))));
    const [title, regular, semibold, bold] = await Promise.all([face("title"), face("regular"), face("semibold"), face("bold")]);
    return { title, regular, semibold, bold };
  })();
  fonts.catch(() => (fonts = null)); // a failed download can be tried again
  return fonts;
}

const logoText = import.meta.glob("../../../../packages/brand/titles/*.svg", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;
const logoUrl = import.meta.glob("../../../../packages/brand/titles/*.svg", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const byFile = <T>(map: Record<string, T>, file: string) => map[`../../../../packages/brand/titles/${file}`];

// The SVG text of a title's logos (for the drawing: coloured, white and black) and the address of the coloured one (for the small pictures in the list).
export const loadLogos = async (t: Title): Promise<{ colour: string; white: string; black: string }> => {
  const load = (file: string) => byFile(logoText, file)!();
  const [colour, white, black] = await Promise.all([load(t.file), load(t.white), load(t.black)]);
  return { colour, white, black };
};
export const logoAddress = (t: Title): string => byFile(logoUrl, t.file) ?? "";

// ---- The form ---------------------------------------------------------------------------------------------------------------
export interface CardForm {
  title: string; // id in packages/brand/titles.json
  header: string; // lines separated by a line break
  headerEdited: boolean; // false: the header follows the title (a suggestion), true: it is the person's own text
  color: string; // "" = the title's own colour
  code: string; // the secret code; empty = a card without a code
  count: number; // how many cards: with more than one, -1, -2 ... are added to the code
  email: string;
  until: string; // yyyy-mm-dd, as the date box gives it
  back: boolean; // also a back page with the logo (printing on both sides)
  sharp: boolean; // the picture for e-mail at twice the size (1200x800, shown at 600x400)
  printStyle: PrintStyle; // the look of the printed card
  emailStyle: EmailStyle; // the look of the picture for e-mail
}

const lastDayOfYear = () => `${new Date().getFullYear()}-12-31`;
const FIRST = titles[0]!;

export function newForm(): CardForm {
  const t = titles.find((x) => x.id === "ripsik") ?? FIRST;
  return { title: t.id, header: suggestHeader(t.id, t.name), headerEdited: false, color: "", code: "", count: 1, email: "", until: lastDayOfYear(), back: false, sharp: false, printStyle: PRINT_STYLES[0], emailStyle: EMAIL_STYLES[0] };
}

export const titleOf = (id: string): Title => titles.find((t) => t.id === id) ?? FIRST;

// Changing the title also changes the header, unless the person has written their own.
export function withTitle(f: CardForm, id: string): CardForm {
  const t = titleOf(id);
  if (f.headerEdited) return { ...f, title: id };
  const second = f.header.split("\n")[1]?.trim() || DEFAULT_PERIOD;
  return { ...f, title: id, header: suggestHeader(id, t.name, second) };
}

// "2026-12-31" as it is written on the card: "31.12.2026". Not a date: "".
export function formatUntil(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export const MAX_CARDS = 200;

// The secret codes of the cards: one card keeps the code as it is, several get -1, -2, ... after it (M-1, M-2, M-3).
// No code at all still makes one card (without a code).
export function codesOf(f: CardForm): string[] {
  const code = f.code.trim();
  if (!code) return [""];
  const n = Math.min(MAX_CARDS, Math.max(1, Math.floor(Number(f.count)) || 1));
  return n === 1 ? [code] : Array.from({ length: n }, (_, i) => `${code}-${i + 1}`);
}

export const validEmail = (s: string) => !s.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// ---- Painting and files ---------------------------------------------------------------------------------------------------------
// Paints a drawing onto a canvas that is `pixelWidth` wide.
export function paint(canvas: HTMLCanvasElement, d: Drawing, pixelWidth: number) {
  const scale = pixelWidth / d.width;
  canvas.width = Math.round(pixelWidth);
  canvas.height = Math.round(d.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  for (const shape of d.shapes) {
    ctx.beginPath();
    for (const c of shape.cmds) {
      if (c[0] === "M") ctx.moveTo(c[1], c[2]);
      else if (c[0] === "L") ctx.lineTo(c[1], c[2]);
      else if (c[0] === "C") ctx.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
      else ctx.closePath();
    }
    if (shape.fill) {
      ctx.fillStyle = shape.fill;
      ctx.fill(shape.evenOdd ? "evenodd" : "nonzero");
    }
    if (shape.stroke) {
      ctx.strokeStyle = shape.stroke.color;
      ctx.lineWidth = shape.stroke.width;
      ctx.lineCap = "butt";
      ctx.setLineDash(shape.stroke.dash ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

const png = (d: Drawing, pixelWidth: number) =>
  new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    paint(canvas, d, pixelWidth);
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png");
  });

// A file name part from a code: letters, digits, dash and underscore.
const part = (s: string) => s.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();

export async function downloadPdf(pages: Drawing[], titleId: string) {
  const bytes = await renderPdf(pages, { title: "Kinkekaart" });
  download(new Blob([bytes as BlobPart], { type: "application/pdf" }), stampedName(`kinkekaart_${titleId}`, "pdf"));
}

// One picture: a PNG. Several (one per code): a zip of PNGs.
export async function downloadEmailPictures(cards: { code: string; drawing: Drawing }[], titleId: string, sharp: boolean) {
  const width = sharp ? EMAIL.width * 2 : EMAIL.width;
  const size = `${EMAIL.width}x${EMAIL.height}${sharp ? "@2x" : ""}`;
  const name = (code: string) => stampedName(`kinkekaart_${titleId}${code ? `_${part(code)}` : ""}_${size}`, "png");
  if (cards.length === 1) return download(await png(cards[0]!.drawing, width), name(cards[0]!.code));
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const c of cards) zip.file(name(c.code), await png(c.drawing, width));
  download(await zip.generateAsync({ type: "blob" }), stampedName(`kinkekaart_${titleId}_email_${size}`, "zip"));
}
