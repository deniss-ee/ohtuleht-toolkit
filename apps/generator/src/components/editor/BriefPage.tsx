import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CircleDashed, ClipboardList, Copy, Images, LayoutTemplate, Link2, Mail, Megaphone, Newspaper, PanelTop, Paperclip, Plus, Send, Shapes, Smartphone, Sparkles, Trash2, User, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { ClientCombobox } from "@/components/editor/ClientCombobox";
import { DatePicker, RangePicker } from "@/components/editor/DatePicker";
import { IconChip } from "@/components/editor/IconChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bannerTypes, tracker as t } from "@/content";
import type { Client } from "@/lib/clients";
import { copyRichText } from "@/lib/clipboard";
import { briefEmail, briefEmailHtml, emptyRow, exampleBriefs, MAILTO_LIMIT, mailtoHref, missing, STATUSES, type Brief, type Status } from "@/lib/tracker";

const SEND_TO = "ol-brief-to";
const FORMAT_ICONS: Record<string, LucideIcon> = { "header-bar": PanelTop, "articles-1250x400": Newspaper, "articles-mobile": Smartphone, "image-slider-1250x400": Images, "image-slider-600x500": Smartphone, other: Shapes };
export const STATUS_DOT: Record<Status, string> = { new: "bg-ink-400", design: "bg-yellow-500", review: "bg-blue-500", delivered: "bg-green-600", live: "bg-red-600", closed: "bg-ink-600" };

