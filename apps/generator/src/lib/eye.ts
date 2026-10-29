// The Õhtuleht eye: the eye in the letter ы. Drawing, SVG and the safety rules.
// Shapes are copied from Figma ("Õhtuleht - Brand hub", page Eye, frames 39:231 filled and 39:314 outline).
// Glyph space is the Figma frame: 1200 x 1200, the letter fills x 220 to 980 and y 140 to 1060, its centre is (600, 600).
import { brand } from "@ohtuleht/brand";

const colour = (scale: string, step: string, fallback: string) => (brand.colors.find((c) => c.id === scale)?.steps as Record<string, string> | undefined)?.[step] ?? fallback;

export const EYE_RED = colour("red", "600", "#F50000"); // body and cap of the filled version
export const EYE_IRIS = colour("red", "950", "#520000"); // the dark iris
export const EYE_WHITE = "#FFFFFF";

export const GLYPH = { cx: 600, cy: 600, width: 760, height: 920 };
const HOLE_BOX = { x: 403, y: 525, w: 356, h: 375 };
export const IRIS_R = 71;
const HIGHLIGHT = { dx: 16.55, dy: -12.56, r: 28 };
export const IRIS_DEFAULT = { x: 618.714, y: 651.61 }; // where Figma draws the iris

// Filled version (frame 39:231).
const BODY = "M813.452 415.61C762.332 382.32 700.602 365.67 628.202 365.67C518.392 365.67 427.562 398 355.842 462.68C284.072 527.38 240.592 607.25 225.342 702.35C209.462 802.55 228.992 887.17 283.902 956.33C338.842 1025.42 422.151 1060 533.911 1060C645.672 1060 734.552 1027.64 806.302 962.97C878.062 898.29 921.562 818.37 936.812 723.28C946.962 659.26 941.701 600.25 921.102 546.38C900.461 492.48 864.582 448.9 813.462 415.6L813.452 415.61Z";
const HOLE = "M758.404 706.75C749.494 764.4 726.164 810.7 688.404 845.56C650.634 880.46 602.514 897.9 544.104 897.9C490.164 897.9 451.084 881.08 426.954 847.49C402.824 813.91 394.904 770.76 403.164 718.14C412.684 660.45 436.184 614.15 473.634 579.29C511.074 544.42 559.024 527 617.434 527C671.414 527 710.484 543.79 734.594 577.37C758.734 611.02 766.674 654.11 758.414 706.76L758.404 706.75Z";
const CAP = "M628.361 295.33C714.851 295.33 790.651 316.14 853.632 357.14C872.072 369.16 888.551 382.66 903.911 396.96C905.241 395.96 906.572 394.87 907.902 394.02C950.302 366.22 979.991 317.18 979.991 229.84C979.991 199.71 966.411 158.36 949.531 140C935.812 153.58 921.761 163.04 899.791 171.7C886.911 176.91 869.302 179.6 850.202 179.6H559.531C517.501 179.6 487.301 184.83 470.121 191.52C418.971 212.07 400.281 247.68 400.281 292.6C400.281 311.64 403.611 328.45 409.001 342.52C473.571 311.25 546.892 295.33 628.352 295.33H628.361Z";

