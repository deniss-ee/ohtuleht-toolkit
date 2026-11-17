// Gift card: one drawing, two outputs. The card (A4 print) and the picture for e-mail (600x400) are laid out here as filled
// shapes (the logo's paths, the text as outlines, a big circle at the bottom). The PDF writer and the canvas both just fill them,
// so the preview, the PDF and the PNG can never disagree. No dependencies: fonts come in through the FontFace interface.
import brand from "../../brand/brand.json" with { type: "json" };
import { brandTextColor, contrast, readableOn } from "./colors.ts";

// ---- Shapes ---------------------------------------------------------------------------------------------------------------
// Absolute path commands, y pointing down, units of the drawing (points for the print card, pixels for the e-mail picture).
export type Cmd = ["M", number, number] | ["L", number, number] | ["C", number, number, number, number, number, number] | ["Z"];

// A filled shape. The colour is #rrggbb.
export interface Shape {
  cmds: Cmd[];
  fill: string;
  evenOdd?: boolean;
}

export interface Drawing {
  width: number;
  height: number;
  shapes: Shape[];
}

// What a font glyph outline looks like (the shape opentype.js returns): lines and quadratic or cubic curves.
export interface GlyphCmd {
  type: "M" | "L" | "Q" | "C" | "Z";
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

// Quadratic curves become cubic ones, so a drawing holds only M, L, C and Z.
export function fromGlyphCmds(list: GlyphCmd[]): Cmd[] {
  const out: Cmd[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  for (const c of list) {
    const x = c.x ?? 0;
    const y = c.y ?? 0;
    if (c.type === "M") {
      out.push(["M", x, y]);
      [cx, cy, sx, sy] = [x, y, x, y];
    } else if (c.type === "L") {
      out.push(["L", x, y]);
      [cx, cy] = [x, y];
    } else if (c.type === "Q") {
      const x1 = c.x1 ?? x;
      const y1 = c.y1 ?? y;
      out.push(["C", cx + (2 / 3) * (x1 - cx), cy + (2 / 3) * (y1 - cy), x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y), x, y]);
      [cx, cy] = [x, y];
    } else if (c.type === "C") {
      out.push(["C", c.x1 ?? x, c.y1 ?? y, c.x2 ?? x, c.y2 ?? y, x, y]);
      [cx, cy] = [x, y];
    } else {
      out.push(["Z"]);
      [cx, cy] = [sx, sy];
    }
  }
  return out;
}

// SVG path data (as the optimised logos have it: M L H V C S Q T Z, absolute or relative) to absolute commands.
export function parsePathData(d: string): Cmd[] {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const raw: GlyphCmd[] = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let px = 0; // last control point, for S and T
  let py = 0;
  let prev = "";
  const num = () => {
    const t = tokens[i++];
    if (t === undefined || /^[A-Za-z]$/.test(t)) throw new Error("path data: a number was expected");
    return Number(t);
  };
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i]!)) cmd = tokens[i++]!;
    else if (cmd === "M") cmd = "L"; // a second pair after M is a line
    else if (cmd === "m") cmd = "l";
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (C === "Z") {
      raw.push({ type: "Z" });
      [x, y] = [sx, sy];
    } else if (C === "M") {
      [x, y] = [ox + num(), oy + num()];
      [sx, sy] = [x, y];
      raw.push({ type: "M", x, y });
    } else if (C === "L") {
      [x, y] = [ox + num(), oy + num()];
      raw.push({ type: "L", x, y });
    } else if (C === "H") {
      x = ox + num();
      raw.push({ type: "L", x, y });
    } else if (C === "V") {
      y = oy + num();
      raw.push({ type: "L", x, y });
    } else if (C === "C" || C === "S") {
      let x1 = x;
      let y1 = y;
      if (C === "C") [x1, y1] = [ox + num(), oy + num()];
      else if (prev === "C" || prev === "S") [x1, y1] = [2 * x - px, 2 * y - py];
      const [x2, y2] = [ox + num(), oy + num()];
      const [nx, ny] = [ox + num(), oy + num()];
      raw.push({ type: "C", x1, y1, x2, y2, x: nx, y: ny });
      [px, py, x, y] = [x2, y2, nx, ny];
    } else if (C === "Q" || C === "T") {
      let x1 = x;
      let y1 = y;
      if (C === "Q") [x1, y1] = [ox + num(), oy + num()];
      else if (prev === "Q" || prev === "T") [x1, y1] = [2 * x - px, 2 * y - py];
      const [nx, ny] = [ox + num(), oy + num()];
      raw.push({ type: "Q", x1, y1, x: nx, y: ny });
      [px, py, x, y] = [x1, y1, nx, ny];
    } else {
      throw new Error(`path data: the command ${cmd} is not supported`);
    }
    prev = C;
  }
  return fromGlyphCmds(raw);
}

