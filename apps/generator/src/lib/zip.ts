import JSZip from "jszip";
import type { ArticlesBannerConfig } from "@ohtuleht/templates";
import { ui } from "@/content";
import { adFileOf, articleFilesOf, logoFileOf, renderExport, zipName, type Draft, type HeaderFile } from "@/lib/banner";
import { AD_HEIGHT, forDesktop, OWN_PICTURE } from "@ohtuleht/templates";
import { averageColor, imageSize, toDataUrl } from "@/lib/image";
import { AD_LIMIT, ARTICLE_LIMIT, HEADER_LIMIT, LOGO_LIMIT, optimiseImage, type Optimised } from "@/lib/optimise";
import { importLegacy } from "@/lib/legacy";
import { importLegacyMobile, importLegacyStatic } from "@/lib/legacyExtra";
import { openZip } from "@/lib/openzip";

export async function buildZip(draft: Draft): Promise<Blob> {
  const zip = new JSZip();
  zip.file("index.html", renderExport(draft));
  if (draft.config.header.type === "image" && draft.headerFile) zip.file(draft.headerFile.name, draft.headerFile.bytes);
  const ad = adFileOf(draft);
  if (ad) zip.file(ad.name, ad.bytes);
  const logo = logoFileOf(draft);
  if (logo) zip.file(logo.name, logo.bytes);
  for (const f of articleFilesOf(draft)) zip.file(f.name, f.bytes);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  window.dispatchEvent(new Event("ol-downloaded")); // the app stops warning about unsaved work
}

export const downloadZip = async (draft: Draft) => download(await buildZip(draft), zipName(draft));

export async function fileToHeader(file: File): Promise<{ headerFile: HeaderFile; avg?: string; optimised: Optimised }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `header.${ext}`;
  const optimised = await optimiseImage(new Uint8Array(await file.arrayBuffer()), name, HEADER_LIMIT);
  const dataUrl = toDataUrl(optimised.bytes, name);
  const avg = await averageColor(dataUrl);
  return { headerFile: { name, bytes: optimised.bytes, dataUrl, avg }, avg, optimised };
}

// The logo of the header: optimised (a vector logo stays as it is), at most 30 px high on the banner, so 60 px for sharp screens.
export async function fileToLogo(file: File): Promise<{ logoFile: HeaderFile; optimised: Optimised }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `logo.${ext === "jpeg" ? "jpg" : ext}`;
  const optimised = await optimiseImage(new Uint8Array(await file.arrayBuffer()), name, LOGO_LIMIT);
  return { logoFile: { name, bytes: optimised.bytes, dataUrl: toDataUrl(optimised.bytes, name) }, optimised };
}

// A picture chosen for one article: optimised, saved as pic-<id>.<ext> (the id keeps names apart when several are used).
export async function fileToArticle(file: File): Promise<{ articleFile: HeaderFile; optimised: Optimised }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const id = Math.random().toString(36).slice(2, 8);
  const name = `pic-${id}.${ext === "jpeg" ? "jpg" : ext}`;
  const optimised = await optimiseImage(new Uint8Array(await file.arrayBuffer()), name, ARTICLE_LIMIT);
  return { articleFile: { name, bytes: optimised.bytes, dataUrl: toDataUrl(optimised.bytes, name) }, optimised };
}

// The ad picture: optimised, and its width worked out from its shape (it is always AD_HEIGHT high).
export async function fileToAd(file: File): Promise<{ adFile: HeaderFile; width: number; optimised: Optimised }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `ad.${ext}`;
  const optimised = await optimiseImage(new Uint8Array(await file.arrayBuffer()), name, AD_LIMIT);
  const dataUrl = toDataUrl(optimised.bytes, name);
  const size = await imageSize(dataUrl);
  const width = size ? Math.min(600, Math.max(100, Math.round((AD_HEIGHT * size.width) / size.height))) : 247;
  return { adFile: { name, bytes: optimised.bytes, dataUrl }, width, optimised };
}

// Reads a banner: made by this toolkit (config embedded in index.html) or an old Swiper banner (read by importLegacy).
// notes = things the person should check after opening an old banner.
export async function importZip(file: File): Promise<{ draft: Draft; notes: string[] }> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) throw new Error(ui.errNoIndex);
  const doc = new DOMParser().parseFromString(await index.async("string"), "text/html");
  const json = doc.getElementById("ol-banner")?.textContent;
  if (!json) {
    const name = file.name.replace(/\.zip$/i, "");
    // The old phone banner: its slides are in the page, or made by a script (then the class is only in the script text).
    if (doc.querySelector(".st-wrapper") || /st-wrapper/.test(doc.documentElement.outerHTML)) return importLegacyMobile(zip, doc, name);
    return (await importLegacyStatic(zip, doc, name)) ?? importLegacy(zip, doc, name);
  }
  const config = JSON.parse(json) as ArticlesBannerConfig;
  if (config.v !== 1 || (config.format !== "articles-1250x400" && config.format !== "articles-mobile")) throw new Error(ui.errBannerVersion);
  // Banners made before the main colour existed: take it from their label or header colour.
  config.primary ??= config.theme.light.badge ?? config.theme.light.headerBg ?? "#9500b2";
  let headerFile: HeaderFile | null = null;
  if (config.header.type === "image") {
    const entry = zip.file(config.header.src);
    if (entry) {
      const bytes = await entry.async("uint8array");
      headerFile = { name: config.header.src, bytes, dataUrl: toDataUrl(bytes, config.header.src), avg: config.header.avg };
    }
  }
  let adFile: HeaderFile | null = null;
  if (config.ad) {
    const entry = zip.file(config.ad.src);
    if (entry) {
      const bytes = await entry.async("uint8array");
      adFile = { name: config.ad.src, bytes, dataUrl: toDataUrl(bytes, config.ad.src) };
    }
  }
  let logoFile: HeaderFile | null = null;
  if (config.headerLogo) {
    const entry = zip.file(config.headerLogo);
    if (entry) {
      const bytes = await entry.async("uint8array");
      logoFile = { name: config.headerLogo, bytes, dataUrl: toDataUrl(bytes, config.headerLogo) };
    }
  }
  // Pictures uploaded for single articles: read from the zip. A name whose file is not in the zip (the other version's picture) is dropped.
  const articleFiles: Record<string, HeaderFile> = {};
  const read = async (name: string | undefined): Promise<string | undefined> => {
    if (!name || !OWN_PICTURE.test(name.trim())) return name;
    const entry = zip.file(name.trim());
    if (!entry) return undefined;
    const bytes = await entry.async("uint8array");
    articleFiles[name.trim()] = { name: name.trim(), bytes, dataUrl: toDataUrl(bytes, name.trim()) };
    return name.trim();
  };
  for (const a of config.articles) {
    // Banners made while a phone link was written into the desktop field: the desktop picture is the desktop size again.
    a.image = forDesktop((await read(a.image)) ?? "");
    const own = await read(a.imageMobile);
    if (own === undefined) delete a.imageMobile;
    else a.imageMobile = own;
  }
  return { draft: { config, headerFile, adFile, logoFile, articleFiles }, notes: [] };
}
