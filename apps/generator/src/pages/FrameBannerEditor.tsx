import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileArchive, FlaskConical, ImagePlus, Images, Loader2, Palette, Repeat, Ruler, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ColorField } from "@/components/editor/ColorField";
import { Choice, Num } from "@/components/editor/Fields";
import { Section, SwitchRow } from "@/components/editor/FormParts";
import { HoverPill } from "@/components/editor/HoverPill";
import { SwapFrame, type Geometry } from "@/components/editor/SwapFrame";
import { ToolShell } from "@/components/editor/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as e, frameEditor as t, ui } from "@/content";
import { formatSize } from "@/lib/format";
import { downloadFrameZip, exampleFrameDraft, fileToFramePicture, frameProblems, frameWeightKb, renderFramePreview, SIZE_PRESETS, tidy, type FrameDraft } from "@/lib/frames";

const BUDGET_KB = 150;
const PREVIEW_WIDTHS = [0, 600, 320]; // responsive only: 0 = as designed

const seconds = (ms: number) => Math.round(ms) / 1000;
const toMs = (s: string) => Math.max(0, Math.round((Number(s.replace(",", ".")) || 0) * 1000));

// The banner as it will run: the real HTML in a frame, scaled to fit. Responsive banners can be tried at narrower widths.
function FramePreview({ draft, onTryExample, working }: { draft: FrameDraft; onTryExample: () => void; working: boolean }) {
  const c = draft.config;
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(900);
  const [narrow, setNarrow] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = c.responsive && narrow ? narrow : c.width;
  const H = c.responsive ? Math.round((W * c.height) / Math.max(1, c.width)) : c.height;
  const empty = c.frames.length === 0;
  const scale = Math.min(1, boxW / W);
  const [shown, setShown] = useState<Geometry>({ width: W, height: H });
  const shownScale = Math.min(1, boxW / Number(shown.width));
  const areaH = empty ? 220 : Math.max(120, Math.round(shown.height * shownScale));
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{e.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{scale < 1 ? e.previewScaled(Math.round(scale * 100), `${W}x${H}`) : e.previewFull(`${W}x${H}`)}</span>}
        </div>
        {c.responsive && (
          <Tabs value={String(narrow)} onValueChange={(v) => setNarrow(Number(v))}>
            <TabsList aria-label={t.previewWidth}>
              {PREVIEW_WIDTHS.map((w) => (
                <TabsTrigger key={w} value={String(w)}>
                  {w === 0 ? `${c.width}` : w}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden rounded-lg border bg-muted/30"} style={{ height: areaH }}>
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
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 0, width: Math.round(Number(shown.width) * shownScale), height: Math.round(shown.height * shownScale) }}>
            <SwapFrame build={(id) => renderFramePreview(draft, id)} deps={[draft, W, H]} width={W} height={H} scaleFor={(w) => Math.min(1, boxW / w)} onShown={setShown} title={ui.bannerPreview} />
          </div>
        )}
      </div>
    </div>
  );
}

