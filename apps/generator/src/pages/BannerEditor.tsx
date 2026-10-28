import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FlaskConical, ImagePlus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { ThemeColors } from "@ohtuleht/templates";
import { ArticleList } from "@/components/editor/ArticleList";
import { ColorField } from "@/components/editor/ColorField";
import { Preview } from "@/components/editor/Preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as t } from "@/content";
import { ThemeToggle } from "@/layout/AppShell";
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

// Closed by default: advanced settings stay out of the way for people who do not need them.
function Collapsible({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
        <div>
          <div className="font-medium leading-none">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
      </summary>
      <div className="space-y-4 border-t p-4">{children}</div>
    </details>
  );
}

function SwitchRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ColorSet({ title, colors, onChange }: { title: string; colors: ThemeColors; onChange: (c: ThemeColors) => void }) {
  const set = (key: keyof ThemeColors) => (hex: string) => onChange({ ...colors, [key]: hex });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ColorField label={t.colorBg} value={colors.bg} onChange={set("bg")} />
      <ColorField label={t.colorText} value={colors.text} onChange={set("text")} />
      <ColorField label={t.colorBadge} value={colors.badge} onChange={set("badge")} />
      <ColorField label={t.colorHover} value={colors.hover} onChange={set("hover")} />
      <ColorField label={t.colorHeader} value={colors.headerBg} onChange={set("headerBg")} />
    </div>
  );
}

const SPEEDS = [
  { label: t.speedFast, ms: 150 },
  { label: t.speedNormal, ms: 250 },
  { label: t.speedSlow, ms: 500 },
];
const nearestSpeed = (ms: number) => SPEEDS.reduce((best, s) => (Math.abs(s.ms - ms) < Math.abs(best.ms - ms) ? s : best)).ms;

