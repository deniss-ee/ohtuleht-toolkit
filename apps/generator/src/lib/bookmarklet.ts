import snippetSource from "../../../../tools/bookmarklet/article-snippet.js?raw";
import scraperSource from "../../../../tools/bookmarklet/article-scraper.js?raw";

// The readable source becomes a one-line "javascript:" bookmark.
const oneLine = (source: string) =>
  source
    .replace(/^\s*\/\/.*$/gm, "") // whole-line comments only: "//" also appears inside URLs
    .replace(/\s+/g, " ")
    .trim();

// Banner snippet bookmark. Plain text for pasting into a bookmark by hand; the percent-encoded form is what the draggable link carries.
const snippet = oneLine(snippetSource);
export const bookmarkletText = "javascript:" + snippet;
export const bookmarkletHref = "javascript:" + encodeURIComponent(snippet);

// Marketing scraper bookmark: it always opens the live site (GitHub Pages), wherever it was made.
// Change this address if the site moves (for example to the company domain).
export const LIVE_URL = "https://deniss-ee.github.io/ohtuleht-toolkit/";
const scraper = oneLine(scraperSource).replace("__APP__", LIVE_URL);
export const scraperText = "javascript:" + scraper;
export const scraperHref = "javascript:" + encodeURIComponent(scraper);
