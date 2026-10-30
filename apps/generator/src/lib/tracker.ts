// Task tracker, first version: briefs for banner jobs, kept in this browser only (no server, no login yet).
// The brief fields follow docs/TASK-TRACKER.md. The same brief becomes one clear email text, so every department asks in the same way.
import { bannerTypes } from "@/content";

export const STATUSES = ["new", "design", "review", "delivered", "live", "closed"] as const;
export type Status = (typeof STATUSES)[number];

export interface BannerRow {
  format: string; // a banner type id, or "other"
  placement: string; // where it runs ("Delfi front page", "Õhtuleht article pages" ...)
  text: string; // headline and call to action
  link: string; // landing page
}

export interface Brief {
  id: string;
  title: string;
  client: string;
  department: string;
  requester: string;
  email: string;
  deadline: string; // yyyy-mm-dd
  runFrom: string;
  runTo: string;
  rows: BannerRow[];
  articles: string; // article links, one per line
  materials: string; // links to pictures, logos, Figma
  notes: string;
  status: Status;
  created: string; // ISO time
  example?: boolean; // a sample brief shown to new users; can be removed in one click
}

export const emptyRow = (): BannerRow => ({ format: bannerTypes[0]?.id ?? "other", placement: "", text: "", link: "" });
export const newBrief = (): Brief => ({
  id: crypto.randomUUID(),
  title: "",
  client: "",
  department: "",
  requester: "",
  email: "",
  deadline: "",
  runFrom: "",
  runTo: "",
  rows: [emptyRow()],
  articles: "",
  materials: "",
  notes: "",
  status: "new",
  created: new Date().toISOString(),
});

export const formatName = (id: string) => bannerTypes.find((b) => b.id === id)?.name ?? "Other";

// Required fields. Returns the names of what is missing, so the form can say exactly what to add.
export type Missing = "title" | "client" | "requester" | "deadline" | "rows";
export function missing(b: Brief): Missing[] {
  const out: Missing[] = [];
  if (!b.title.trim()) out.push("title");
  if (!b.client.trim()) out.push("client");
  if (!b.requester.trim()) out.push("requester");
  if (!b.deadline) out.push("deadline");
  if (!b.rows.some((r) => r.placement.trim() || r.text.trim())) out.push("rows");
  return out;
}

export const isOverdue = (b: Brief, today = new Date().toISOString().slice(0, 10)) => !!b.deadline && b.deadline < today && b.status !== "delivered" && b.status !== "live" && b.status !== "closed";

// The email: a subject and a body with the same order every time. Labels are English so a designer reads one layout; the values are as typed.
export function briefEmail(b: Brief): { subject: string; body: string } {
  const line = (label: string, value: string) => (value.trim() ? `${label}: ${value.trim()}\n` : "");
  const rows = b.rows
    .filter((r) => r.placement.trim() || r.text.trim() || r.link.trim())
    .map((r, i) => [`${i + 1}. ${formatName(r.format)}`, r.placement.trim() && `   Placement: ${r.placement.trim()}`, r.text.trim() && `   Text: ${r.text.trim()}`, r.link.trim() && `   Link: ${r.link.trim()}`].filter(Boolean).join("\n"))
    .join("\n");
  const body =
    line("Title", b.title) +
    line("Client", b.client) +
    line("From", [b.requester, b.department].filter((s) => s.trim()).join(", ")) +
    line("Reply to", b.email) +
    line("Needed by", b.deadline) +
    line("Runs", [b.runFrom, b.runTo].filter(Boolean).join(" to ")) +
    (rows ? `\nBanners:\n${rows}\n` : "") +
    (b.articles.trim() ? `\nArticles:\n${b.articles.trim()}\n` : "") +
    (b.materials.trim() ? `\nMaterials (pictures, logos, Figma):\n${b.materials.trim()}\n` : "") +
    (b.notes.trim() ? `\nNotes:\n${b.notes.trim()}\n` : "");
  return { subject: `Banner request: ${b.title.trim()}${b.client.trim() ? ` (${b.client.trim()})` : ""}`, body: body.trimEnd() };
}

