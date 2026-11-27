import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { Button } from "@/components/ui/button";
import { contentMarketing as t } from "@/content";

// "Open a banner you made before": a strip on the start screens (Home and Content marketing) where the zip of an earlier banner is chosen or dropped.
// Editing an existing banner is a main job, so it sits next to "Continue where you left off", not hidden in a card grid.
export function OpenZipCard({ onUpload }: { onUpload: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="region"
      aria-label={t.uploadTitle}
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 transition-colors ${over ? "border-primary bg-primary/5" : "bg-muted/50"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onUpload(f);
      }}
    >
      <IconChip icon={FileUp} tone="yellow" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{t.uploadTitle}</div>
        <div className="text-sm text-muted-foreground">{t.uploadText}</div>
      </div>
      <Button variant="outline" onClick={() => input.current?.click()}>
        {t.uploadButton}
      </Button>
      <input
        ref={input}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        aria-label={t.uploadButton}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onUpload(f);
        }}
      />
    </div>
  );
}