export const place = (cmds: Cmd[], scale: number, dx: number, dy: number): Cmd[] =>
  cmds.map((c) => {
    if (c[0] === "Z") return c;
    if (c[0] === "C") return ["C", c[1] * scale + dx, c[2] * scale + dy, c[3] * scale + dx, c[4] * scale + dy, c[5] * scale + dx, c[6] * scale + dy];
    return [c[0], c[1] * scale + dx, c[2] * scale + dy];
  });

const hex6 = (c: string) => (/^#[0-9a-f]{3}$/i.test(c) ? "#" + [...c.slice(1)].map((h) => h + h).join("") : c).toLowerCase();

// A logo SVG (made by packages/brand/scripts/import-titles.mjs: plain paths) as shapes in its own units.
// A path takes its fill and fill rule from itself or from the nearest <g> or <svg> around it, as in SVG.
export function logoShapes(svg: string): { shapes: Shape[]; width: number; height: number } {
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!box) throw new Error("logo: no viewBox");
  const shapes: Shape[] = [];
  const stack: { fill: string; evenOdd: boolean }[] = [{ fill: "#000000", evenOdd: false }];
  const attr = (tag: string, name: string) => new RegExp(String.raw`\s${name}="([^"]*)"`).exec(tag)?.[1];
  let hidden = 0; // inside <defs> or <clipPath>: shapes there are not drawn (the logos only clip to their own full-size box)
  for (const m of svg.matchAll(/<(\/?)(svg|g|path|defs|clipPath)\b([^>]*?)(\/?)>/g)) {
    const [, closing, name, rest, selfClosing] = m;
    const here = stack[stack.length - 1]!;
    const wrapper = name === "defs" || name === "clipPath";
    if (closing) {
      if (wrapper) hidden--;
      else if (name !== "path") stack.pop();
      continue;
    }
    if (wrapper) {
      if (!selfClosing) hidden++;
      continue;
    }
    const fill = attr(rest!, "fill") ?? here.fill;
    const rule = attr(rest!, "fill-rule");
    const evenOdd = rule ? rule === "evenodd" : here.evenOdd;
    if (name === "path") {
      const d = attr(rest!, "d");
      if (d && !hidden && fill !== "none") shapes.push({ cmds: parsePathData(d), fill: hex6(fill), evenOdd: evenOdd || undefined });
    } else if (!selfClosing) stack.push({ fill, evenOdd });
  }
  return { shapes, width: Number(box[1]), height: Number(box[2]) };
}

// ---- Text -----------------------------------------------------------------------------------------------------------------
// Fira Sans semibold for the header; Inter for everything else.
export type FontStyle = "title" | "regular" | "semibold" | "bold";

// One font at one weight. y of path() is the baseline, x the left edge of the glyph (its advance not included).
export interface FontFace {
  advance(ch: string, size: number): number;
  path(ch: string, x: number, y: number, size: number): GlyphCmd[];
  kern?(left: string, right: string, size: number): number;
}
export type Fonts = Record<FontStyle, FontFace>;

// The part of an opentype.js font that is used here. A face can be made of several fonts (Latin first, then Latin Extended
// for letters such as š and ž): each character comes from the first font that has it.
export interface FontLike {
  unitsPerEm: number;
  charToGlyphIndex(ch: string): number;
  glyphs: { get(index: number): { advanceWidth?: number; getPath(x: number, y: number, size: number): { commands: GlyphCmd[] } } };
  getKerningValue?(left: number, right: number): number;
}

