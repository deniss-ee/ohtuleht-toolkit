import JSZip from "jszip";
import type { ArticlesBannerConfig } from "@ohtuleht/templates";
import { renderExport, zipName, type Draft, type HeaderFile } from "@/lib/banner";

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
}

export const downloadZip = async (draft: Draft) => download(await buildZip(draft), zipName(draft));

function mimeOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "svg") return "image/svg+xml";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

function toDataUrl(bytes: Uint8Array, name: string): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `data:${mimeOf(name)};base64,${btoa(binary)}`;
}

export async function fileToHeader(file: File): Promise<HeaderFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const name = `header.${ext}`;
  return { name, bytes, dataUrl: toDataUrl(bytes, name) };
}

// Reads a banner made by this toolkit: the config is embedded in index.html.
export async function importZip(file: File): Promise<Draft> {
  const zip = await JSZip.loadAsync(file);
  const index = zip.file("index.html");
  if (!index) throw new Error("This zip has no index.html.");
  const doc = new DOMParser().parseFromString(await index.async("string"), "text/html");
  const json = doc.getElementById("ol-banner")?.textContent;
  if (!json) throw new Error("This banner was not made with the toolkit, so it cannot be opened yet.");
  const config = JSON.parse(json) as ArticlesBannerConfig;
  if (config.v !== 1 || config.format !== "articles-1250x400") throw new Error("Unsupported banner version or format.");
  let headerFile: HeaderFile | null = null;
  if (config.header.type === "image") {
    const entry = zip.file(config.header.src);
    if (entry) {
      const bytes = await entry.async("uint8array");
      headerFile = { name: config.header.src, bytes, dataUrl: toDataUrl(bytes, config.header.src) };
    }
  }
  return { config, headerFile };
}
