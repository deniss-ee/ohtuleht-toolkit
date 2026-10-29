import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Crosshair, Download, ImageUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ColorField } from "@/components/editor/ColorField";
import { ToolShell } from "@/components/editor/ToolShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageCropper as t, ui } from "@/content";
import { canMove, CANVAS_H, CANVAS_W, clampOffset, draw, makeBlur, MAX_WIDTH, MAX_ZOOM, MIN_WIDTH, newCropState, type CropState, type FitMode } from "@/lib/cropper";
import { download } from "@/lib/zip";

const JPG_QUALITY = 0.95;
const size = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

interface Loaded {
  img: HTMLImageElement;
  name: string; // file name without extension
}

function loadImage(file: File): Promise<Loaded> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error(t.notImage));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // the picture is decoded, the address is not needed any more
      resolve({ img, name: file.name.replace(/\.[^.]+$/, "") });
    };
    img.onerror = () => reject(new Error(t.loadFailed));
    img.src = url;
  });
}

// Tool: any picture onto a 1920x1080 canvas, saved as JPG.
export function ImageCropper({ onBack }: { onBack: () => void }) {
  const [pic, setPic] = useState<Loaded | null>(null);
  const [state, setState] = useState<CropState>(newCropState);
  const [over, setOver] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // The blur is slow to make, so it is made once per picture.
  const blur = useMemo(() => (pic ? makeBlur(pic.img) : null), [pic]);
  const movable = pic ? canMove(pic.img, state) : false;
  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx && pic) draw(ctx, pic.img, state, blur);
  }, [pic, state, blur]);

  // Ctrl+V: a picture from the clipboard (a screenshot, or "copy image" in a browser).
  const openRef = useRef<(f: File | undefined) => void>(() => {});
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"))?.getAsFile();
      if (!file) return;
      e.preventDefault();
      openRef.current(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Mouse wheel and pinch zoom the picture (fill and custom width only; other modes leave the page scrolling).
  const picRef = useRef(pic);
  picRef.current = pic;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const p = picRef.current;
      if (!p) return;
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setState((s) => {
        if (s.mode === "cover") {
          return clampOffset(p.img, { ...s, zoom: Math.min(MAX_ZOOM, Math.max(1, s.zoom * factor)) });
        }
        if (s.mode === "custom") {
          return clampOffset(p.img, { ...s, width: Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, (s.width || MIN_WIDTH) * factor))) });
        }
        return s;
      });
      // Only these two modes zoom, so only there the page must not scroll.
      if (modeRef.current === "cover" || modeRef.current === "custom") e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const open = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPic(await loadImage(file));
      setState((s) => ({ ...s, ox: 0, oy: 0 }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.loadFailed);
    }
  };

  openRef.current = open;

  // Estimated size of the file, so nobody downloads a 5 MB picture by surprise. Made a moment after the last change.
  const [bytes, setBytes] = useState<number | null>(null);
  useEffect(() => {
    if (!pic) return void setBytes(null);
    const timer = setTimeout(() => canvas.current?.toBlob((b) => setBytes(b ? b.size : null), "image/jpeg", JPG_QUALITY), 500);
    return () => clearTimeout(timer);
  }, [pic, state, blur]);

  // Changing a setting also keeps the picture inside the allowed area.
  const update = (patch: Partial<CropState>) => setState((s) => (pic ? clampOffset(pic.img, { ...s, ...patch }) : { ...s, ...patch }));
  const move = (dx: number, dy: number) => setState((s) => (pic ? clampOffset(pic.img, { ...s, ox: s.ox + dx, oy: s.oy + dy }) : s));

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!movable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: state.ox, oy: state.oy };
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !pic) return;
    const k = CANVAS_W / e.currentTarget.getBoundingClientRect().width; // screen px to canvas px
    setState((s) => clampOffset(pic.img, { ...s, ox: d.ox + (e.clientX - d.x) * k, oy: d.oy + (e.clientY - d.y) * k }));
  };
  const onKey = (e: KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 100 : 20;
    const keys: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if ((e.key === "+" || e.key === "=" || e.key === "-") && pic) {
      const up = e.key !== "-";
      if (state.mode === "cover") update({ zoom: Math.min(MAX_ZOOM, Math.max(1, state.zoom * (up ? 1.1 : 1 / 1.1))) });
      else if (state.mode === "custom") update({ width: Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, state.width * (up ? 1.1 : 1 / 1.1)))) });
      else return;
      e.preventDefault();
      return;
    }
    const k = keys[e.key];
    if (!k || !movable) return;
    e.preventDefault();
    move(k[0], k[1]);
  };

  const save = () => {
    if (!pic || !canvas.current) return;
    canvas.current.toBlob(
      (blob) => {
        if (!blob) return toast.error(t.loadFailed);
        download(blob, `${pic.name}_ol.jpg`);
        toast.success(t.downloaded);
      },
      "image/jpeg",
      JPG_QUALITY,
    );
  };

  const cursor = !pic ? "pointer" : movable ? (drag.current ? "grabbing" : "grab") : "default";

  return (
    <ToolShell
      title={t.title}
      subtitle={t.subtitle}
      problems={pic ? [] : [{ field: "crop-choose", message: t.choosePicture }]}
      readyText={ui.ready}
      doneText={t.doneText}
      onDownload={save}
      onBack={onBack}
      downloadLabel={
        <>
          <Download className="size-4" /> <>{ui.downloadWord}<span className="hidden sm:inline"> {ui.suffixJpg}</span>{bytes !== null && <span className="hidden text-xs font-normal opacity-80 md:inline"> · {size(bytes)}</span>}</>
        </>
      }
    >
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-24 pt-4">
      <p className="text-muted-foreground">{t.intro}</p>

      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { open(e.target.files?.[0]); e.target.value = ""; }} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <div
          className={`relative overflow-hidden rounded-xl border-2 border-dashed ${over ? "border-primary bg-primary/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); open(e.dataTransfer.files[0]); }}
        >
          <canvas
            ref={canvas}
            width={CANVAS_W}
            height={CANVAS_H}
            tabIndex={pic ? 0 : -1}
            role="img"
            aria-label={t.canvasLabel}
            className="block h-auto w-full touch-none select-none bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            style={{ cursor }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKey}
          />
          {!pic && (
            <button id="crop-choose" type="button" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" onClick={() => input.current?.click()}>
              <ImageUp className="size-12" />
              <span className="text-lg font-semibold text-foreground">{t.dropTitle}</span>
              <span className="text-sm">{t.dropHint}</span>
              <span className="text-sm">{t.pasteHint}</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.modeTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div role="radiogroup" aria-label={t.modeTitle} className="space-y-2">
                {t.modes.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
                    <input type="radio" name="fitmode" className="mt-1 accent-primary" checked={state.mode === m.id} onChange={() => update({ mode: m.id as FitMode, zoom: 1, ox: 0, oy: 0 })} />
                    <span>
                      <span className="block text-sm font-medium">{m.name}</span>
                      <span className="block text-xs text-muted-foreground">{m.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {state.mode === "cover" && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="crop-zoom">{t.zoom}: {Math.round(state.zoom * 100)}%</Label>
                  <input id="crop-zoom" type="range" min={100} max={MAX_ZOOM * 100} step={5} value={Math.round(state.zoom * 100)} onChange={(e) => update({ zoom: Number(e.target.value) / 100 })} className="w-full accent-primary" />
                  <p className="text-xs text-muted-foreground">{t.zoomHint}</p>
                </div>
              )}
              {state.mode === "custom" && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="crop-width">{t.width}</Label>
                  <Input id="crop-width" type="number" inputMode="numeric" min={MIN_WIDTH} max={MAX_WIDTH} value={state.width} onChange={(e) => update({ width: Number(e.target.value) })} />
                  <p className="text-xs text-muted-foreground">{t.widthHint} {t.zoomHint}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.backgroundTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div role="radiogroup" aria-label={t.backgroundTitle} className="grid grid-cols-2 gap-2">
                {[
                  { id: "blur", label: t.backgroundBlur },
                  { id: "colour", label: t.backgroundColour },
                ].map((b) => (
                  <label key={b.id} className="flex cursor-pointer items-center justify-center rounded-lg border p-2 text-center text-sm has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
                    <input
                      type="radio"
                      name="background"
                      className="sr-only"
                      checked={state.background.type === b.id}
                      onChange={() => update({ background: b.id === "blur" ? { type: "blur" } : { type: "colour", colour: "#ffffff" } })}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              {state.background.type === "colour" && <ColorField label={t.colour} value={state.background.colour} onChange={(colour) => update({ background: { type: "colour", colour } })} />}
            </CardContent>
          </Card>

          {pic && (
            <p className="text-xs text-muted-foreground">
              {t.size(pic.img.width, pic.img.height)}. {movable ? t.moveHint : t.noMove}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={!pic || !movable} onClick={() => update({ ox: 0, oy: 0 })}>
              <Crosshair className="size-4" /> {t.centre}
            </Button>
            <Button variant="outline" className="gap-2" disabled={!pic} onClick={() => input.current?.click()}>
              <RefreshCw className="size-4" /> {t.other}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </ToolShell>
  );
}
