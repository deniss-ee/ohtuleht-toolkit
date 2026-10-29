import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FileArchive, FlaskConical, ImagePlus, Megaphone, Palette, PanelTop, SlidersHorizontal, TriangleAlert, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { resolveTheme } from "@ohtuleht/templates";
import type { ArticlesBannerConfig, ThemeColors } from "@ohtuleht/templates";
import { ArticleList } from "@/components/editor/ArticleList";
import { BookmarkletDialog } from "@/components/editor/BookmarkletHelp";
import { AutoColorField, ColorField } from "@/components/editor/ColorField";
import { HeaderThumb } from "@/components/editor/HeaderThumb";
import { goTo, HoverPill } from "@/components/editor/HoverPill";
import { IconChip, type Tone } from "@/components/editor/IconChip";
import { Preview } from "@/components/editor/Preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { editor as t } from "@/content";
import { ThemeToggle } from "@/layout/AppShell";
import { bytesOf, exampleDraft, problems, renderExport, type Draft } from "@/lib/banner";
import { downloadZip, fileToHeader } from "@/lib/zip";

const BUDGET_KB = 100;

function Section({ title, description, icon, tone, children }: { title: string; description?: string; icon: LucideIcon; tone: Tone; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconChip icon={icon} tone={tone} />
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// Closed by default: advanced settings stay out of the way for people who do not need them.
function Collapsible({ title, description, icon, tone, children }: { title: string; description: string; icon: LucideIcon; tone: Tone; children: ReactNode }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <IconChip icon={icon} tone={tone} />
        <div className="flex-1">
          <div className="font-medium leading-none">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
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

function ColorSet({ title, mode, config, onChange }: { title: string; mode: "light" | "dark"; config: ArticlesBannerConfig; onChange: (c: ThemeColors) => void }) {
  const colors = config.theme[mode];
  const resolved = resolveTheme(config, mode);
  const set = (key: keyof ThemeColors) => (hex: string) => onChange({ ...colors, [key]: hex });
  const reset = (key: "badge" | "headerBg" | "headerText") => () => {
    const next = { ...colors };
    delete next[key];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ColorField label={t.colorBg} value={colors.bg} onChange={set("bg")} />
      <ColorField label={t.colorText} value={colors.text} onChange={set("text")} />
      <ColorField label={t.colorHover} value={colors.hover} onChange={set("hover")} />
      <AutoColorField label={t.colorBadge} value={resolved.badge} custom={colors.badge !== undefined} onChange={set("badge")} onReset={reset("badge")} />
      <AutoColorField label={t.colorHeader} value={resolved.headerBg} custom={colors.headerBg !== undefined} onChange={set("headerBg")} onReset={reset("headerBg")} />
      <AutoColorField label={t.colorHeaderText} value={resolved.headerText} custom={colors.headerText !== undefined} onChange={set("headerText")} onReset={reset("headerText")} />
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
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [pinned, setPinned] = useState(() => window.innerHeight >= 800 && window.innerWidth >= 1000);
  const fileInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const set = (patch: Partial<Draft["config"]>) => onChange({ ...draft, config: { ...c, ...patch } });
  const setBehavior = (patch: Partial<Draft["config"]["behavior"]>) => set({ behavior: { ...c.behavior, ...patch } });

  const issues = problems(draft);
  const weightKb = useMemo(() => (bytesOf(renderExport(draft)) + (c.header.type === "image" ? (draft.headerFile?.bytes.length ?? 0) : 0)) / 1024, [draft, c.header.type]);

  const onHeaderFile = async (file: File | undefined) => {
    if (!file) return;
    const { headerFile, avg } = await fileToHeader(file);
    onChange({ ...draft, headerFile, config: { ...c, header: { type: "image", src: headerFile.name, href: c.header.href, avg } } });
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
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b px-3 py-2 lg:h-14 lg:flex-nowrap lg:gap-3 lg:px-4 lg:py-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{t.back}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{c.campaign.trim() || t.untitled}</div>
          <div className="text-xs text-muted-foreground">{t.heading} · 1250x400</div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:gap-3">
        <HoverPill
          tone="plain"
          icon={<FileArchive className="size-3.5" />}
          label={`${weightKb.toFixed(1)} KB`}
        >
          {() => (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm font-medium">
                <span>{t.weight}</span>
                <span className="font-mono">{weightKb.toFixed(1)} / {BUDGET_KB} KB</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(weightKb)} aria-valuemax={BUDGET_KB} aria-label={t.weight}>
                <div className={weightKb > BUDGET_KB ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, (weightKb / BUDGET_KB) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{t.sizeHelp}</p>
            </div>
          )}
        </HoverPill>
        <HoverPill
          tone={issues.length === 0 ? "ok" : "warn"}
          icon={issues.length === 0 ? <CheckCircle2 className="size-3.5 text-green-600" /> : <TriangleAlert className="size-3.5 text-yellow-600" />}
          label={
            <>
              <span className="hidden sm:inline">{issues.length === 0 ? t.ready : t.toFix(issues.length)}</span>
              <span className="sm:hidden">{issues.length === 0 ? "" : issues.length}</span>
            </>
          }
        >
          {(close) =>
            issues.length === 0 ? (
              <p className="text-sm">{t.allGood}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t.toFixTitle}</p>
                <p className="text-xs text-muted-foreground">{t.toFixHelp}</p>
                <ul className="space-y-1">
                  {issues.map((p) => (
                    <li key={p.field + p.message}>
                      <button
                        type="button"
                        className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          close();
                          goTo(p.field);
                        }}
                      >
                        {p.message}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
        </HoverPill>
        <Button variant="outline" size="sm" className="gap-2" onClick={loadExample}>
          <FlaskConical className="size-4" />
          <span className="hidden md:inline">{t.loadExample}</span>
        </Button>
        <ThemeToggle />
        <Button className="ml-auto gap-2 sm:ml-0" disabled={issues.length > 0 || busy} onClick={download}>
          <Download className="size-4" /> {busy ? t.downloading : (<>Download<span className="hidden sm:inline"> zip</span></>)}
        </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1282px] px-4">
          <div className={pinned ? "sticky top-0 z-20 -mx-4 border-b bg-background px-4 py-3" : "py-3"}>
            <Preview draft={draft} pinned={pinned} onPin={setPinned} onAddArticles={() => goTo("paste")} onTryExample={loadExample} onOpenBookmark={() => setBookmarkOpen(true)} />
          </div>

          <div className="space-y-4 pb-24 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Section title={t.campaignTitle} icon={Megaphone} tone="red">
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
                <div className="space-y-1.5">
                  <ColorField label={t.mainColor} value={c.primary} onChange={(primary) => set({ primary })} />
                  <p className="text-xs text-muted-foreground">{t.mainColorHint}</p>
                </div>
              </Section>

              <Section title={t.headerTitle} description={t.headerHint} icon={PanelTop} tone="ink">
                <HeaderThumb draft={draft} />
                <Tabs value={c.header.type} onValueChange={(v) => set({ header: v === "image" ? { type: "image", src: draft.headerFile?.name ?? "", href: c.header.href, avg: draft.headerFile?.avg, textInPicture: c.header.textInPicture } : { type: "color", href: c.header.href, textInPicture: c.header.textInPicture } })}>
                  <TabsList>
                    <TabsTrigger value="image">{t.headerImage}</TabsTrigger>
                    <TabsTrigger value="color">{t.headerColor}</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="min-h-[7rem]">
                {c.header.type === "image" ? (
                  <div className="space-y-2">
                    <input ref={fileInput} type="file" className="sr-only" aria-label={t.headerFile} accept="image/png,image/webp,image/svg+xml,image/jpeg" onChange={(e) => onHeaderFile(e.target.files?.[0])} />
                    <Button id="header-choose" variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()}>
                      <ImagePlus className="size-4" /> {draft.headerFile ? t.headerChange : t.headerChoose}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {draft.headerFile ? "" : `${t.headerNone} `}
                      {t.headerFileHint}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t.headerUsesMain}</p>
                )}
                </div>
                {c.header.type === "image" && c.header.textInPicture !== undefined && (
                  <div className="flex items-start gap-3">
                    <Checkbox id="header-text-in-picture" className="mt-0.5" checked={c.header.textInPicture} onCheckedChange={(v) => set({ header: { ...c.header, textInPicture: v === true } })} />
                    <div className="space-y-0.5">
                      <Label htmlFor="header-text-in-picture">{t.headerTextInPicture}</Label>
                      <p className="text-xs text-muted-foreground">{t.headerTextInPictureHint}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="header-href">{t.headerLink}</Label>
                  <Input id="header-href" placeholder="https://" value={c.header.href} onChange={(e) => set({ header: { ...c.header, href: e.target.value } })} />
                  <p className="text-xs text-muted-foreground">{t.headerLinkHint}</p>
                </div>
              </Section>
            </div>

            <ArticleList articles={c.articles} defaultBadge={c.badge} defaultColor={resolveTheme(c, "light").badge} onChange={(articles) => set({ articles })} onOpenBookmark={() => setBookmarkOpen(true)} />

            <BookmarkletDialog open={bookmarkOpen} onOpenChange={setBookmarkOpen} />

            <h2 className="pt-2 text-sm font-semibold text-muted-foreground">{t.advanced}</h2>
            <Collapsible title={t.colorsTitle} description={t.colorsHint} icon={Palette} tone="yellow">
              <div className="grid gap-6 sm:grid-cols-2">
                <ColorSet title={t.light} mode="light" config={c} onChange={(light) => set({ theme: { ...c.theme, light } })} />
                <ColorSet title={t.dark} mode="dark" config={c} onChange={(dark) => set({ theme: { ...c.theme, dark } })} />
              </div>
            </Collapsible>
            <Collapsible title={t.behaviorTitle} description={t.behaviorHint} icon={SlidersHorizontal} tone="ink">
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
