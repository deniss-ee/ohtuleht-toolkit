import JSZip from "jszip";
import { renderImageSlider, validateImageSlider } from "@ohtuleht/templates";
import type { ImageSliderConfig, Problem } from "@ohtuleht/templates";
import runtimeJs from "../../../../packages/banner-runtime/dist/runtime.js?raw";
import sliderCssRaw from "../../../../packages/banner-runtime/src/slider.css?raw";
import { getLang, ui } from "@/content";
import { readySignal } from "@/components/editor/SwapFrame";
import { bytesOf, slug, type HeaderFile } from "@/lib/banner";
import { toDataUrl } from "@/lib/image";
import { BG_LIMIT, optimiseImage, SLIDE_LIMIT, type Optimised } from "@/lib/optimise";
import { openZip } from "@/lib/openzip";
import { download } from "@/lib/zip";

const sliderCss = sliderCssRaw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

// Pictures are kept under a short random key while the person edits (slides can be added, moved and removed).
// config.slides[i].image and config.background.src hold these keys; real file names are made when the zip is written.
export interface SliderDraft {
  config: ImageSliderConfig;
  files: Record<string, HeaderFile>;
}

export function newSliderDraft(): SliderDraft {
  return {
    files: {},
    config: {
      v: 1,
      kind: "image-slider",
      format: "image-slider-1250x400",
      campaign: "",
      background: { src: "", clickable: true, href: "" },
      slides: [],
      linkMode: "shared",
      sharedHref: "",
      // Values of the Dacia/Renault banners: three 300x250 slides, 10 px apart, 165 px from the left and 100 px from the top.
      layout: { x: 165, y: 100, width: 920, height: 250, gap: 10, visible: 3 },
      arrows: true,
      behavior: { shuffle: false, autoplay: true, delayMs: 2000, speedMs: 500, loop: true },
    },
  };
}

export const sliderProblems = (d: SliderDraft): Problem[] => validateImageSlider(d.config, getLang());

const newKey = () => Math.random().toString(36).slice(2, 10);
const extOf = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return ext === "jpeg" ? "jpg" : ext;
};

// A picture the person chose: optimised, ready for the draft.
export async function fileToSliderPicture(file: File, kind: "slide" | "background"): Promise<{ key: string; file: HeaderFile; optimised: Optimised }> {
  const name = `${kind}.${extOf(file.name)}`;
  const optimised = await optimiseImage(new Uint8Array(await file.arrayBuffer()), name, kind === "slide" ? SLIDE_LIMIT : BG_LIMIT);
  return { key: newKey(), file: { name, bytes: optimised.bytes, dataUrl: toDataUrl(optimised.bytes, name) }, optimised };
}

// Pictures of the unused keys are dropped so they never end up in the zip or in storage.
export function tidy(d: SliderDraft): SliderDraft {
  const used = new Set([d.config.background.src, ...d.config.slides.map((s) => s.image)]);
  const files = Object.fromEntries(Object.entries(d.files).filter(([k]) => used.has(k)));
  return Object.keys(files).length === Object.keys(d.files).length ? d : { ...d, files };
}

interface Resolved {
  config: ImageSliderConfig;
  out: { name: string; bytes: Uint8Array }[]; // files for the zip
}

// Preview: pictures as data URLs. Export: pictures as 1.jpg, 2.jpg ... and bg.png next to index.html.
function resolve(d: SliderDraft, mode: "preview" | "export"): Resolved {
  const out: Resolved["out"] = [];
  const pick = (key: string, base: string) => {
    const f = d.files[key];
    if (!f) return "";
    const name = `${base}.${extOf(f.name)}`;
    out.push({ name, bytes: f.bytes });
    return mode === "preview" ? f.dataUrl : name;
  };
  const background = { ...d.config.background, src: pick(d.config.background.src, "bg") };
  const slides = d.config.slides.map((s, i) => ({ ...s, image: pick(s.image, String(i + 1)) }));
  return { config: { ...d.config, background, slides }, out };
}

