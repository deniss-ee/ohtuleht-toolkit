import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Download, FileArchive, FlaskConical, ImagePlus, Images, LayoutDashboard, Pin, PinOff, SlidersHorizontal, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, Section, SwitchRow } from "@/components/editor/FormParts";
import { goTo, HoverPill } from "@/components/editor/HoverPill";
import { SwapFrame } from "@/components/editor/SwapFrame";
import { useSaveShortcut } from "@/components/editor/useSaveShortcut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as e, sliderEditor as t, ui } from "@/content";
import { Toggles } from "@/layout/AppShell";
import { formatSize } from "@/lib/format";
import type { Optimised } from "@/lib/optimise";
import { downloadSliderZip, exampleSliderDraft, fileToSliderPicture, renderSliderPreview, sliderProblems, sliderWeightKb, tidy, type SliderDraft } from "@/lib/slider";

const BUDGET_KB = 100;
const W = 1250;
const H = 400;

const SPEEDS = [
  { label: e.speedFast, ms: 250 },
  { label: e.speedNormal, ms: 500 },
  { label: e.speedSlow, ms: 900 },
];
const nearestSpeed = (ms: number) => SPEEDS.reduce((best, s) => (Math.abs(s.ms - ms) < Math.abs(best.ms - ms) ? s : best)).ms;

// Number box for a size in pixels.
function Num({ id, label, value, min, onChange }: { id: string; label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={min} value={value} onChange={(ev) => onChange(Math.max(min, Math.round(Number(ev.target.value) || 0)))} />
    </div>
  );
}

// The banner at full size when the screen allows, otherwise scaled to fit; does not flicker while editing.
function SliderPreview({ draft, pinned, onPin, onTryExample }: { draft: SliderDraft; pinned: boolean; onPin: (v: boolean) => void; onTryExample: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(W);
  const empty = !draft.config.background.src && draft.config.slides.length === 0;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1, boxW / W);
  const pct = Math.round(scale * 100);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{e.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{pct < 100 ? e.previewScaled(pct, "1250x400") : e.previewFull("1250x400")}</span>}
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-pressed={pinned} onClick={() => onPin(!pinned)}>
          {pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
          {e.pin}
        </Button>
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden"} style={{ height: empty ? 240 : H * scale }}>
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
            <div>
              <h2 className="text-lg font-semibold">{t.emptyTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.emptyText}</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={onTryExample}>
              <FlaskConical className="size-4" /> {e.emptyTryExample}
            </Button>
          </div>
        ) : (
          <SwapFrame build={(id) => renderSliderPreview(draft, id)} deps={[draft]} width={W} height={H} scaleFor={(w) => Math.min(1, boxW / w)} title={ui.bannerPreview} />
        )}
      </div>
    </div>
  );
}

// Small picture in a list row.
function Thumb({ src }: { src?: string }) {
  return <div className="aspect-[6/5] h-12 shrink-0 overflow-hidden rounded bg-muted">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</div>;
}

