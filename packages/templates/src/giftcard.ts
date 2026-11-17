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
  print: { order: string; withCode: string; toEmail: string; valid: string };
  email: { order: string; withCode: string; valid: string };
}

export type Kind = "print" | "email";

export interface GiftCardSpec {
  header: string; // the title of the card, lines separated by a line break
  logo: string; // the SVG text of the title's logo
  color: string; // main colour: the circle, the header and the lines around the card
  code: string; // secret code, "" = none (no code box)
  email: string; // where to send the order (print only), "" = none
  until: string; // valid until, as it is written on the card, "" = none
  copy: CardCopy;
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

// The two texts on the card (also what the tests read): what to do to order, and until when the card is valid.
// A part without a value is left out: no code, no "and the code"; no address, no "to e-mail"; no date, no validity line.
export function cardText(kind: Kind, spec: GiftCardSpec): { order: Piece[]; valid: Piece[] } {
  const values = { email: spec.email.trim(), date: spec.until.trim() };
  const c = spec.copy[kind];
  const order = c.order + (spec.code.trim() ? c.withCode : "") + (kind === "print" && values.email ? spec.copy.print.toEmail : "");
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

const K = 0.5522847498;

// A full circle of radius r as four curves.
function circle(cx: number, cy: number, r: number): Cmd[] {
  const k = K * r;
  return [
    ["M", cx + r, cy],
    ["C", cx + r, cy + k, cx + k, cy + r, cx, cy + r],
    ["C", cx - k, cy + r, cx - r, cy + k, cx - r, cy],
    ["C", cx - r, cy - k, cx - k, cy - r, cx, cy - r],
    ["C", cx + k, cy - r, cx + r, cy - k, cx + r, cy],
    ["Z"],
  ];
}

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

// The logo fitted into a box. x is its centre, its left edge or its right edge, as align says.
function logoDrawing(svg: string, x: number, top: number, bottom: number, maxW: number, align: "center" | "left" | "right" = "center"): Shape[] {
  const logo = logoShapes(svg);
  const scale = Math.min(maxW / logo.width, (bottom - top) / logo.height);
  const w = logo.width * scale;
  const dx = align === "center" ? x - w / 2 : align === "left" ? x : x - w;
  const dy = (top + bottom) / 2 - (logo.height * scale) / 2;
  return logo.shapes.map((s) => ({ ...s, cmds: place(s.cmds, scale, dx, dy) }));
}

// ---- The look --------------------------------------------------------------------------------------------------------------
// The look of the toolkit: white, plenty of room, Inter for the text, Fira Sans for the headline, the colour of the title in one big
// circle at the bottom. Nothing around the card.

// The text colour on the circle: white or black as the brand rule says (for other colours: white when it reads at 3:1, else black);
// the values stand out in yellow where that reads, else just bold.
function onCircle(color: string): { text: string; highlight: string } {
  const text = brandTextColor(color) ?? (contrast(WHITE, color) >= 3 ? WHITE : BLACK);
  return { text, highlight: contrast(YELLOW, color) >= 3 && text === WHITE ? YELLOW : text };
}

const segs = (pieces: Piece[], c: { text: string; highlight: string }): Seg[] => pieces.map((p) => (p.value ? { text: p.text, style: "semibold" as FontStyle, fill: c.highlight } : { text: p.text, style: "regular" as FontStyle, fill: c.text }));

// The secret code in a white box on the circle: a small label above, the code big.
function codeBox(fonts: Fonts, cx: number, top: number, w: number, h: number, label: string, code: string, color: string, size: { label: number; code: number }): Shape[] {
  const accent = readableOn(color, WHITE, 3);
  const tracking = 0.16;
  const lw = width(fonts, label, "semibold", size.label, tracking) - tracking * size.label;
  const cw = width(fonts, code, "bold", size.code);
  return [
    { cmds: roundRect(cx - w / 2, top, w, h, Math.min(16, h * 0.2)), fill: WHITE },
    { cmds: outline(fonts, label, "semibold", size.label, cx - lw / 2, top + h * 0.3, tracking), fill: accent },
    { cmds: outline(fonts, code, "bold", size.code, cx - cw / 2, top + h * 0.8), fill: INK },
  ];
}

// The header: every line the same size, in the title's colour, in Fira Sans. The size is the largest that fits.
function header(fonts: Fonts, text: string, color: string, x: number, top: number, maxW: number, maxH: number, maxSize: number, minSize: number, align: Align): { shapes: Shape[]; bottom: number } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { shapes: [], bottom: top };
  const lineHeight = 1.18;
  let size = maxSize;
  while (size > minSize && (Math.max(...lines.map((l) => width(fonts, l, "title", size))) > maxW || lines.length * size * lineHeight > maxH)) size -= 0.5;
  const fill = readableOn(color, WHITE, 3); // large text: 3:1 is enough
  const shapes = lines.map((line, i) => {
    const w = width(fonts, line, "title", size);
    return { cmds: outline(fonts, line, "title", size, align === "center" ? x - w / 2 : x, top + size * 0.82 + i * size * lineHeight), fill };
  });
  return { shapes, bottom: top + size * 0.82 + (lines.length - 1) * size * lineHeight + size * 0.2 };
}

// ---- The cards ------------------------------------------------------------------------------------------------------------
export const A4 = { width: 595.276, height: 841.89 }; // points (210 x 297 mm)
export const EMAIL = { width: 600, height: 400 }; // pixels

// The printed card: label, header, the logo, then the circle with what to do, the code and the date.
function printCard(spec: GiftCardSpec, fonts: Fonts): Drawing {
  const { width: w, height: h } = A4;
  const cx = w / 2;
  const color = spec.color;
  const c = onCircle(color);
  const circleTop = 0.53 * h;
  const shapes: Shape[] = [
    { cmds: rect(0, 0, w, h), fill: WHITE },
    { cmds: circle(cx, circleTop + 1.27 * w, 1.27 * w), fill: color },
  ];

  const label = spec.copy.label;
  const labelSize = 15;
  const tracking = 0.16;
  const lw = width(fonts, label, "semibold", labelSize, tracking) - tracking * labelSize;
  shapes.push({ cmds: outline(fonts, label, "semibold", labelSize, cx - lw / 2, 0.095 * h, tracking), fill: MUTED });

  const head = header(fonts, spec.header, color, cx, 0.125 * h, 0.84 * w, 0.2 * h, 42, 24, "center");
  shapes.push(...head.shapes);
  shapes.push(...logoDrawing(spec.logo, cx, Math.max(head.bottom + 36, 0.33 * h), circleTop - 40, 0.6 * w));

  // in the circle: what to do, the code, until when; the block stands in the middle of the circle
  const text = cardText("print", spec);
  const orderSegs = segs(text.order, c);
  const validSegs = segs(text.valid, c);
  const orderSize = 19;
  const validSize = 17;
  const gap = 28;
  const boxH = 88;
  const code = spec.code.trim();
  const order = paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, cx, 0, 0.64 * w);
  const valid = validSegs.length ? paragraphs(fonts, [validSegs], validSize, 1.3, 0, cx, 0, 0.7 * w) : null;
  const total = order.height + (code ? gap + boxH : 0) + (valid ? gap + valid.height : 0);
  const regionTop = circleTop + 40;
  const regionBottom = h - 48;
  let y = regionTop + (regionBottom - regionTop - total) / 2;
  shapes.push(...paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, cx, y + orderSize * 0.78, 0.64 * w).shapes);
  y += order.height;
  if (code) {
    shapes.push(...codeBox(fonts, cx, y + gap, Math.max(230, width(fonts, code, "bold", 36) + 80), boxH, spec.copy.codeLabel, code, color, { label: 9.5, code: 36 }));
    y += gap + boxH;
  }
  if (valid) shapes.push(...paragraphs(fonts, [validSegs], validSize, 1.3, 0, cx, y + gap + validSize * 0.78, 0.7 * w).shapes);
  return { width: w, height: h, shapes };
}

