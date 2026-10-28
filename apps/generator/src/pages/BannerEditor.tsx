import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Download, FlaskConical } from "lucide-react";
import type { ThemeColors } from "@ohtuleht/templates";
import { ArticleList } from "@/components/editor/ArticleList";
import { ColorField } from "@/components/editor/ColorField";
import { Preview } from "@/components/editor/Preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { editor as t } from "@/content";
import { bytesOf, exampleDraft, problems, renderExport, type Draft } from "@/lib/banner";
import { downloadZip, fileToHeader } from "@/lib/zip";

const BUDGET_KB = 100;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SwitchRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ColorSet({ title, colors, onChange }: { title: string; colors: ThemeColors; onChange: (c: ThemeColors) => void }) {
  const set = (key: keyof ThemeColors) => (hex: string) => onChange({ ...colors, [key]: hex });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <ColorField label={t.colorBg} value={colors.bg} onChange={set("bg")} />
      <ColorField label={t.colorText} value={colors.text} onChange={set("text")} />
      <ColorField label={t.colorBadge} value={colors.badge} onChange={set("badge")} />
      <ColorField label={t.colorHover} value={colors.hover} onChange={set("hover")} />
      <ColorField label={t.colorHeader} value={colors.headerBg} onChange={set("headerBg")} />
    </div>
  );
}

export function BannerEditor({ draft, onChange, onBack }: { draft: Draft; onChange: (d: Draft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const c = draft.config;
  const set = (patch: Partial<Draft["config"]>) => onChange({ ...draft, config: { ...c, ...patch } });

  const issues = problems(draft);
  const weightKb = useMemo(() => (bytesOf(renderExport(draft)) + (c.header.type === "image" ? (draft.headerFile?.bytes.length ?? 0) : 0)) / 1024, [draft, c.header.type]);

  const onHeaderFile = async (file: File | undefined) => {
    if (!file) return;
    const headerFile = await fileToHeader(file);
    onChange({ ...draft, headerFile, config: { ...c, header: { type: "image", src: headerFile.name, href: c.header.href } } });
  };

  const download = async () => {
    setBusy(true);
    try {
      await downloadZip(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
            <ArrowLeft className="size-4" /> {t.back}
          </Button>
          <h1 className="text-xl font-semibold">{t.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onChange(exampleDraft())}>
            <FlaskConical className="size-4" /> {t.loadExample}
          </Button>
          <Button size="sm" className="gap-2" disabled={issues.length > 0 || busy} onClick={download}>
            <Download className="size-4" /> {busy ? t.downloading : t.download}
          </Button>
        </div>
      </div>

      <Preview draft={draft} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <Card>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{t.weight}</span>
              <span className="font-mono text-sm">
                {weightKb.toFixed(1)} KB / {BUDGET_KB} KB
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(weightKb)} aria-valuemax={BUDGET_KB} aria-label={t.weight}>
              <div className={weightKb > BUDGET_KB ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, (weightKb / BUDGET_KB) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{t.weightHint}</p>
          </CardContent>
        </Card>
        {issues.length > 0 && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="mb-1 text-sm font-medium">{t.problemsTitle}</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {issues.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Section title={t.campaignCard}>
            <div className="space-y-1.5">
              <Label htmlFor="campaign">{t.campaignName}</Label>
              <Input id="campaign" value={c.campaign} onChange={(e) => set({ campaign: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="badge">{t.badge}</Label>
              <Input id="badge" value={c.badge} onChange={(e) => set({ badge: e.target.value })} />
              <p className="text-xs text-muted-foreground">{t.badgeHint}</p>
            </div>
          </Section>

          <Section title={t.headerCard}>
            <div className="space-y-1.5">
              <Label htmlFor="header-type">{t.headerType}</Label>
              <Select value={c.header.type} onValueChange={(v) => set({ header: v === "image" ? { type: "image", src: draft.headerFile?.name ?? "", href: c.header.href } : { type: "color", href: c.header.href } })}>
                <SelectTrigger id="header-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">{t.headerImage}</SelectItem>
                  <SelectItem value="color">{t.headerColor}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {c.header.type === "image" && (
              <div className="space-y-1.5">
                <Label htmlFor="header-file">{t.headerFile}</Label>
                <Input id="header-file" type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" onChange={(e) => onHeaderFile(e.target.files?.[0])} />
                <p className="text-xs text-muted-foreground">{draft.headerFile ? draft.headerFile.name : t.headerNone}. {t.headerFileHint}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="header-href">{t.headerLink}</Label>
              <Input id="header-href" placeholder="https://" value={c.header.href} onChange={(e) => set({ header: { ...c.header, href: e.target.value } })} />
            </div>
          </Section>

          <Section title={t.behaviorCard}>
            <SwitchRow id="shuffle" label={t.shuffle} checked={c.behavior.shuffle} onChange={(v) => set({ behavior: { ...c.behavior, shuffle: v } })} />
            <SwitchRow id="autoplay" label={t.autoplay} checked={c.behavior.autoplay} onChange={(v) => set({ behavior: { ...c.behavior, autoplay: v } })} />
            <SwitchRow id="loop" label={t.loop} checked={c.behavior.loop} onChange={(v) => set({ behavior: { ...c.behavior, loop: v } })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="delay">{t.delay}</Label>
                <Input id="delay" type="number" min={500} step={100} value={c.behavior.delayMs} onChange={(e) => set({ behavior: { ...c.behavior, delayMs: Number(e.target.value) || 2500 } })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="speed">{t.speed}</Label>
                <Input id="speed" type="number" min={0} step={50} value={c.behavior.speedMs} onChange={(e) => set({ behavior: { ...c.behavior, speedMs: Number(e.target.value) || 0 } })} />
              </div>
            </div>
          </Section>

          <Section title={t.colorsCard}>
            <div className="grid gap-6 sm:grid-cols-2">
              <ColorSet title={t.light} colors={c.theme.light} onChange={(light) => set({ theme: { ...c.theme, light } })} />
              <ColorSet title={t.dark} colors={c.theme.dark} onChange={(dark) => set({ theme: { ...c.theme, dark } })} />
            </div>
          </Section>
        </div>

        <ArticleList articles={c.articles} onChange={(articles) => set({ articles })} />
      </div>
    </div>
  );
}

