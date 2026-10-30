// Shared storage: briefs and clients live in the Cloudflare Worker (apps/api). The browser keeps a copy so the site works offline.
//  - Every change is sent to the Worker; if that fails it waits in an outbox and is sent next time.
//  - On opening, the outbox is sent and the lists are fetched. The Worker is the truth, with one exception: a record that exists only
//    on this computer and was never on the server is new work done offline, so it is uploaded (not dropped).
//  - A record that was on the server at the last fetch but is gone now was deleted by somebody else, so it is dropped here too.
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://ohtuleht-api.ohtuleht-api.workers.dev";

export type Kind = "briefs" | "clients";
interface Rec {
  id: string;
  example?: boolean;
}
type Op = { kind: Kind; id: string; op: "put" | "del"; record?: Rec };

const OUTBOX = "ol-outbox";
const KNOWN = "ol-known-ids"; // ids that were on the server at the last fetch

const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window: nothing is remembered between visits */
  }
};

async function call(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, signal: AbortSignal.timeout(8000), headers: { "Content-Type": "application/json" } });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function send(o: Op): Promise<boolean> {
  const res = o.op === "put" ? await call(`/api/${o.kind}/${encodeURIComponent(o.id)}`, { method: "PUT", body: JSON.stringify(o.record) }) : await call(`/api/${o.kind}/${encodeURIComponent(o.id)}`, { method: "DELETE" });
  return res !== null;
}

// Sends the waiting changes, oldest first. Returns true when nothing is left waiting.
export async function flush(): Promise<boolean> {
  const box = read<Op[]>(OUTBOX, []);
  const left: Op[] = [];
  for (const o of box) if (left.length || !(await send(o))) left.push(o);
  write(OUTBOX, left);
  return left.length === 0;
}

// Tells the Worker about one change; on failure it waits in the outbox. Examples are never sent.
export async function push(kind: Kind, op: "put" | "del", id: string, record?: Rec): Promise<boolean> {
  if (record?.example || id.startsWith("example-")) return true;
  const box = read<Op[]>(OUTBOX, []).filter((o) => !(o.kind === kind && o.id === id)); // a newer change replaces the waiting one
  box.push({ kind, id, op, record });
  write(OUTBOX, box);
  return flush();
}

// What changed between two lists, sent as puts and deletes.
export function pushDiff<T extends Rec>(kind: Kind, prev: T[], next: T[]) {
  const before = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
  const ids = new Set(next.map((r) => r.id));
  for (const r of next) if (before.get(r.id) !== JSON.stringify(r)) void push(kind, "put", r.id, r);
  for (const r of prev) if (!ids.has(r.id)) void push(kind, "del", r.id);
}

export interface Pulled<T> {
  online: boolean;
  items: T[];
  testMode: boolean;
}

// Fetches the truth from the Worker and merges it with this computer's copy (rules above).
export async function pull<T extends Rec>(kind: Kind, local: T[]): Promise<Pulled<T>> {
  const health = await call("/api/health");
  if (!health) return { online: false, items: local, testMode: false };
  const testMode = ((await health.json().catch(() => ({}))) as { auth?: string }).auth === "open";
  await flush();
  const res = await call(`/api/${kind}`);
  if (!res) return { online: false, items: local, testMode };
  const remote = (await res.json()) as T[];
  const waiting = read<Op[]>(OUTBOX, []).filter((o) => o.kind === kind); // changes that could not be sent yet: they win over the server's copy
  const known = new Set(read<Record<string, string[]>>(KNOWN, {})[kind] ?? []);
  const byId = new Map(remote.map((r) => [r.id, r]));
  for (const o of waiting) {
    if (o.op === "del") byId.delete(o.id);
    else if (o.record) byId.set(o.id, o.record as T);
  }
  // New work done offline: only here, never on the server, and not a sample.
  const offline = local.filter((r) => !r.example && !byId.has(r.id) && !known.has(r.id));
  for (const r of offline) void push(kind, "put", r.id, r);
  const items = [...byId.values(), ...offline];
  const samples = items.length === 0 ? local.filter((r) => r.example) : []; // an empty server: keep the first-visit samples
  write(KNOWN, { ...read<Record<string, string[]>>(KNOWN, {}), [kind]: [...remote.map((r) => r.id), ...offline.map((r) => r.id)] });
  return { online: true, items: [...items, ...samples], testMode };
}
