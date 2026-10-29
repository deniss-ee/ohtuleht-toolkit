import { renderArticles1250x400, renderArticlesMobile, validate } from "@ohtuleht/templates";
import type { ArticleItem, ArticlesBannerConfig, ArticlesFormat, Problem, ThemeColors } from "@ohtuleht/templates";
import runtimeJs from "../../../../packages/banner-runtime/dist/runtime.js?raw";
import exampleHeader from "@/assets/example-header.svg";
import { readySignal } from "@/components/editor/SwapFrame";
import { averageColor, toDataUrl } from "@/lib/image";
import sliderCssRaw from "../../../../packages/banner-runtime/src/slider.css?raw";

const sliderCss = sliderCssRaw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

// Header image chosen in the form. Bytes go into the zip, the data URL feeds the preview.
export interface HeaderFile {
  name: string; // file name inside the zip, e.g. header.png
  bytes: Uint8Array;
  dataUrl: string;
  avg?: string; // average colour of the picture, kept so switching header type does not lose it
}

export interface Draft {
  config: ArticlesBannerConfig;
  headerFile: HeaderFile | null;
}

// Starting colours copied from the existing banners' stylesheet: titles turn red on hover.
// The main colour drives the header, arrows and label colours; every campaign picks its own.
const light: ThemeColors = { bg: "#ffffff", text: "#272727", hover: "#e3000f" };
const dark: ThemeColors = { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" };

// Preview frame size and name of each format. The mobile banner fills the width of the phone: the frame is the Figma frame (376 wide, 8 px margins).
export const FORMATS: Record<ArticlesFormat, { label: string; width: number; height: number; suffix: string }> = {
  "articles-1250x400": { label: "1250x400", width: 1250, height: 400, suffix: "1250x400" },
  "articles-mobile": { label: "Mobile", width: 376, height: 499, suffix: "mobile" },
};

const render = (c: ArticlesBannerConfig, assets: Parameters<typeof renderArticles1250x400>[1]) => (c.format === "articles-mobile" ? renderArticlesMobile(c, assets) : renderArticles1250x400(c, assets));

export function newDraft(format: ArticlesFormat = "articles-1250x400"): Draft {
  return {
    headerFile: null,
    config: {
      v: 1,
      format,
      campaign: "",
      primary: "#f50000", // brand red (Primary Red 600)
      header: { type: "color", href: "" },
      badge: "Sisuturundus",
      theme: { light: { ...light }, dark: { ...dark, ...(format === "articles-mobile" ? { bg: "#1c1c1c" } : {}) } },
      behavior: { shuffle: true, autoplay: true, delayMs: 2500, speedMs: 250, loop: true },
      articles: [],
    },
  };
}

// Filled-in sample (with a real header image) so the form can be tried without collecting anything first.
export async function exampleDraft(format: ArticlesFormat = "articles-1250x400"): Promise<Draft> {
  const d = newDraft(format);
  const img = (p: string) => `https://p.ohtuleht.ee/webp/54/i/${p}`;
  d.config.campaign = "Example campaign";
  const bytes = new Uint8Array(await (await fetch(exampleHeader)).arrayBuffer());
  const dataUrl = toDataUrl(bytes, "header.svg");
  const avg = await averageColor(dataUrl);
  d.headerFile = { name: "header.svg", bytes, dataUrl, avg };
  d.config.header = { type: "image", src: "header.svg", href: "https://www.ohtuleht.ee/teemalehed/kultuurisundmused2026-st", avg };
  d.config.articles = [
    { url: "https://www.ohtuleht.ee/1169772/", image: img("2026/10/26/t1ovwidw.aju.jpg"), title: "Kaks komöödiat, üks kindel lubadus: rohkesti naeru, äratundmist ja ootamatuid pöördeid!" },
    { url: "https://www.ohtuleht.ee/1169357/", image: img("2026/10/21/ljqh0wyf.zk2.jpg"), title: "Novembrimaagia: Sinatrale pühendatud galaõhtu viib kuulaja aega, mil muusika oli elegantne ja õhk täis romantikat" },
    { url: "https://www.ohtuleht.ee/1169358/", image: img("2026/10/21/i4kotj21.a5u.jpg"), title: "Muhedad jõulukontserdid: Koit Toome ja Karl-Erik Taukar lubavad kauneid duette ja põnevaid muusikalisi valikuid", badge: "Kontsert", badgeColor: "#0a7a3d" },
    { url: "https://www.ohtuleht.ee/1169360/", image: img("2026/10/21/ikgyfay1.0d4.jpg"), title: "Huumor ja kaunis jõulumuusika – just seda pakuvad Suured Tüdrukud ja Reigo Tamm!" },
    { url: "https://www.ohtuleht.ee/1169361/", image: img("2026/10/21/uhkpo021.vhi.jpg"), title: "Hispaania tenorite trio Les Bohèmes toob publikuni maailmakuulsa ooperimuusika – tõeliselt elegantses võtmes" },
    { url: "https://www.ohtuleht.ee/1169362/", image: img("2026/10/20/0ba3iixt.ati.jpg"), title: "Ines astub jõuluajal taas lavale! Õhtu, mil ei pea kuhugi kiirustama ja võib nautida jõuluaja maagiat..." },
  ];
  return d;
}

export function emptyArticle(): ArticleItem {
  return { url: "", title: "", image: "" };
}

export function problems(draft: Draft): Problem[] {
  return validate(draft.config);
}

// The preview passes the chosen theme's colours as both themes, so no browser setting is needed.
// Shuffle is off here so the order does not jump with every edit; the real banner shuffles as set.
export function renderPreview(draft: Draft, theme: "light" | "dark", id: number): string {
  const c = draft.config;
  const header = draft.headerFile && c.header.type === "image" ? { ...c.header, src: draft.headerFile.dataUrl } : c.header;
  const colors = theme === "dark" ? c.theme.dark : c.theme.light;
  const html = render({ ...c, header, behavior: { ...c.behavior, shuffle: false }, theme: { light: colors, dark: colors } }, { runtimeJs, sliderCss });
  return html.replace("</body>", readySignal(id) + "</body>");
}

// Final html for the zip: the header refers to the file inside the zip.
export function renderExport(draft: Draft): string {
  const c = draft.config;
  const header = c.header.type === "image" && draft.headerFile ? { ...c.header, src: draft.headerFile.name } : c.header;
  return render({ ...c, header }, { runtimeJs, sliderCss });
}

const encoder = new TextEncoder();
export const bytesOf = (text: string) => encoder.encode(text).length;

export function slug(text: string): string {
  const s = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "banner";
}

export function zipName(draft: Draft): string {
  return `${slug(draft.config.campaign)}_${FORMATS[draft.config.format].suffix}.zip`;
}
