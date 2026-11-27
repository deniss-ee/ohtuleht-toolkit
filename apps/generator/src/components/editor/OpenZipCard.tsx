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
      className={`@container rounded-xl border-[1.5px] border-dashed p-4 transition-colors ${over ? "border-primary bg-primary/5" : "border-foreground/15"}`}
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
      {/* Narrow place: stacked and centred like a drop area; wide: one row */}
      <div className="flex flex-col items-center gap-3 text-center @lg:flex-row @lg:text-left">
        <IconChip icon={FileUp} tone="yellow" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{t.uploadTitle}</div>
          <div className="text-sm text-muted-foreground">{t.uploadText}</div>
        </div>
        <Button variant="outline" onClick={() => input.current?.click()}>
          {t.uploadButton}
        </Button>
      </div>
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
