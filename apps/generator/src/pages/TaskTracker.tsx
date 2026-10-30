import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Building2, CalendarDays, Cloud, CloudOff, Download, Kanban, ListChecks, Plus, Sparkles, Table2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BriefPage, STATUS_DOT } from "@/components/editor/BriefPage";
import { PageHeader } from "@/components/editor/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tracker as t, getLang } from "@/content";
import { clientsCsv, emptyClient, fetchSharedClients, loadClients, mergeClients, parseClientsCsv, saveClients, sortClients, type Client } from "@/lib/clients";
import { pull, pushDiff } from "@/lib/sync";
import { isOverdue, loadBriefs, parseBackup, saveBriefs, STATUSES, type Brief, type Status } from "@/lib/tracker";

const shortDate = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(getLang() === "et" ? "et-EE" : "en-GB", { day: "numeric", month: "short" });


const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

function Field({ id, label, hint, children, wide }: { id: string; label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  return <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden />;
}

// A brief as a card: who it is for, what, when. The whole card opens it.
function BriefCard({ b, onOpen, draggable }: { b: Brief; onOpen: () => void; draggable?: boolean }) {
  const late = isOverdue(b);
  const n = b.rows.filter((r) => r.placement || r.text).length;
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
      onClick={onOpen}
      className="group w-full cursor-grab rounded-xl border bg-card p-3.5 text-left shadow-xs transition hover:-translate-y-px hover:border-foreground/25 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[9px] font-semibold text-foreground">{initials(b.client)}</span>
        <span className="truncate">{b.client || "-"}</span>
        {b.example && <span className="ml-auto shrink-0 rounded bg-muted px-1 text-[10px]">{t.example}</span>}
      </span>
      <span className="mt-2 block leading-snug font-medium">{b.title || t.untitled}</span>
      <span className="mt-3 flex flex-wrap items-center gap-1.5 text-xs whitespace-nowrap">
        <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${late ? "bg-red-600/10 font-medium text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
          {late ? <AlertTriangle className="size-3" aria-hidden /> : <CalendarDays className="size-3" aria-hidden />}
          {b.deadline ? shortDate(b.deadline) : t.noDate}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">{t.banners(n)}</span>
        <span className="flex-1" />
        {b.requester && (
          <span title={b.requester} className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {initials(b.requester)}
          </span>
        )}
      </span>
    </button>
  );
}

// Clients: add once, pick every time. Import from a CSV file (a Scoro export) or take the shared list from the repository.
function Clients({ clients, onChange }: { clients: Client[]; onChange: (list: Client[]) => void }) {
  const [draft, setDraft] = useState<Client>(emptyClient);
  const [sure, setSure] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Client>) => setDraft((d) => ({ ...d, ...p }));
  const add = () => {
    if (!draft.name.trim()) return;
    onChange(mergeClients(clients, [{ ...draft, name: draft.name.trim() }]));
    toast.success(t.clients.added(draft.name.trim()));
    setDraft(emptyClient());
  };
  const importCsv = async (f: File) => {
    const got = parseClientsCsv(await f.text());
    if (!got) return void toast.error(t.clients.importFailed);
    const merged = mergeClients(clients, got);
    onChange(merged);
    toast.success(t.clients.imported(merged.length - clients.length, got.length));
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + clientsCsv(clients)], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "clients.csv" }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-5">
      <section aria-label={t.clients.add} className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">{t.clients.add}</h2>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Field id="c-name" label={t.clients.name}>
            <Input id="c-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field id="c-contact" label={t.clients.contact}>
            <Input id="c-contact" value={draft.contact} autoComplete="off" onChange={(e) => set({ contact: e.target.value })} />
          </Field>
          <Field id="c-email" label={t.clients.email}>
            <Input id="c-email" type="email" value={draft.email} autoComplete="off" onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field id="c-phone" label={t.clients.phone}>
            <Input id="c-phone" type="tel" value={draft.phone} autoComplete="off" onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" className="gap-2" disabled={!draft.name.trim()}>
              <Plus className="size-4" /> {t.clients.save}
            </Button>
          </div>
        </form>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">{t.clients.title}</h2>
        <Badge variant="secondary">{clients.length}</Badge>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" className="gap-2" onClick={() => file.current?.click()}>
          <Upload className="size-4" /> {t.clients.import}
        </Button>
        <Button size="sm" variant="ghost" className="gap-2" disabled={!clients.length} onClick={exportCsv}>
          <Download className="size-4" /> {t.clients.export}
        </Button>
        <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" aria-label={t.clients.import} onChange={(e) => (e.target.files?.[0] && void importCsv(e.target.files[0]), (e.target.value = ""))} />
      </div>

      {clients.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.clients.empty}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {sortClients(clients).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{initials(c.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {c.name} {c.example && <Badge variant="outline">{t.example}</Badge>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{[c.contact, c.email, c.phone].filter(Boolean).join(" · ") || "-"}</p>
              </div>
              {sure === c.id ? (
                <>
                  <Button size="sm" variant="destructive" onClick={() => (onChange(clients.filter((x) => x.id !== c.id)), setSure(null))}>
                    {t.deleteSure}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSure(null)}>
                    {t.cancel}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" aria-label={`${t.delete}: ${c.name}`} onClick={() => setSure(c.id)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t.clients.note}</p>
    </div>
  );
}

// Task tracker: a banner request (the form), the board and table of requests, and the client list. A request becomes a card on the board.
export function TaskTracker({ onMake, onNewRequest }: { onMake: (typeId: string) => void; onNewRequest: () => void }) {
  const [list, setList] = useState<Brief[]>(loadBriefs);
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [view, setView] = useState<"board" | "table" | "clients">("board");
  const [open, setOpen] = useState<Brief | null>(null); // an existing card being edited
  const [over, setOver] = useState<Status | null>(null);
  const file = useRef<HTMLInputElement>(null);

  // The newest lists, for the comparisons below (a state value can be one step behind when changes come quickly).
  const listRef = useRef(list);
  const clientsRef = useRef(clients);
  const [net, setNet] = useState<{ online: boolean | null; testMode: boolean }>({ online: null, testMode: false });

  const commit = (next: Brief[]) => {
    pushDiff("briefs", listRef.current, next);
    listRef.current = next;
    setList(next);
    saveBriefs(next);
  };
  const commitClients = (next: Client[]) => {
    pushDiff("clients", clientsRef.current, next);
    clientsRef.current = next;
    setClients(next);
    saveClients(next);
  };
  // Fetch what everybody has saved: when the page opens, when the tab gets the focus again, and every half minute.
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const b = await pull("briefs", listRef.current);
      const c = await pull("clients", clientsRef.current);
      if (!alive) return;
      setNet({ online: b.online && c.online, testMode: b.testMode });
      if (b.online) {
        listRef.current = b.items;
        setList(b.items);
        saveBriefs(b.items);
      }
      if (c.online) {
        clientsRef.current = c.items;
        setClients(c.items);
        saveClients(c.items);
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    const onShow = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);
  // The shared list from the repository joins the person's own (once, when the page opens).
  useEffect(() => {
    void fetchSharedClients().then((shared) => shared.length && ((clientsRef.current = mergeClients(clientsRef.current, shared)), setClients(clientsRef.current)));
  }, []);

  const save = (b: Brief) => {
    const exists = list.some((x) => x.id === b.id);
    commit(exists ? list.map((x) => (x.id === b.id ? b : x)) : [b, ...list]);
    // A client typed for the first time joins the client list, so it is a choice next time.
    if (b.client.trim() && !clients.some((c) => c.name.trim().toLowerCase() === b.client.trim().toLowerCase())) commitClients(mergeClients(clients, [{ ...emptyClient(), name: b.client.trim() }]));
    setOpen(null);
    window.scrollTo(0, 0);
    toast.success(exists ? t.saved : t.added);
  };
  const move = (id: string, status: Status) => commit(list.map((b) => (b.id === id ? { ...b, status } : b)));
  const examples = list.some((b) => b.example);
  const byStatus = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, list.filter((b) => b.status === s).sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9"))])) as Record<Status, Brief[]>, [list]);

  const exportAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(list, null, 2)], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: `briefs-${new Date().toISOString().slice(0, 10)}.json` }).click();
    URL.revokeObjectURL(url);
  };
  const importAll = async (f: File) => {
    const got = parseBackup(await f.text());
    if (!got) return void toast.error(t.importFailed);
    const ids = new Set(list.map((b) => b.id));
    commit([...got.filter((b) => !ids.has(b.id)), ...list]);
    toast.success(t.imported(got.length));
  };

  // An existing card opens as a page.
  if (open) {
    const b = open;
    return <BriefPage key={b.id} initial={b} isNew={false} clients={clients} onSave={save} onBack={() => setOpen(null)} onDelete={(id) => (commit(list.filter((x) => x.id !== id)), setOpen(null), toast.success(t.deleted))} onMake={onMake} />;
  }

  return (
    <div className="mx-auto max-w-[110rem] space-y-4">
      <PageHeader icon={ListChecks} title={t.title} intro={t.intro} />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="board" className="gap-2">
              <Kanban className="size-4" /> {t.viewBoard}
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="size-4" /> {t.viewTable}
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Building2 className="size-4" /> {t.viewClients}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="flex-1" />
        {view !== "clients" && (
          <>
            <Button size="sm" variant="ghost" className="gap-2" disabled={!list.length} onClick={exportAll}>
              <Download className="size-4" /> {t.export}
            </Button>
            <Button size="sm" variant="ghost" className="gap-2" onClick={() => file.current?.click()}>
              <Upload className="size-4" /> {t.import}
            </Button>
            <input ref={file} type="file" accept=".json,application/json" className="sr-only" aria-label={t.import} onChange={(e) => (e.target.files?.[0] && void importAll(e.target.files[0]), (e.target.value = ""))} />
          </>
        )}
        <Button className="gap-2" onClick={onNewRequest}>
          <Plus className="size-4" /> {t.newRequest}
        </Button>
      </div>

      {net.online !== null && (
        <p className={`flex flex-wrap items-center gap-2 text-xs ${net.online ? "text-muted-foreground" : "text-destructive"}`} role="status">
          {net.online ? <Cloud className="size-4 text-green-600" aria-hidden /> : <CloudOff className="size-4" aria-hidden />}
          {net.online ? t.syncOnline : t.syncOffline}
          {net.online && net.testMode && <span className="rounded bg-yellow-300/30 px-1.5 py-0.5 font-medium text-foreground">{t.syncTest}</span>}
        </p>
      )}

      {examples && view !== "clients" && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-muted/50 px-3 py-2 text-sm">
          <Sparkles className="size-4 text-primary" aria-hidden /> {t.examplesNote}
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => commit(list.filter((b) => !b.example))}>
            {t.clearExamples}
          </Button>
        </p>
      )}

      {view === "board" && (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="grid min-w-max grid-flow-col auto-cols-[17rem] gap-3 2xl:min-w-0 2xl:auto-cols-fr">
            {STATUSES.map((s) => (
              <section
                key={s}
                aria-label={t.statuses[s]}
                onDragOver={(e) => (e.preventDefault(), setOver(s))}
                onDragLeave={() => setOver((o) => (o === s ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) move(id, s);
                }}
                className={`flex min-h-56 flex-col gap-2.5 rounded-2xl p-2.5 transition-colors ${over === s ? "bg-primary/10 ring-2 ring-primary/40" : "bg-muted/60"}`}
              >
                <h2 className="flex items-center gap-2 px-1 pt-0.5 text-sm font-semibold">
                  <StatusDot status={s} /> {t.statuses[s]}
                  <span className="rounded-full bg-background px-1.5 text-xs font-medium text-muted-foreground">{byStatus[s].length}</span>
                </h2>
                {byStatus[s].map((b) => (
                  <BriefCard key={b.id} b={b} draggable onOpen={() => setOpen(b)} />
                ))}
                {byStatus[s].length === 0 && <p className="rounded-xl border border-dashed px-2 py-6 text-center text-xs text-muted-foreground">{t.emptyColumn}</p>}
              </section>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.dragHint}</p>
        </div>
      )}

      {view === "table" && (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                {(["title", "client", "requester", "status", "deadline"] as const).map((c) => (
                  <th key={c} scope="col" className="px-4 py-2.5 font-medium">
                    {t.cols[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...list]
                .sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9"))
                .map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <button type="button" className="text-left font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none" onClick={() => setOpen(b)}>
                        {b.title || t.untitled}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">{initials(b.client)}</span>
                        {b.client}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.requester}</td>
                    <td className="px-4 py-3">
                      <span className="relative inline-flex items-center">
                        <StatusDot status={b.status} />
                        <select aria-label={t.status} className="-ml-2 h-8 cursor-pointer appearance-none rounded-lg bg-transparent pr-2 pl-5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50" value={b.status} onChange={(e) => move(b.id, e.target.value as Status)}>
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t.statuses[s]}
                            </option>
                          ))}
                        </select>
                      </span>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${isOverdue(b) ? "font-medium text-destructive" : "text-muted-foreground"}`}>{b.deadline || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">{t.empty}</p>}
        </div>
      )}

      {view === "clients" && <Clients clients={clients} onChange={commitClients} />}

      {view !== "clients" && <p className="text-xs text-muted-foreground">{t.localNote}</p>}
    </div>
  );
}
