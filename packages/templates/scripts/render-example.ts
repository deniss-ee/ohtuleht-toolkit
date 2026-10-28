// Renders the Kultuurisügis example (articles taken from the legacy banner) into example-output/.
// Run: yarn workspace @ohtuleht/templates example   (build banner-runtime first)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { renderArticles1250x400, validate } from "../src/index.ts";
import type { ArticlesBannerConfig } from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const out = new URL("../example-output/", import.meta.url);

const img = (path: string) => `https://p.ohtuleht.ee/webp/54/i/${path}`;
const articles: ArticlesBannerConfig["articles"] = [
  { url: "https://www.ohtuleht.ee/1169772/", image: img("2026/10/26/t1ovwidw.aju.jpg"), title: "Kaks komöödiat, üks kindel lubadus: rohkesti naeru, äratundmist ja ootamatuid pöördeid!" },
  { url: "https://www.ohtuleht.ee/1169357/", image: img("2026/10/21/ljqh0wyf.zk2.jpg"), title: "Novembrimaagia: Sinatrale pühendatud galaõhtu viib kuulaja aega, mil muusika oli elegantne ja õhk täis romantikat" },
  { url: "https://www.ohtuleht.ee/1169358/", image: img("2026/10/21/i4kotj21.a5u.jpg"), title: "Muhedad jõulukontserdid: Koit Toome ja Karl-Erik Taukar lubavad kauneid duette ja põnevaid muusikalisi valikuid" },
  { url: "https://www.ohtuleht.ee/1169360/", image: img("2026/10/21/ikgyfay1.0d4.jpg"), title: "Huumor ja kaunis jõulumuusika – just seda pakuvad Suured Tüdrukud ja Reigo Tamm!" },
  { url: "https://www.ohtuleht.ee/1169361/", image: img("2026/10/21/uhkpo021.vhi.jpg"), title: "Hispaania tenorite trio Les Bohèmes toob publikuni maailmakuulsa ooperimuusika – tõeliselt elegantses võtmes" },
  { url: "https://www.ohtuleht.ee/1169362/", image: img("2026/10/20/0ba3iixt.ati.jpg"), title: "Ines astub jõuluajal taas lavale! Õhtu, mil ei pea kuhugi kiirustama ja võib nautida jõuluaja maagiat..." },
  { url: "https://www.ohtuleht.ee/1156030/", image: img("2026/4/21/oz3s4yvd.zdl.jpg"), title: "Palju äratundmist, aga ka magusvalusaid hetki – just seda pakub Vabamu näitus „Ilmaküla eestlased“" },
  { url: "https://www.ohtuleht.ee/1168830/", image: img("2026/10/12/vbwbsn5w.yyz.jpg"), title: "INGER kirjutas armastuskirja suvele. Lühialbumi „SUWE“ esitluskontsert toimub 12. novembril Telliskivis!" },
];

// Colours of this one campaign; other campaigns pick their own.
const config: ArticlesBannerConfig = {
  v: 1,
  format: "articles-1250x400",
  campaign: "Kultuurisügis 2710",
  header: { type: "image", src: "header.png", href: "https://www.ohtuleht.ee/teemalehed/kultuurisundmused2026-st" },
  badge: "Sisuturundus",
  primary: "#9500b2",
  theme: {
    light: { bg: "#ffffff", text: "#272727", hover: "#e3000f" },
    dark: { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" },
  },
  behavior: { shuffle: true, autoplay: true, delayMs: 2500, speedMs: 250, loop: true },
  articles,
};

const problems = validate(config);
if (problems.length) throw new Error(problems.map((p) => p.message).join("\n"));

const assets = {
  runtimeJs: readFileSync(new URL("packages/banner-runtime/dist/runtime.js", root), "utf8"),
  sliderCss: readFileSync(new URL("packages/banner-runtime/src/slider.css", root), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " "),
};
const html = renderArticles1250x400(config, assets);

mkdirSync(out, { recursive: true });
writeFileSync(new URL("index.html", out), html);
copyFileSync(new URL("content-marketing/st_KultuurSygis_2710-1250x400/header.png", root), new URL("header.png", out));

const header = readFileSync(new URL("header.png", out)).length;
console.log(`index.html ${html.length} B (gzip ${gzipSync(html).length} B), header.png ${header} B, total without article images ${html.length + header} B`);
