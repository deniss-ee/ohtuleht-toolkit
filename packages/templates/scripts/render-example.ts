// Renders a plain example banner (desktop and mobile) into example-output/.
// Made-up texts, example.com links, placeholder pictures, solid colour header, default labels and colours.
// Run: yarn workspace @ohtuleht/templates example   (build banner-runtime first)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { renderArticles1250x400, renderArticlesMobile, validate } from "../src/index.ts";
import type { ArticlesBannerConfig } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const out = new URL("../example-output/", import.meta.url);

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/1000`;
const titles = [
  "Näidisartikkel: lühike pealkiri",
  "Siia tuleb artikli pealkiri, mis on kahe rea pikkune ja näitab, kuidas tekst kaardil murdub",
  "Kolmas näide: pikem pealkiri, mis jätkub veel natuke, et näha mitme rea paigutust ja kaardi alumist osa",
  "Neljas näidisartikkel ilma pikema jututa",
  "Viies näide: mõned sõnad, mis täidavad pealkirja ja näitavad kaardi ilmet",
  "Kuues ja viimane näidisartikkel, et libistamine ja täpid oleks näha",
];
const articles: ArticlesBannerConfig["articles"] = titles.map((title, i) => ({ url: `https://example.com/article-${i + 1}`, image: img(`ol-example-${i + 1}`), title }));

const base: ArticlesBannerConfig = {
  v: 1,
  format: "articles-1250x400",
  campaign: "Example campaign",
  header: { type: "color", href: "https://example.com/campaign" },
  badge: "Sisuturundus",
  primary: "#f50000",
  theme: {
    light: { bg: "#ffffff", text: "#272727", hover: "#e3000f" },
    dark: { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" },
  },
  behavior: { shuffle: true, autoplay: true, delayMs: 3000, speedMs: 250, loop: true },
  articles,
};
const mobile: ArticlesBannerConfig = { ...base, format: "articles-mobile", theme: { ...base.theme, dark: { ...base.theme.dark, bg: "#1c1c1c" } } };

for (const c of [base, mobile]) {
  const problems = validate(c);
  if (problems.length) throw new Error(problems.map((p) => p.message).join("\n"));
}

const assets = {
  runtimeJs: readFileSync(new URL("packages/banner-runtime/dist/runtime.js", root), "utf8"),
  sliderCss: readFileSync(new URL("packages/banner-runtime/src/slider.css", root), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " "),
};

mkdirSync(out, { recursive: true });
for (const [file, html] of [
  ["index.html", renderArticles1250x400(base, assets)],
  ["mobile.html", renderArticlesMobile(mobile, assets)],
] as const) {
  writeFileSync(new URL(file, out), html);
  console.log(`${file} ${html.length} B (gzip ${gzipSync(html).length} B), no pictures`);
}
