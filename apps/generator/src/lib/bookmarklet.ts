import source from "../../../../tools/bookmarklet/article-snippet.js?raw";

// The readable source becomes a one-line "javascript:" bookmark.
const code = source
  .replace(/^\s*\/\/.*$/gm, "") // whole-line comments only: "//" also appears inside URLs
  .replace(/\s+/g, " ")
  .trim();

// Plain text for pasting into a bookmark by hand; the percent-encoded form is what the draggable link carries.
export const bookmarkletText = "javascript:" + code;
export const bookmarkletHref = "javascript:" + encodeURIComponent(code);
