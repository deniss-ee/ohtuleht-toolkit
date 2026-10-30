import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Building2, CalendarDays, Download, Kanban, LayoutTemplate, ListChecks, Mail, Plus, Sparkles, Table2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/editor/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { bannerTypes, tracker as t } from "@/content";
import { clientsCsv, emptyClient, fetchSharedClients, loadClients, mergeClients, parseClientsCsv, saveClients, sortClients, type Client } from "@/lib/clients";
import { copyText } from "@/lib/clipboard";
import { briefEmail, emptyRow, exampleBriefs, isOverdue, loadBriefs, MAILTO_LIMIT, mailtoHref, missing, newBrief, parseBackup, saveBriefs, STATUSES, type Brief, type Status } from "@/lib/tracker";

const SEND_TO = "ol-brief-to";
const field = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
// Each status has a quiet colour, so a column or a chip is recognised before it is read.
const DOT: Record<Status, string> = { new: "bg-ink-400", design: "bg-yellow-500", review: "bg-blue-500", delivered: "bg-green-600", live: "bg-red-600", closed: "bg-ink-600" };

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
  return <span className={`size-2 shrink-0 rounded-full ${DOT[status]}`} aria-hidden />;
}

// A brief as a card: what, for whom, when. The whole card opens it.
function BriefCard({ b, onOpen, draggable }: { b: Brief; onOpen: () => void; draggable?: boolean }) {
  const late = isOverdue(b);
  const n = b.rows.filter((r) => r.placement || r.text).length;
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
      onClick={onOpen}
      className="w-full cursor-pointer rounded-xl border bg-card p-3 text-left shadow-xs transition hover:border-foreground/30 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="block font-medium leading-snug">{b.title || t.untitled}</span>
      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
        <Building2 className="size-3.5 shrink-0" aria-hidden /> {b.client || "-"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs whitespace-nowrap">
        <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${late ? "bg-red-600/10 font-medium text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
          {late ? <AlertTriangle className="size-3" aria-hidden /> : <CalendarDays className="size-3" aria-hidden />}
          {b.deadline || t.noDate}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">{t.banners(n)}</span>
        {b.example && <span className="text-muted-foreground/70">{t.example}</span>}
        <span className="flex-1" />
        {b.requester && (
          <span title={b.requester} className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {initials(b.requester)}
          </span>
        )}
      </div>
    </button>
  );
}

// The brief itself, as a page in a window: fields, banner rows, and the email that will be sent.
function BriefDialog({ initial, clients, onSave, onDelete, onClose, onMake }: { initial: Brief; clients: Client[]; onSave: (b: Brief) => void; onDelete: (id: string) => void; onClose: () => void; onMake: (typeId: string) => void }) {
  const [b, setB] = useState<Brief>(initial);
  const [touched, setTouched] = useState(false);
  const [sure, setSure] = useState(false);
  const [sendTo, setSendTo] = useState(() => {
    try {
      return localStorage.getItem(SEND_TO) ?? "";
    } catch {
      return "";
    }
  });
  const patch = (p: Partial<Brief>) => setB((x) => ({ ...x, ...p }));
  const row = (i: number, p: Partial<Brief["rows"][number]>) => patch({ rows: b.rows.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const lacking = missing(b);
  const bad = (k: (typeof lacking)[number]) => touched && lacking.includes(k);
  const known = clients.some((c) => c.name.trim().toLowerCase() === b.client.trim().toLowerCase());
  const mail = useMemo(() => briefEmail(b), [b]);
  const isNew = initial.title === "" && !initial.example && initial.rows.length === 1 && !initial.rows[0]!.placement;

  const copyEmail = () => {
    setTouched(true);
    if (!lacking.length) void copyText(`${mail.subject}\n\n${mail.body}`, t.copied);
  };
  const openEmail = () => {
    setTouched(true);
    if (lacking.length) return;
    try {
      localStorage.setItem(SEND_TO, sendTo);
    } catch {
      /* not remembered */
    }
    const href = mailtoHref(sendTo, mail.subject, mail.body);
    if (href.length > MAILTO_LIMIT) {
      void copyText(`${mail.subject}\n\n${mail.body}`, t.copied);
      toast.message(t.tooLong);
    } else location.href = href;
  };
  const save = () => {
    setTouched(true);
    if (!lacking.length) onSave({ ...b, example: false });
  };
  const fill = () => setB({ ...exampleBriefs()[0]!, id: b.id, example: false, status: "new", created: b.created });
  const formats = [...new Set(b.rows.map((r) => r.format))].filter((f) => bannerTypes.some((x) => x.id === f && x.ready));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{isNew ? t.dialogNew : t.dialogEdit}</DialogTitle>
          <DialogDescription>{t.dialogIntro}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.status}>
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={b.status === s ? "default" : "outline"} className="gap-2" aria-pressed={b.status === s} onClick={() => patch({ status: s })}>
              <StatusDot status={s} /> {t.statuses[s]}
            </Button>
          ))}
          {isNew && (
            <Button size="sm" variant="ghost" className="ml-auto gap-2" onClick={fill}>
              <Sparkles className="size-4" /> {t.fillExample}
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="b-title" label={t.fields.title} wide>
            <Input id="b-title" className="h-10 text-base" value={b.title} aria-invalid={bad("title")} placeholder={t.placeholders.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field id="b-client" label={t.fields.client} hint={b.client.trim() && !known ? t.newClientNote(b.client.trim()) : t.hints.client}>
            <Input id="b-client" list="b-clients" value={b.client} aria-invalid={bad("client")} placeholder={t.pickClient} onChange={(e) => patch({ client: e.target.value })} />
            <datalist id="b-clients">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field id="b-deadline" label={t.fields.deadline} hint={t.hints.deadline}>
            <Input id="b-deadline" type="date" value={b.deadline} aria-invalid={bad("deadline")} onChange={(e) => patch({ deadline: e.target.value })} />
          </Field>
          <Field id="b-requester" label={t.fields.requester}>
            <Input id="b-requester" value={b.requester} aria-invalid={bad("requester")} autoComplete="name" onChange={(e) => patch({ requester: e.target.value })} />
          </Field>
          <Field id="b-department" label={t.fields.department}>
            <Input id="b-department" value={b.department} placeholder={t.placeholders.department} onChange={(e) => patch({ department: e.target.value })} />
          </Field>
          <Field id="b-from" label={t.fields.runFrom}>
            <Input id="b-from" type="date" value={b.runFrom} onChange={(e) => patch({ runFrom: e.target.value })} />
          </Field>
          <Field id="b-to" label={t.fields.runTo}>
            <Input id="b-to" type="date" value={b.runTo} onChange={(e) => patch({ runTo: e.target.value })} />
          </Field>
        </div>

        <section aria-label={t.rowsTitle} className="space-y-3">
          <div>
            <h3 className="font-semibold">{t.rowsTitle}</h3>
            <p className={`text-sm ${bad("rows") ? "text-destructive" : "text-muted-foreground"}`}>{t.rowsHint}</p>
          </div>
          {b.rows.map((r, i) => (
            <div key={i} className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2">
              <Field id={`r-format-${i}`} label={t.row.format}>
                <select id={`r-format-${i}`} className={field} value={r.format} onChange={(e) => row(i, { format: e.target.value })}>
                  {bannerTypes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} ({x.size})
                    </option>
                  ))}
                  <option value="other">{t.row.other}</option>
                </select>
              </Field>
              <Field id={`r-place-${i}`} label={t.row.placement}>
                <Input id={`r-place-${i}`} value={r.placement} placeholder={t.placeholders.placement} onChange={(e) => row(i, { placement: e.target.value })} />
              </Field>
              <Field id={`r-text-${i}`} label={t.row.text}>
                <Textarea id={`r-text-${i}`} rows={2} value={r.text} onChange={(e) => row(i, { text: e.target.value })} />
              </Field>
              <Field id={`r-link-${i}`} label={t.row.link}>
                <Input id={`r-link-${i}`} type="url" value={r.link} placeholder="https://" onChange={(e) => row(i, { link: e.target.value })} />
              </Field>
              {b.rows.length > 1 && (
                <div className="sm:col-span-2">
                  <Button size="sm" variant="ghost" onClick={() => patch({ rows: b.rows.filter((_, j) => j !== i) })}>
                    {t.row.remove}
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => patch({ rows: [...b.rows, emptyRow()] })}>
            <Plus className="size-4" /> {t.row.add}
          </Button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="b-articles" label={t.fields.articles} hint={t.hints.articles}>
            <Textarea id="b-articles" rows={3} value={b.articles} spellCheck={false} onChange={(e) => patch({ articles: e.target.value })} />
          </Field>
          <Field id="b-materials" label={t.fields.materials} hint={t.hints.materials}>
            <Textarea id="b-materials" rows={3} value={b.materials} spellCheck={false} onChange={(e) => patch({ materials: e.target.value })} />
          </Field>
          <Field id="b-notes" label={t.fields.notes} wide>
            <Textarea id="b-notes" rows={2} value={b.notes} onChange={(e) => patch({ notes: e.target.value })} />
          </Field>
        </div>

        <section aria-label={t.emailTitle} className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <div>
            <h3 className="font-semibold">{t.emailTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.emailHint}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-sm">
            <p className="font-medium">{mail.subject}</p>
            <pre className="mt-2 max-h-52 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">{mail.body}</pre>
          </div>
          <Field id="b-sendto" label={t.fields.sendTo} hint={t.hints.sendTo}>
            <Input id="b-sendto" type="email" value={sendTo} placeholder="designer@ohtuleht.ee" onChange={(e) => setSendTo(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={copyEmail}>
              <Mail className="size-4" /> {t.copyEmail}
            </Button>
            <Button variant="outline" className="gap-2" onClick={openEmail}>
              <Mail className="size-4" /> {t.openEmail}
            </Button>
          </div>
        </section>

        {touched && lacking.length > 0 && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {t.missingIntro} {lacking.map((k) => t.missing[k]).join(", ")}.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button onClick={save}>{isNew ? t.save : t.update}</Button>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          {formats.map((f) => (
            <Button key={f} variant="outline" className="gap-2" onClick={() => onMake(f)}>
              <LayoutTemplate className="size-4" /> {t.make(bannerTypes.find((x) => x.id === f)?.name ?? f)}
            </Button>
          ))}
          <span className="flex-1" />
          {!isNew &&
            (sure ? (
              <Button variant="destructive" onClick={() => onDelete(b.id)}>
                {t.deleteSure}
              </Button>
            ) : (
              <Button variant="ghost" className="gap-2 text-destructive" onClick={() => setSure(true)}>
                <Trash2 className="size-4" /> {t.delete}
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
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

// Task tracker: briefs for banner jobs on a board (like Notion or Trello), as a table, and the client list.
export function TaskTracker({ onMake }: { onMake: (typeId: string) => void }) {
  const [list, setList] = useState<Brief[]>(loadBriefs);
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [view, setView] = useState<"board" | "table" | "clients">("board");
  const [open, setOpen] = useState<Brief | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const commit = (next: Brief[]) => {
    setList(next);
    saveBriefs(next);
  };
  const commitClients = (next: Client[]) => {
    setClients(next);
    saveClients(next);
  };
  // The shared list from the repository joins the person's own (once, when the page opens).
  useEffect(() => {
    void fetchSharedClients().then((shared) => shared.length && setClients((c) => mergeClients(c, shared)));
  }, []);

  const save = (b: Brief) => {
    const exists = list.some((x) => x.id === b.id);
    commit(exists ? list.map((x) => (x.id === b.id ? b : x)) : [b, ...list]);
    // A client typed for the first time joins the client list, so it is a choice next time.
    if (b.client.trim() && !clients.some((c) => c.name.trim().toLowerCase() === b.client.trim().toLowerCase())) commitClients(mergeClients(clients, [{ ...emptyClient(), name: b.client.trim() }]));
    setOpen(null);
    toast.success(t.saved);
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
            <Button className="gap-2" onClick={() => setOpen(newBrief())}>
              <Plus className="size-4" /> {t.newBrief}
            </Button>
          </>
        )}
      </div>

      {examples && view !== "clients" && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-sm">
          <Sparkles className="size-4 text-primary" aria-hidden /> {t.examplesNote}
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => commit(list.filter((b) => !b.example))}>
            {t.clearExamples}
          </Button>
        </p>
      )}

      {view === "board" && (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="grid min-w-max grid-flow-col auto-cols-[16.5rem] gap-3 xl:min-w-0 xl:auto-cols-fr">
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
                className={`flex min-h-48 flex-col gap-2 rounded-xl p-2 transition-colors ${over === s ? "bg-primary/10 ring-2 ring-primary/40" : "bg-muted/50"}`}
              >
                <h2 className="flex items-center gap-2 px-1 pt-1 text-sm font-semibold">
                  <StatusDot status={s} /> {t.statuses[s]} <span className="font-normal text-muted-foreground">{byStatus[s].length}</span>
                </h2>
                {byStatus[s].map((b) => (
                  <BriefCard key={b.id} b={b} draggable onOpen={() => setOpen(b)} />
                ))}
                {byStatus[s].length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">{t.emptyColumn}</p>}
              </section>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.dragHint}</p>
        </div>
      )}

      {view === "table" && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                {(["title", "client", "requester", "status", "deadline"] as const).map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-medium">
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
                    <td className="px-3 py-2">
                      <button type="button" className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none" onClick={() => setOpen(b)}>
                        {b.title || t.untitled}
                      </button>
                    </td>
                    <td className="px-3 py-2">{b.client}</td>
                    <td className="px-3 py-2">{b.requester}</td>
                    <td className="px-3 py-2">
                      <select aria-label={t.status} className={`${field} w-32`} value={b.status} onChange={(e) => move(b.id, e.target.value as Status)}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t.statuses[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`px-3 py-2 ${isOverdue(b) ? "font-medium text-destructive" : ""}`}>{b.deadline || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t.empty}</p>}
        </div>
      )}

      {view === "clients" && <Clients clients={clients} onChange={commitClients} />}

      {view !== "clients" && <p className="text-xs text-muted-foreground">{t.localNote}</p>}

      {open && <BriefDialog key={open.id} initial={open} clients={clients} onSave={save} onDelete={(id) => (commit(list.filter((b) => b.id !== id)), setOpen(null))} onClose={() => setOpen(null)} onMake={onMake} />}
    </div>
  );
}
