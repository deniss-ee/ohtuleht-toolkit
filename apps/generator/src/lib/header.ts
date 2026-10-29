import JSZip from "jszip";
import { openZip } from "@/lib/openzip";
import { iframeCode, renderHeaderBar, validateHeaderBar } from "@ohtuleht/templates";
import type { HeaderBarConfig, Problem } from "@ohtuleht/templates";
import { readySignal } from "@/components/editor/SwapFrame";
import { download } from "@/lib/zip";
import { averageColor, toDataUrl } from "@/lib/image";
import { slug, type HeaderFile } from "@/lib/banner";

export interface HeaderDraft {
  config: HeaderBarConfig;
  picture: HeaderFile | null; // bytes for the zip, data URL for the preview
  embedUrl: string; // where the files will be hosted, used only for the iframe code
}

export function newHeaderDraft(): HeaderDraft {
  return { config: { v: 1, format: "header-bar", label: "", href: "", primary: "#f50000" }, picture: null, embedUrl: "" };
}

// Real values of a live header (b.ohtuleht.ee/html5/Ohtuleht/paised_uus/vallatud_joulud/), for trying the tool.
export function exampleHeaderDraft(): HeaderDraft {
  return {
    config: { v: 1, format: "header-bar", label: "Näidiskampaania", href: "https://example.com/campaign", primary: "#99e300" },
    picture: null,
    embedUrl: "https://b.ohtuleht.ee/html5/Ohtuleht/paised_uus/vallatud_joulud/",
  };
}

export const headerProblems = (d: HeaderDraft): Problem[] => validateHeaderBar(d.config);
export const headerEmbedCode = (d: HeaderDraft) => iframeCode(d.embedUrl);
export const headerZipName = (d: HeaderDraft) => `header_${slug(d.config.label)}.zip`;

// What goes into the zip: the picture is the file next to the page.
function exportConfig(d: HeaderDraft): HeaderBarConfig {
  return { ...d.config, picture: d.picture ? { src: d.picture.name, avg: d.picture.avg } : undefined };
}

export function renderHeaderFiles(d: HeaderDraft) {
  return renderHeaderBar(exportConfig(d));
}

// One page for the preview frame: the stylesheet is inlined and the picture becomes a data URL.
export function renderHeaderPreview(d: HeaderDraft, id: number): string {
  const config: HeaderBarConfig = { ...d.config, picture: d.picture ? { src: d.picture.dataUrl, avg: d.picture.avg } : undefined };
  const { html, css } = renderHeaderBar(config);
  // In the editor the page behind the bar is transparent, so no grey shows around the rounded corners.
  return html.replace('<link href="style.css" rel="stylesheet" />', `<style>${css}html,body{background:transparent!important}</style>`).replace("</body>", readySignal(id) + "</body>");
}

export async function fileToPicture(file: File): Promise<HeaderFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `bg.${ext}`;
  const dataUrl = toDataUrl(bytes, name);
  return { name, bytes, dataUrl, avg: await averageColor(dataUrl) };
}

export async function buildHeaderZip(d: HeaderDraft): Promise<Blob> {
  const { html, css } = renderHeaderFiles(d);
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("style.css", css);
  if (d.picture) zip.file(d.picture.name, d.picture.bytes);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

export const downloadHeaderZip = async (d: HeaderDraft) => download(await buildHeaderZip(d), headerZipName(d));

// Reads a header made by this tool (config is embedded in index.html). Returns null when the zip is something else.
export async function importHeaderZip(file: File): Promise<HeaderDraft | null> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) return null;
  const json = new DOMParser().parseFromString(await index.async("string"), "text/html").getElementById("ol-header")?.textContent;
  if (!json) return null;
  const config = JSON.parse(json) as HeaderBarConfig;
  if (config.v !== 1 || config.format !== "header-bar") throw new Error("Unsupported header version.");
  let picture: HeaderFile | null = null;
  if (config.picture) {
    const entry = zip.file(config.picture.src);
    if (entry) {
      const bytes = await entry.async("uint8array");
      picture = { name: config.picture.src, bytes, dataUrl: toDataUrl(bytes, config.picture.src), avg: config.picture.avg };
    }
  }
  return { config, picture, embedUrl: "" };
}
