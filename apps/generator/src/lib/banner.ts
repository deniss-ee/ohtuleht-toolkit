import { renderArticles1250x400, renderArticlesMobile, validate } from "@ohtuleht/templates";
import type { ArticleItem, ArticlesBannerConfig, ArticlesFormat, Problem, ThemeColors } from "@ohtuleht/templates";
import runtimeJs from "../../../../packages/banner-runtime/dist/runtime.js?raw";
import { getLang } from "@/content";
import { stampedName } from "@/lib/format";
import { readySignal } from "@/components/editor/SwapFrame";
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
  adFile?: HeaderFile | null; // picture of the static ad (desktop); same shape as the header picture
}

// Starting colours copied from the existing banners' stylesheet: titles turn red on hover.
// The main colour drives the header, arrows and label colours; every campaign picks its own.
const light: ThemeColors = { bg: "#ffffff", text: "#272727", hover: "#e3000f" };
const dark: ThemeColors = { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" };

// Preview frame size and name of each format. The mobile banner is 498 px high and fills the width of the phone;
// its preview frame is 8 px taller above and below so the dots at the very bottom are never cut by the frame edge.
export const FORMATS: Record<ArticlesFormat, { label: string; width: number; height: number; suffix: string; darkBg: string }> = {
  "articles-1250x400": { label: "1250x400", width: 1250, height: 400, suffix: "1250x400", darkBg: "#0f0f0f" },
  "articles-mobile": { label: "Mobile", width: 376, height: 514, suffix: "mobile", darkBg: "#1c1c1c" },
};

// Same banner, other size: everything is kept (campaign, header, articles, colours, behaviour).
// The dark background follows the new format unless it was changed by hand.
export function switchFormat(draft: Draft, format: ArticlesFormat): Draft {
  const c = draft.config;
  if (c.format === format) return draft;
  const dark = c.theme.dark.bg === FORMATS[c.format].darkBg ? { ...c.theme.dark, bg: FORMATS[format].darkBg } : c.theme.dark;
  return { ...draft, config: { ...c, format, theme: { ...c.theme, dark } } };
}

const render = (c: ArticlesBannerConfig, assets: Parameters<typeof renderArticles1250x400>[1]) => (c.format === "articles-mobile" ? renderArticlesMobile({ ...c, ad: undefined }, assets) : renderArticles1250x400(c, assets));

// The ad picture is part of the banner only on the desktop size and only when a picture is chosen.
export const adFileOf = (draft: Draft): HeaderFile | null => (draft.config.format === "articles-1250x400" && draft.config.ad ? (draft.adFile ?? null) : null);

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
      theme: { light: { ...light }, dark: { ...dark, bg: FORMATS[format].darkBg } },
      behavior: { shuffle: true, autoplay: true, delayMs: 3000, speedMs: 250, loop: true },
      articles: [],
    },
  };
}

// Filled-in sample so the form can be tried without collecting anything first. As plain as possible:
// solid colour header, every label and colour left at its default, made-up texts, example.com links
// and random placeholder pictures (no real company or article). The person changes whatever they need.
export async function exampleDraft(format: ArticlesFormat = "articles-1250x400"): Promise<Draft> {
  const d = newDraft(format);
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/1000`;
  d.config.campaign = "Example campaign";
  d.config.header = { type: "color", href: "https://example.com/campaign" };
  d.config.articles = [
    { url: "https://example.com/article-1", image: img("ol-example-1"), title: "Näidisartikkel: lühike pealkiri" },
    { url: "https://example.com/article-2", image: img("ol-example-2"), title: "Siia tuleb artikli pealkiri, mis on kahe rea pikkune ja näitab, kuidas tekst kaardil murdub" },
    { url: "https://example.com/article-3", image: img("ol-example-3"), title: "Kolmas näide: pikem pealkiri, mis jätkub veel natuke, et näha mitme rea paigutust ja kaardi alumist osa" },
    { url: "https://example.com/article-4", image: img("ol-example-4"), title: "Neljas näidisartikkel ilma pikema jututa" },
    { url: "https://example.com/article-5", image: img("ol-example-5"), title: "Viies näide: mõned sõnad, mis täidavad pealkirja ja näitavad kaardi ilmet" },
    { url: "https://example.com/article-6", image: img("ol-example-6"), title: "Kuues ja viimane näidisartikkel, et libistamine ja täpid oleks näha" },
  ];
  return d;
}

export function emptyArticle(): ArticleItem {
  return { url: "", title: "", image: "" };
}

export function problems(draft: Draft): Problem[] {
  return validate(draft.config, getLang());
}

// The preview passes the chosen theme's colours as both themes, so no browser setting is needed.
// Shuffle is off here so the order does not jump with every edit; the real banner shuffles as set.
export function renderPreview(draft: Draft, theme: "light" | "dark", id: number): string {
  const c = draft.config;
  const header = draft.headerFile && c.header.type === "image" ? { ...c.header, src: draft.headerFile.dataUrl } : c.header;
  const ad = c.ad && draft.adFile ? { ...c.ad, src: draft.adFile.dataUrl } : c.ad;
  const colors = theme === "dark" ? c.theme.dark : c.theme.light;
  const html = render({ ...c, header, ad, behavior: { ...c.behavior, shuffle: false }, theme: { light: colors, dark: colors } }, { runtimeJs, sliderCss });
  return html.replace("</body>", readySignal(id) + "</body>");
}

// Final html for the zip: the header refers to the file inside the zip.
export function renderExport(draft: Draft): string {
  const c = draft.config;
  const header = c.header.type === "image" && draft.headerFile ? { ...c.header, src: draft.headerFile.name } : c.header;
  const ad = c.ad && draft.adFile ? { ...c.ad, src: draft.adFile.name } : c.ad;
  return render({ ...c, header, ad }, { runtimeJs, sliderCss });
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
  return stampedName(`${slug(draft.config.campaign)}_${FORMATS[draft.config.format].suffix}`, "zip");
}