// One block of the page: a round icon, a title and a line of help, then the fields.
function Block({ icon, title, hint, children, error }: { icon: LucideIcon; title: string; hint: string; children: ReactNode; error?: boolean }) {
  return (
    <section aria-label={title} className={`rounded-2xl border bg-card p-5 shadow-xs ${error ? "border-destructive/50" : ""}`}>
      <div className="mb-4 flex items-start gap-3">
        <IconChip icon={icon} tone="red" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children, wide }: { id: string; label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// A new request (blank) or an existing task. Left: what to fill in, in plain blocks. Right: what is still missing and the email that will be sent.
export function BriefPage({ initial, isNew, clients, onSave, onBack, onDelete, onMake }: { initial: Brief; isNew: boolean; clients: Client[]; onSave: (b: Brief) => void; onBack: () => void; onDelete: (id: string) => void; onMake: (typeId: string) => void }) {
  const [b, setB] = useState<Brief>(initial);
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
  const mail = useMemo(() => briefEmail(b), [b]);
  const known = clients.some((c) => c.name.trim().toLowerCase() === b.client.trim().toLowerCase());
  const formats = [...new Set(b.rows.map((r) => r.format))].filter((f) => bannerTypes.some((x) => x.id === f && x.ready));
  const checks: { key: keyof typeof t.missing; done: boolean }[] = [
    { key: "title", done: !lacking.includes("title") },
    { key: "client", done: !lacking.includes("client") },
    { key: "requester", done: !lacking.includes("requester") },
    { key: "deadline", done: !lacking.includes("deadline") },
    { key: "rows", done: !lacking.includes("rows") },
  ];
  const ready = lacking.length === 0;

  const text = `${mail.subject}\n\n${mail.body}`;
  const save = () => ready && onSave({ ...b, example: false });
  const copyMail = () => copyRichText(briefEmailHtml(b), text, t.copied);
  const copyAndAdd = () => {
    if (!ready) return;
    void copyMail();
    onSave({ ...b, example: false });
  };
  const send = () => {
    if (!ready) return;
    try {
      localStorage.setItem(SEND_TO, sendTo);
    } catch {
      /* not remembered */
    }
    const href = mailtoHref(sendTo, mail.subject, mail.body);
    onSave({ ...b, example: false });
    if (href.length > MAILTO_LIMIT) {
      void copyMail();
      toast.message(t.tooLong);
    } else location.href = href;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t.backToBoard}
        </Button>
        <span className="flex-1" />
        {isNew && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setB({ ...exampleBriefs()[0]!, id: b.id, example: false, status: "new", created: b.created })}>
            <Sparkles className="size-4" /> {t.fillExample}
          </Button>
        )}
        {!isNew && (
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${STATUS_DOT[b.status]}`} aria-hidden />
            <label className="sr-only" htmlFor="b-status">
              {t.status}
            </label>
            <select id="b-status" value={b.status} onChange={(e) => patch({ status: e.target.value as Status })} className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.statuses[s]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{isNew ? t.requestTitle : t.dialogEdit}</h1>
        <p className="text-muted-foreground">{isNew ? t.requestIntro : t.dialogIntro}</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Block icon={Megaphone} title={t.secWhat} hint={t.secWhatHint}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="b-title" label={t.fields.title} wide>
                <Input id="b-title" className="h-11 text-base" autoFocus={isNew} value={b.title} placeholder={t.placeholders.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field id="b-client" label={t.fields.client} hint={b.client.trim() && !known ? t.newClientNote(b.client.trim()) : t.hints.client} wide>
                <ClientCombobox id="b-client" value={b.client} clients={clients} onChange={(client) => patch({ client })} />
              </Field>
            </div>
          </Block>

          <Block icon={User} title={t.secWho} hint={t.secWhoHint}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="b-requester" label={t.fields.requester}>
                <Input id="b-requester" autoComplete="name" value={b.requester} onChange={(e) => patch({ requester: e.target.value })} />
              </Field>
              <Field id="b-department" label={t.fields.department}>
                <Input id="b-department" value={b.department} placeholder={t.placeholders.department} onChange={(e) => patch({ department: e.target.value })} />
              </Field>
              <Field id="b-email" label={t.fields.email} wide>
                <Input id="b-email" type="email" autoComplete="email" value={b.email} onChange={(e) => patch({ email: e.target.value })} />
              </Field>
            </div>
          </Block>

          <Block icon={ClipboardList} title={t.secWhen} hint={t.secWhenHint}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="b-deadline" label={t.fields.deadline} hint={t.hints.deadline}>
                <DatePicker id="b-deadline" value={b.deadline} placeholder={t.pickDate} onChange={(deadline) => patch({ deadline })} />
              </Field>
              <Field id="b-runs" label={t.fields.runs} hint={t.hints.runs}>
                <RangePicker id="b-runs" from={b.runFrom} to={b.runTo} placeholder={t.pickDates} onChange={(runFrom, runTo) => patch({ runFrom, runTo })} />
              </Field>
            </div>
          </Block>

          <Block icon={LayoutTemplate} title={t.secBanners} hint={t.secBannersHint} error={false}>
            <div className="space-y-4">
              {b.rows.map((r, i) => (
                <div key={i} className="space-y-4 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{t.bannerN(i + 1)}</h3>
                    {b.rows.length > 1 && (
                      <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => patch({ rows: b.rows.filter((_, j) => j !== i) })}>
                        <X className="size-4" /> {t.row.remove}
                      </Button>
                    )}
                  </div>
                  <div role="radiogroup" aria-label={t.row.format} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[...bannerTypes.filter((x) => x.ready).map((x) => ({ id: x.id, name: x.name, size: x.size })), { id: "other", name: t.row.other, size: t.row.otherSize }].map((x) => {
                      const Icon = FORMAT_ICONS[x.id] ?? Shapes;
                      const on = r.format === x.id;
                      return (
                        <button
                          key={x.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => row(i, { format: x.id })}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${on ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:border-foreground/30"}`}
                        >
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{x.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{x.size}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={`r-place-${i}`} label={t.row.placement}>
                      <Input id={`r-place-${i}`} value={r.placement} placeholder={t.placeholders.placement} onChange={(e) => row(i, { placement: e.target.value })} />
                    </Field>
                    <Field id={`r-link-${i}`} label={t.row.link}>
                      <Input id={`r-link-${i}`} type="url" value={r.link} placeholder="https://" onChange={(e) => row(i, { link: e.target.value })} />
                    </Field>
                    <Field id={`r-text-${i}`} label={t.row.text} wide>
                      <Textarea id={`r-text-${i}`} rows={2} value={r.text} placeholder={t.placeholders.text} onChange={(e) => row(i, { text: e.target.value })} />
                    </Field>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="gap-2" onClick={() => patch({ rows: [...b.rows, { ...emptyRow(), format: b.rows.at(-1)?.format ?? emptyRow().format }] })}>
                <Plus className="size-4" /> {t.row.add}
              </Button>
            </div>
          </Block>

          <Block icon={Paperclip} title={t.secMaterials} hint={t.secMaterialsHint}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="b-articles" label={t.fields.articles} hint={t.hints.articles}>
                <Textarea id="b-articles" rows={3} value={b.articles} spellCheck={false} placeholder="https://www.ohtuleht.ee/…" onChange={(e) => patch({ articles: e.target.value })} />
              </Field>
              <Field id="b-materials" label={t.fields.materials} hint={t.hints.materials}>
                <Textarea id="b-materials" rows={3} value={b.materials} spellCheck={false} placeholder="https://www.figma.com/…" onChange={(e) => patch({ materials: e.target.value })} />
              </Field>
              <Field id="b-notes" label={t.fields.notes} wide>
                <Textarea id="b-notes" rows={2} value={b.notes} onChange={(e) => patch({ notes: e.target.value })} />
              </Field>
            </div>
          </Block>
        </div>

        <aside aria-label={t.summary} className="space-y-4 lg:sticky lg:top-4">
          <section className="rounded-2xl border bg-card p-5 shadow-xs">
            <h2 className="mb-3 font-semibold">{ready ? t.allSet : t.stillNeeded(lacking.length)}</h2>
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.key} className={`flex items-center gap-2 ${c.done ? "text-muted-foreground" : "font-medium"}`}>
                  {c.done ? <Check className="size-4 rounded-full bg-green-600 p-0.5 text-white" aria-hidden /> : <CircleDashed className="size-4 text-muted-foreground" aria-hidden />}
                  <span className={c.done ? "line-through decoration-muted-foreground/40" : ""}>{t.missing[c.key]}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="font-semibold">{t.emailTitle}</h2>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <p className="font-medium break-words">{mail.subject}</p>
              <pre className="mt-2 max-h-56 overflow-auto font-sans text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{mail.body}</pre>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="b-sendto">{t.fields.sendTo}</Label>
              <Input id="b-sendto" type="email" value={sendTo} placeholder="designer@ohtuleht.ee" onChange={(e) => setSendTo(e.target.value)} />
            </div>
            <div className="mt-4 grid gap-2">
              {isNew ? (
                <>
                  <Button className="h-10 gap-2" disabled={!ready} onClick={send}>
                    <Send className="size-4" /> {t.sendAndAdd}
                  </Button>
                  <Button variant="outline" className="gap-2" disabled={!ready} onClick={copyAndAdd}>
                    <Copy className="size-4" /> {t.copyAndAdd}
                  </Button>
                  <Button variant="ghost" className="gap-2" disabled={!ready} onClick={save}>
                    <Plus className="size-4" /> {t.addOnly}
                  </Button>
                </>
              ) : (
                <>
                  <Button className="h-10" disabled={!ready} onClick={save}>
                    {t.update}
                  </Button>
                  <Button variant="outline" className="gap-2" disabled={!ready} onClick={send}>
                    <Send className="size-4" /> {t.sendAgain}
                  </Button>
                </>
              )}
              {!isNew && (
                <Button variant="ghost" className="gap-2" disabled={!ready} onClick={() => void copyMail()}>
                  <Copy className="size-4" /> {t.copyEmail}
                </Button>
              )}
            </div>
          </section>

          {!isNew && (
            <section className="space-y-2 rounded-2xl border bg-card p-5 shadow-xs">
              {formats.map((f) => (
                <Button key={f} variant="outline" className="w-full justify-start gap-2" onClick={() => onMake(f)}>
                  <Link2 className="size-4" /> {t.make(bannerTypes.find((x) => x.id === f)?.name ?? f)}
                </Button>
              ))}
              {sure ? (
                <Button variant="destructive" className="w-full" onClick={() => onDelete(b.id)}>
                  {t.deleteSure}
                </Button>
              ) : (
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => setSure(true)}>
                  <Trash2 className="size-4" /> {t.delete}
                </Button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