// The same email as formatted text: the subject in bold, one paragraph per block, a line break after each line.
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function briefEmailHtml(b: Brief): string {
  const m = briefEmail(b);
  const blocks = m.body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px 0;">${p.split("\n").map(escHtml).join("<br>")}</p>`);
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;"><p style="margin:0 0 12px 0;"><b>${escHtml(m.subject)}</b></p>${blocks.join("")}</div>`;
}

// mailto: links have a limit in some mail programs; past it the caller should offer Copy instead.
export const MAILTO_LIMIT = 1800;
export const mailtoHref = (to: string, subject: string, body: string) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// ---- examples: what a good brief looks like, so a new person sees the tool filled in ----
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const ex = (id: string, p: Partial<Brief>): Brief => ({ ...newBrief(), id: "example-" + id, example: true, ...p });
export const exampleBriefs = (): Brief[] => [
  ex("rimi", { title: "Spring sale, Rimi", client: "Rimi Eesti", department: "Advertising sales", requester: "Mari Maasikas", email: "mari.maasikas@ohtuleht.ee", deadline: day(3), runFrom: day(7), runTo: day(21), status: "design", rows: [{ format: "articles-1250x400", placement: "Front page, top", text: "Spring prices: up to -30%", link: "https://www.rimi.ee/kevad?utm_source=ohtuleht&utm_medium=banner&utm_campaign=spring-sale" }, { format: "articles-mobile", placement: "Front page, mobile", text: "Spring prices: up to -30%", link: "https://www.rimi.ee/kevad?utm_source=ohtuleht&utm_medium=banner&utm_campaign=spring-sale" }], articles: "https://www.ohtuleht.ee/1169772/\nhttps://www.ohtuleht.ee/1169801/", materials: "Logo and pictures: https://example.com/rimi-materials\nFigma: https://www.figma.com/design/example", notes: "Red background, logo top left. Client wants to approve before it runs." }),
  ex("telia", { title: "Black Friday teaser", client: "Telia", department: "Content marketing", requester: "Jaan Tamm", deadline: day(-2), status: "review", rows: [{ format: "image-slider-1250x400", placement: "Article pages, header", text: "Black Friday starts Monday", link: "https://www.telia.ee/blackfriday" }], notes: "Three pictures in the slider. Send a preview to the client first." }),
  ex("saku", { title: "New beer, Saku", client: "Saku Õlletehas", department: "Advertising sales", requester: "Mari Maasikas", deadline: day(10), status: "new", rows: [{ format: "header-bar", placement: "Theme page: Beer", text: "Try the new taste", link: "https://www.saku.ee" }], materials: "Pictures to come from the client." }),
  ex("kino", { title: "Movie premiere", client: "Forum Cinemas", department: "Content marketing", requester: "Liis Kask", deadline: day(-9), status: "delivered", rows: [{ format: "other", placement: "Entertainment section", text: "In cinemas from Friday", link: "https://www.forumcinemas.ee" }] }),
  ex("lhv", { title: "Savings campaign", client: "LHV", department: "Advertising sales", requester: "Jaan Tamm", deadline: day(-20), status: "live", rows: [{ format: "articles-1250x400", placement: "Business section", text: "Savings at 3%", link: "https://www.lhv.ee" }] }),
];

// ---- storage (this browser only) ----
const KEY = "ol-briefs";
export function loadBriefs(): Brief[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === null) return exampleBriefs(); // first visit: show the tool with examples in it
    const raw = JSON.parse(stored);
    return Array.isArray(raw) ? (raw.filter((b) => b && typeof b.id === "string") as Brief[]) : [];
  } catch {
    return [];
  }
}
export function saveBriefs(list: Brief[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private window: the list is lost when the tab closes */
  }
}
// A file the person can keep as a backup, or move to another computer.
export function parseBackup(text: string): Brief[] | null {
  try {
    const raw = JSON.parse(text);
    return Array.isArray(raw) ? raw.filter((b) => b && typeof b.id === "string" && typeof b.title === "string").map((b) => ({ ...newBrief(), ...b, rows: Array.isArray(b.rows) && b.rows.length ? b.rows : [emptyRow()] })) : null;
  } catch {
    return null;
  }
}
