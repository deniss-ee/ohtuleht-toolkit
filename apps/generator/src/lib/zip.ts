import JSZip from "jszip";
import type { ArticlesBannerConfig } from "@ohtuleht/templates";
import { ui } from "@/content";
import { renderExport, zipName, type Draft, type HeaderFile } from "@/lib/banner";
import { averageColor, toDataUrl } from "@/lib/image";
import { importLegacy } from "@/lib/legacy";
import { openZip } from "@/lib/openzip";

export async function buildZip(draft: Draft): Promise<Blob> {
  const zip = new JSZip();
  zip.file("index.html", renderExport(draft));
  if (draft.config.header.type === "image" && draft.headerFile) zip.file(draft.headerFile.name, draft.headerFile.bytes);
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

export async function fileToHeader(file: File): Promise<{ headerFile: HeaderFile; avg?: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `header.${ext}`;
  const dataUrl = toDataUrl(bytes, name);
  const avg = await averageColor(dataUrl);
  return { headerFile: { name, bytes, dataUrl, avg }, avg };
}

// Reads a banner: made by this toolkit (config embedded in index.html) or an old Swiper banner (read by importLegacy).
// notes = things the person should check after opening an old banner.
export async function importZip(file: File): Promise<{ draft: Draft; notes: string[] }> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) throw new Error(ui.errNoIndex);
  const doc = new DOMParser().parseFromString(await index.async("string"), "text/html");
  const json = doc.getElementById("ol-banner")?.textContent;
  if (!json) return importLegacy(zip, doc, file.name.replace(/\.zip$/i, ""));
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
  return { draft: { config, headerFile }, notes: [] };
}
