import { useEffect, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { ui } from "@/content";

const isZip = (f: File) => /\.zip$/i.test(f.name) || f.type === "application/zip" || f.type === "application/x-zip-compressed";

// Drop a banner zip anywhere on the site to open it, from any page. While files are dragged over the window a full-page sign says so.
// A drop on a place that takes files itself (a picture box, the "Open a banner" strip) is left to that place: it calls preventDefault first.
export function DropZip({ onZip }: { onZip: (file: File) => void }) {
  const [shown, setShown] = useState(false);
  const depth = useRef(0); // dragenter and dragleave fire for every child; count them to know when the drag really left the window
  const latest = useRef(onZip);
  latest.current = onZip;

  useEffect(() => {
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");
    // The sign shows only for a zip (a picture dragged onto a picture box must not say "open a banner").
    const hasZip = (e: DragEvent) => [...(e.dataTransfer?.items ?? [])].some((i) => i.kind === "file" && /zip/i.test(i.type));
    const enter = (e: DragEvent) => {
      if (!hasZip(e)) return;
      depth.current++;
      setShown(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasZip(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setShown(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault(); // allows the drop (otherwise the browser opens the file and leaves the site)
    };
    const drop = (e: DragEvent) => {
      depth.current = 0;
      setShown(false);
      if (!hasFiles(e) || e.defaultPrevented) return;
      e.preventDefault();
      const zip = [...(e.dataTransfer?.files ?? [])].find(isZip);
      if (zip) latest.current(zip);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, []);

  if (!shown) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm" aria-hidden>
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-background px-10 py-8 text-center shadow-lg">
        <FileUp className="size-8 text-primary" />
        <div className="text-lg font-semibold">{ui.dropZipTitle}</div>
        <div className="text-sm text-muted-foreground">{ui.dropZipText}</div>
      </div>
    </div>
  );
}
