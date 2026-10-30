import type JSZip from "jszip";
import type { ArticleItem } from "@ohtuleht/templates";
import { editor as t } from "@/content";
import { newDraft, type Draft, type HeaderFile } from "@/lib/banner";
import { averageColor, toDataUrl } from "@/lib/image";
import { decl, hex, textOf, urlIn } from "@/lib/legacy";
import { HEADER_LIMIT, optimiseImage } from "@/lib/optimise";

// Two more kinds of old banners, read into the same Draft the editor uses:
//  - the old phone banner "Kuubik" (600x500, a cube of article pictures, `.st-wrapper` slides): becomes the new mobile articles banner;
//  - a fixed row of articles listed in a script (Tamrex: `array.js` with `var arr = [{ image, url, header, ... }]`): becomes the desktop articles banner.
// Everything it could not carry over is returned as `notes` in plain words.

const remote = (ref: string) => /^(https?:)?\/\//.test(ref);
const clickUrl = (onclick: string | null) => (onclick ?? "").match(/getClickTag\(\s*['"]([^'"]*)['"]/)?.[1] ?? "";
const unquote = (s: string) => {
  try {
    return JSON.parse(`"${s}"`) as string;
  } catch {
    return s;
  }
};

// Objects like { url: "...", image: "...", title: "..." } in a script (read as text, the script is never run).
function objectsIn(script: string, keys: string[]): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const m of script.matchAll(/\{([^{}]*)\}/g)) {
    const o: Record<string, string> = {};
    for (const f of (m[1] ?? "").matchAll(/(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"/g)) o[f[1] ?? ""] = unquote(f[2] ?? "");
    if (keys.every((k) => k in o)) out.push(o);
  }
  return out;
}

async function cssOf(zip: JSZip, doc: Document): Promise<string> {
  let css = "";
  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute("href") ?? "";
    if (!remote(href) && !/swiper/i.test(href)) css += (await textOf(zip, href)) + "\n";
  }
  for (const s of doc.querySelectorAll("style")) css += (s.textContent ?? "") + "\n";
  return css.replace(/@import[^;]+;/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

async function scriptsOf(zip: JSZip, doc: Document): Promise<string> {
  let script = "";
  for (const s of doc.querySelectorAll("script")) {
    const src = s.getAttribute("src");
    script += src ? (remote(src) ? "" : await textOf(zip, src)) : (s.textContent ?? "");
    script += "\n";
  }
  return script;
}

const mostCommon = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
};

// ---- Old phone banner: slides are in the page (`.swiper-slide > .st-wrapper`) or made by a script from `const articles = [...]`.
export async function importLegacyMobile(zip: JSZip, doc: Document, zipName: string): Promise<{ draft: Draft; notes: string[] }> {
  const script = await scriptsOf(zip, doc);
  let rows = [...doc.querySelectorAll(".swiper-slide")]
    .filter((s) => !s.classList.contains("swiper-slide-duplicate") && s.querySelector(".st-wrapper"))
    .map((s) => ({
      url: clickUrl(s.getAttribute("onclick")),
      image: urlIn(s.querySelector(".st-wrapper")?.getAttribute("style") ?? "") ?? "",
      badge: s.querySelector(".badge")?.textContent?.trim() ?? "",
      title: s.querySelector(".header")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    }));
  if (!rows.length) {
    const badge = script.match(/class="badge">([^<]*)</)?.[1]?.trim() ?? "";
    rows = objectsIn(script, ["url", "image", "title"]).map((o) => ({ url: o.url ?? "", image: o.image ?? "", badge, title: o.title ?? "" }));
  }
  if (!rows.length) throw new Error(t.legacyNoSlides);

  const campaignBadge = mostCommon(rows.map((r) => r.badge)) || "Sisuturundus";
  const articles: ArticleItem[] = rows.map((r) => ({ url: r.url, title: r.title, image: r.image, ...(r.badge && r.badge !== campaignBadge ? { badge: r.badge } : {}) }));
  const num = (re: RegExp) => Number(script.match(re)?.[1]) || undefined;

  const draft = newDraft("articles-mobile");
  const c = draft.config;
  c.campaign = zipName.slice(0, 80);
  c.badge = campaignBadge;
  c.articles = articles;
  c.behavior = { shuffle: false, autoplay: /autoplay/.test(script), delayMs: num(/delay\s*:\s*(\d+)/) ?? 3000, speedMs: num(/speed\s*:\s*(\d+)/) ?? 250, loop: !/loop\s*:\s*false/.test(script) };
  const notes = [t.legacyName(c.campaign), t.legacyMobile, t.legacyMobileHeader, t.legacyShuffle];
  return { draft, notes };
}

// ---- Fixed row of articles listed in a script (Tamrex).
export async function importLegacyStatic(zip: JSZip, doc: Document, zipName: string): Promise<{ draft: Draft; notes: string[] } | null> {
  const script = await scriptsOf(zip, doc);
  const rows = objectsIn(script, ["image", "url", "header"]);
  if (!rows.length || doc.querySelector(".swiper-slide")) return null;
  const css = await cssOf(zip, doc);
  const notes: string[] = [];

  const draft = newDraft("articles-1250x400");
  const c = draft.config;
  c.campaign = (doc.title.replace(/\s*\d+\s*x\s*\d+\s*$/i, "").trim() || zipName).slice(0, 80);
  if (/^(document|untitled)$/i.test(c.campaign)) c.campaign = zipName.slice(0, 80);
  const categories = rows.map((r) => r.category ?? "");
  c.badge = mostCommon(categories) || "Sisuturundus";
  c.articles = rows.map((r) => ({ url: r.url ?? "", image: r.image ?? "", title: r.header ?? "", ...(r.category && r.category !== c.badge ? { badge: r.category } : {}) }));
  c.behavior = { ...c.behavior, shuffle: /displayArticles\(\s*true/.test(script), autoplay: false };

  // Colours: the label colour is the main colour, the title hover colour is kept.
  const primary = hex(decl(css, ".badge", "color"));
  if (primary) c.primary = primary;
  const hover = hex(decl(css, ".article:hover .title", "color"));
  if (hover) c.theme = { ...c.theme, light: { ...c.theme.light, hover }, dark: { ...c.theme.dark, hover } };

  // Header: a picture from the style sheet; its link may sit in a commented-out piece of the page.
  let href = doc.querySelector("a.header")?.getAttribute("href") ?? "";
  if (!href) {
    const walker = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT);
    for (let n = walker.nextNode(); n && !href; n = walker.nextNode()) href = (n.textContent ?? "").match(/class="header"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*class="header"/)?.slice(1).find(Boolean) ?? "";
    if (href) notes.push(t.legacyHeaderLinkFound(href));
  }
  const ref = urlIn(decl(css, ".header", "background-image")) ?? urlIn(decl(css, ".header", "background")) ?? "";
  const entry = ref && !remote(ref) ? zip.file(ref.replace(/^\.\//, "")) : null;
  c.header = { type: "color", href };
  if (entry) {
    const name = "header." + (ref.split(".").pop()?.toLowerCase() ?? "png");
    const opt = await optimiseImage(await entry.async("uint8array"), name, HEADER_LIMIT);
    const dataUrl = toDataUrl(opt.bytes, name);
    const avg = await averageColor(dataUrl);
    const file: HeaderFile = { name, bytes: opt.bytes, dataUrl, avg };
    draft.headerFile = file;
    c.header = { type: "image", src: name, href, avg, textInPicture: true };
    notes.push(t.legacyHeaderText);
  } else if (ref) {
    notes.push(t.legacyNoHeaderPicture);
  }

  notes.push(t.legacyName(c.campaign), t.legacyStatic, t.legacyColors);
  if (rows.some((r) => (r.retarget ?? "").trim())) notes.push(t.legacyRetarget);
  return { draft, notes };
}