export function faceFrom(fonts: FontLike[]): FontFace {
  const find = (ch: string) => {
    for (const font of fonts) {
      const index = font.charToGlyphIndex(ch);
      if (index > 0) return { font, index };
    }
    return null;
  };
  return {
    advance(ch, size) {
      const hit = find(ch) ?? (ch === " " ? null : find(" "));
      const font = hit?.font ?? fonts[0]!;
      return (((hit ? font.glyphs.get(hit.index).advanceWidth : font.glyphs.get(font.charToGlyphIndex(" ")).advanceWidth) ?? 0) * size) / font.unitsPerEm;
    },
    path(ch, x, y, size) {
      const hit = find(ch);
      return hit ? hit.font.glyphs.get(hit.index).getPath(x, y, size).commands : [];
    },
    kern(left, right, size) {
      const l = find(left);
      const r = find(right);
      if (!l || !r || l.font !== r.font || !l.font.getKerningValue) return 0;
      return (l.font.getKerningValue(l.index, r.index) * size) / l.font.unitsPerEm;
    },
  };
}

export interface Seg {
  text: string;
  style: FontStyle;
  fill: string;
}

function width(fonts: Fonts, text: string, style: FontStyle, size: number, tracking = 0): number {
  const face = fonts[style];
  let w = 0;
  const chars = [...text];
  chars.forEach((ch, i) => {
    w += face.advance(ch, size) + tracking * size;
    const next = chars[i + 1];
    if (next && face.kern) w += face.kern(ch, next, size);
  });
  return w;
}

// The glyph outlines of one piece of text, starting at x on the baseline y.
function outline(fonts: Fonts, text: string, style: FontStyle, size: number, x: number, y: number, tracking = 0): Cmd[] {
  const face = fonts[style];
  const out: Cmd[] = [];
  const chars = [...text];
  chars.forEach((ch, i) => {
    if (ch.trim()) out.push(...fromGlyphCmds(face.path(ch, x, y, size)));
    x += face.advance(ch, size) + tracking * size;
    const next = chars[i + 1];
    if (next && face.kern) x += face.kern(ch, next, size);
  });
  return out;
}

type Word = Seg[];

// Splits styled pieces into words (pieces glued together without a space stay one word, for example a code followed by a comma).
function wordsOf(segs: Seg[]): Word[] {
  const words: Word[] = [];
  let cur: Word = [];
  for (const s of segs) {
    for (const part of s.text.split(/(\s+)/)) {
      if (/^\s+$/.test(part)) {
        if (cur.length) words.push(cur);
        cur = [];
      } else if (part) cur.push({ ...s, text: part });
    }
  }
  if (cur.length) words.push(cur);
  return words;
}

const wordWidth = (fonts: Fonts, w: Word, size: number) => w.reduce((sum, s) => sum + width(fonts, s.text, s.style, size), 0);

// Greedy line breaking. A word wider than the line stands alone on its own line.
function greedy(fonts: Fonts, words: Word[], size: number, maxWidth: number): Word[][] {
  const space = fonts.regular.advance(" ", size);
  const lines: Word[][] = [];
  let line: Word[] = [];
  let w = 0;
  for (const word of words) {
    const ww = wordWidth(fonts, word, size);
    if (line.length && w + space + ww > maxWidth) {
      lines.push(line);
      line = [];
      w = 0;
    }
    w += (line.length ? space : 0) + ww;
    line.push(word);
  }
  if (line.length) lines.push(line);
  return lines;
}

// The same lines, but evened out: the narrowest width that still gives the same number of lines (no single word left alone on the last line).
function breakLines(fonts: Fonts, words: Word[], size: number, maxWidth: number): Word[][] {
  const lines = greedy(fonts, words, size, maxWidth);
  if (lines.length < 2) return lines;
  let lo = Math.max(...words.map((w) => wordWidth(fonts, w, size)));
  let hi = maxWidth;
  for (let i = 0; i < 12 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(fonts, words, size, mid).length === lines.length) hi = mid;
    else lo = mid;
  }
  return greedy(fonts, words, size, hi);
}