// Full-screen editor: covers the menu so the preview can use the whole width.
export function BannerEditor({ draft, onChange, onBack }: { draft: Draft; onChange: (d: Draft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [pinned, setPinned] = useState(() => window.innerHeight >= 800 && window.innerWidth >= 1000);
  const fileInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const set = (patch: Partial<Draft["config"]>) => onChange({ ...draft, config: { ...c, ...patch } });
  const setBehavior = (patch: Partial<Draft["config"]["behavior"]>) => set({ behavior: { ...c.behavior, ...patch } });

  const issues = problems(draft);
  const weightKb = useMemo(() => (bytesOf(renderExport(draft)) + (c.header.type === "image" ? (draft.headerFile?.bytes.length ?? 0) : 0)) / 1024, [draft, c.header.type]);

  const onHeaderFile = async (file: File | undefined) => {
    if (!file) return;
    const headerFile = await fileToHeader(file);
    onChange({ ...draft, headerFile, config: { ...c, header: { type: "image", src: headerFile.name, href: c.header.href } } });
  };

  const loadExample = async () => {
    onChange(await exampleDraft());
    toast.success(t.exampleLoaded);
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
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{t.back}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{c.campaign.trim() || t.untitled}</div>
          <div className="text-xs text-muted-foreground">{t.heading} · 1250x400</div>
        </div>
        {issues.length === 0 ? (
          <Badge variant="secondary" className="hidden gap-1 sm:inline-flex">
            <CheckCircle2 className="size-3.5 text-green-600" /> {t.ready}
          </Badge>
        ) : (
          <Badge variant="outline" className="hidden gap-1 sm:inline-flex">
            <TriangleAlert className="size-3.5 text-amber-600" /> {t.toFix(issues.length)}
          </Badge>
        )}
        <Button variant="outline" size="sm" className="gap-2" onClick={loadExample}>
          <FlaskConical className="size-4" />
          <span className="hidden md:inline">{t.loadExample}</span>
        </Button>
        <ThemeToggle />
        <Button className="gap-2" disabled={issues.length > 0 || busy} onClick={download}>
          <Download className="size-4" /> {busy ? t.downloading : t.download}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1282px] px-4">
          <div className={pinned ? "sticky top-0 z-20 -mx-4 border-b bg-background px-4 py-3" : "py-3"}>
            <Preview draft={draft} pinned={pinned} onPin={setPinned} />
          </div>

          <div className="space-y-4 pb-24 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
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
              <Card className={issues.length ? "border-amber-500/50" : undefined}>
                <CardContent className="pt-6">
                  {issues.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="size-4 text-green-600" /> {t.ready}
                    </p>
                  ) : (
                    <>
                      <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                        <TriangleAlert className="size-4 text-amber-600" /> {t.todoTitle}
                      </p>
                      <ul className="list-disc space-y-0.5 pl-6 text-sm text-muted-foreground">
                        {issues.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Section title={t.campaignTitle}>
                <div className="space-y-1.5">
                  <Label htmlFor="campaign">{t.campaignName}</Label>
                  <Input id="campaign" value={c.campaign} onChange={(e) => set({ campaign: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.campaignHint}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="badge">{t.badge}</Label>
                  <Input id="badge" value={c.badge} onChange={(e) => set({ badge: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.badgeHint}</p>
                </div>
              </Section>

              <Section title={t.headerTitle} description={t.headerHint}>
                <Tabs value={c.header.type} onValueChange={(v) => set({ header: v === "image" ? { type: "image", src: draft.headerFile?.name ?? "", href: c.header.href } : { type: "color", href: c.header.href } })}>
                  <TabsList>
                    <TabsTrigger value="image">{t.headerImage}</TabsTrigger>
                    <TabsTrigger value="color">{t.headerColor}</TabsTrigger>
                  </TabsList>
                </Tabs>
                {c.header.type === "image" ? (
                  <div className="space-y-2">
                    <input ref={fileInput} type="file" className="sr-only" aria-label={t.headerFile} accept="image/png,image/webp,image/svg+xml,image/jpeg" onChange={(e) => onHeaderFile(e.target.files?.[0])} />
                    {draft.headerFile ? (
                      <img src={draft.headerFile.dataUrl} alt="" className="h-auto w-full rounded-md border" style={{ aspectRatio: "1248 / 46", objectFit: "contain" }} />
                    ) : (
                      <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{t.headerNone}</p>
                    )}
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()}>
                      <ImagePlus className="size-4" /> {draft.headerFile ? t.headerChange : t.headerChoose}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t.headerFileHint}</p>
                  </div>
                ) : (
                  <ColorField label={t.colorHeader} value={c.theme.light.headerBg} onChange={(hex) => set({ theme: { light: { ...c.theme.light, headerBg: hex }, dark: { ...c.theme.dark, headerBg: hex } } })} />
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="header-href">{t.headerLink}</Label>
                  <Input id="header-href" placeholder="https://" value={c.header.href} onChange={(e) => set({ header: { ...c.header, href: e.target.value } })} />
                  <p className="text-xs text-muted-foreground">{t.headerLinkHint}</p>
                </div>
              </Section>
            </div>

            <ArticleList articles={c.articles} defaultBadge={c.badge} defaultColor={c.theme.light.badge} onChange={(articles) => set({ articles })} />

            <h2 className="pt-2 text-sm font-semibold text-muted-foreground">{t.advanced}</h2>
            <Collapsible title={t.colorsTitle} description={t.colorsHint}>
              <div className="grid gap-6 sm:grid-cols-2">
                <ColorSet title={t.light} colors={c.theme.light} onChange={(light) => set({ theme: { ...c.theme, light } })} />
                <ColorSet title={t.dark} colors={c.theme.dark} onChange={(dark) => set({ theme: { ...c.theme, dark } })} />
              </div>
            </Collapsible>
            <Collapsible title={t.behaviorTitle} description={t.behaviorHint}>
              <SwitchRow id="shuffle" label={t.shuffle} checked={c.behavior.shuffle} onChange={(v) => setBehavior({ shuffle: v })} />
              <SwitchRow id="autoplay" label={t.autoplay} checked={c.behavior.autoplay} onChange={(v) => setBehavior({ autoplay: v })} />
              <SwitchRow id="loop" label={t.loop} checked={c.behavior.loop} onChange={(v) => setBehavior({ loop: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="delay">{t.delay}</Label>
                  <Input id="delay" type="number" min={1} step={0.5} value={c.behavior.delayMs / 1000} onChange={(e) => setBehavior({ delayMs: Math.max(500, Math.round((Number(e.target.value) || 2.5) * 1000)) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t.speed}</Label>
                  <div className="flex gap-2" role="group" aria-label={t.speed}>
                    {SPEEDS.map((s) => (
                      <Button key={s.ms} variant={nearestSpeed(c.behavior.speedMs) === s.ms ? "default" : "outline"} size="sm" aria-pressed={nearestSpeed(c.behavior.speedMs) === s.ms} onClick={() => setBehavior({ speedMs: s.ms })}>
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
