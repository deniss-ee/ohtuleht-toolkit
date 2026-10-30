import brandData from "../brand.json";

export interface ColorScale {
  id: string;
  name: string;
  role: string;
  base?: number; // step that is the production value, when the brand hub names one
  steps: Record<string, string>; // "50" ... "950" -> #RRGGBB
}

export interface LogoVariant {
  id: string;
  family: "wordmark" | "logomark";
  name: string;
  file: string; // file in packages/brand/logos
  width: number;
  height: number;
  usage: string;
}

export interface Brand {
  v: 1;
  source: string;
  colors: ColorScale[];
  clearSpace: { ratio: number; note: string };
  logos: LogoVariant[];
  fonts: { id: string; family: string; role: string; weights: number[]; stack: string; url: string; inManual?: boolean }[];
}

export const brand = brandData as Brand;

// ---- colour helpers ----

export type ColorFormat = "hex" | "rgb" | "hsl" | "css" | "tailwind";

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

// The text to copy for one colour in the chosen format, e.g. "#F50000", "rgb(245, 0, 0)", "var(--color-red-600)".
export function formatColor(scaleId: string, step: string, hex: string, format: ColorFormat): string {
  const rgb = hexToRgb(hex);
  switch (format) {
    case "hex":
      return hex.toUpperCase();
    case "rgb":
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    case "hsl": {
      const [h, s, l] = rgbToHsl(rgb);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    case "css":
      return `var(--color-${scaleId}-${step})`;
    case "tailwind":
      return `${scaleId}-${step}`;
  }
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG contrast ratio between two #RRGGBB colours, 1 to 21.
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Plain-language WCAG level for normal-size text.
export function wcagLevel(ratio: number): "AAA" | "AA" | "AA large" | "Fail" {
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Fail";
}

// Brand rule: on the colour steps 50 to 500 the text is black, from 600 up it is white.
export function textOnStep(step: string | number): "white" | "black" {
  return Number(step) >= 600 ? "white" : "black";
}

// ---- token export ----

export function tokensCss(): string {
  const lines = brand.colors.flatMap((c) => Object.entries(c.steps).map(([step, hex]) => `  --color-${c.id}-${step}: ${hex.toLowerCase()};`));
  return `/* Õhtuleht brand colours. Source: ${brand.source} */\n:root {\n${lines.join("\n")}\n}\n`;
}

export function tokensTailwind(): string {
  const lines = brand.colors.flatMap((c) => Object.entries(c.steps).map(([step, hex]) => `  --color-${c.id}-${step}: ${hex.toLowerCase()};`));
  return `/* Tailwind v4: paste into your CSS. Gives classes like bg-red-600 and text-ink-950. */\n@theme {\n${lines.join("\n")}\n}\n`;
}

export function tokensJson(): string {
  const out: Record<string, Record<string, string>> = {};
  for (const c of brand.colors) out[c.id] = { ...c.steps };
  return JSON.stringify({ source: brand.source, colors: out }, null, 2) + "\n";
}

// ---- logo helpers ----

// Padding around a logo for its safe zone (clear space), in the logo's own units.
export function safeZone(logo: LogoVariant): number {
  return Math.round(logo.height * brand.clearSpace.ratio * 100) / 100;
}