type Align = "center" | "left";

// Paragraphs of styled words, centred on x or starting at x. Returns the shapes (one per colour) and the height of the block;
// the first baseline is at y.
function paragraphs(fonts: Fonts, paras: Seg[][], size: number, lineHeight: number, gap: number, x0: number, y: number, maxWidth: number, align: Align = "center"): { shapes: Shape[]; height: number } {
  const byFill = new Map<string, Cmd[]>();
  const add = (fill: string, cmds: Cmd[]) => byFill.set(fill, [...(byFill.get(fill) ?? []), ...cmds]);
  const space = fonts.regular.advance(" ", size);
  let baseline = y;
  paras.forEach((para, pi) => {
    for (const line of breakLines(fonts, wordsOf(para), size, maxWidth)) {
      const lw = line.reduce((sum, word, i) => sum + wordWidth(fonts, word, size) + (i ? space : 0), 0);
      let x = align === "center" ? x0 - lw / 2 : x0;
      line.forEach((word, wi) => {
        if (wi) x += space;
        for (const s of word) {
          add(s.fill, outline(fonts, s.text, s.style, size, x, baseline));
          x += width(fonts, s.text, s.style, size);
        }
      });
      baseline += size * lineHeight;
    }
    if (pi < paras.length - 1) baseline += gap;
  });
  return { shapes: [...byFill].map(([fill, cmds]) => ({ cmds, fill })), height: baseline - y - size * (lineHeight - 1) };
}

// ---- Copy -----------------------------------------------------------------------------------------------------------------
// Texts with {email} and {date} in them. The filled-in values are the highlighted ones.
export interface CardCopy {
  label: string; // KINKEKAART
  codeLabel: string; // SALAKOOD, above the code in its box
  print: { order: string; withCode: string; toEmail: string; valid: string }; // the sentences of the printed card
}

export type Kind = "print" | "email";

export interface GiftCardSpec {
  header: string; // the title of the card, lines separated by a line break
  logo: string; // the SVG text of the title's logo
  color: string; // main colour: the circle, the header
  code: string; // secret code, "" = none (no code box)
  email: string; // where to send the order (print only), "" = none
  until: string; // valid until, as it is written on the card, "" = none
  copy: CardCopy;
  printStyle?: PrintStyle; // the look of the printed card (default: the first)
  emailStyle?: EmailStyle; // the look of the picture for e-mail (default: the first)
}

export interface Piece {
  text: string;
  value: boolean; // filled in from the form: stands out
}

// Fills the {name} places; pieces that come from the values are marked as highlighted.
export function fillCopy(template: string, values: Record<string, string>): Piece[] {
  return template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((part) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1];
      return key ? { text: values[key] ?? "", value: true } : { text: part, value: false };
    });
}

// The two texts of the printed card (also what the tests read): what to do to order, and until when the card is valid.
// A part without a value is left out: no code, no "and the code"; no address, no "to e-mail"; no date, no validity line.
export function cardText(spec: GiftCardSpec): { order: Piece[]; valid: Piece[] } {
  const values = { email: spec.email.trim(), date: spec.until.trim() };
  const c = spec.copy.print;
  const order = c.order + (spec.code.trim() ? c.withCode : "") + (values.email ? c.toEmail : "");
  return { order: fillCopy(order, values), valid: values.date ? fillCopy(c.valid, values) : [] };
}

// ---- Colours and shapes ---------------------------------------------------------------------------------------------------
const BLACK = "#000000";
const WHITE = "#ffffff";
const YELLOW = "#ffe500"; // the highlight on dark colours

// The ink of the toolkit: text is Ink Gray 950, secondary text Ink Gray 700 (brand.json is the single source).
const ink = (step: string) => (brand.colors.find((c) => c.name === "Ink Gray")!.steps as Record<string, string>)[step]!.toLowerCase();
const INK = ink("950");
const MUTED = ink("700");

