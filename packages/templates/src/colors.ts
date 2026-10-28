import type { ArticlesBannerConfig, ResolvedTheme } from "./types.ts";

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const toHex = ([r, g, b]: Rgb) => "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG contrast ratio, 1 to 21.
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// Moves a colour lighter or darker (keeping its hue) until it reads on the background.
// Dark backgrounds lighten dark colours; light backgrounds darken pale ones.
export function readableOn(color: string, background: string, minRatio = 4.5): string {
  if (contrast(color, background) >= minRatio) return color;
  const [h, s, l] = rgbToHsl(parseHex(color));
  const towardsLight = luminance(parseHex(background)) < 0.4;
  for (let i = 1; i <= 100; i++) {
    const next = Math.min(1, Math.max(0, l + (towardsLight ? i : -i) / 100));
    const hex = toHex(hslToRgb([h, s, next]));
    if (contrast(hex, background) >= minRatio) return hex;
  }
  return towardsLight ? "#ffffff" : "#000000";
}

// Text colour for a coloured bar: whichever of a dark or a light tint of the bar's own hue reads best.
// The tint (a little of the hue, very low saturation) looks softer than pure black or white.
export function onColor(background: string): string {
  const [h, s] = rgbToHsl(parseHex(background));
  const tint = Math.min(s, 0.25);
  const dark = toHex(hslToRgb([h, tint, 0.08]));
  const light = toHex(hslToRgb([h, tint, 0.97]));
  return contrast(dark, background) >= contrast(light, background) ? dark : light;
}

// Full colour set for one theme. The main colour fills in whatever the campaign did not set by hand:
// header colour = main colour, label colour = main colour made readable on the background.
export function resolveTheme(config: Pick<ArticlesBannerConfig, "primary" | "theme">, mode: "light" | "dark"): ResolvedTheme {
  const t = config.theme[mode];
  const headerBg = t.headerBg ?? config.primary;
  return {
    bg: t.bg,
    text: t.text,
    hover: t.hover,
    primary: config.primary,
    badge: t.badge ?? readableOn(config.primary, t.bg),
    headerBg,
    headerText: t.headerText ?? onColor(headerBg),
  };
}
