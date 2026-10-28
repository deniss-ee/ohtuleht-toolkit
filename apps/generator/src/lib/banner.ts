import { renderArticles1250x400, validate } from "@ohtuleht/templates";
import type { ArticleItem, ArticlesBannerConfig, ThemeColors } from "@ohtuleht/templates";
import runtimeJs from "../../../../packages/banner-runtime/dist/runtime.js?raw";
import sliderCssRaw from "../../../../packages/banner-runtime/src/slider.css?raw";

const sliderCss = sliderCssRaw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");

// Header image chosen in the form. Bytes go into the zip, the data URL feeds the preview.
export interface HeaderFile {
  name: string; // file name inside the zip, e.g. header.png
  bytes: Uint8Array;
  dataUrl: string;
}

export interface Draft {
  config: ArticlesBannerConfig;
  headerFile: HeaderFile | null;
}

// Neutral starting colours. Every campaign sets its own.
const light: ThemeColors = { bg: "#ffffff", text: "#272727", badge: "#333333", hover: "#000000", headerBg: "#333333" };
const dark: ThemeColors = { bg: "#0f0f0f", text: "#ffffff", badge: "#cccccc", hover: "#ffffff", headerBg: "#333333" };

export function newDraft(): Draft {
  return {
    headerFile: null,
    config: {
      v: 1,
      format: "articles-1250x400",
      campaign: "",
      header: { type: "color", href: "" },
      badge: "Sisuturundus",
      theme: { light: { ...light }, dark: { ...dark } },
      behavior: { shuffle: true, autoplay: true, delayMs: 2500, speedMs: 250, loop: true },
      articles: [],
    },
  };
}

// Filled-in sample so the form can be tried without collecting articles first.
export function exampleDraft(): Draft {
  const d = newDraft();
  const img = (p: string) => `https://p.ohtuleht.ee/webp/54/i/${p}`;
  d.config.campaign = "Example campaign";
  d.config.header = { type: "color", href: "https://www.ohtuleht.ee/" };
  d.config.articles = [
    { url: "https://www.ohtuleht.ee/1169772/", image: img("2026/10/26/t1ovwidw.aju.jpg"), title: "Kaks komöödiat, üks kindel lubadus: rohkesti naeru, äratundmist ja ootamatuid pöördeid!" },
    { url: "https://www.ohtuleht.ee/1169357/", image: img("2026/10/21/ljqh0wyf.zk2.jpg"), title: "Novembrimaagia: Sinatrale pühendatud galaõhtu viib kuulaja aega, mil muusika oli elegantne ja õhk täis romantikat" },
    { url: "https://www.ohtuleht.ee/1169358/", image: img("2026/10/21/i4kotj21.a5u.jpg"), title: "Muhedad jõulukontserdid: Koit Toome ja Karl-Erik Taukar lubavad kauneid duette ja põnevaid muusikalisi valikuid" },
    { url: "https://www.ohtuleht.ee/1169360/", image: img("2026/10/21/ikgyfay1.0d4.jpg"), title: "Huumor ja kaunis jõulumuusika – just seda pakuvad Suured Tüdrukud ja Reigo Tamm!" },
    { url: "https://www.ohtuleht.ee/1169361/", image: img("2026/10/21/uhkpo021.vhi.jpg"), title: "Hispaania tenorite trio Les Bohèmes toob publikuni maailmakuulsa ooperimuusika – tõeliselt elegantses võtmes" },
    { url: "https://www.ohtuleht.ee/1169362/", image: img("2026/10/20/0ba3iixt.ati.jpg"), title: "Ines astub jõuluajal taas lavale! Õhtu, mil ei pea kuhugi kiirustama ja võib nautida jõuluaja maagiat..." },
  ];
  return d;
}

export function emptyArticle(): ArticleItem {
  return { url: "", title: "", image: "" };
}

export function problems(draft: Draft): string[] {
  return validate(draft.config);
}

// The preview passes the chosen theme's colours as both themes, so no browser setting is needed.
export function renderPreview(draft: Draft, theme: "light" | "dark"): string {
  const c = draft.config;
  const header = draft.headerFile && c.header.type === "image" ? { ...c.header, src: draft.headerFile.dataUrl } : c.header;
  const colors = theme === "dark" ? c.theme.dark : c.theme.light;
  return renderArticles1250x400({ ...c, header, theme: { light: colors, dark: colors } }, { runtimeJs, sliderCss });
}

// Final html for the zip: the header refers to the file inside the zip.
export function renderExport(draft: Draft): string {
  const c = draft.config;
  const header = c.header.type === "image" && draft.headerFile ? { ...c.header, src: draft.headerFile.name } : c.header;
  return renderArticles1250x400({ ...c, header }, { runtimeJs, sliderCss });
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
  return `${slug(draft.config.campaign)}_1250x400.zip`;
}