const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// t = 0 is a, t = 1 is b
const mix = (a: string, b: string, t: number) => {
  const [r2, g2, b2] = rgbOf(b);
  return "#" + rgbOf(a).map((v, i) => Math.round(v + ([r2, g2, b2][i]! - v) * t).toString(16).padStart(2, "0")).join("");
};
// The page: white with 6 % of the title's colour in it.
const tint = (color: string) => mix(WHITE, color, 0.06);

const K = 0.5522847498;

const rect = (x: number, y: number, w: number, h: number): Cmd[] => [["M", x, y], ["L", x + w, y], ["L", x + w, y + h], ["L", x, y + h], ["Z"]];

function roundRect(x: number, y: number, w: number, h: number, r: number): Cmd[] {
  const k = K * r;
  return [
    ["M", x + r, y],
    ["L", x + w - r, y],
    ["C", x + w - r + k, y, x + w, y + r - k, x + w, y + r],
    ["L", x + w, y + h - r],
    ["C", x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h],
    ["L", x + r, y + h],
    ["C", x + r - k, y + h, x, y + h - r + k, x, y + h - r],
    ["L", x, y + r],
    ["C", x, y + r - k, x + r - k, y, x + r, y],
    ["Z"],
  ];
}

// ---- The look --------------------------------------------------------------------------------------------------------------
// The look of the toolkit: a light tint of the title's colour as the page, Inter for the text, Fira Sans for the headline,
// a card like the cards of the app, as an object with a shadow.

// The text colour on the circle: white or black as the brand rule says (for other colours: white when it reads at 3:1, else black);
// the values stand out in yellow where that reads, else just bold.
function onCircle(color: string): { text: string; highlight: string } {
  const text = brandTextColor(color) ?? (contrast(WHITE, color) >= 3 ? WHITE : BLACK);
  return { text, highlight: contrast(YELLOW, color) >= 3 && text === WHITE ? YELLOW : text };
}

const segs = (pieces: Piece[], c: { text: string; highlight: string }): Seg[] => pieces.map((p) => (p.value ? { text: p.text, style: "semibold" as FontStyle, fill: c.highlight } : { text: p.text, style: "regular" as FontStyle, fill: c.text }));

// ---- Building blocks: pieces that know their height, stacked and centred ----------------------------------------------------
interface Item {
  height: number;
  draw(top: number): Shape[];
}

// Items one below the other with `gap` between them.
function stack(items: Item[], gap: number): Item {
  const height = items.reduce((sum, it) => sum + it.height, 0) + gap * Math.max(0, items.length - 1);
  return {
    height,
    draw(top) {
      let y = top;
      return items.flatMap((it) => {
        const shapes = it.draw(y);
        y += it.height + gap;
        return shapes;
      });
    },
  };
}

// The items stacked and placed in the middle of the space between `from` and `to`.
const between = (items: Item[], gap: number, from: number, to: number): Shape[] => {
  const s = stack(items, gap);
  return s.draw(from + (to - from - s.height) / 2);
};

function fitSize(fonts: Fonts, text: string, style: FontStyle, maxW: number, maxSize: number, minSize = 10): number {
  let size = maxSize;
  while (size > minSize && width(fonts, text, style, size) > maxW) size -= 0.5;
  return size;
}

// One line of text. x is its centre, or its left edge.
function lineItem(fonts: Fonts, text: string, style: FontStyle, size: number, x: number, fill: string, align: Align = "center", tracking = 0): Item {
  return {
    height: size * 0.8,
    draw: (top) => {
      const w = width(fonts, text, style, size, tracking) - tracking * size;
      return [{ cmds: outline(fonts, text, style, size, align === "center" ? x - w / 2 : x, top + size * 0.78, tracking), fill }];
    },
  };
}

// The label above the header: small capitals, spaced.
const labelItem = (fonts: Fonts, text: string, size: number, x: number, fill: string, align: Align = "center") => lineItem(fonts, text, "semibold", size, x, fill, align, 0.16);