export function renderSliderPreview(d: SliderDraft, id: number): string {
  const { config } = resolve(d, "preview");
  // Shuffle is off in the preview so the order does not jump with every edit.
  return renderImageSlider({ ...config, behavior: { ...config.behavior, shuffle: false } }, { runtimeJs, sliderCss }).replace("</body>", readySignal(id) + "</body>");
}

export function renderSliderExport(d: SliderDraft) {
  const { config, out } = resolve(d, "export");
  return { html: renderImageSlider(config, { runtimeJs, sliderCss }), out };
}

// Total weight of the zip content, in KB.
export function sliderWeightKb(d: SliderDraft): number {
  const { html, out } = renderSliderExport(d);
  return (bytesOf(html) + out.reduce((n, f) => n + f.bytes.length, 0)) / 1024;
}

export async function buildSliderZip(d: SliderDraft): Promise<Blob> {
  const { html, out } = renderSliderExport(d);
  const zip = new JSZip();
  zip.file("index.html", html);
  out.forEach((f) => zip.file(f.name, f.bytes));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

export const sliderZipName = (d: SliderDraft) => `${slug(d.config.campaign)}_1250x400.zip`;
export const downloadSliderZip = async (d: SliderDraft) => download(await buildSliderZip(d), sliderZipName(d));

// Reads a slider made by this tool (config is embedded in index.html). Returns null when the zip is something else.
export async function importSliderZip(file: File): Promise<SliderDraft | null> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) return null;
  const json = new DOMParser().parseFromString(await index.async("string"), "text/html").getElementById("ol-banner")?.textContent;
  if (!json) return null;
  const parsed = JSON.parse(json) as Partial<ImageSliderConfig>;
  if (parsed.kind !== "image-slider") return null;
  if (parsed.v !== 1 || parsed.format !== "image-slider-1250x400") throw new Error(ui.errBannerVersion);
  const config = parsed as ImageSliderConfig;
  const files: SliderDraft["files"] = {};
  const read = async (src: string): Promise<string> => {
    const entry = zip.file(src);
    if (!entry) return "";
    const bytes = await entry.async("uint8array");
    const key = newKey();
    files[key] = { name: src, bytes, dataUrl: toDataUrl(bytes, src) };
    return key;
  };
  const background = { ...config.background, src: await read(config.background.src) };
  const slides = [];
  for (const s of config.slides) slides.push({ ...s, image: await read(s.image) });
  return { config: { ...config, background, slides }, files };
}

// Pictures drawn on the spot, so the form can be tried without collecting anything first.
export async function exampleSliderDraft(): Promise<SliderDraft> {
  const make = async (w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, kind: "slide" | "background") => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext("2d")!);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.9));
    return fileToSliderPicture(new File([blob], `${kind}.jpg`, { type: "image/jpeg" }), kind);
  };
  const d = newSliderDraft();
  d.config.campaign = "Example campaign";
  const bg = await make(2500, 800, (x) => {
    const g = x.createLinearGradient(0, 0, 2500, 800);
    g.addColorStop(0, "#1b1b1f");
    g.addColorStop(1, "#3a3a44");
    x.fillStyle = g;
    x.fillRect(0, 0, 2500, 800);
    x.fillStyle = "#fff";
    x.font = "bold 72px sans-serif";
    x.textAlign = "center";
    x.fillText("Näidiskampaania", 1250, 130);
  }, "background");
  d.files[bg.key] = bg.file;
  d.config.background.src = bg.key;
  const colors = ["#f50000", "#0b72e7", "#12a150", "#f2a900", "#8a3ffc"];
  for (let i = 0; i < colors.length; i++) {
    const p = await make(600, 500, (x) => {
      x.fillStyle = colors[i]!;
      x.fillRect(0, 0, 600, 500);
      x.fillStyle = "#fff";
      x.font = "bold 220px sans-serif";
      x.textAlign = "center";
      x.fillText(String(i + 1), 300, 320);
    }, "slide");
    d.files[p.key] = p.file;
    d.config.slides.push({ image: p.key, href: "" });
  }
  return d;
}
