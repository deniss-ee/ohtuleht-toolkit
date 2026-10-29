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

// Marketing scraper bookmark: it opens this toolkit, so it carries the address it was made on (localhost or the live site).
const scraper = oneLine(scraperSource).replace("__APP__", location.origin + location.pathname);
export const scraperText = "javascript:" + scraper;
export const scraperHref = "javascript:" + encodeURIComponent(scraper);