// The header: every line the same size, Fira Sans. The size is the largest that fits.
function headerItem(fonts: Fonts, text: string, fill: string, x: number, maxW: number, maxH: number, maxSize: number, minSize: number, align: Align): Item {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lineHeight = 1.18;
  let size = maxSize;
  while (size > minSize && (Math.max(0, ...lines.map((l) => width(fonts, l, "title", size))) > maxW || lines.length * size * lineHeight > maxH)) size -= 0.5;
  return {
    height: lines.length ? (lines.length - 1) * size * lineHeight + size * 0.9 : 0,
    draw: (top) =>
      lines.map((line, i) => {
        const w = width(fonts, line, "title", size);
        return { cmds: outline(fonts, line, "title", size, align === "center" ? x - w / 2 : x, top + size * 0.82 + i * size * lineHeight), fill };
      }),
  };
}

// A paragraph (the pieces are styled words), wrapped to maxW.
function paragraphItem(fonts: Fonts, parts: Seg[], size: number, x: number, maxW: number, align: Align = "center"): Item {
  const m = paragraphs(fonts, [parts], size, 1.35, 0, x, 0, maxW, align);
  return { height: parts.length ? m.height : 0, draw: (top) => paragraphs(fonts, [parts], size, 1.35, 0, x, top + size * 0.78, maxW, align).shapes };
}

// The logo, as large as the box allows. x is its centre, its left edge or its right edge.
function logoItem(svg: string, x: number, maxW: number, maxH: number, align: Align | "right" = "center"): Item & { width: number } {
  const logo = logoShapes(svg);
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const w = logo.width * scale;
  const dx = align === "center" ? x - w / 2 : align === "left" ? x : x - w;
  return { height: logo.height * scale, width: w, draw: (top) => logo.shapes.map((s) => ({ ...s, cmds: place(s.cmds, scale, dx, top) })) };
}

// The logo on a white rounded plate, for when the page behind it is coloured.
function logoPlateItem(svg: string, cx: number, maxW: number, maxH: number, pad: number): Item {
  const logo = logoItem(svg, cx, maxW, maxH);
  const w = logo.width + 2 * pad;
  const h = logo.height + 2 * pad;
  return { height: h, draw: (top) => [{ cmds: roundRect(cx - w / 2, top, w, h, Math.min(22, h * 0.14)), fill: WHITE }, ...logo.draw(top + pad)] };
}

interface BoxLook {
  box: string; // the box
  label: string; // the small word above the code
  code: string;
}

// The secret code in a box: a small label above, the code big. The code gets as large as the box allows.
function codeBoxItem(fonts: Fonts, cx: number, w: number, h: number, label: string, code: string, look: BoxLook, maxCode: number, labelSize: number): Item {
  const tracking = 0.16;
  const size = fitSize(fonts, code, "bold", w - 48, maxCode, 14);
  return {
    height: h,
    draw: (top) => {
      const lw = width(fonts, label, "semibold", labelSize, tracking) - tracking * labelSize;
      const cw = width(fonts, code, "bold", size);
      return [
        { cmds: roundRect(cx - w / 2, top, w, h, Math.min(18, h * 0.2)), fill: look.box },
        { cmds: outline(fonts, label, "semibold", labelSize, cx - lw / 2, top + h * 0.3, tracking), fill: look.label },
        { cmds: outline(fonts, code, "bold", size, cx - cw / 2, top + h * 0.8), fill: look.code },
      ];
    },
  };
}

// ---- The card as an object ------------------------------------------------------------------------------------------------
// One design, two sizes: a rounded card with a soft shadow and a punched slot, lying on a page that is a light tint of the title's colour.
// Two looks: a white card with the colour in the details, or a card in the title's colour.
export const A4 = { width: 595.276, height: 841.89 }; // points (210 x 297 mm)
export const EMAIL = { width: 600, height: 400 }; // pixels

export const PRINT_STYLES = ["white", "colour"] as const;
export type PrintStyle = (typeof PRINT_STYLES)[number];
export const EMAIL_STYLES = ["white", "colour"] as const;
export type EmailStyle = (typeof EMAIL_STYLES)[number];

type Look = { text: string; highlight: string };

// The page: white with 6 % of the title's colour in it.
const page = (w: number, h: number, color: string): Shape => ({ cmds: rect(0, 0, w, h), fill: tint(color) });

