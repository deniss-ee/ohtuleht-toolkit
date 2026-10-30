import type JSZip from "jszip";
import { editor as t } from "@/content";
import { formatSize } from "@/lib/format";
import { toDataUrl } from "@/lib/image";
import { decl, textOf, urlIn } from "@/lib/legacy";
import { BG_LIMIT, optimiseImage, SLIDE_LIMIT } from "@/lib/optimise";
import { openZip } from "@/lib/openzip";
import { extOf, importSliderZip, newKey, newSliderDraft, type SliderDraft } from "@/lib/slider";

// Reads an old image slider banner (the Dacia and Renault 1250x400 banners: a background in style.css, `.slider-track > .slide`
// items with a picture and a ClickTag each, and the slider options in script.js) into the same SliderDraft the editor uses.
// Everything it could not carry over is returned as `notes` in plain words.

const clickUrl = (onclick: string | null) => (onclick ?? "").match(/getClickTag\(\s*['"]([^'"]*)['"]/)?.[1] ?? "";
const px = (v: string | undefined) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? Math.round(n) : undefined;
};
const remote = (ref: string) => /^(https?:)?\/\//.test(ref);

async function importLegacySlider(zip: JSZip, doc: Document, zipName: string): Promise<{ draft: SliderDraft; notes: string[] } | null> {
  const slides = [...doc.querySelectorAll(".slider-track > .slide")].filter((s) => s.querySelector("img"));
  if (!slides.length || doc.querySelector(".swiper-slide")) return null; // not this kind of banner

  let css = "";
  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute("href") ?? "";
    if (!remote(href)) css += (await textOf(zip, href)) + "\n";
  }
  for (const s of doc.querySelectorAll("style")) css += (s.textContent ?? "") + "\n";
  css = css.replace(/@import[^;]+;/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // The slider options live in a script next to the page (or inline).
  let script = "";
  for (const s of doc.querySelectorAll("script")) {
    const src = s.getAttribute("src");
    script += src && !remote(src) ? (await textOf(zip, src)) + "\n" : (s.textContent ?? "") + "\n";
  }
  const num = (name: string) => Number(script.match(new RegExp(`\\b${name}\\s*=\\s*(\\d+)`))?.[1]) || undefined;

  const draft = newSliderDraft();
  const c = draft.config;
  const notes: string[] = [];
  let before = 0;
  let after = 0;

  // Pictures: the background and every slide, optimised like pictures chosen in the form.
  const take = async (ref: string, name: string, limit: typeof SLIDE_LIMIT): Promise<string> => {
    const entry = ref && !remote(ref) ? zip.file(ref.replace(/^\.\//, "")) : null;
    if (!entry) return "";
    const opt = await optimiseImage(await entry.async("uint8array"), `${name}.${extOf(ref)}`, limit);
    before += opt.before;
    after += opt.after;
    const key = newKey();
    draft.files[key] = { name: opt.name, bytes: opt.bytes, dataUrl: toDataUrl(opt.bytes, opt.name) };
    return key;
  };
  const bgRef = urlIn(decl(css, ".banner", "background")) ?? urlIn(decl(css, ".banner", "background-image")) ?? "";
  c.background = await take(bgRef, "background", BG_LIMIT);
  if (!c.background) notes.push(t.legacySliderNoBackground);

  const hrefs: string[] = [];
  let missing = 0;
  for (const s of slides) {
    const image = await take(s.querySelector("img")?.getAttribute("src") ?? "", "slide", SLIDE_LIMIT);
    if (!image) {
      missing++;
      continue;
    }
    const href = clickUrl(s.getAttribute("onclick"));
    hrefs.push(href);
    c.slides.push({ image, href });
  }
  if (missing) notes.push(t.legacySliderNoPicture(missing));

  // Links: one for all when every slide leads to the same place, otherwise one per slide.
  if (hrefs.length && hrefs.every((h) => h === hrefs[0])) {
    c.linkMode = "shared";
    c.sharedHref = hrefs[0] ?? "";
  } else {
    c.linkMode = "each";
  }
  const banner = doc.querySelector(".banner");
  const bgOnclick = banner?.getAttribute("onclick") ?? "";
  c.backgroundLink = { clickable: /getClickTag/.test(bgOnclick), href: clickUrl(bgOnclick) };

  // Position, size and behaviour.
  const L = c.desktop.layout;
  L.x = px(decl(css, ".slider-wrap", "left")) ?? L.x;
  L.y = px(decl(css, ".slider-wrap", "top")) ?? L.y;
  L.width = px(decl(css, ".slider-wrap", "width")) ?? L.width;
  L.height = px(decl(css, ".slider-wrap", "height")) ?? L.height;
  L.gap = px(decl(css, ".slider-track", "gap")) ?? num("gap") ?? L.gap;
  L.visible = num("visibleSlides") ?? L.visible;
  c.desktop.arrows = !!doc.querySelector(".nav-btn");
  c.behavior = { shuffle: false, autoplay: /setInterval/.test(script), delayMs: num("delay") ?? 2000, speedMs: num("speed") ?? 500, loop: /cloneNode/.test(script) || !/loop\s*[:=]\s*false/.test(script) };

  // Campaign name: the page title without its size ("Dacia Ohtuleht 1250x400").
  c.campaign = (doc.title.replace(/\s*\d+\s*x\s*\d+\s*$/i, "").trim() || zipName).slice(0, 80);

  notes.push(t.legacyName(c.campaign), t.legacySliderLinks, t.legacySliderPosition);
  if (after && after < before) notes.push(t.legacyOptimised(formatSize(before), formatSize(after)));
  if ([...doc.querySelectorAll("script[src]")].some((s) => remote(s.getAttribute("src") ?? ""))) notes.push(t.legacySliderScript);
  notes.push(t.legacyShuffle, t.legacySliderMobile);
  return { draft, notes };
}

// An image slider zip: made by this tool (config embedded) or an old banner. Returns null when the zip is something else.
export async function importSliderAny(file: File): Promise<{ draft: SliderDraft; notes: string[] } | null> {
  const own = await importSliderZip(file);
  if (own) return { draft: own, notes: [] };
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) return null;
  const doc = new DOMParser().parseFromString(await index.async("string"), "text/html");
  if (doc.getElementById("ol-banner")) return null;
  return importLegacySlider(zip, doc, file.name.replace(/\.zip$/i, ""));
}
