import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, LayoutTemplate, ListChecks, Mail, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/editor/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { bannerTypes, tracker as t } from "@/content";
import { copyText } from "@/lib/clipboard";
import { briefEmail, isOverdue, loadBriefs, MAILTO_LIMIT, mailtoHref, missing, newBrief, emptyRow, parseBackup, saveBriefs, STATUSES, type Brief, type Status } from "@/lib/tracker";

const SEND_TO = "ol-brief-to";
const select = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// The first version of the task tracker: briefs for banner jobs, kept in this browser. A brief also becomes one clear email text.
export function TaskTracker({ onMake }: { onMake: (typeId: string) => void }) {
  const [list, setList] = useState<Brief[]>(loadBriefs);
  const [draft, setDraft] = useState<Brief>(newBrief);
  const [tab, setTab] = useState("list");
  const [sendTo, setSendTo] = useState(() => {
    try {
      return localStorage.getItem(SEND_TO) ?? "";
    } catch {
      return "";
    }
  });
  const [touched, setTouched] = useState(false); // required fields are only shouted about after the first try
  const [sure, setSure] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const commit = (next: Brief[]) => {
    setList(next);
    saveBriefs(next);
  };
  const patch = (p: Partial<Brief>) => setDraft((d) => ({ ...d, ...p }));
  const row = (i: number, p: Partial<Brief["rows"][number]>) => patch({ rows: draft.rows.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const lacking = missing(draft);
  const exists = list.some((b) => b.id === draft.id);

  const save = () => {
    setTouched(true);
    if (lacking.length) return;
    commit(exists ? list.map((b) => (b.id === draft.id ? draft : b)) : [draft, ...list]);
    toast.success(t.saved);
    setDraft(newBrief());
    setTouched(false);
    setTab("list");
  };
  const mail = (b: Brief) => briefEmail(b);
  const copyEmail = (b: Brief) => {
    const m = mail(b);
    void copyText(`${m.subject}\n\n${m.body}`, t.copied);
  };
  const openEmail = () => {
    setTouched(true);
    if (lacking.length) return;
    try {
      localStorage.setItem(SEND_TO, sendTo);
    } catch {
      /* not remembered */
    }
    const m = mail(draft);
    const href = mailtoHref(sendTo, m.subject, m.body);
    if (href.length > MAILTO_LIMIT) {
      copyEmail(draft);
      toast.message(t.tooLong);
      return;
    }
    location.href = href;
  };
  const edit = (b: Brief) => {
    setDraft(b);
    setTouched(false);
    setTab("new");
    window.scrollTo(0, 0);
  };
  const fresh = () => {
    setDraft(newBrief());
    setTouched(false);
  };
  const exportAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(list, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `briefs-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };
  const importAll = async (f: File) => {
    const got = parseBackup(await f.text());
    if (!got) return void toast.error(t.importFailed);
    const ids = new Set(list.map((b) => b.id));
    commit([...got.filter((b) => !ids.has(b.id)), ...list]);
    toast.success(t.imported(got.length));
  };

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, list.filter((b) => b.status === s).length])) as Record<Status, number>, [list]);
  const [filter, setFilter] = useState<Status | "open">("open");
  const shown = list.filter((b) => (filter === "open" ? b.status !== "closed" && b.status !== "delivered" && b.status !== "live" : b.status === filter)).sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9"));
  const bad = (k: (typeof lacking)[number]) => touched && lacking.includes(k);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={ListChecks} title={t.title} intro={t.intro} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <ListChecks className="size-4" /> {t.tabList} <Badge variant="secondary">{list.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Plus className="size-4" /> {exists ? t.tabEdit : t.tabNew}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 pt-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.filter}>
            <Button size="sm" variant={filter === "open" ? "default" : "outline"} onClick={() => setFilter("open")}>
              {t.openOnes}
            </Button>
            {STATUSES.map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
                {t.statuses[s]} <span className="opacity-70">{counts[s]}</span>
              </Button>
            ))}
            <span className="flex-1" />
            <Button size="sm" variant="ghost" className="gap-2" disabled={!list.length} onClick={exportAll}>
              <Download className="size-4" /> {t.export}
            </Button>
            <Button size="sm" variant="ghost" className="gap-2" onClick={() => file.current?.click()}>
              <Upload className="size-4" /> {t.import}
            </Button>
            <input ref={file} type="file" accept=".json,application/json" className="sr-only" aria-label={t.import} onChange={(e) => (e.target.files?.[0] && void importAll(e.target.files[0]), (e.target.value = ""))} />
          </div>

          {shown.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">{list.length ? t.noneHere : t.empty}</p>
              <p className="mb-4 text-sm text-muted-foreground">{list.length ? t.noneHereHint : t.emptyHint}</p>
              <Button className="gap-2" onClick={() => setTab("new")}>
                <Plus className="size-4" /> {t.tabNew}
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((b) => (
                <li key={b.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{b.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {[b.client, b.requester, b.department].filter(Boolean).join(" · ")}
                        {" · "}
                        {t.banners(b.rows.filter((r) => r.placement || r.text).length)}
                      </p>
                      <p className={`mt-1 flex items-center gap-1 text-sm ${isOverdue(b) ? "font-medium text-destructive" : ""}`}>
                        {isOverdue(b) && <AlertTriangle className="size-4" aria-hidden />}
                        {t.due}: {b.deadline || "-"}
                        {isOverdue(b) && ` (${t.overdue})`}
                      </p>
                    </div>
                    <div className="w-36">
                      <select aria-label={t.status} className={select} value={b.status} onChange={(e) => commit(list.map((x) => (x.id === b.id ? { ...x, status: e.target.value as Status } : x)))}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t.statuses[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => edit(b)}>
                      <Pencil className="size-4" /> {t.edit}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => copyEmail(b)}>
                      <Mail className="size-4" /> {t.copyEmail}
                    </Button>
                    {[...new Set(b.rows.map((r) => r.format))].flatMap((f) => (bannerTypes.some((x) => x.id === f && x.ready) ? [f] : [])).map((f) => (
                      <Button key={f} size="sm" variant="outline" className="gap-2" onClick={() => onMake(f)}>
                        <LayoutTemplate className="size-4" /> {t.make(bannerTypes.find((x) => x.id === f)?.name ?? f)}
                      </Button>
                    ))}
                    {sure === b.id ? (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => (commit(list.filter((x) => x.id !== b.id)), setSure(null))}>
                          {t.deleteSure}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSure(null)}>
                          {t.cancel}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="gap-2" onClick={() => setSure(b.id)}>
                        <Trash2 className="size-4" /> {t.delete}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{t.localNote}</p>
        </TabsContent>

        <TabsContent value="new" className="space-y-6 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="b-title" label={t.fields.title}>
              <Input id="b-title" value={draft.title} aria-invalid={bad("title")} placeholder={t.placeholders.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field id="b-client" label={t.fields.client}>
              <Input id="b-client" value={draft.client} aria-invalid={bad("client")} onChange={(e) => patch({ client: e.target.value })} />
            </Field>
            <Field id="b-requester" label={t.fields.requester}>
              <Input id="b-requester" value={draft.requester} aria-invalid={bad("requester")} autoComplete="name" onChange={(e) => patch({ requester: e.target.value })} />
            </Field>
            <Field id="b-department" label={t.fields.department}>
              <Input id="b-department" value={draft.department} placeholder={t.placeholders.department} onChange={(e) => patch({ department: e.target.value })} />
            </Field>
            <Field id="b-email" label={t.fields.email}>
              <Input id="b-email" type="email" value={draft.email} autoComplete="email" onChange={(e) => patch({ email: e.target.value })} />
            </Field>
            <Field id="b-deadline" label={t.fields.deadline} hint={t.hints.deadline}>
              <Input id="b-deadline" type="date" value={draft.deadline} aria-invalid={bad("deadline")} onChange={(e) => patch({ deadline: e.target.value })} />
            </Field>
            <Field id="b-from" label={t.fields.runFrom}>
              <Input id="b-from" type="date" value={draft.runFrom} onChange={(e) => patch({ runFrom: e.target.value })} />
            </Field>
            <Field id="b-to" label={t.fields.runTo}>
              <Input id="b-to" type="date" value={draft.runTo} onChange={(e) => patch({ runTo: e.target.value })} />
            </Field>
          </div>

          <section aria-label={t.rowsTitle} className="space-y-3">
            <div>
              <h2 className="font-semibold">{t.rowsTitle}</h2>
              <p className={`text-sm ${bad("rows") ? "text-destructive" : "text-muted-foreground"}`}>{t.rowsHint}</p>
            </div>
            {draft.rows.map((r, i) => (
              <div key={i} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <Field id={`r-format-${i}`} label={t.row.format}>
                  <select id={`r-format-${i}`} className={select} value={r.format} onChange={(e) => row(i, { format: e.target.value })}>
                    {bannerTypes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.size})
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
                {draft.rows.length > 1 && (
                  <div className="sm:col-span-2">
                    <Button size="sm" variant="ghost" className="gap-2" onClick={() => patch({ rows: draft.rows.filter((_, j) => j !== i) })}>
                      <X className="size-4" /> {t.row.remove}
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => patch({ rows: [...draft.rows, emptyRow()] })}>
              <Plus className="size-4" /> {t.row.add}
            </Button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="b-articles" label={t.fields.articles} hint={t.hints.articles}>
              <Textarea id="b-articles" rows={3} value={draft.articles} spellCheck={false} onChange={(e) => patch({ articles: e.target.value })} />
            </Field>
            <Field id="b-materials" label={t.fields.materials} hint={t.hints.materials}>
              <Textarea id="b-materials" rows={3} value={draft.materials} spellCheck={false} onChange={(e) => patch({ materials: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="b-notes" label={t.fields.notes}>
                <Textarea id="b-notes" rows={3} value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} />
              </Field>
            </div>
          </div>

          {touched && lacking.length > 0 && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {t.missingIntro} {lacking.map((k) => t.missing[k]).join(", ")}.
            </p>
          )}

          <section aria-label={t.emailTitle} className="space-y-3 rounded-xl border border-dashed bg-muted/50 p-4">
            <h2 className="font-semibold">{t.emailTitle}</h2>
            <Field id="b-sendto" label={t.fields.sendTo} hint={t.hints.sendTo}>
              <Input id="b-sendto" type="email" value={sendTo} placeholder="designer@ohtuleht.ee" onChange={(e) => setSendTo(e.target.value)} />
            </Field>
            <pre className="max-h-56 overflow-auto rounded-lg border bg-card p-3 font-mono text-xs whitespace-pre-wrap">{`${mail(draft).subject}\n\n${mail(draft).body}`}</pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={() => (setTouched(true), !lacking.length && copyEmail(draft))}>
                <Mail className="size-4" /> {t.copyEmail}
              </Button>
              <Button variant="outline" className="gap-2" onClick={openEmail}>
                <Mail className="size-4" /> {t.openEmail}
              </Button>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={save}>
              <Save className="size-4" /> {exists ? t.update : t.save}
            </Button>
            {(exists || draft.title) && (
              <Button variant="ghost" onClick={fresh}>
                {t.startOver}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
