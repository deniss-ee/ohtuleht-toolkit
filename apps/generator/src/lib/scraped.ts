// What the scraper bookmark hands over: the article, packed in the address after "#a=" (it never goes to a server).
export interface Scraped {
  title: string;
  lead: string;
  url: string;
  image: string;
  badge: string;
}

export function readScraped(hash: string): Scraped | null {
  const code = /^#a=([\w-]+)$/.exec(hash)?.[1];
  if (!code) return null;
  try {
    const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    return { title: text(o.t), lead: text(o.l), url: text(o.u), image: text(o.i), badge: text(o.b) };
  } catch {
    return null;
  }
}