// A soft shadow under a rounded box: layers from the outside in, each a little darker, so the edge is smooth.
// The shadow is the page colour darkened towards the title's colour, never grey.
function shadowShapes(x: number, y: number, w: number, h: number, r: number, color: string, spread: number, drop: number): Shape[] {
  const layers = 30;
  const dark = mix(color, BLACK, 0.6);
  const shapes: Shape[] = [];
  for (let i = layers; i >= 1; i--) {
    const k = i / layers; // 1 = outermost
    const grow = spread * k;
    shapes.push({ cmds: roundRect(x - grow, y - grow + drop * (1 - 0.5 * k), w + 2 * grow, h + 2 * grow, r + grow), fill: mix(tint(color), dark, 0.17 * (1 - k) ** 2.1) });
  }
  return shapes;
}

// The punched slot at the top of the card, as on a hanging gift card: a little darker on its upper edge, as if it had depth.
function slotShapes(cx: number, y: number, w: number, h: number, color: string): Shape[] {
  return [
    { cmds: roundRect(cx - w / 2, y - 1.2, w, h, h / 2), fill: mix(tint(color), BLACK, 0.12) },
    { cmds: roundRect(cx - w / 2, y, w, h, h / 2), fill: mix(tint(color), BLACK, 0.035) },
  ];
}

// A small rounded label with text in it, centred on cx.
function pillItem(fonts: Fonts, text: string, cx: number, size: number, fill: string, textFill: string): Item {
  const h = size * 2.05;
  const tw = width(fonts, text, "semibold", size);
  const w = tw + size * 2;
  return {
    height: h,
    draw: (top) => [
      { cmds: roundRect(cx - w / 2, top, w, h, h / 2), fill },
      { cmds: outline(fonts, text, "semibold", size, cx - tw / 2, top + h / 2 + size * 0.36), fill: textFill },
    ],
  };
}

interface Face {
  w: number;
  h: number;
  card: { x: number; y: number; w: number; h: number; r: number };
  slot: { y: number; w: number; h: number }; // y from the top of the card
  shadow: { spread: number; drop: number };
  pad: number;
  gap: number;
}

// The card itself, and what stands in it; `items` get the colours of the look.
function cardDrawing(face: Face, spec: GiftCardSpec, variant: "white" | "colour", items: (k: Palette) => Item[]): Drawing {
  const color = spec.color;
  const c = onCircle(color);
  const colour = variant === "colour";
  const palette: Palette = colour
    ? { head: c.text, label: mix(color, c.text, 0.78), body: { text: c.text, highlight: c.highlight }, muted: mix(color, c.text, 0.85), pill: mix(color, c.text, 0.2), pillText: c.text, plate: true, box: { box: WHITE, label: readableOn(color, WHITE, 3), code: INK } }
    : { head: readableOn(color, WHITE, 3), label: MUTED, body: { text: INK, highlight: INK }, muted: MUTED, pill: color, pillText: c.text, plate: false, box: { box: mix(WHITE, color, 0.09), label: readableOn(color, mix(WHITE, color, 0.09), 3), code: INK } };
  const { card, slot } = face;
  const cx = card.x + card.w / 2;
  const top = card.y + slot.y + slot.h + face.gap;
  const bottom = card.y + card.h - face.pad;
  return {
    width: face.w,
    height: face.h,
    shapes: [
      page(face.w, face.h, color),
      ...shadowShapes(card.x, card.y, card.w, card.h, card.r, color, face.shadow.spread, face.shadow.drop),
      { cmds: roundRect(card.x, card.y, card.w, card.h, card.r), fill: colour ? color : WHITE },
      ...slotShapes(cx, card.y + slot.y, slot.w, slot.h, color),
      ...between(items(palette), face.gap, top, bottom),
    ],
  };
}

interface Palette {
  head: string; // the header
  label: string; // the small capitals
  body: Look; // the sentence
  muted: string; // the date
  pill: string;
  pillText: string;
  plate: boolean; // the logo on a white plate (when the card is coloured)
  box: BoxLook; // the code box
}

