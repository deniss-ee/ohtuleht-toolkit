// UTM links: a normal web address plus the labels that tell the statistics (Google Analytics and others) where a visit came from.
export interface Utm {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

export const emptyUtm = (): Utm => ({ source: "", medium: "banner", campaign: "", content: "", term: "" });

// Ready choices for the medium; people can still type their own.
export const MEDIUMS = ["banner", "display", "email", "newsletter", "social", "native", "video", "cpc"];

// Labels work best in one spelling: lower case, words joined with a hyphen ("Spring Sale" and "spring sale" would be two different campaigns).
export const tidy = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");

export type UtmResult = { ok: true; link: string } | { ok: false; error: "empty" | "invalid" };

// Adds the labels to one address. An address that already has a ? part or a # part keeps them; labels already in it are replaced.
export function withUtm(address: string, utm: Utm, normalise: boolean): UtmResult {
  const text = address.trim();
  if (!text) return { ok: false, error: "empty" };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (!url.hostname.includes(".")) return { ok: false, error: "invalid" };
  const value = (v: string) => (normalise ? tidy(v) : v.trim());
  const pairs: [string, string][] = [
    ["utm_source", utm.source],
    ["utm_medium", utm.medium],
    ["utm_campaign", utm.campaign],
    ["utm_content", utm.content],
    ["utm_term", utm.term],
  ];
  for (const [key, raw] of pairs) {
    const v = value(raw);
    if (v) url.searchParams.set(key, v);
    else url.searchParams.delete(key);
  }
  return { ok: true, link: url.toString() };
}

// Source, medium and campaign are the three labels the statistics expect.
export const utmMissing = (u: Utm): ("source" | "medium" | "campaign")[] => (["source", "medium", "campaign"] as const).filter((k) => !u[k].trim());
