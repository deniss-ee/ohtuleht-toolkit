import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Clapperboard, Download, FileArchive, FlaskConical, ImagePlus, Images, Link2, Loader2, ScanLine, Timer, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { hasContent, pictureFits, RB } from "@ohtuleht/templates";
import { Choice, Num } from "@/components/editor/Fields";
import { Section } from "@/components/editor/FormParts";
import { HoverPill } from "@/components/editor/HoverPill";
import { SwapFrame, type Geometry } from "@/components/editor/SwapFrame";
import { ToolShell } from "@/components/editor/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as e, responsiveEditor as t, ui } from "@/content";
import { formatSize } from "@/lib/format";
import { imageSize } from "@/lib/image";
import { downloadResponsiveZip, exampleResponsiveDraft, fileToPicture, fileToVideo, isVideoName, renderResponsivePreview, responsiveProblems, tidy, VERSION_WIDTH, versionWeightKb, type ResponsiveDraft, type VersionName } from "@/lib/responsive";

const BUDGET_KB = 250; // a soft guide for what one viewer downloads
const PREVIEW_WIDTHS = [320, 430, 540, 600, 700];
const seconds = (ms: number) => Math.round(ms) / 1000;
const toMs = (s: number) => Math.max(0, Math.round(s * 1000));

type Dims = Record<string, { w: number; h: number }>;

