import JSZip from "jszip";
import { renderFrameBanner, validateFrameBanner } from "@ohtuleht/templates";
import type { FrameBannerConfig, Problem } from "@ohtuleht/templates";
import { getLang, ui } from "@/content";
import { readySignal } from "@/components/editor/SwapFrame";
import { bytesOf, slug, type HeaderFile } from "@/lib/banner";
import { stampedName } from "@/lib/format";
import { imageSize, toDataUrl } from "@/lib/image";
import { openZip } from "@/lib/openzip";
import { download } from "@/lib/zip";

// Pictures are kept under a short random key while the person edits (they can be added, moved and removed).
// config.frames[i].image and config.backgroundImage hold these keys; real file names are made when the zip is written.
export interface FrameDraft {
  config: FrameBannerConfig;
  files: Record<string, HeaderFile>;
}

export function newFrameDraft(): FrameDraft {
  return {
    files: {},
    config: {
      v: 1,
      kind: "frame-banner",
      format: "frame-banner",
      campaign: "",
      width: 300,
      height: 250,
      responsive: false,
      fit: "cover",
      backgroundColor: "",
      backgroundImage: "",
      frames: [],
      holdMs: 2000,
      fadeMs: 600,
      loop: { forever: true, times: 3 },
      pauseOnHover: false,
      respectMotion: false,
      href: "",
    },
  };
}

// Common banner sizes of the ad slots, plus the sizes of our own banners.
export const SIZE_PRESETS: { w: number; h: number }[] = [
  { w: 300, h: 250 },
  { w: 300, h: 600 },
  { w: 728, h: 90 },
  { w: 970, h: 250 },
  { w: 320, h: 100 },
  { w: 600, h: 500 },
  { w: 1250, h: 400 },
];

export const frameProblems = (d: FrameDraft): Problem[] => validateFrameBanner(d.config, getLang());

export const newKey = () => Math.random().toString(36).slice(2, 10);
export const extOf = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return ext === "jpeg" ? "jpg" : ext;
};

// A picture the person chose. It is kept as it is (a PNG keeps its transparency); nothing is converted.
export async function fileToFramePicture(file: File): Promise<{ key: string; file: HeaderFile; width: number; height: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = `${slug(file.name.replace(/\.[^.]+$/, "")) || "picture"}.${extOf(file.name)}`;
  const dataUrl = toDataUrl(bytes, name);
  const size = await imageSize(dataUrl);
  return { key: newKey(), file: { name, bytes, dataUrl }, width: size?.width ?? 0, height: size?.height ?? 0 };
}

// Pictures of the unused keys are dropped so they never end up in the zip or in storage.
export function tidy(d: FrameDraft): FrameDraft {
  const used = new Set([d.config.backgroundImage, ...d.config.frames.map((f) => f.image)]);
  const files = Object.fromEntries(Object.entries(d.files).filter(([k]) => used.has(k)));
  return Object.keys(files).length === Object.keys(d.files).length ? d : { ...d, files };
}

interface Resolved {
  config: FrameBannerConfig;
  out: { name: string; bytes: Uint8Array }[];
}

// Preview: pictures as data URLs. Export: pictures as 1.png, 2.jpg ... and bg.jpg next to index.html.
function resolve(d: FrameDraft, mode: "preview" | "export"): Resolved {
  const out: Resolved["out"] = [];
  const pick = (key: string, base: string) => {
    const f = d.files[key];
    if (!f) return "";
    const name = `${base}.${extOf(f.name)}`;
    out.push({ name, bytes: f.bytes });
    return mode === "preview" ? f.dataUrl : name;
  };
  const backgroundImage = pick(d.config.backgroundImage, "bg");
  const frames = d.config.frames.map((fr, i) => ({ ...fr, image: pick(fr.image, String(i + 1)) }));
  return { config: { ...d.config, backgroundImage, frames }, out };
}

// The preview is a copy of the real banner (the same HTML), plus a signal that tells when its pictures are ready.
export function renderFramePreview(d: FrameDraft, id: number): string {
  return renderFrameBanner(resolve(d, "preview").config).replace("</body>", readySignal(id) + "</body>");
}

export function renderFrameExport(d: FrameDraft) {
  const { config, out } = resolve(d, "export");
  return { html: renderFrameBanner(config), out };
}

// Total weight of the zip content, in KB.
export function frameWeightKb(d: FrameDraft): number {
  const { html, out } = renderFrameExport(d);
  return (bytesOf(html) + out.reduce((n, f) => n + f.bytes.length, 0)) / 1024;
}

export async function buildFrameZip(d: FrameDraft): Promise<Blob> {
  const { html, out } = renderFrameExport(d);
  const zip = new JSZip();
  zip.file("index.html", html);
  out.forEach((f) => zip.file(f.name, f.bytes));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

export const frameZipName = (d: FrameDraft) => stampedName(`${slug(d.config.campaign)}_${d.config.width}x${d.config.height}`, "zip");
export const downloadFrameZip = async (d: FrameDraft) => download(await buildFrameZip(d), frameZipName(d));

// Reads a banner made by this tool (the config is embedded in index.html). Returns null when the zip is something else.
export async function importFrameZip(file: File): Promise<FrameDraft | null> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) return null;
  const json = new DOMParser().parseFromString(await index.async("string"), "text/html").getElementById("ol-banner")?.textContent;
  if (!json) return null;
  const parsed = JSON.parse(json) as Partial<FrameBannerConfig>;
  if (parsed.kind !== "frame-banner") return null;
  if (parsed.v !== 1) throw new Error(ui.errBannerVersion);
  const config = parsed as FrameBannerConfig;
  const files: FrameDraft["files"] = {};
  const read = async (src: string): Promise<string> => {
    const entry = src ? zip.file(src) : null;
    if (!entry) return "";
    const bytes = await entry.async("uint8array");
    const key = newKey();
    files[key] = { name: src, bytes, dataUrl: toDataUrl(bytes, src) };
    return key;
  };
  const backgroundImage = await read(config.backgroundImage ?? "");
  const frames = [];
  for (const fr of config.frames) frames.push({ ...fr, image: await read(fr.image) });
  return { config: { ...newFrameDraft().config, ...config, backgroundImage, frames }, files };
}

// Pictures drawn on the spot, so the form can be tried without collecting anything first.
// Four solid colour pictures with a big number, and the banner size is 300x250.
export async function exampleFrameDraft(): Promise<FrameDraft> {
  const d = newFrameDraft();
  d.config.campaign = "Example loop";
  const colors = ["#f50000", "#0b72e7", "#12a150", "#f2a900"];
  for (let i = 0; i < colors.length; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 500;
    const x = canvas.getContext("2d")!;
    x.fillStyle = colors[i]!;
    x.fillRect(0, 0, 600, 500);
    x.fillStyle = "#fff";
    x.font = "bold 260px sans-serif";
    x.textAlign = "center";
    x.fillText(String(i + 1), 300, 340);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
    const p = await fileToFramePicture(new File([blob], `${i + 1}.png`, { type: "image/png" }));
    d.files[p.key] = p.file;
    d.config.frames.push({ image: p.key });
  }
  return d;
}