const logoOn = (spec: GiftCardSpec, cx: number, maxW: number, maxH: number, k: Palette): Item => (k.plate ? logoPlateItem(spec.logo, cx, maxW, maxH, 14) : logoItem(spec.logo, cx, maxW, maxH));

// The printed card: label, logo, header, the code, what to do and until when. In the middle of the page.
function printCard(spec: GiftCardSpec, fonts: Fonts, variant: "white" | "colour"): Drawing {
  const { width: w, height: h } = A4;
  const cw = 0.78 * w;
  const ch = 0.72 * h;
  const face: Face = { w, h, card: { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch, r: 34 }, slot: { y: 24, w: 66, h: 14 }, shadow: { spread: 40, drop: 16 }, pad: 42, gap: 24 };
  const cx = w / 2;
  const code = spec.code.trim();
  return cardDrawing(face, spec, variant, (k) => {
    const text = cardText(spec);
    return [
      labelItem(fonts, spec.copy.label, 13, cx, k.label),
      logoOn(spec, cx, 0.5 * w, 0.085 * h, k),
      headerItem(fonts, spec.header, k.head, cx, cw - 2 * face.pad, 0.15 * h, 36, 22, "center"),
      ...(code ? [codeBoxItem(fonts, cx, cw - 2 * face.pad, 112, spec.copy.codeLabel, code, k.box, 54, 9.5)] : []),
      paragraphItem(fonts, segs(text.order, k.body), 16, cx, cw - 2 * face.pad - 20),
      ...(text.valid.length ? [paragraphItem(fonts, segs(text.valid, { text: k.muted, highlight: k.muted }), 14.5, cx, cw - 2 * face.pad)] : []),
    ];
  });
}

// The picture for e-mail: only the logo, how long (the header without its first line: the logo already says the title) and the code, all big.
// On a phone this picture is about 60 % of its size. Until when and what to do belong in the letter.
function emailLines(header: string): string {
  const lines = header.split("\n").map((l) => l.trim()).filter(Boolean);
  return (lines.length > 1 ? lines.slice(1) : lines).join(" ");
}

function emailCard(spec: GiftCardSpec, fonts: Fonts, variant: "white" | "colour"): Drawing {
  const { width: w, height: h } = EMAIL;
  const face: Face = { w, h, card: { x: 36, y: 22, w: w - 72, h: 330, r: 26 }, slot: { y: 18, w: 46, h: 11 }, shadow: { spread: 24, drop: 10 }, pad: 28, gap: 18 };
  const cx = w / 2;
  const code = spec.code.trim();
  const how = emailLines(spec.header);
  return cardDrawing(face, spec, variant, (k) => [
    logoOn(spec, cx, 250, 68, k),
    ...(how ? [pillItem(fonts, how, cx, 19, k.pill, k.pillText)] : []),
    ...(code ? [codeBoxItem(fonts, cx, w - 72 - 2 * 28, 104, spec.copy.codeLabel, code, k.box, 52, 11)] : []),
  ]);
}

const PRINT: Record<PrintStyle, (spec: GiftCardSpec, fonts: Fonts) => Drawing> = { white: (s, f) => printCard(s, f, "white"), colour: (s, f) => printCard(s, f, "colour") };
const MAIL: Record<EmailStyle, (spec: GiftCardSpec, fonts: Fonts) => Drawing> = { white: (s, f) => emailCard(s, f, "white"), colour: (s, f) => emailCard(s, f, "colour") };

// The whole card of one kind, in the style the spec names (the first of each list when it names none).
export function layoutCard(kind: Kind, spec: GiftCardSpec, fonts: Fonts): Drawing {
  return kind === "print" ? PRINT[spec.printStyle ?? "white"](spec, fonts) : MAIL[spec.emailStyle ?? "white"](spec, fonts);
}

// The back of the card, for printing on both sides: the logo alone on the tinted page.
export function layoutBack(spec: GiftCardSpec): Drawing {
  const { width: w, height: h } = A4;
  const logo = logoItem(spec.logo, w / 2, 0.55 * w, 0.28 * h);
  return { width: w, height: h, shapes: [page(w, h, spec.color), ...logo.draw(h / 2 - logo.height / 2)] };
}
