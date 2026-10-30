// Client list for the task tracker. Until Scoro is connected it lives in three places that are merged by name:
//  1. this browser (added by hand, or imported from a CSV file, for example a Scoro export),
//  2. the shared file `public/clients.json` in the repository (one list for everybody; change it on GitHub and publish the site),
//  3. the examples shown on the very first visit.
// Later Scoro (or a Worker with a database) replaces 1 and 2: `scoro` keeps the Scoro id so the lists can be matched.
export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  note: string;
  scoro?: string;
  example?: boolean;
}

const KEY = "ol-clients";
export const emptyClient = (): Client => ({ id: crypto.randomUUID(), name: "", contact: "", email: "", phone: "", note: "" });

export const exampleClients = (): Client[] =>
  [
    ["Rimi Eesti", "Kati Saar", "kati.saar@example.com", "+372 600 1001"],
    ["Telia", "Peeter Mägi", "peeter.magi@example.com", "+372 600 1002"],
    ["Saku Õlletehas", "Anne Luik", "anne.luik@example.com", "+372 600 1003"],
    ["Forum Cinemas", "Mart Rebane", "mart.rebane@example.com", "+372 600 1004"],
    ["LHV", "Liisa Kuusk", "liisa.kuusk@example.com", "+372 600 1005"],
  ].map(([name, contact, email, phone]) => ({ ...emptyClient(), id: `example-${name}`, name: name!, contact: contact!, email: email!, phone: phone!, example: true }));

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Adds the new clients to the old list. A client with a name that is already there is skipped (the person's own entry wins).
export function mergeClients(old: Client[], incoming: Client[]): Client[] {
  const out = [...old];
  for (const c of incoming) if (c.name.trim() && !out.some((o) => same(o.name, c.name))) out.push(c);
  return out;
}
export const sortClients = (list: Client[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, "et"));

export function loadClients(): Client[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === null) return exampleClients();
    const raw = JSON.parse(stored);
    return Array.isArray(raw) ? (raw.filter((c) => c && typeof c.name === "string") as Client[]) : [];
  } catch {
    return [];
  }
}
export function saveClients(list: Client[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private window: the list is lost when the tab closes */
  }
}

// The shared list from the repository. Missing or broken file: nothing is added.
export async function fetchSharedClients(): Promise<Client[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}clients.json`, { cache: "no-cache" });
    if (!res.ok) return [];
    const raw = await res.json();
    return Array.isArray(raw) ? raw.filter((c) => c && typeof c.name === "string").map((c) => ({ ...emptyClient(), ...c, id: c.id ?? `shared-${c.name}` })) : [];
  } catch {
    return [];
  }
}

// ---- CSV (a Scoro or Excel export) ----
function splitCsv(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : first.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"', i++);
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) (row.push(cell), (cell = ""));
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

// Reads a CSV with a header row. Column names are recognised in English and Estonian; only the name is required.
export function parseClientsCsv(text: string): Client[] | null {
  const rows = splitCsv(text.replace(/^﻿/, ""));
  if (rows.length < 2) return null;
  const head = rows[0]!.map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const name = col("name", "company", "client", "nimi", "ettevõte", "klient");
  if (name < 0) return null;
  const contact = col("contact", "person", "kontakt", "isik");
  const email = col("email", "e-mail", "e-post");
  const phone = col("phone", "mobile", "telefon", "mobiil");
  const id = col("id", "scoro");
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return rows
    .slice(1)
    .map((r) => ({ ...emptyClient(), name: get(r, name), contact: get(r, contact), email: get(r, email), phone: get(r, phone), scoro: get(r, id) || undefined }))
    .filter((c) => c.name);
}

const quote = (s: string) => (/[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export const clientsCsv = (list: Client[]) => ["name,contact,email,phone,note", ...list.map((c) => [c.name, c.contact, c.email, c.phone, c.note].map(quote).join(","))].join("\n");
