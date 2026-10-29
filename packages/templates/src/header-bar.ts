// Template: header bar. The 100% wide, 46 px bar uploaded to b.ohtuleht.ee and shown on the site in an iframe.
// Output matches the live files (index.html + style.css [+ bg picture]), e.g.
// https://b.ohtuleht.ee/html5/Ohtuleht/paised_uus/vallatud_joulud/ and category/rubriik-4dimensioon.
import { onColor } from "./colors.ts";
import { escapeHtml, jsonForScript } from "./escape.ts";
import { messages, type Lang } from "./messages.ts";
import type { Problem } from "./validate.ts";

export interface HeaderBarConfig {
  v: 1;
  format: "header-bar";
  label: string; // text on the bar, shown uppercase
  href: string; // theme page the bar opens
  primary: string; // bar colour
  textColor?: string; // when empty, picked for contrast
  picture?: { src: string; avg?: string }; // optional background picture; src is the file name in the zip; avg = its average colour
}

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:wght@400;700&display=swap";
const isUrl = (s: string) => /^https?:\/\//.test(s.trim());

export function validateHeaderBar(c: HeaderBarConfig, lang: Lang = "en"): Problem[] {
  const m = messages(lang);
  const problems: Problem[] = [];
  if (!c.label.trim()) problems.push({ message: m.barLabel, field: "hb-label" });
  if (!isUrl(c.href)) problems.push({ message: m.barHref, field: "hb-href" });
  return problems;
}

export function headerTextColor(c: HeaderBarConfig): string {
  return c.textColor ?? onColor(c.picture?.avg ?? c.primary);
}

export interface HeaderBarFiles {
  html: string; // index.html
  css: string; // style.css
}

export function renderHeaderBar(c: HeaderBarConfig): HeaderBarFiles {
  const image = c.picture ? `url("${c.picture.src}")` : "none";
  const css = `:root {
  --banner-background: ${c.primary};
  --banner-font-family: "Fira Sans Condensed", Arial, sans-serif;
  --banner-font-size: 16px;
  --banner-height: 46px;
  --banner-padding-inline: 16px;
  --banner-text-color: ${headerTextColor(c)};
  --banner-background-image: ${image};
}
* {
  box-sizing: border-box;
}
body {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  margin: 0;
  font-family: var(--banner-font-family);
  background-color: #f4f4f4;
}
.banner {
  padding-inline: var(--banner-padding-inline);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--banner-height);
  overflow: hidden;
  color: var(--banner-text-color);
  text-decoration: none;
  background-color: var(--banner-background);
  background-image: var(--banner-background-image);
  background-position: left;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 6px;
}
.banner__label {
  font: 700 var(--banner-font-size) / 1 var(--banner-font-family);
  text-transform: uppercase;
  color: inherit;
}
@media (prefers-color-scheme: dark) {
  body,
  html {
    background-color: #0f0f0f;
  }
}
`;
  const html = `<!doctype html>
<html lang="et">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(c.label)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'" />
    <link href="style.css" rel="stylesheet" />
  </head>
  <body>
    <a class="banner" href="${escapeHtml(c.href)}" role="banner" target="_blank" rel="noopener">
      <span class="banner__label">${escapeHtml(c.label)}</span>
    </a>
    <script type="application/json" id="ol-header">${jsonForScript(c)}</script>
  </body>
</html>
`;
  return { html, css };
}

// The iframe code to paste into the site, for the folder the files were uploaded to.
export function iframeCode(url: string): string {
  const src = url.trim() || "https://b.ohtuleht.ee/html5/…/";
  return `<iframe src="${escapeHtml(src)}" width="100%" height="46px" frameborder="0" marginheight="0" marginwidth="0"></iframe>`;
}