// Outline version (frame 39:314): the same shapes drawn as 16 unit lines.
const BODY_LINE = "M628.201 373.67C699.344 373.67 759.49 390.016 809.086 422.313L811.445 423.85C859.981 456.077 893.945 497.835 913.629 549.236V549.237C933.668 601.641 938.867 659.211 928.912 722.014C913.952 815.295 871.352 893.567 800.945 957.027C730.853 1020.2 643.962 1052 533.911 1052C423.884 1052 343.195 1018.04 290.163 951.351C236.861 884.213 217.656 801.946 233.242 703.602C248.204 610.317 290.784 532.1 361.198 468.622L361.199 468.621C431.246 405.45 520.078 373.67 628.201 373.67Z";
const HOLE_LINE = "M617.724 535.39C669.179 535.39 705.086 551.056 727.336 580.99L728.385 582.426C750.53 613.298 758.513 653.112 751.254 702.894L750.787 705.918C742.114 762.038 719.518 806.604 683.267 840.072L683.264 840.075C647.176 873.42 601.087 890.29 544.394 890.29C492.167 890.29 455.926 874.096 433.74 843.212V843.211L432.692 841.732C410.932 810.528 403.456 770.174 411.347 719.832C420.622 663.628 443.401 619.021 479.374 585.536L479.375 585.535C515.122 552.242 561.026 535.39 617.724 535.39Z";
const CAP_LINE = "M948.657 151.79C954.193 159.838 959.394 170.801 963.507 183.052C968.806 198.836 971.991 215.834 971.991 229.84C971.991 314.39 943.665 360.535 904.523 386.661C890.278 373.758 874.973 361.502 858 350.438L857.996 350.436L856.482 349.456C792.321 308.14 715.476 287.33 628.361 287.33H628.352C549.232 287.33 477.454 302.162 413.691 331.464C410.309 320.117 408.281 307.085 408.281 292.6C408.281 271.246 412.717 252.738 422.734 237.271C432.725 221.846 448.717 208.748 473.062 198.959C488.939 192.787 518.005 187.6 559.531 187.6H850.201C869.873 187.6 888.57 184.852 902.724 179.142L902.725 179.143C922.261 171.442 936.025 163.011 948.657 151.79Z";
const LINE_WIDTH = 16;

export type EyeStyle = "filled" | "outline";

export interface EyeState {
  style: EyeStyle;
  iris: { x: number; y: number }; // centre of the iris, glyph space
  angle: number; // degrees, clockwise
  size: number; // 1 = as drawn in Figma on a canvas whose short side is 1200
  fx: number; // centre of the letter as a share of the canvas width (0.5 = middle)
  fy: number;
  ratio: [number, number]; // canvas width : height
  background: string | null; // null = transparent
}

// Canvas in drawing units: the short side is always 1200.
export function canvasOf(ratio: [number, number]) {
  const [rw, rh] = ratio;
  return rw >= rh ? { w: Math.round((1200 * rw) / rh), h: 1200 } : { w: 1200, h: Math.round((1200 * rh) / rw) };
}

export const RATIOS: { id: string; ratio: [number, number] }[] = [
  { id: "1:1", ratio: [1, 1] },
  { id: "4:3", ratio: [4, 3] },
  { id: "3:4", ratio: [3, 4] },
  { id: "16:9", ratio: [16, 9] },
  { id: "9:16", ratio: [9, 16] },
];

const f = (n: number) => String(Math.round(n * 100) / 100);

// The finished picture as a standalone SVG (transparent unless a background is set).
export function eyeSvg(s: EyeState): string {
  const { w, h } = canvasOf(s.ratio);
  const filled = s.style === "filled";
  const iris =
    `<g clip-path="url(#eye-hole)"><circle cx="${f(s.iris.x)}" cy="${f(s.iris.y)}" r="${IRIS_R}" fill="${EYE_IRIS}"/>` +
    `<circle cx="${f(s.iris.x + HIGHLIGHT.dx)}" cy="${f(s.iris.y + HIGHLIGHT.dy)}" r="${HIGHLIGHT.r}" fill="${EYE_WHITE}"/></g>`;
  const parts = filled
    ? `<path d="${BODY}" fill="${EYE_RED}"/><path d="${HOLE}" fill="${EYE_WHITE}"/>${iris}<path d="${CAP}" fill="${EYE_RED}"/>`
    : `<path d="${BODY_LINE}" stroke="${EYE_WHITE}" stroke-width="${LINE_WIDTH}"/><path d="${HOLE}" fill="${EYE_WHITE}"/>${iris}` +
      `<path d="${HOLE_LINE}" stroke="${EYE_WHITE}" stroke-width="${LINE_WIDTH}"/><path d="${CAP_LINE}" stroke="${EYE_WHITE}" stroke-width="${LINE_WIDTH}"/>`;
  const place = `translate(${f(s.fx * w)} ${f(s.fy * h)}) rotate(${f(s.angle)}) scale(${Math.round(s.size * 10000) / 10000}) translate(-${GLYPH.cx} -${GLYPH.cy})`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">` +
    `<title>Õhtuleht eye</title>` +
    `<defs><clipPath id="eye-hole"><path d="${HOLE}"/></clipPath></defs>` +
    (s.background ? `<rect width="${w}" height="${h}" fill="${s.background}"/>` : "") +
    `<g transform="${place}">${parts}</g></svg>`
  );
}

