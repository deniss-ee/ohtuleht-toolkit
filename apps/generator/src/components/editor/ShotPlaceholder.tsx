import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { guide as t } from "@/content";
import type { ShotRatio } from "@/guide-content";

const RATIO: Record<ShotRatio, string> = { "16:9": "16 / 9", "4:3": "4 / 3", "1:1": "1 / 1" };

// A screenshot slot. If the picture file public/guide/<id>.webp exists it is shown (click to enlarge);
// if not, a dashed frame says what to capture and what to call the file.
export function ShotPlaceholder({ id, caption, ratio = "16:9" }: { id: string; caption: string; ratio?: ShotRatio }) {
  const src = `${import.meta.env.BASE_URL}guide/${id}.webp`;
  const [state, setState] = useState<"checking" | "found" | "missing">("checking");
  const [big, setBig] = useState(false);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setState("found");
    img.onerror = () => alive && setState("missing");
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  if (state === "found")
    return (
      <>
        <button type="button" onClick={() => setBig(true)} className="block w-full overflow-hidden rounded-xl border bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" aria-label={t.enlarge}>
          <img src={src} alt={caption} loading="lazy" className="w-full" />
        </button>
        <Dialog open={big} onOpenChange={setBig}>
          <DialogContent className="max-w-[min(96vw,64rem)] sm:max-w-[min(96vw,64rem)]">
            <DialogTitle className="sr-only">{caption}</DialogTitle>
            <DialogDescription className="sr-only">{caption}</DialogDescription>
            <img src={src} alt={caption} className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      </>
    );
  return (
    <figure className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 p-6 text-center" style={{ aspectRatio: RATIO[ratio], minHeight: "9rem", maxHeight: "15rem" }} aria-label={t.shotTitle}>
      <Camera className="size-7 text-muted-foreground" aria-hidden />
      <figcaption className="max-w-md text-sm">
        <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t.shotTitle}</span>
        {caption}
      </figcaption>
      <code className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground">guide/{id}.webp</code>
    </figure>
  );
}