// Full-screen editor for the picture loop banner.
export function FrameBannerEditor({ draft, onChange, onBack }: { draft: FrameDraft; onChange: (d: FrameDraft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<"add" | "bg" | "example" | null>(null);
  const [over, setOver] = useState(false);
  const addInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const set = (patch: Partial<FrameDraft["config"]>) => onChange(tidy({ ...draft, config: { ...c, ...patch } }));
  const issues = frameProblems(draft);
  const weightKb = useMemo(() => frameWeightKb(draft), [draft]);
  const shortest = Math.min(...c.frames.map((f) => f.holdMs ?? c.holdMs), c.holdMs);

  const run = async (what: "add" | "bg" | "example", job: () => Promise<void>) => {
    setWorking(what);
    try {
      await job();
    } finally {
      setWorking(null);
    }
  };

  // Pictures are placed in the order of their file names (1.png, 2.png, 10.png). The first one sets the banner size when none is set yet.
  const addFrames = (list: FileList | File[] | null) => {
    const files = [...(list ?? [])].filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!files.length) return toast.error(t.onlyPictures);
    return run("add", async () => {
      const added = await Promise.all(files.map(fileToFramePicture));
      const next = { ...draft.files };
      added.forEach((p) => (next[p.key] = p.file));
      const first = c.frames.length === 0 ? added[0] : undefined;
      onChange({
        ...draft,
        files: next,
        config: { ...c, ...(first && first.width && c.width === 300 && c.height === 250 ? { width: first.width, height: first.height } : {}), frames: [...c.frames, ...added.map((p) => ({ image: p.key }))] },
      });
    });
  };

  const addBackground = (file: File | undefined) =>
    file &&
    run("bg", async () => {
      const p = await fileToFramePicture(file);
      onChange(tidy({ ...draft, files: { ...draft.files, [p.key]: p.file }, config: { ...c, backgroundImage: p.key } }));
    });

  const move = (i: number, d: -1 | 1) => {
    const frames = [...c.frames];
    const [f] = frames.splice(i, 1);
    frames.splice(i + d, 0, f!);
    set({ frames });
  };
  const setHold = (i: number, ms: number | undefined) => set({ frames: c.frames.map((f, j) => (j === i ? (ms === undefined ? { image: f.image } : { ...f, holdMs: ms }) : f)) });
  const useFirstSize = async () => {
    const f = draft.files[c.frames[0]?.image ?? ""];
    if (!f) return;
    const img = new Image();
    img.src = f.dataUrl;
    await img.decode().catch(() => undefined);
    if (img.naturalWidth) set({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const loadExample = () =>
    run("example", async () => {
      onChange(await exampleFrameDraft());
      toast.success(e.exampleLoaded);
    });

  const download = async () => {
    setBusy(true);
    try {
      await downloadFrameZip(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell
      title={c.campaign.trim() || t.untitled}
      subtitle={`${t.heading} · ${c.responsive ? t.responsiveShort(c.width, c.height) : `${c.width}x${c.height}`}`}
      problems={issues}
      readyText={e.ready}
      doneText={t.allGood}
      busy={busy}
      onDownload={download}
      onBack={onBack}
      extra={
        <>
          <HoverPill tone="plain" icon={<FileArchive className="size-3.5" />} label={`${weightKb.toFixed(0)} KB`}>
            {() => (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm font-medium">
                  <span>{e.weight}</span>
                  <span className="font-mono">
                    {weightKb.toFixed(0)} / {BUDGET_KB} KB
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(weightKb)} aria-valuemax={BUDGET_KB} aria-label={e.weight}>
                  <div className={weightKb > BUDGET_KB ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, (weightKb / BUDGET_KB) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{t.weightHelp}</p>
              </div>
            )}
          </HoverPill>
          <Button variant="outline" size="sm" className="gap-2 max-md:size-8 max-sm:size-10 max-md:rounded-full max-md:p-0" disabled={working !== null} onClick={loadExample}>
            {working === "example" ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            <span className="hidden md:inline">{e.loadExample}</span>
          </Button>
        </>
      }
      downloadLabel={
        <>
          <Download className="size-4" />{" "}
          {busy ? e.downloading : (
            <>
              {ui.downloadWord}
              <span className="hidden sm:inline"> {ui.suffixZip}</span>
            </>
          )}
        </>
      }
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-5">
            <FramePreview draft={draft} onTryExample={loadExample} working={working === "example"} />

            <Section title={t.framesTitle} description={t.framesHint} icon={Images} tone="red">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign">{t.campaign}</Label>
                  <Input id="campaign" value={c.campaign} placeholder={t.campaignPlaceholder} onChange={(ev) => set({ campaign: ev.target.value })} />
                </div>

                <ol className="space-y-2" aria-label={t.framesTitle}>
                  {c.frames.map((f, i) => {
                    const file = draft.files[f.image];
                    return (
                      <li key={f.image + i} className="flex items-center gap-3 rounded-xl border bg-card p-2">
                        <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border" style={{ backgroundImage: "repeating-conic-gradient(#0000000f 0% 25%, transparent 0% 50%)", backgroundSize: "12px 12px" }}>
                          {file && <img src={file.dataUrl} alt="" className="h-full w-full object-contain" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{file?.name}</div>
                          <div className="text-xs text-muted-foreground">{file ? formatSize(file.bytes.length) : ""}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`hold-${i}`} className="sr-only">
                            {t.holdOne(i + 1)}
                          </Label>
                          <Input id={`hold-${i}`} className="h-8 w-20 text-right" type="number" inputMode="decimal" min={0.3} step={0.1} value={f.holdMs === undefined ? "" : seconds(f.holdMs)} placeholder={String(seconds(c.holdMs))} onChange={(ev) => setHold(i, ev.target.value === "" ? undefined : toMs(ev.target.value))} />
                          <span className="text-xs text-muted-foreground">s</span>
                        </div>
                        <div className="flex">
                          <Button variant="ghost" size="icon-sm" aria-label={t.moveUp(i + 1)} disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={t.moveDown(i + 1)} disabled={i === c.frames.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={t.removeOne(i + 1)} onClick={() => set({ frames: c.frames.filter((_, j) => j !== i) })}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${over ? "border-primary bg-primary/5" : ""}`}
                  onDragOver={(ev) => (ev.preventDefault(), setOver(true))}
                  onDragLeave={() => setOver(false)}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    setOver(false);
                    void addFrames(ev.dataTransfer.files);
                  }}
                >
                  <input ref={addInput} type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(ev) => (void addFrames(ev.target.files), (ev.target.value = ""))} />
                  <Button id="frames-add" variant="outline" className="gap-2" disabled={working === "add"} onClick={() => addInput.current?.click()}>
                    {working === "add" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {c.frames.length ? t.addMore : t.add}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">{t.dropHere}</p>
                </div>
              </div>
            </Section>
          </div>

          <div className="min-w-0 space-y-5">
            <Section title={t.timeTitle} description={t.timeHint} icon={Timer} tone="red">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Num id="hold" label={t.hold} value={seconds(c.holdMs)} min={0.3} step={0.1} onChange={(v) => set({ holdMs: toMs(String(v)) })} hint={t.holdHint} />
                  <Num id="fade" label={t.fade} value={seconds(c.fadeMs)} min={0} step={0.1} onChange={(v) => set({ fadeMs: toMs(String(v)) })} hint={c.fadeMs > shortest ? t.fadeTooLong : t.fadeHint} />
                </div>
                <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">{t.fadeExplain}</p>
              </div>
            </Section>

            <Section title={t.loopTitle} description={t.loopHint} icon={Repeat} tone="yellow">
              <div className="space-y-3">
                <Choice label={t.loopTitle} value={c.loop.forever ? "forever" : "times"} options={[{ id: "forever", label: t.loopForever }, { id: "times", label: t.loopTimes }]} onChange={(v) => set({ loop: { ...c.loop, forever: v === "forever" } })} />
                {!c.loop.forever && <Num id="loop-times" label={t.loopCount} value={c.loop.times} min={1} max={99} onChange={(v) => set({ loop: { ...c.loop, times: Math.max(1, Math.round(v)) } })} hint={t.loopEnds} />}
                <SwitchRow id="pause-hover" label={t.pauseOnHover} checked={c.pauseOnHover} onChange={(v) => set({ pauseOnHover: v })} />
                <SwitchRow id="respect-motion" label={t.respectMotion} checked={c.respectMotion} onChange={(v) => set({ respectMotion: v })} />
              </div>
            </Section>

            <Section title={t.sizeTitle} description={t.sizeHint} icon={Ruler} tone="red">
              <div className="space-y-3">
                <Choice label={t.sizeMode} value={c.responsive ? "responsive" : "fixed"} options={[{ id: "fixed", label: t.fixed, hint: t.fixedHint }, { id: "responsive", label: t.responsive, hint: t.responsiveHint }]} onChange={(v) => set({ responsive: v === "responsive" })} />
                <div className="grid grid-cols-2 gap-3">
                  <Num id="size-width" label={c.responsive ? t.ratioWidth : t.width} value={c.width} min={20} max={4000} onChange={(v) => set({ width: Math.round(v) })} />
                  <Num id="size-height" label={c.responsive ? t.ratioHeight : t.height} value={c.height} min={20} max={4000} onChange={(v) => set({ height: Math.round(v) })} />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.presets}>
                  {SIZE_PRESETS.map((p) => (
                    <Button key={`${p.w}x${p.h}`} size="sm" variant={c.width === p.w && c.height === p.h ? "secondary" : "outline"} onClick={() => set({ width: p.w, height: p.h })}>
                      {p.w}x{p.h}
                    </Button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" className="gap-2" disabled={!c.frames.length} onClick={() => void useFirstSize()}>
                  {t.useFirstSize}
                </Button>
                <Choice label={t.fit} value={c.fit} options={[{ id: "cover", label: t.fitCover, hint: t.fitCoverHint }, { id: "contain", label: t.fitContain, hint: t.fitContainHint }, { id: "fill", label: t.fitFill, hint: t.fitFillHint }]} onChange={(v) => set({ fit: v })} />
                {c.responsive && <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">{t.responsiveExplain}</p>}
              </div>
            </Section>

            <Section title={t.bgTitle} description={t.bgHint} icon={Palette} tone="yellow">
              <div className="space-y-3">
                <div id="bg-color" className="space-y-1.5">
                  {c.backgroundColor ? (
                    <>
                      <ColorField label={t.bgColor} value={c.backgroundColor} onChange={(v) => set({ backgroundColor: v })} />
                      <Button size="sm" variant="ghost" onClick={() => set({ backgroundColor: "" })}>
                        {t.bgClear}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="gap-2" onClick={() => set({ backgroundColor: "#1a1a1a" })}>
                      <Palette className="size-4" /> {t.bgAddColor}
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <input ref={bgInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(ev) => (void addBackground(ev.target.files?.[0]), (ev.target.value = ""))} />
                  <Button id="bg-choose" variant="outline" className="gap-2" disabled={working === "bg"} onClick={() => bgInput.current?.click()}>
                    {working === "bg" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {c.backgroundImage ? t.bgChange : t.bgChoose}
                  </Button>
                  {c.backgroundImage && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{draft.files[c.backgroundImage]?.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => set({ backgroundImage: "" })}>
                        {t.bgClear}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{t.bgExplain}</p>
                </div>
              </div>
            </Section>

            <Section title={t.linkTitle} description={t.linkHint} icon={FileArchive} tone="red">
              <div className="space-y-1.5">
                <Label htmlFor="href">{t.link}</Label>
                <Input id="href" type="url" placeholder="https://" value={c.href} onChange={(ev) => set({ href: ev.target.value })} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}