export const svgDataUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

// PNG of the given pixel width (the height follows the canvas proportions).
export async function eyePng(s: EyeState, pixelWidth: number): Promise<Blob> {
  const { w, h } = canvasOf(s.ratio);
  const pw = Math.max(1, Math.round(pixelWidth));
  const ph = Math.max(1, Math.round((pixelWidth * h) / w));
  const img = new Image();
  img.src = svgDataUrl(eyeSvg(s));
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, pw, ph);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png"));
}

// ---------- Safety rules ----------

export type RuleId = "iris" | "cap" | "eye" | "letter";
// Shares of each part that must stay inside the picture.
export const LIMITS: Record<RuleId, number> = { iris: 1, cap: 1, eye: 0.9, letter: 0.55 };
const TOLERANCE = 0.015; // raster counting is not exact

export interface Safety {
  shares: Record<RuleId, number>; // 0 to 1
  ok: boolean;
  broken: RuleId[];
}

const RES = 0.25; // pixels per drawing unit when counting
const holePath = new Path2D(HOLE);
const parts = { body: new Path2D(BODY), cap: new Path2D(CAP) };
let totals: Record<RuleId, number> | null = null;

function count(draw: (ctx: CanvasRenderingContext2D) => void, w: number, h: number, transform: DOMMatrix | null): number {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * RES));
  canvas.height = Math.max(1, Math.ceil(h * RES));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(RES, RES);
  if (transform) ctx.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
  ctx.fillStyle = "#000";
  draw(ctx);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i]! / 255;
  return sum;
}

const drawIris = (ctx: CanvasRenderingContext2D, iris: EyeState["iris"]) => {
  ctx.beginPath();
  ctx.arc(iris.x, iris.y, IRIS_R, 0, Math.PI * 2);
  ctx.arc(iris.x + HIGHLIGHT.dx, iris.y + HIGHLIGHT.dy, HIGHLIGHT.r, 0, Math.PI * 2);
  ctx.fill("nonzero");
};
const drawLetter = (ctx: CanvasRenderingContext2D) => {
  ctx.fill(parts.body);
  ctx.fill(parts.cap);
};

// Area of each part in drawing units when nothing is cut (counted once).
function totalsOf(iris: EyeState["iris"]) {
  if (!totals) {
    totals = {
      iris: count((c) => drawIris(c, IRIS_DEFAULT), 1200, 1200, null),
      cap: count((c) => c.fill(parts.cap), 1200, 1200, null),
      eye: count((c) => c.fill(holePath), 1200, 1200, null),
      letter: count(drawLetter, 1200, 1200, null),
    };
  }
  void iris;
  return totals;
}

// How much of each part is inside the picture, and which rules are broken.
export function checkSafety(s: EyeState): Safety {
  const { w, h } = canvasOf(s.ratio);
  const t = totalsOf(s.iris);
  const m = new DOMMatrix().translate(s.fx * w, s.fy * h).rotate(s.angle).scale(s.size).translate(-GLYPH.cx, -GLYPH.cy);
  const k = s.size * s.size;
  const share = (visible: number, total: number) => Math.min(1, visible / (total * k));
  const shares: Record<RuleId, number> = {
    iris: share(count((c) => drawIris(c, s.iris), w, h, m), t.iris),
    cap: share(count((c) => c.fill(parts.cap), w, h, m), t.cap),
    eye: share(count((c) => c.fill(holePath), w, h, m), t.eye),
    letter: share(count(drawLetter, w, h, m), t.letter),
  };
  const broken = (Object.keys(LIMITS) as RuleId[]).filter((id) => shares[id] < LIMITS[id] - TOLERANCE);
  return { shares, ok: broken.length === 0, broken };
}

