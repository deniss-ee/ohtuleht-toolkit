// A small PDF writer for drawings made of filled shapes (see giftcard.ts). Vector only: no fonts, no pictures, flat RGB colours.
// One page per drawing, the page is as big as the drawing (points). The structure is the plain PDF 1.4 one: catalog, pages, one
// content stream per page, a cross-reference table.
import type { Drawing } from "./giftcard.ts";

const enc = new TextEncoder();

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();

// "#rrggbb" to the PDF colour operands, for example "0.9608 0 0"; add rg for a fill colour
function rgb(hex: string): string {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return v.map((x) => n(Math.round(x * 10000) / 10000)).join(" ");
}

// The drawing as PDF drawing operators. PDF counts y from the bottom, the drawing from the top, so y is turned over.
export function contentOf(d: Drawing): string {
  const out: string[] = [];
  const y = (v: number) => n(d.height - v);
  for (const shape of d.shapes) {
    out.push(`${rgb(shape.fill)} rg`);
    for (const c of shape.cmds) {
      if (c[0] === "M") out.push(`${n(c[1])} ${y(c[2])} m`);
      else if (c[0] === "L") out.push(`${n(c[1])} ${y(c[2])} l`);
      else if (c[0] === "C") out.push(`${n(c[1])} ${y(c[2])} ${n(c[3])} ${y(c[4])} ${n(c[5])} ${y(c[6])} c`);
      else out.push("h");
    }
    out.push(shape.evenOdd ? "f*" : "f");
  }
  return out.join("\n");
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// A PDF text string: plain ASCII as it is, anything else as UTF-16 in hex.
function textString(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return `(${s.replace(/[\\()]/g, "\\$&")})`;
  const hex = [...s].map((ch) => ch.codePointAt(0)!.toString(16).padStart(4, "0")).join("");
  return `<FEFF${hex}>`;
}

export interface PdfOptions {
  title?: string;
  compress?: boolean; // default true; the tests read the plain stream
}

export async function renderPdf(pages: Drawing[], options: PdfOptions = {}): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    size += bytes.length;
  };
  const object = (num: number, body: string | (() => void)) => {
    offsets[num] = size;
    push(`${num} 0 obj\n`);
    if (typeof body === "string") push(body);
    else body();
    push("\nendobj\n");
  };

  // object numbers: 1 catalog, 2 pages, 3 info, then a page and its content stream for each drawing
  const pageNum = (i: number) => 4 + i * 2;
  push("%PDF-1.4\n%âãÏÓ\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageNum(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  object(3, `<< /Title ${textString(options.title ?? "")} /Producer ${textString("Õhtuleht Toolkit")} >>`);
  for (const [i, page] of pages.entries()) {
    object(pageNum(i), `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(page.width)} ${n(page.height)}] /Contents ${pageNum(i) + 1} 0 R /Resources << >> >>`);
    const raw = enc.encode(contentOf(page));
    const packed = options.compress === false ? raw : await deflate(raw);
    object(pageNum(i) + 1, () => {
      push(`<< /Length ${packed.length}${options.compress === false ? "" : " /Filter /FlateDecode"} >>\nstream\n`);
      push(packed);
      push("\nendstream");
    });
  }

  const count = pageNum(pages.length - 1) + 2; // number of objects, with the free entry 0
  const xref = size;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let k = 1; k < count; k++) push(`${String(offsets[k]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
