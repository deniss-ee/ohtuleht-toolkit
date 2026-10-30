import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Download, FileArchive, FlaskConical, ImagePlus, Images, Loader2, LayoutDashboard, Pin, PinOff, SlidersHorizontal, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { isMobileSlider } from "@ohtuleht/templates";
import type { SliderEffect, SliderView, SliderViewMobile } from "@ohtuleht/templates";
import { Collapsible, Section, SwitchRow } from "@/components/editor/FormParts";
import { goTo, HoverPill } from "@/components/editor/HoverPill";
import { FormatSwitch } from "@/components/editor/FormatSwitch";
import { SwapFrame, type Geometry } from "@/components/editor/SwapFrame";
import { useSaveShortcut } from "@/components/editor/useSaveShortcut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as e, sliderEditor as t, ui } from "@/content";
import { Toggles } from "@/layout/AppShell";
import { formatSize } from "@/lib/format";
import type { Optimised } from "@/lib/optimise";
import { downloadSliderZip, exampleSliderDraft, fileToSliderPicture, renderSliderPreview, sliderProblems, sliderWeightKb, switchSliderFormat, tidy, type SliderDraft } from "@/lib/slider";

const BUDGET_KB = 100;
const PHONES = [375, 390, 430];

const SPEEDS = [
  { label: e.speedFast, ms: 250 },
  { label: e.speedNormal, ms: 500 },
  { label: e.speedSlow, ms: 900 },
];
const EFFECTS: Record<"desktop" | "mobile", SliderEffect[]> = { desktop: ["slide", "arc"], mobile: ["slide", "cube"] };
const EFFECT_LABEL = (f: SliderEffect) => (f === "arc" ? t.effectArc : f === "cube" ? t.effectCube : t.effectSlide);
const EFFECT_HINT = (f: SliderEffect) => (f === "arc" ? t.effectArcHint : f === "cube" ? t.effectCubeHint : t.effectSlideHint);
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
// The phone banner is as wide as the phone and 5/6 of that high.
function SliderPreview({ draft, pinned, onPin, onTryExample, working }: { draft: SliderDraft; pinned: boolean; onPin: (v: boolean) => void; onTryExample: () => void; working: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(1250);
  const [phone, setPhone] = useState(375);
  const mobile = isMobileSlider(draft.config);
  const W = mobile ? phone : 1250;
  const H = mobile ? Math.round((phone * 5) / 6) : 400;
  const size = mobile ? "600x500" : "1250x400";
  const empty = draft.config.slides.length === 0 && (mobile || !draft.config.background);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The size of the frame on screen. It follows a change (desktop/phone, phone width) only when the new frame is ready,
  // so the area never shows the old banner in the new size. The area is never lower than the desktop banner: switching
  // between the sizes moves nothing below it, and the phone banner sits in the middle.
  const [shown, setShown] = useState<Geometry>({ width: W, height: H });
  const scaleFor = (w: number) => Math.min(1, boxW / w);
  const shownW = Number(shown.width);
  const shownScale = scaleFor(shownW);
  const shownMobile = shownW !== 1250;
  const frameH = Math.round(shown.height * shownScale);
  const areaH = empty ? 240 : Math.max(frameH, Math.round(400 * scaleFor(1250)));
  const pct = Math.round(scaleFor(W) * 100);
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{e.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{mobile ? e.previewMobile(phone) : pct < 100 ? e.previewScaled(pct, size) : e.previewFull(size)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={pinned ? "secondary" : "ghost"} size="sm" className="gap-1.5" aria-pressed={pinned} onClick={() => onPin(!pinned)}>
            {pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
            {e.pin}
          </Button>
          {mobile && (
            <Tabs value={String(phone)} onValueChange={(v) => setPhone(Number(v))}>
              <TabsList aria-label={e.phoneWidth}>
                {PHONES.map((w) => (
                  <TabsTrigger key={w} value={String(w)}>
                    {w}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden"} style={{ height: areaH }}>
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: empty ? 0 : Math.round((areaH - frameH) / 2), height: empty ? "100%" : frameH, width: shownMobile && !empty ? Math.round(shownW * shownScale) : "100%" }}>
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
              <div>
                <h2 className="text-lg font-semibold">{t.emptyTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.emptyText}</p>
              </div>
              <Button variant="outline" className="gap-2" disabled={working} onClick={onTryExample}>
                {working ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />} {working ? e.preparing : e.emptyTryExample}
              </Button>
            </div>
          ) : (
            <SwapFrame build={(id) => renderSliderPreview(draft, id)} deps={[draft, W, H]} width={W} height={H} scaleFor={scaleFor} onShown={setShown} title={ui.bannerPreview} />
          )}
        </div>
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
  const [working, setWorking] = useState<"bg" | "slides" | "example" | null>(null); // pictures are being prepared
  const bgInput = useRef<HTMLInputElement>(null);
  const slideInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const mobile = isMobileSlider(c);
  const set = (patch: Partial<SliderDraft["config"]>) => onChange(tidy({ ...draft, config: { ...c, ...patch } }));
  // Arrows and effect belong to the size being edited; the slider position and size only exist on the desktop banner.
  const setView = (patch: Partial<SliderViewMobile>) => set(mobile ? { mobile: { ...c.mobile, ...patch } } : { desktop: { ...c.desktop, ...patch } });
  const setLayout = (patch: Partial<SliderView["layout"]>) => set({ desktop: { ...c.desktop, layout: { ...c.desktop.layout, ...patch } } });
  const layout = c.desktop.layout;
  const view = mobile ? c.mobile : c.desktop;
  const setBehavior = (patch: Partial<SliderDraft["config"]["behavior"]>) => set({ behavior: { ...c.behavior, ...patch } });

  const issues = sliderProblems(draft);
  const weightKb = useMemo(() => sliderWeightKb(draft), [draft]);
  const slideW = Math.round((layout.width - layout.gap * (layout.visible - 1)) / Math.max(1, layout.visible));

  // What the optimiser saved, in one message for all pictures just added.
  const report = (list: Optimised[]) => {
    const before = list.reduce((n, o) => n + o.before, 0);
    const after = list.reduce((n, o) => n + o.after, 0);
    if (after < before) toast.success(e.optimised(formatSize(before), formatSize(after)));
  };

  // Runs a slow job (pictures are optimised in the browser) and shows a spinner on its button meanwhile.
  const work = async (what: "bg" | "slides" | "example", job: () => Promise<void>) => {
    setWorking(what);
    try {
      await job();
    } finally {
      setWorking(null);
    }
  };

  const onBackground = (file: File | undefined) =>
    file &&
    work("bg", async () => {
      const p = await fileToSliderPicture(file, "background");
      report([p.optimised]);
      onChange(tidy({ ...draft, files: { ...draft.files, [p.key]: p.file }, config: { ...c, background: p.key } }));
    });

  // Pictures are placed in the order of their file names (1.jpg, 2.jpg, 10.jpg).
  const onSlides = (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return work("slides", async () => {
      const added = await Promise.all(files.map((f) => fileToSliderPicture(f, "slide")));
      report(added.map((p) => p.optimised));
      const next = { ...draft.files };
      added.forEach((p) => (next[p.key] = p.file));
      onChange({ ...draft, files: next, config: { ...c, slides: [...c.slides, ...added.map((p) => ({ image: p.key, href: "" }))] } });
    });
  };

  const move = (i: number, d: -1 | 1) => {
    const slides = [...c.slides];
    const [s] = slides.splice(i, 1);
    slides.splice(i + d, 0, s!);
    set({ slides });
  };
  const setSlideHref = (i: number, href: string) => set({ slides: c.slides.map((s, j) => (j === i ? { ...s, href } : s)) });

  const loadExample = () =>
    work("example", async () => {
      onChange(switchSliderFormat(await exampleSliderDraft(), c.format));
      toast.success(e.exampleLoaded);
    });

  const download = async () => {
    setBusy(true);
    try {
      await downloadSliderZip(draft);
    } finally {
      setBusy(false);
    }
  };
  useSaveShortcut(download, issues.length === 0 && !busy);

  const bgFile = draft.files[c.background];

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
            {t.heading} · {mobile ? "600x500" : "1250x400"}
          </div>
        </div>
        <FormatSwitch
          value={c.format}
          label={e.versionLabel}
          desktop={{ value: "image-slider-1250x400", label: `${e.versionDesktop} 1250x400` }}
          mobile={{ value: "image-slider-600x500", label: `${e.versionMobile} 600x500` }}
          onChange={(v) => {
            const format = v as SliderDraft["config"]["format"];
            onChange(switchSliderFormat(draft, format));
            toast.success(e.versionSwitched(format === "image-slider-600x500" ? e.versionMobile : e.versionDesktop), { id: "version-switched" });
          }}
        />
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
            label={issues.length === 0 ? e.ready : ui.toFix(issues.length)} short={issues.length === 0 ? undefined : issues.length}
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
          <Button variant="outline" size="sm" className="gap-2 max-md:size-8 max-sm:size-10 max-md:rounded-full max-md:p-0" disabled={working !== null} onClick={loadExample}>
            {working === "example" ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
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
            <SliderPreview draft={draft} pinned={pinned} onPin={setPinned} onTryExample={loadExample} working={working === "example"} />
          </div>

          <div className="pb-24 pt-4">
            <div className="grid items-start gap-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
              <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-1">
                <Section title={t.campaignTitle} icon={Images} tone="red">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign">{t.campaignName}</Label>
                    <Input id="campaign" value={c.campaign} onChange={(ev) => set({ campaign: ev.target.value })} />
                    <p className="text-xs text-muted-foreground">{t.campaignHint}</p>
                  </div>
                </Section>

                {!mobile && (
                  <Section title={t.bgTitle} description={t.bgHint} icon={ImagePlus} tone="ink" className="animate-in fade-in-0 duration-300">
                    {bgFile && <img src={bgFile.dataUrl} alt="" className="aspect-[1250/400] w-full rounded-md border object-cover" />}
                    <div className="space-y-2">
                      <input ref={bgInput} type="file" className="sr-only" aria-label={t.bgTitle} accept="image/png,image/jpeg,image/webp" onChange={(ev) => onBackground(ev.target.files?.[0])} />
                      <Button id="bg-choose" variant="outline" size="sm" className="gap-2" disabled={working !== null} onClick={() => bgInput.current?.click()}>
                        {working === "bg" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {working === "bg" ? e.preparing : bgFile ? t.bgChange : t.bgChoose}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {bgFile ? "" : `${t.bgNone} `}
                        {t.bgFileHint}
                      </p>
                    </div>
                    <SwitchRow id="bg-clickable" label={t.bgClickable} checked={c.backgroundLink.clickable} onChange={(v) => set({ backgroundLink: { ...c.backgroundLink, clickable: v } })} />
                    {c.backgroundLink.clickable && (
                      <div className="space-y-1.5">
                        <Label htmlFor="bg-href">{t.bgLink}</Label>
                        <Input id="bg-href" placeholder="https://" value={c.backgroundLink.href} onChange={(ev) => set({ backgroundLink: { ...c.backgroundLink, href: ev.target.value } })} />
                        <p className="text-xs text-muted-foreground">{t.linkHint}</p>
                      </div>
                    )}
                  </Section>
                )}
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <Section title={t.slidesTitle(c.slides.length)} description={t.slidesHint} icon={Images} tone="red">
                  <div className="space-y-2">
                    <input ref={slideInput} type="file" multiple className="sr-only" aria-label={t.slidesAdd} accept="image/png,image/jpeg,image/webp" onChange={(ev) => { void onSlides(ev.target.files); ev.target.value = ""; }} />
                    <Button id="slides-add" variant="outline" size="sm" className="gap-2" disabled={working !== null} onClick={() => slideInput.current?.click()}>
                      {working === "slides" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {working === "slides" ? e.preparing : t.slidesAdd}
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

              <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-2">
                <h2 className="pt-2 text-sm font-semibold text-muted-foreground">{e.advanced}</h2>
                {!mobile && (
                  <Collapsible title={t.layoutTitle} description={t.layoutHint} icon={LayoutDashboard} tone="yellow" className="animate-in fade-in-0 duration-300">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Num id="layout-x" label={t.fromLeft} value={layout.x} min={0} onChange={(x) => setLayout({ x })} />
                      <Num id="layout-y" label={t.fromTop} value={layout.y} min={0} onChange={(y) => setLayout({ y })} />
                      <Num id="layout-width" label={t.sliderWidth} value={layout.width} min={1} onChange={(width) => setLayout({ width })} />
                      <Num id="layout-height" label={t.sliderHeight} value={layout.height} min={1} onChange={(height) => setLayout({ height })} />
                      <Num id="layout-gap" label={t.slideGap} value={layout.gap} min={0} onChange={(gap) => setLayout({ gap })} />
                      <Num id="layout-visible" label={t.slidesVisible} value={layout.visible} min={1} onChange={(visible) => setLayout({ visible })} />
                    </div>
                    <p className="text-xs text-muted-foreground">{t.slideSize(slideW, layout.height)}</p>
                  </Collapsible>
                )}
                <Collapsible title={t.lookTitle} description={mobile ? t.lookHintMobile : t.lookHint} icon={Sparkles} tone="yellow">
                  <SwitchRow id="arrows" label={t.arrows} checked={view.arrows} onChange={(v) => setView({ arrows: v })} />
                  <div className="space-y-2">
                    <Label>{t.effectTitle}</Label>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t.effectTitle}>
                      {EFFECTS[mobile ? "mobile" : "desktop"].map((f) => (
                        <Button
                          key={f}
                          variant={view.effect === f ? "default" : "outline"}
                          size="sm"
                          aria-pressed={view.effect === f}
                          onClick={() => {
                            // The carousel needs at least 3 slides in view.
                            if (f === "arc" && !mobile) set({ desktop: { ...c.desktop, effect: f, layout: { ...layout, visible: Math.max(3, layout.visible) } } });
                            else setView({ effect: f });
                          }}
                        >
                          {EFFECT_LABEL(f)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{EFFECT_HINT(view.effect)}</p>
                  </div>
                </Collapsible>
                <Collapsible title={e.behaviorTitle} description={t.behaviorHint} icon={SlidersHorizontal} tone="ink">
                  <SwitchRow id="shuffle" label={e.shuffle} checked={c.behavior.shuffle} onChange={(v) => setBehavior({ shuffle: v })} />
                  <SwitchRow id="autoplay" label={e.autoplay} checked={c.behavior.autoplay} onChange={(v) => setBehavior({ autoplay: v })} />
                  <SwitchRow id="loop" label={t.loopLabel} checked={c.behavior.loop} onChange={(v) => setBehavior({ loop: v })} />
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
