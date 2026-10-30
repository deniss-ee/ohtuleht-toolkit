import { useMemo, useState } from "react";
import { ArrowLeft, Link2 } from "lucide-react";
import { CopyField } from "@/components/editor/MarketingParts";
import { PageHeader } from "@/components/editor/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { utmTool as t } from "@/content";
import { copyText } from "@/lib/clipboard";
import { emptyUtm, MEDIUMS, tidy, utmMissing, withUtm, type Utm } from "@/lib/utm";

const KEY = "ol-utm";
const load = (): Utm => {
  try {
    return { ...emptyUtm(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return emptyUtm();
  }
};

// Tool: tracking links. Paste one or more addresses, fill the labels once, copy the links. The labels are remembered for the next campaign day.
export function UtmBuilder({ onBack }: { onBack: () => void }) {
  const [utm, setUtm] = useState<Utm>(load);
  const [text, setText] = useState("");
  const [normalise, setNormalise] = useState(true);
  const set = (p: Partial<Utm>) =>
    setUtm((u) => {
      const next = { ...u, ...p };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* not remembered */
      }
      return next;
    });

  const rows = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((line, i) => ({ n: i + 1, line: line.trim() }))
        .filter((r) => r.line)
        .map((r) => ({ ...r, result: withUtm(r.line, utm, normalise) })),
    [text, utm, normalise],
  );
  const good = rows.flatMap((r) => (r.result.ok ? [r.result.link] : []));
  const missing = utmMissing(utm);
  const preview = (v: string) => (normalise ? tidy(v) : v.trim());
  const fields: { id: keyof Utm; list?: boolean }[] = [{ id: "source" }, { id: "medium", list: true }, { id: "campaign" }, { id: "content" }, { id: "term" }];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> {t.back}
      </Button>
      <PageHeader icon={Link2} title={t.title} intro={t.intro} />

      <div className="space-y-2">
        <Label htmlFor="utm-links">{t.links}</Label>
        <Textarea id="utm-links" autoFocus rows={3} value={text} spellCheck={false} placeholder={t.placeholder} onChange={(e) => setText(e.target.value)} />
        {rows.flatMap((r) => (r.result.ok ? [] : [r])).map((r) => (
          <p key={r.n} role="alert" className="text-sm text-destructive">
            {t.badLine(r.n)}
          </p>
        ))}
      </div>

      <section aria-label={t.labels} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1">
            <Label htmlFor={`utm-${f.id}`}>
              {t.fields[f.id]} {f.id !== "content" && f.id !== "term" && <span className="text-muted-foreground">({t.required})</span>}
            </Label>
            <Input id={`utm-${f.id}`} list={f.list ? "utm-mediums" : undefined} value={utm[f.id]} placeholder={t.placeholders[f.id]} onChange={(e) => set({ [f.id]: e.target.value })} />
            <p className="text-xs text-muted-foreground">{t.hints[f.id]}</p>
          </div>
        ))}
        <datalist id="utm-mediums">
          {MEDIUMS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch id="utm-tidy" checked={normalise} onCheckedChange={setNormalise} />
          <Label htmlFor="utm-tidy">{t.tidy}</Label>
          {normalise && utm.campaign.trim() && preview(utm.campaign) !== utm.campaign.trim() && <span className="text-xs text-muted-foreground">{t.becomes(preview(utm.campaign))}</span>}
        </div>
      </section>

      {missing.length > 0 && good.length > 0 && (
        <p className="text-sm text-destructive" role="alert">
          {t.missing} {missing.map((k) => t.fields[k]).join(", ")}.
        </p>
      )}

      {good.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {good.map((link, i) => (
            <CopyField key={link} label={good.length > 1 ? t.linkN(i + 1) : t.result} value={link} />
          ))}
          {good.length > 1 && (
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => void copyText(good.join("\n"), t.copiedAll)}>
              {t.copyAll}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