// Full-screen editor for the image slider.
export function SliderEditor({ draft, onChange, onBack }: { draft: SliderDraft; onChange: (d: SliderDraft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [pinned, setPinned] = useState(false);
  const bgInput = useRef<HTMLInputElement>(null);
  const slideInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const set = (patch: Partial<SliderDraft["config"]>) => onChange(tidy({ ...draft, config: { ...c, ...patch } }));
  const setLayout = (patch: Partial<SliderDraft["config"]["layout"]>) => set({ layout: { ...c.layout, ...patch } });
  const setBehavior = (patch: Partial<SliderDraft["config"]["behavior"]>) => set({ behavior: { ...c.behavior, ...patch } });

  const issues = sliderProblems(draft);
  const weightKb = useMemo(() => sliderWeightKb(draft), [draft]);
  const slideW = Math.round((c.layout.width - c.layout.gap * (c.layout.visible - 1)) / Math.max(1, c.layout.visible));

  // What the optimiser saved, in one message for all pictures just added.
  const report = (list: Optimised[]) => {
    const before = list.reduce((n, o) => n + o.before, 0);
    const after = list.reduce((n, o) => n + o.after, 0);
    if (after < before) toast.success(e.optimised(formatSize(before), formatSize(after)));
  };

  const onBackground = async (file: File | undefined) => {
    if (!file) return;
    const p = await fileToSliderPicture(file, "background");
    report([p.optimised]);
    onChange(tidy({ ...draft, files: { ...draft.files, [p.key]: p.file }, config: { ...c, background: { ...c.background, src: p.key } } }));
  };

  // Pictures are placed in the order of their file names (1.jpg, 2.jpg, 10.jpg).
  const onSlides = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const added = await Promise.all(files.map((f) => fileToSliderPicture(f, "slide")));
    report(added.map((p) => p.optimised));
    const next = { ...draft.files };
    added.forEach((p) => (next[p.key] = p.file));
    onChange({ ...draft, files: next, config: { ...c, slides: [...c.slides, ...added.map((p) => ({ image: p.key, href: "" }))] } });
  };

  const move = (i: number, d: -1 | 1) => {
    const slides = [...c.slides];
    const [s] = slides.splice(i, 1);
    slides.splice(i + d, 0, s!);
    set({ slides });
  };
  const setSlideHref = (i: number, href: string) => set({ slides: c.slides.map((s, j) => (j === i ? { ...s, href } : s)) });

  const loadExample = async () => {
    onChange(await exampleSliderDraft());
    toast.success(e.exampleLoaded);
  };

  const download = async () => {
    setBusy(true);
    try {
      await downloadSliderZip(draft);
    } finally {
      setBusy(false);
    }
  };
  useSaveShortcut(download, issues.length === 0 && !busy);

  const bgFile = draft.files[c.background.src];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b px-3 py-2 lg:h-14 lg:flex-nowrap lg:gap-3 lg:px-4 lg:py-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{ui.back}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{c.campaign.trim() || t.untitled}</div>
          <div className="text-xs text-muted-foreground">
            {t.heading} · 1250x400
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:gap-3">
          <HoverPill tone="plain" icon={<FileArchive className="size-3.5" />} label={`${weightKb.toFixed(1)} KB`}>
            {() => (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm font-medium">
                  <span>{e.weight}</span>
                  <span className="font-mono">
                    {weightKb.toFixed(1)} / {BUDGET_KB} KB
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(weightKb)} aria-valuemax={BUDGET_KB} aria-label={e.weight}>
                  <div className={weightKb > BUDGET_KB ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, (weightKb / BUDGET_KB) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{e.sizeHelp}</p>
              </div>
            )}
          </HoverPill>
          <HoverPill
            tone={issues.length === 0 ? "ok" : "warn"}
            icon={issues.length === 0 ? <CheckCircle2 className="size-3.5 text-green-600" /> : <TriangleAlert className="size-3.5 text-yellow-600" />}
            label={
              <>
                <span className="hidden sm:inline">{issues.length === 0 ? e.ready : ui.toFix(issues.length)}</span>
                <span className="sm:hidden">{issues.length === 0 ? "" : issues.length}</span>
              </>
            }
          >
            {(close) =>
              issues.length === 0 ? (
                <p className="text-sm">{t.allGood}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{ui.toFixTitle}</p>
                  <p className="text-xs text-muted-foreground">{e.toFixHelp}</p>
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
            <span className="hidden md:inline">{e.loadExample}</span>
          </Button>
          <Toggles />
          <Button className="ml-auto gap-2 sm:ml-0" disabled={issues.length > 0 || busy} onClick={download} title="Ctrl+S">
            <Download className="size-4" />{" "}
            {busy ? e.downloading : (
              <>
                {ui.downloadWord}
                <span className="hidden sm:inline"> {ui.suffixZip}</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1282px] px-4">
          <div className={pinned ? "sticky top-0 z-20 -mx-4 border-b bg-background px-4 py-3" : "py-3"}>
            <SliderPreview draft={draft} pinned={pinned} onPin={setPinned} onTryExample={loadExample} />
          </div>

          <div className="pb-24 pt-4">
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-4 lg:col-start-2">
                <Section title={t.campaignTitle} icon={Images} tone="red">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign">{t.campaignName}</Label>
                    <Input id="campaign" value={c.campaign} onChange={(ev) => set({ campaign: ev.target.value })} />
                    <p className="text-xs text-muted-foreground">{t.campaignHint}</p>
                  </div>
                </Section>

                <Section title={t.bgTitle} description={t.bgHint} icon={ImagePlus} tone="ink">
                  {bgFile && <img src={bgFile.dataUrl} alt="" className="aspect-[1250/400] w-full rounded-md border object-cover" />}
                  <div className="space-y-2">
                    <input ref={bgInput} type="file" className="sr-only" aria-label={t.bgTitle} accept="image/png,image/jpeg,image/webp" onChange={(ev) => onBackground(ev.target.files?.[0])} />
                    <Button id="bg-choose" variant="outline" size="sm" className="gap-2" onClick={() => bgInput.current?.click()}>
                      <ImagePlus className="size-4" /> {bgFile ? t.bgChange : t.bgChoose}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {bgFile ? "" : `${t.bgNone} `}
                      {t.bgFileHint}
                    </p>
                  </div>
                  <SwitchRow id="bg-clickable" label={t.bgClickable} checked={c.background.clickable} onChange={(v) => set({ background: { ...c.background, clickable: v } })} />
                  {c.background.clickable && (
                    <div className="space-y-1.5">
                      <Label htmlFor="bg-href">{t.bgLink}</Label>
                      <Input id="bg-href" placeholder="https://" value={c.background.href} onChange={(ev) => set({ background: { ...c.background, href: ev.target.value } })} />
                      <p className="text-xs text-muted-foreground">{t.linkHint}</p>
                    </div>
                  )}
                </Section>
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
                <Section title={t.slidesTitle(c.slides.length)} description={t.slidesHint} icon={Images} tone="red">
                  <div className="space-y-2">
                    <input ref={slideInput} type="file" multiple className="sr-only" aria-label={t.slidesAdd} accept="image/png,image/jpeg,image/webp" onChange={(ev) => { void onSlides(ev.target.files); ev.target.value = ""; }} />
                    <Button id="slides-add" variant="outline" size="sm" className="gap-2" onClick={() => slideInput.current?.click()}>
                      <ImagePlus className="size-4" /> {t.slidesAdd}
                    </Button>
                    {c.slides.length === 0 && <p className="text-xs text-muted-foreground">{t.slidesNone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{t.linksLabel}</Label>
                    <Tabs value={c.linkMode} onValueChange={(v) => set({ linkMode: v as "shared" | "each" })}>
                      <TabsList aria-label={t.linksLabel}>
                        <TabsTrigger value="shared">{t.linkShared}</TabsTrigger>
                        <TabsTrigger value="each">{t.linkEach}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {c.linkMode === "shared" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="shared-href">{t.sharedLink}</Label>
                        <Input id="shared-href" placeholder="https://" value={c.sharedHref} onChange={(ev) => set({ sharedHref: ev.target.value })} />
                        <p className="text-xs text-muted-foreground">{t.linkHint}</p>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {c.slides.map((s, i) => (
                      <li key={s.image + i} className="rounded-lg border p-2">
                        <div className="flex items-center gap-3">
                          <Thumb src={draft.files[s.image]?.dataUrl} />
                          <div className="min-w-0 flex-1 text-sm font-medium">{t.slideN(i + 1)}</div>
                          <Button variant="ghost" size="icon" aria-label={t.slideEarlier} disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={t.slideLater} disabled={i === c.slides.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={t.slideRemove} onClick={() => set({ slides: c.slides.filter((_, j) => j !== i) })}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {c.linkMode === "each" && (
                          <div className="mt-2 space-y-1.5">
                            <Label htmlFor={`slide${i}-href`} className="text-xs">
                              {t.slideLink}
                            </Label>
                            <Input id={`slide${i}-href`} placeholder="https://" value={s.href} onChange={(ev) => setSlideHref(i, ev.target.value)} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {c.linkMode === "each" && c.slides.length > 0 && <p className="text-xs text-muted-foreground">{t.linkHint}</p>}
                </Section>
              </div>

              <div className="min-w-0 space-y-4 lg:col-start-2">
                <h2 className="pt-2 text-sm font-semibold text-muted-foreground">{e.advanced}</h2>
                <Collapsible title={t.layoutTitle} description={t.layoutHint} icon={LayoutDashboard} tone="yellow">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Num id="layout-x" label={t.fromLeft} value={c.layout.x} min={0} onChange={(x) => setLayout({ x })} />
                    <Num id="layout-y" label={t.fromTop} value={c.layout.y} min={0} onChange={(y) => setLayout({ y })} />
                    <Num id="layout-width" label={t.sliderWidth} value={c.layout.width} min={1} onChange={(width) => setLayout({ width })} />
                    <Num id="layout-height" label={t.sliderHeight} value={c.layout.height} min={1} onChange={(height) => setLayout({ height })} />
                    <Num id="layout-gap" label={t.slideGap} value={c.layout.gap} min={0} onChange={(gap) => setLayout({ gap })} />
                    <Num id="layout-visible" label={t.slidesVisible} value={c.layout.visible} min={1} onChange={(visible) => setLayout({ visible })} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.slideSize(slideW, c.layout.height)}</p>
                  <SwitchRow id="arrows" label={t.arrows} checked={c.arrows} onChange={(v) => set({ arrows: v })} />
                </Collapsible>
                <Collapsible title={e.behaviorTitle} description={e.behaviorHint} icon={SlidersHorizontal} tone="ink">
                  <SwitchRow id="shuffle" label={e.shuffle} checked={c.behavior.shuffle} onChange={(v) => setBehavior({ shuffle: v })} />
                  <SwitchRow id="autoplay" label={e.autoplay} checked={c.behavior.autoplay} onChange={(v) => setBehavior({ autoplay: v })} />
                  <SwitchRow id="loop" label={e.loop} checked={c.behavior.loop} onChange={(v) => setBehavior({ loop: v })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="delay">{e.delay}</Label>
                      <Input id="delay" type="number" min={1} step={0.5} value={c.behavior.delayMs / 1000} onChange={(ev) => setBehavior({ delayMs: Math.max(500, Math.round((Number(ev.target.value) || 2) * 1000)) })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{e.speed}</Label>
                      <div className="flex gap-2" role="group" aria-label={e.speed}>
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
      </div>
    </div>
  );
}
