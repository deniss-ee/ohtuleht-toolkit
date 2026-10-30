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

// mailto: links have a limit in some mail programs; past it the caller should offer Copy instead.
export const MAILTO_LIMIT = 1800;
export const mailtoHref = (to: string, subject: string, body: string) => `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// ---- storage (this browser only) ----
const KEY = "ol-briefs";
export function loadBriefs(): Brief[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
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
