import type JSZip from "jszip";
import { AD_HEIGHT } from "@ohtuleht/templates";
import type { AdItem, ArticleItem, ArticlesBannerConfig, ThemeColors } from "@ohtuleht/templates";
import { editor as t } from "@/content";
import type { Draft, HeaderFile } from "@/lib/banner";
import { averageColor, imageSize, toDataUrl } from "@/lib/image";
import { AD_LIMIT, HEADER_LIMIT, optimiseImage } from "@/lib/optimise";
import { formatSize } from "@/lib/format";

// Reads an old Swiper banner (made by hand before this toolkit) into the same Draft the editor uses.
// Reads the slides from index.html, the colours from style.css and the slider options from the inline script.
// Everything it could not carry over is returned as `notes` in plain words.

const DEFAULTS = { light: { bg: "#ffffff", text: "#272727", hover: "#e3000f" }, dark: { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" }, primary: "#f50000" };

// "#fff" or "#FFFFFF" -> "#ffffff"; anything else (var(), names) -> undefined.
export function hex(v: string | undefined): string | undefined {
  const m = v?.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return undefined;
  const h = (m[1] ?? "").toLowerCase();
  return "#" + (h.length === 3 ? [...h].map((c) => c + c).join("") : h);
}

// Value of `prop` in the first rule whose selector list contains exactly `selector`.
export function decl(css: string, selector: string, prop: string): string | undefined {
  for (const rule of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!(rule[1] ?? "").split(",").some((s) => s.trim() === selector)) continue;
    const d = (rule[2] ?? "").match(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+)`, "i"));
    if (d) return (d[1] ?? "").trim();
  }
  return undefined;
}

export const urlIn = (v: string | undefined) => v?.match(/url\(\s*["']?([^"')]+)/i)?.[1];

export async function textOf(zip: JSZip, path: string): Promise<string> {
  return (await zip.file(path.replace(/^\.\//, ""))?.async("string")) ?? "";
}

export async function importLegacy(zip: JSZip, doc: Document, zipName: string): Promise<{ draft: Draft; notes: string[] }> {
  // Old phone banners (.st-wrapper) and fixed rows from a script are read in legacyExtra.ts before this runs.
  const slides = [...doc.querySelectorAll(".swiper-slide")].filter((s) => !s.classList.contains("swiper-slide-duplicate") && s.querySelector(".article"));
  if (!slides.length) throw new Error(doc.querySelector('[class*="slide"]') ? t.legacyNotSlider : t.legacyNoSlides);

  // Style sheets next to index.html, plus any inline style.
  let css = "";
  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute("href") ?? "";
    if (!/^(https?:)?\/\//.test(href) && !/swiper/i.test(href)) css += (await textOf(zip, href)) + "\n";
  }
  for (const s of doc.querySelectorAll("style")) css += (s.textContent ?? "") + "\n";
  css = css.replace(/@import[^;]+;/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const darkAt = css.search(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/);
  const base = darkAt < 0 ? css : css.slice(0, darkAt);
  const dark = darkAt < 0 ? "" : css.slice(darkAt);

  // Slider options from the inline script.
  const script = [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent ?? "").join("\n");
  const num = (re: RegExp) => Number(script.match(re)?.[1]) || undefined;
  const delay = num(/delay\s*:\s*(\d+)/);
  const speed = num(/speed\s*:\s*(\d+)/);
  const visible = num(/slidesPerView\s*:\s*(\d+)/);
  const autoplay = /autoplay\s*:\s*(\{|true)/.test(script);
  const loop = !/loop\s*:\s*false/.test(script);

  // Colours.
  const badgeLight = hex(decl(base, ".badge", "color"));
  const badgeDark = hex(decl(dark, ".badge", "color"));
  const headerBg = hex(decl(base, ".header", "background-color")) ?? hex(decl(base, ".header", "background"));
  const hover = hex(decl(base, ".article:hover .title", "color")) ?? DEFAULTS.light.hover;
  const primary = badgeLight ?? headerBg ?? DEFAULTS.primary;
  const light: ThemeColors = { ...DEFAULTS.light, text: hex(decl(base, ".title", "color")) ?? DEFAULTS.light.text, hover };
  const darkTheme: ThemeColors = {
    bg: hex(decl(dark, ":root", "--bg-color")) ?? DEFAULTS.dark.bg,
    text: hex(decl(dark, ":root", "--text-color")) ?? DEFAULTS.dark.text,
    hover,
  };
  if (badgeDark && badgeDark !== primary) darkTheme.badge = badgeDark;
  if (headerBg && headerBg !== primary) light.headerBg = headerBg;

  // Header: a link with a picture from the style sheet (the text is baked into the picture).
  const header = doc.querySelector(".header");
  const href = header?.getAttribute("href") ?? "";
  const pictureRef = urlIn(decl(base, ".header", "background")) ?? urlIn(decl(base, ".header", "background-image"));
  const pictureEntry = pictureRef && !/^(https?:)?\/\//.test(pictureRef) ? zip.file(pictureRef.replace(/^\.\//, "")) : null;
  const notes: string[] = [];
  let before = 0; // picture weight before and after optimising, for one note
  let after = 0;
  let headerFile: HeaderFile | null = null;
  let config: ArticlesBannerConfig["header"] = { type: "color", href };
  if (pictureEntry && pictureRef) {
    const name = "header." + (pictureRef.split(".").pop()?.toLowerCase() ?? "png");
    const opt = await optimiseImage(await pictureEntry.async("uint8array"), name, HEADER_LIMIT);
    before += opt.before;
    after += opt.after;
    const bytes = opt.bytes;
    const dataUrl = toDataUrl(bytes, name);
    const avg = await averageColor(dataUrl);
    headerFile = { name, bytes, dataUrl, avg };
    config = { type: "image", src: name, href, avg, textInPicture: true };
    notes.push(t.legacyHeaderText);
  } else if (pictureRef) {
    notes.push(t.legacyNoHeaderPicture);
  }

  // Campaign name: the page title without its size ("Sisuturundus 1250x400").
  const campaign = (doc.title.replace(/\s*\d+\s*x\s*\d+\s*$/i, "").trim() || zipName).slice(0, 80);
  notes.push(t.legacyName(campaign));
  notes.push(t.legacyColors);

  // Articles.
  const read = (s: Element) => {
    const onclick = s.getAttribute("onclick") ?? "";
    const style = s.querySelector(".img")?.getAttribute("style") ?? "";
    return {
      url: onclick.match(/getClickTag\(\s*['"]([^'"]+)['"]/)?.[1] ?? "",
      image: urlIn(style) ?? "",
      badge: s.querySelector(".badge")?.textContent?.trim() ?? "",
      title: s.querySelector(".title")?.textContent?.trim() ?? "",
    };
  };
  const rows = slides.map(read);
  // The most common label becomes the campaign label; the others stay on their own article.
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.badge, (counts.get(r.badge) ?? 0) + 1);
  const campaignBadge = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const articles: ArticleItem[] = rows.map((r) => ({ url: r.url, title: r.title, image: r.image, ...(r.badge && r.badge !== campaignBadge ? { badge: r.badge } : {}) }));

  // The fixed ad picture on the right (`img.banner-img`): kept, with its own link.
  let ad: AdItem | undefined;
  let adFile: HeaderFile | null = null;
  const adImg = doc.querySelector("img.banner-img");
  const adRef = adImg?.getAttribute("src") ?? "";
  const adEntry = adRef && !/^(https?:)?\/\//.test(adRef) ? zip.file(adRef.replace(/^\.\//, "")) : null;
  if (adImg && adEntry) {
    const name = "ad." + (adRef.split(".").pop()?.toLowerCase() ?? "jpg");
    const opt = await optimiseImage(await adEntry.async("uint8array"), name, AD_LIMIT);
    before += opt.before;
    after += opt.after;
    const dataUrl = toDataUrl(opt.bytes, name);
    const size = await imageSize(dataUrl);
    const width = size ? Math.min(600, Math.max(100, Math.round((AD_HEIGHT * size.width) / size.height))) : 247;
    const href = (adImg.getAttribute("onclick") ?? "").match(/getClickTag\(\s*['"]([^'"]+)['"]/)?.[1] ?? "";
    ad = { src: name, href, width };
    adFile = { name, bytes: opt.bytes, dataUrl };
    notes.push(t.legacyAdKept);
  }
  if (after && after < before) notes.push(t.legacyOptimised(formatSize(before), formatSize(after)));
  if (visible && visible !== (ad ? 3 : 4)) notes.push(t.legacyVisible(visible));
  notes.push(t.legacyShuffle);

  const cfg: ArticlesBannerConfig = {
    v: 1,
    format: "articles-1250x400",
    campaign,
    primary,
    header: config,
    ...(ad ? { ad } : {}),
    badge: campaignBadge || "Sisuturundus",
    theme: { light, dark: darkTheme },
    behavior: { shuffle: false, autoplay, delayMs: delay ?? 3000, speedMs: speed ?? 250, loop },
    articles,
  };
  return { draft: { config: cfg, headerFile, adFile }, notes };
}
