export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// For a value placed inside a single-quoted JS string inside an HTML attribute.
export function escapeJsInAttr(value: string): string {
  return escapeHtml(value.replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
}

// For url("...") inside an HTML attribute.
export function escapeCssUrlInAttr(value: string): string {
  return escapeHtml(value.replace(/[\\"()\s]/g, (c) => encodeURIComponent(c)));
}

// JSON that is safe inside <script type="application/json">.
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