// ---------- Moving the iris ----------

const ctxProbe = document.createElement("canvas").getContext("2d")!;
const irisFits = (x: number, y: number) => {
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (!ctxProbe.isPointInPath(holePath, x + Math.cos(a) * IRIS_R, y + Math.sin(a) * IRIS_R)) return false;
  }
  return true;
};

// The iris stays inside the eye: a wanted spot outside is pulled back toward the middle of the eye.
export function clampIris(want: { x: number; y: number }): { x: number; y: number } {
  if (irisFits(want.x, want.y)) return want;
  const home = { x: HOLE_BOX.x + HOLE_BOX.w / 2, y: HOLE_BOX.y + HOLE_BOX.h / 2 };
  let lo = 0; // fits
  let hi = 1; // does not fit
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (irisFits(home.x + (want.x - home.x) * mid, home.y + (want.y - home.y) * mid)) lo = mid;
    else hi = mid;
  }
  return { x: home.x + (want.x - home.x) * lo, y: home.y + (want.y - home.y) * lo };
}

// ---------- Moving the letter safely ----------

// Goes from a safe picture toward a wanted one and stops where a rule would break.
export function approach(from: EyeState, to: EyeState): { state: EyeState; stopped: RuleId | null } {
  const at = (t: number): EyeState => ({
    ...to,
    angle: from.angle + (to.angle - from.angle) * t,
    size: from.size + (to.size - from.size) * t,
    fx: from.fx + (to.fx - from.fx) * t,
    fy: from.fy + (to.fy - from.fy) * t,
  });
  const wanted = checkSafety(to);
  if (wanted.ok) return { state: to, stopped: null };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (checkSafety(at(mid)).ok) lo = mid;
    else hi = mid;
  }
  return { state: at(lo), stopped: wanted.broken[0] ?? null };
}

// ---------- Ready-made looks (from the Figma page) ----------

export interface EyePreset {
  id: string;
  look?: { x: number; y: number }; // where the iris goes (clamped)
  angle: number;
  fx: number;
  fy: number;
}

// Angles are clockwise. Figma draws the tilted ones at -131.44 and 87.22 degrees (counter-clockwise).
export const PRESETS: EyePreset[] = [
  { id: "straight", angle: 0, fx: 0.5, fy: 0.5 },
  { id: "left", look: { x: 529, y: 693 }, angle: 0, fx: 0.5, fy: 0.5 },
  { id: "down", look: { x: 600, y: 742 }, angle: 0, fx: 0.5, fy: 0.5 },
  { id: "turned-right", angle: 131.44, fx: 0.5, fy: 0.5 },
  { id: "turned-left", angle: -87.22, fx: 0.5, fy: 0.5 },
  { id: "peek-top-left", angle: 131.44, fx: 283.1 / 1200, fy: 348.3 / 1200 },
  { id: "peek-bottom-right", angle: -87.22, fx: 923.7 / 1200, fy: 909.6 / 1200 },
];

export function newEye(style: EyeStyle = "filled"): EyeState {
  return { style, iris: { ...IRIS_DEFAULT }, angle: 0, fx: 0.5, fy: 0.5, size: 1, ratio: [1, 1], background: null };
}

export function applyPreset(s: EyeState, p: EyePreset): EyeState {
  return { ...s, iris: clampIris(p.look ?? IRIS_DEFAULT), angle: p.angle, fx: p.fx, fy: p.fy };
}

// A pointer position on the picture (drawing units) turned into glyph space; used to drag the iris.
export function toGlyph(s: EyeState, x: number, y: number): { x: number; y: number } {
  const { w, h } = canvasOf(s.ratio);
  const inv = new DOMMatrix().translate(s.fx * w, s.fy * h).rotate(s.angle).scale(s.size).translate(-GLYPH.cx, -GLYPH.cy).inverse();
  const p = inv.transformPoint(new DOMPoint(x, y));
  return { x: p.x, y: p.y };
}
