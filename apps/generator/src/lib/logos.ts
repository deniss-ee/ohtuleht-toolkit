import JSZip from "jszip";
import { brand, safeZone, type LogoVariant } from "@ohtuleht/brand";
import { ui } from "@/content";

// Optimised SVG sources, read as text at build time (packages/brand/logos/*.svg).
const sources = import.meta.glob("../../../../packages/brand/logos/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function source(logo: LogoVariant): string {
  const key = Object.keys(sources).find((k) => k.endsWith("/" + logo.file));
  if (!key) throw new Error(`Logo file missing: ${logo.file}`);
  return sources[key]!;
}

export interface LogoOptions {
  safeZone: boolean; // add the clear space around the logo
}

// Size of the finished picture in logo units (the safe zone adds the same padding on all four sides).
export function logoBox(logo: LogoVariant, o: LogoOptions) {
  const pad = o.safeZone ? safeZone(logo) : 0;
  return { pad, width: logo.width + 2 * pad, height: logo.height + 2 * pad };
}

// The logo as a standalone SVG. With the safe zone the canvas grows around the artwork (viewBox starts at -pad).
export function logoSvg(logo: LogoVariant, o: LogoOptions): string {
  const { pad, width, height } = logoBox(logo, o);
  const viewBox = `${-pad} ${-pad} ${width} ${height}`;
  return source(logo).replace(/viewBox="[^"]*"/, `viewBox="${viewBox}" width="${width}" height="${height}"`);
}

export const svgDataUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

// PNG with the given pixel width (height follows the proportions). `background` null = transparent.
export async function logoPng(logo: LogoVariant, o: LogoOptions, pixelWidth: number, background: string | null): Promise<Blob> {
  const { width, height } = logoBox(logo, o);
  const w = Math.max(1, Math.round(pixelWidth));
  const h = Math.max(1, Math.round((pixelWidth * height) / width));
  const img = new Image();
  img.src = svgDataUrl(logoSvg(logo, o));
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(ui.errPicture);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(ui.errPicture))), "image/png"));
}

export function logoFileName(logo: LogoVariant, o: LogoOptions, ext: "svg" | "png", pixelWidth?: number): string {
  return `ohtuleht_${logo.id}${o.safeZone ? "_safe-zone" : ""}${pixelWidth ? `_${pixelWidth}px` : ""}.${ext}`;
}

// Every logo, with and without the safe zone: SVG files plus PNGs at the chosen width.
export async function logoZip(pixelWidth: number, background: string | null): Promise<Blob> {
  const zip = new JSZip();
  for (const logo of brand.logos) {
    for (const safe of [false, true]) {
      const o = { safeZone: safe };
      zip.file(`svg/${logoFileName(logo, o, "svg")}`, logoSvg(logo, o));
      zip.file(`png/${logoFileName(logo, o, "png", pixelWidth)}`, await logoPng(logo, o, pixelWidth, background));
    }
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