// The banner as it runs in a slot of the chosen width, and which version that width shows. The safe zone can be drawn on top.
function Preview({ draft, safe, onSafe, onTryExample, working }: { draft: ResponsiveDraft; safe: boolean; onSafe: (v: boolean) => void; onTryExample: () => void; working: boolean }) {
  const c = draft.config;
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(700);
  const [W, setW] = useState(540);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const wanted: VersionName = W <= RB.breakpoint ? "small" : "large";
  const other: VersionName = wanted === "small" ? "large" : "small";
  const shown: VersionName = hasContent(c[wanted]) ? wanted : other;
  const empty = !hasContent(c.small) && !hasContent(c.large);
  const scale = Math.min(1, boxW / W);
  const [geom, setGeom] = useState<Geometry>({ width: W, height: RB.height });
  const gScale = Math.min(1, boxW / Number(geom.width));
  const zone = RB[shown].safe;
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{e.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{t.previewShows(RB[shown].width, W)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={safe} onChange={(ev) => onSafe(ev.target.checked)} />
            {t.safeZone}
          </label>
          <Tabs value={String(W)} onValueChange={(v) => setW(Number(v))}>
            <TabsList aria-label={t.previewWidth}>
              {PREVIEW_WIDTHS.map((w) => (
                <TabsTrigger key={w} value={String(w)}>
                  {w}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden rounded-lg border bg-muted/30"} style={{ height: empty ? 200 : Math.round(RB.height * Math.max(scale, gScale)) + 2 }}>
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ width: Math.round(Number(geom.width) * gScale), height: Math.round(RB.height * gScale) }}>
            <SwapFrame build={(id) => renderResponsivePreview(draft, id)} deps={[draft, W]} width={W} height={RB.height} scaleFor={(w) => Math.min(1, boxW / w)} onShown={setGeom} title={ui.bannerPreview} sameOrigin />
            {safe && (
              <div className="pointer-events-none absolute top-0 bottom-0 border-x-2 border-dashed border-yellow-400/90 bg-yellow-300/10" style={{ left: Math.round(((Number(geom.width) - zone) / 2) * gScale), width: Math.round(zone * gScale) }} aria-hidden>
                <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded bg-yellow-300 px-1.5 text-[10px] font-semibold text-black">{zone}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// One version of the banner: a video, or pictures. Each has its own size and safe zone.
function VersionCard({ name, draft, dims, onChange, onDims, onTask }: { name: VersionName; draft: ResponsiveDraft; dims: Dims; onChange: (d: ResponsiveDraft) => void; onDims: (key: string, w: number, h: number) => void; onTask: (job: () => Promise<void>) => Promise<void> }) {
  const v = draft.config[name];
  const s = RB[name];
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const set = (patch: Partial<typeof v>) => onChange(tidy({ ...draft, config: { ...draft.config, [name]: { ...v, ...patch } } }));

  const addVideo = (file: File | undefined) => {
    if (!file) return;
    if (!isVideoName(file.name) && !file.type.startsWith("video/")) return void toast.error(t.onlyVideo);
    return onTask(async () => {
      const p = await fileToVideo(file);
      onDims(p.key, p.width, p.height);
      const files = { ...draft.files, [p.key]: p.file, ...(p.poster ? { [p.poster.key]: p.poster.file } : {}) };
      onChange(tidy({ ...draft, files, config: { ...draft.config, [name]: { ...v, kind: "video", video: p.key, poster: p.poster?.key ?? "" } } }));
    });
  };
  const addPictures = (list: FileList | File[] | null) => {
    const files = [...(list ?? [])].filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!files.length) return void toast.error(t.onlyPictures);
    return onTask(async () => {
      const added = await Promise.all(files.map(fileToPicture));
      added.forEach((p) => onDims(p.key, p.width, p.height));
      const next = { ...draft.files };
      added.forEach((p) => (next[p.key] = p.file));
      onChange({ ...draft, files: next, config: { ...draft.config, [name]: { ...v, kind: "pictures", pictures: [...v.pictures, ...added.map((p) => p.key)] } } });
    });
  };
  const move = (i: number, d: -1 | 1) => {
    const pictures = [...v.pictures];
    const [p] = pictures.splice(i, 1);
    pictures.splice(i + d, 0, p!);
    set({ pictures });
  };
  const sizeNote = (key: string) => {
    const d = dims[key];
    if (!d || !d.w) return null;
    return pictureFits(name, d.w, d.h) ? (
      <span className="text-xs text-green-700 dark:text-green-400">{t.sizeOk(d.w, d.h)}</span>
    ) : (
      <span className="flex items-start gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden /> {t.sizeWrong(d.w, d.h, s.width, s.height)}
      </span>
    );
  };

  const drop = {
    onDragOver: (ev: React.DragEvent) => (ev.preventDefault(), setOver(true)),
    onDragLeave: () => setOver(false),
    onDrop: (ev: React.DragEvent) => {
      ev.preventDefault();
      setOver(false);
      if (v.kind === "video") void addVideo(ev.dataTransfer.files[0]);
      else void addPictures(ev.dataTransfer.files);
    },
  };

  return (
    <Section title={t.versionTitle(s.width, s.height)} description={t.versionWhen(name)} icon={name === "small" ? Clapperboard : Images} tone={name === "small" ? "red" : "yellow"}>
      <div className="space-y-3">
        <p className="rounded-lg bg-yellow-300/20 p-2.5 text-xs">{t.safeNote(s.safe, s.width)}</p>
        <Choice label={t.kind} value={v.kind} options={[{ id: "video", label: t.kindVideo }, { id: "pictures", label: t.kindPictures }]} onChange={(kind) => set({ kind })} />

        <div className={`rounded-xl border-2 border-dashed p-3 transition-colors ${over ? "border-primary bg-primary/5" : ""}`} {...drop}>
          <input ref={input} type="file" multiple={v.kind === "pictures"} accept={v.kind === "video" ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp"} className="sr-only" tabIndex={-1} aria-hidden onChange={(ev) => (v.kind === "video" ? void addVideo(ev.target.files?.[0]) : void addPictures(ev.target.files), (ev.target.value = ""))} />

          {v.kind === "video" ? (
            <div className="space-y-2">
              {v.video && draft.files[v.video] && (
                <div className="flex items-center gap-3">
                  {v.poster && draft.files[v.poster] ? <img src={draft.files[v.poster]!.dataUrl} alt="" className="h-12 w-32 rounded border object-cover" /> : <div className="flex h-12 w-32 items-center justify-center rounded border bg-muted"><Clapperboard className="size-5 text-muted-foreground" aria-hidden /></div>}
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="truncate font-medium">{formatSize(draft.files[v.video]!.bytes.length)}</div>
                    {sizeNote(v.video)}
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={t.removeVideo} onClick={() => set({ video: "", poster: "" })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
              <Button id={`rb-${name}-add`} variant="outline" className="gap-2" onClick={() => input.current?.click()}>
                <Clapperboard className="size-4" /> {v.video ? t.changeVideo : t.chooseVideo}
              </Button>
              <p className="text-xs text-muted-foreground">{t.videoNote}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <ol className="space-y-2" aria-label={t.kindPictures}>
                {v.pictures.map((k, i) => (
                  <li key={k + i} className="flex items-center gap-2 rounded-lg border bg-card p-1.5">
                    <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                    {draft.files[k] && <img src={draft.files[k]!.dataUrl} alt="" className="h-10 w-28 rounded border object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">{draft.files[k] ? formatSize(draft.files[k]!.bytes.length) : ""}</div>
                      {sizeNote(k)}
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={t.moveUp(i + 1)} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={t.moveDown(i + 1)} disabled={i === v.pictures.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={t.removeOne(i + 1)} onClick={() => set({ pictures: v.pictures.filter((_, j) => j !== i) })}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ol>
              <Button id={`rb-${name}-add`} variant="outline" className="gap-2" onClick={() => input.current?.click()}>
                <ImagePlus className="size-4" /> {v.pictures.length ? t.addMore : t.addPictures}
              </Button>
              <p className="text-xs text-muted-foreground">{t.picturesNote}</p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t.dropHere}</p>
        </div>
        {!hasContent(v) && <p className="text-xs text-muted-foreground">{t.emptyVersion}</p>}
      </div>
    </Section>
  );
}

// Full-screen editor for the responsive banner.
export function ResponsiveBannerEditor({ draft, onChange, onBack }: { draft: ResponsiveDraft; onChange: (d: ResponsiveDraft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(0); // jobs running (pictures and videos are being read)
  const [safe, setSafe] = useState(true);
  const [dims, setDims] = useState<Dims>({});
  const c = draft.config;
  const issues = responsiveProblems(draft);
  const weights = useMemo(() => ({ small: versionWeightKb(draft, "small"), large: versionWeightKb(draft, "large") }), [draft]);
  const multi = [c.small, c.large].some((v) => v.kind === "pictures" && v.pictures.length > 1);

  // Pictures that came back from the saved work have no known size yet: read it.
  useEffect(() => {
    const missing = Object.entries(draft.files).filter(([k, f]) => !dims[k] && f.dataUrl && !isVideoName(f.name));
    if (!missing.length) return;
    void Promise.all(missing.map(async ([k, f]) => [k, await imageSize(f.dataUrl)] as const)).then((list) => setDims((d) => ({ ...d, ...Object.fromEntries(list.filter(([, s]) => s).map(([k, s]) => [k, { w: s!.width, h: s!.height }])) })));
  }, [draft.files, dims]);

  const task = async (job: () => Promise<void>) => {
    setWorking((n) => n + 1);
    try {
      await job();
    } catch {
      toast.error(t.readFailed);
    } finally {
      setWorking((n) => n - 1);
    }
  };
  const loadExample = () =>
    task(async () => {
      const ex = await exampleResponsiveDraft();
      onChange(ex);
      setDims({});
      toast.success(e.exampleLoaded);
    });
  const download = async () => {
    setBusy(true);
    try {
      await downloadResponsiveZip(draft);
    } finally {
      setBusy(false);
    }
  };
  const worst = Math.max(weights.small, weights.large);
  const set = (patch: Partial<ResponsiveDraft["config"]>) => onChange({ ...draft, config: { ...c, ...patch } });

  return (
    <ToolShell
      title={c.campaign.trim() || t.untitled}
      subtitle={`${t.heading} · ${RB.minWidth}-${RB.maxWidth} x ${RB.height}`}
      problems={issues}
      readyText={e.ready}
      doneText={t.allGood}
      busy={busy}
      onDownload={download}
      onBack={onBack}
      extra={
        <>
          <HoverPill tone="plain" icon={<FileArchive className="size-3.5" />} label={`${worst.toFixed(0)} KB`}>
            {() => (
              <div className="space-y-2">
                <div className="text-sm font-medium">{t.weightTitle}</div>
                {(["small", "large"] as VersionName[]).map((n) => (
                  <div key={n} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{VERSION_WIDTH[n]}x{RB.height}</span>
                      <span className="font-mono">{weights[n].toFixed(0)} / {BUDGET_KB} KB</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(weights[n])} aria-valuemax={BUDGET_KB} aria-label={`${VERSION_WIDTH[n]}`}>
                      <div className={weights[n] > BUDGET_KB ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, (weights[n] / BUDGET_KB) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t.weightHelp}</p>
              </div>
            )}
          </HoverPill>
          <Button variant="outline" size="sm" className="gap-2 max-md:size-8 max-sm:size-10 max-md:rounded-full max-md:p-0" disabled={working > 0} onClick={loadExample}>
            {working > 0 ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-5">
            <Preview draft={draft} safe={safe} onSafe={setSafe} onTryExample={loadExample} working={working > 0} />
            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              <ScanLine className="mt-0.5 size-4 shrink-0" aria-hidden /> {t.howItWorks}
            </p>
            <Section title={t.nameTitle} description={t.nameHint} icon={Link2} tone="red">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign">{t.campaign}</Label>
                  <Input id="campaign" value={c.campaign} placeholder={t.campaignPlaceholder} onChange={(ev) => set({ campaign: ev.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="href">{t.link}</Label>
                  <Input id="href" type="url" placeholder="https://" value={c.href} onChange={(ev) => set({ href: ev.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.linkHint}</p>
                </div>
              </div>
            </Section>
          </div>

          <div className="min-w-0 space-y-5">
            {(["small", "large"] as VersionName[]).map((n) => (
              <VersionCard key={n} name={n} draft={draft} dims={dims} onChange={onChange} onDims={(k, w, h) => setDims((d) => ({ ...d, [k]: { w, h } }))} onTask={task} />
            ))}
            {multi && (
              <Section title={t.timeTitle} description={t.timeHint} icon={Timer} tone="red">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Num id="hold" label={t.hold} value={seconds(c.holdMs)} min={0.3} step={0.1} onChange={(v) => set({ holdMs: toMs(v) })} />
                    <Num id="fade" label={t.fade} value={seconds(c.fadeMs)} min={0} step={0.1} onChange={(v) => set({ fadeMs: toMs(v) })} hint={c.fadeMs > c.holdMs ? t.fadeTooLong : undefined} />
                  </div>
                  <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">{t.fadeExplain}</p>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}