// The picture for e-mail is small on a phone, so the type is big. The label and the header on the top left, the logo on the top right,
// the circle across the bottom: the words on its left, the code on its right.
function emailCard(spec: GiftCardSpec, fonts: Fonts): Drawing {
  const { width: w, height: h } = EMAIL;
  const pad = 32;
  const color = spec.color;
  const c = onCircle(color);
  const circleTop = 190;
  const shapes: Shape[] = [
    { cmds: rect(0, 0, w, h), fill: WHITE },
    { cmds: circle(w / 2, circleTop + 1.3 * w, 1.3 * w), fill: color },
  ];

  const label = spec.copy.label;
  const labelSize = 13;
  const tracking = 0.16;
  shapes.push({ cmds: outline(fonts, label, "semibold", labelSize, pad, 48, tracking), fill: MUTED });

  const logoW = 150;
  shapes.push(...logoDrawing(spec.logo, w - pad, 32, 138, logoW, "right"));
  shapes.push(...header(fonts, spec.header, color, pad, 62, w - 2 * pad - logoW - 24, 112, 38, 22, "left").shapes);

  const text = cardText("email", spec);
  const orderSegs = segs(text.order, c);
  const validSegs = segs(text.valid, c);
  const code = spec.code.trim();
  const orderSize = 18;
  const validSize = 17;
  if (code) {
    // words and date on the left, the code on the right
    const colW = 292;
    const order = paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, pad, 0, colW, "left");
    shapes.push(...paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, pad, 272, colW, "left").shapes);
    if (validSegs.length) shapes.push(...paragraphs(fonts, [validSegs], validSize, 1.3, 0, pad, 272 + order.height + 14 + validSize * 0.78, colW, "left").shapes);
    shapes.push(...codeBox(fonts, 462, 252, 210, 96, spec.copy.codeLabel, code, color, { label: 9.5, code: 38 }));
  } else {
    // no code: the words in the middle of the circle
    const order = paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, w / 2, 0, 460);
    shapes.push(...paragraphs(fonts, [orderSegs], orderSize, 1.35, 0, w / 2, 282, 460).shapes);
    if (validSegs.length) shapes.push(...paragraphs(fonts, [validSegs], validSize, 1.3, 0, w / 2, 282 + order.height + 18 + validSize * 0.78, 460).shapes);
  }
  return { width: w, height: h, shapes };
}

// The whole card of one kind.
export function layoutCard(kind: Kind, spec: GiftCardSpec, fonts: Fonts): Drawing {
  return kind === "print" ? printCard(spec, fonts) : emailCard(spec, fonts);
}

// The back of the card, for printing on both sides: the logo alone on a white page.
export function layoutBack(spec: GiftCardSpec): Drawing {
  const { width: w, height: h } = A4;
  return { width: w, height: h, shapes: [{ cmds: rect(0, 0, w, h), fill: WHITE }, ...logoDrawing(spec.logo, w / 2, 0.36 * h, 0.64 * h, 0.55 * w)] };
}
