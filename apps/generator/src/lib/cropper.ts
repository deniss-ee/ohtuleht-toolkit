// Image cropper maths and drawing. The canvas is always 1920x1080.
export const CANVAS_W = 1920;
export const CANVAS_H = 1080;

export type FitMode = "fit" | "cover" | "original" | "custom";
export type Background = { type: "blur" } | { type: "colour"; colour: string };

export interface CropState {
  mode: FitMode;
  width: number; // used by "custom"
  background: Background;
  ox: number; // picture centre, offset from the canvas centre (canvas px)
  oy: number;
}

export const newCropState = (): CropState => ({ mode: "fit", width: 1650, background: { type: "blur" }, ox: 0, oy: 0 });

export const MIN_WIDTH = 100;
export const MAX_WIDTH = 3000;

// Size the picture is drawn at, per mode.
export function drawnSize(img: { width: number; height: number }, s: CropState): { w: number; h: number } {
  let scale = 1;
  if (s.mode === "fit") scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
  else if (s.mode === "cover") scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
  else if (s.mode === "custom") scale = Math.min(Math.max(s.width || MIN_WIDTH, MIN_WIDTH), MAX_WIDTH) / img.width;
  return { w: img.width * scale, h: img.height * scale };
}

// Along one axis the picture can move only while it is bigger than the canvas (it must keep covering it).
// "fit" never moves.
export function maxOffset(img: { width: number; height: number }, s: CropState): { x: number; y: number } {
  if (s.mode === "fit") return { x: 0, y: 0 };
  const d = drawnSize(img, s);
  return { x: Math.max(0, (d.w - CANVAS_W) / 2), y: Math.max(0, (d.h - CANVAS_H) / 2) };
}

export function clampOffset(img: { width: number; height: number }, s: CropState): CropState {
  const m = maxOffset(img, s);
  return { ...s, ox: Math.min(m.x, Math.max(-m.x, s.ox)), oy: Math.min(m.y, Math.max(-m.y, s.oy)) };
}

export const canMove = (img: { width: number; height: number }, s: CropState) => {
  const m = maxOffset(img, s);
  return m.x > 0 || m.y > 0;
};

// Blurred, darkened copy of the picture that fills the canvas. Slow to make, so callers keep it.
export function makeBlur(img: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = CANVAS_W;
  c.height = CANVAS_H;
  const ctx = c.getContext("2d")!;
  const scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height) * 1.1;
  const w = img.width * scale;
  const h = img.height * scale;
  if (typeof (ctx as { filter?: string }).filter === "string") {
    ctx.filter = "blur(48px) brightness(0.75)";
    ctx.drawImage(img, (CANVAS_W - w) / 2, (CANVAS_H - h) / 2, w, h);
  } else {
    // Browsers without canvas filters (older Safari): shrink the picture, stretch it back (soft) and darken it.
    const tiny = document.createElement("canvas");
    tiny.width = 48;
    tiny.height = Math.round((48 * CANVAS_H) / CANVAS_W);
    const t = tiny.getContext("2d")!;
    t.imageSmoothingQuality = "high";
    t.drawImage(img, (tiny.width - (w * tiny.width) / CANVAS_W) / 2, (tiny.height - (h * tiny.height) / CANVAS_H) / 2, (w * tiny.width) / CANVAS_W, (h * tiny.height) / CANVAS_H);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tiny, 0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  return c;
}

export function draw(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, s: CropState, blur: HTMLCanvasElement | null) {
  const st = clampOffset(img, s);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (st.background.type === "colour") {
    ctx.fillStyle = st.background.colour;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else if (blur) {
    ctx.drawImage(blur, 0, 0);
  }
  const d = drawnSize(img, st);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (CANVAS_W - d.w) / 2 + st.ox, (CANVAS_H - d.h) / 2 + st.oy, d.w, d.h);
}
