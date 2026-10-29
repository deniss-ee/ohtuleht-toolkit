import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, ImagePlus, Video } from "lucide-react";
import { toast } from "sonner";
import { IconChip } from "@/components/editor/IconChip";
import { SwapFrame } from "@/components/editor/SwapFrame";
import { ToolShell } from "@/components/editor/ToolShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { movieBanner as t, ui } from "@/content";
import { downloadMovieZips, movieProblems, newMovieDraft, readPicture, renderMoviePreview, VERSIONS, type MovieDraft, type VersionKey } from "@/lib/movie";
import type { VideoPosition } from "@ohtuleht/templates";

const size = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Width of an element, kept up to date, so the preview can be scaled to fit.
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// Tool: video on a background picture, two zips for the ad server.
export function MovieBanner({ onBack }: { onBack: () => void }) {
  const [d, setD] = useState<MovieDraft>(newMovieDraft);
  const [shown, setShown] = useState<VersionKey>("a");
  const [busy, setBusy] = useState(false);
  const [box, boxWidth] = useWidth();
  const issues = movieProblems(d);
  const v = d[shown];

  const pickPicture = async (key: VersionKey, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error(t.notImage);
    try {
      const p = await readPicture(file);
      setD((s) => ({ ...s, [key]: { ...s[key], file, ...p } }));
      setShown(key);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.notImage);
    }
  };
  const pickVideo = (file: File | undefined) => {
    if (!file) return;
    if (!/^video\/(mp4|webm)$/.test(file.type)) return void toast.error(t.notVideo);
    setD((s) => ({ ...s, video: file, videoUrl: URL.createObjectURL(file) }));
  };
  const setVersion = (key: VersionKey, patch: Partial<MovieDraft["a"]>) => setD((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  const download = async () => {
    setBusy(true);
    try {
      const [a, b] = await downloadMovieZips(d);
      toast.success(t.saved(size(a), size(b)), { description: t.allowDownloads });
    } finally {
      setBusy(false);
    }
  };

  const scale = boxWidth && v.file ? Math.min(1, boxWidth / v.width) : 1;
  const pct = Math.round(scale * 100);
  const frameSize = `${v.width} x ${v.height} px`;

  return (
    <ToolShell
      title={t.title}
      subtitle={t.subtitle}
      problems={issues}
      readyText={t.ready}
      doneText={t.doneText}
      busy={busy}
      onDownload={download}
      onBack={onBack}
      downloadLabel={
        <>
          <Download className="size-4" /> {busy ? t.building : <>{ui.downloadWord}<span className="hidden sm:inline"> {ui.suffixBothZips}</span></>}
        </>
      }
    >
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-24 pt-4">
      <p className="text-muted-foreground">{t.intro}</p>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t.previewTitle}</h2>
            <Tabs value={shown} onValueChange={(k) => setShown(k as VersionKey)}>
              <TabsList>
                {VERSIONS.map((x) => (
                  <TabsTrigger key={x.key} value={x.key}>
                    {x.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div ref={box} className="w-full">
            <div className="relative overflow-hidden rounded-lg border bg-muted/40" style={{ height: v.file ? Math.round(v.height * scale) : 200 }}>
              {v.file ? (
                <SwapFrame build={(id) => renderMoviePreview(d, shown, id)} deps={[d, shown]} width={v.width} height={v.height} scaleFor={() => scale} title={ui.bannerPreview} sameOrigin />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">{t.previewEmpty}</div>
              )}
            </div>
          </div>
          {v.file && <p className="text-xs text-muted-foreground">{pct < 100 ? t.previewScaled(pct, frameSize) : t.previewFull(frameSize)}</p>}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconChip icon={Video} tone="red" />
                <div>
                  <CardTitle>{t.videoTitle}</CardTitle>
                  <CardDescription>{t.videoHint}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <FileButton id="mv-video" accept="video/mp4,video/webm" label={d.video ? t.videoChange : t.videoChoose} name={d.video ? `${d.video.name} (${size(d.video.size)})` : t.noFile} onFile={pickVideo} icon={<Clapperboard className="size-4" />} />
              <div className="space-y-1.5">
                <Label htmlFor="mv-height">{t.videoHeight}</Label>
                <Input id="mv-height" type="number" inputMode="numeric" min={50} max={1000} value={d.videoHeight} onChange={(e) => setD({ ...d, videoHeight: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">{t.position}</span>
                <div role="radiogroup" aria-label={t.position} className="grid grid-cols-3 gap-2">
                  {t.positions.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center justify-center rounded-lg border p-2 text-sm has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
                      <input type="radio" name="mv-position" className="sr-only" checked={d.position === p.id} onChange={() => setD({ ...d, position: p.id as VideoPosition })} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              {d.position !== "center" && (
                <div className="space-y-1.5">
                  <Label htmlFor="mv-offset">{t.offset}</Label>
                  <Input id="mv-offset" type="number" inputMode="numeric" min={0} max={500} value={d.offset} onChange={(e) => setD({ ...d, offset: Number(e.target.value) })} />
                </div>
              )}
            </CardContent>
          </Card>

          {VERSIONS.map((x) => (
            <Card key={x.key}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconChip icon={ImagePlus} tone={x.key === "a" ? "red" : "yellow"} />
                  <div>
                    <CardTitle>{t.versionTitle(x.label)}</CardTitle>
                    {d[x.key].file && <CardDescription>{t.backgroundHint(d[x.key].width, d[x.key].height)}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <FileButton
                  id={`mv-bg-${x.key}`}
                  accept="image/*"
                  label={d[x.key].file ? t.backgroundChange : t.backgroundChoose}
                  name={d[x.key].file ? `${d[x.key].file!.name} (${size(d[x.key].file!.size)})` : t.noFile}
                  onFile={(f) => pickPicture(x.key, f)}
                  icon={<ImagePlus className="size-4" />}
                />
                <div className="space-y-1.5">
                  <Label htmlFor={`mv-link-${x.key}`}>{t.link}</Label>
                  <Input id={`mv-link-${x.key}`} type="url" placeholder={t.linkPlaceholder} value={d[x.key].href} onChange={(e) => setVersion(x.key, { href: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.linkHint}</p>
                </div>
              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
    </ToolShell>
  );
}

// A button that opens the file chooser and shows the chosen file name under it.
function FileButton({ id, accept, label, name, onFile, icon }: { id: string; accept: string; label: string; name: string; onFile: (f: File | undefined) => void; icon: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <input ref={input} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <Button id={id} type="button" variant="outline" className="gap-2" onClick={() => input.current?.click()}>
        {icon} {label}
      </Button>
      <p className="truncate text-xs text-muted-foreground">{name}</p>
    </div>
  );
}
