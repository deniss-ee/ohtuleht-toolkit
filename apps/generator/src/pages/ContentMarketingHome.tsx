import { useRef } from "react";
import { ChevronRight, FileUp, LayoutTemplate, Images, Newspaper, PanelTop, Smartphone, type LucideIcon } from "lucide-react";
import { ContinueCard } from "@/components/editor/ContinueCard";
import { PageHeader } from "@/components/editor/PageHeader";
import { StartCard } from "@/components/editor/StartCard";
import { bannerTypes, contentMarketing as t } from "@/content";
import type { SavedInfo } from "@/lib/storage";

// One icon per banner type (picked by id so new types only need an entry here).
const ICONS: Record<string, LucideIcon> = {
  "header-bar": PanelTop,
  "articles-1250x400": Newspaper,
  "articles-ad-1250x400": Newspaper,
  "image-slider-1250x400": Images,
  "articles-mobile": Smartphone,
  "articles-600x500": Smartphone,
  "image-slider-600x500": Smartphone,
};

// Start screen of the category: pick a banner type or open an existing zip.
// Every card is built the same way (title, details, button at the bottom) so rows line up.
export function ContentMarketingHome({ onCreate, onUpload, saved, onContinue, onDiscard }: { onCreate: (typeId: string) => void; onUpload: (file: File) => void; saved: SavedInfo | null; onContinue: () => void; onDiscard: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={LayoutTemplate} title={t.title} intro={t.intro} />

      {saved && <ContinueCard saved={saved} onContinue={onContinue} onDiscard={onDiscard} />}

      <ol className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/50 p-4 sm:flex-row sm:items-stretch sm:gap-2">
        {t.steps.map((s, i) => (
          <li key={s.title} className="flex flex-1 items-start gap-3 sm:items-center">
            {i > 0 && <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" aria-hidden />}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="text-sm text-muted-foreground">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bannerTypes.map((b) => (
          <StartCard key={b.id} icon={ICONS[b.id] ?? Newspaper} title={b.name} text={b.description} badges={[b.size, b.device]} action={b.ready ? t.create : t.soon} disabled={!b.ready} onAction={() => onCreate(b.id)} />
        ))}
        <StartCard
          icon={FileUp}
          tone="yellow"
          variant="outline"
          title={t.uploadTitle}
          text={t.uploadText}
          badges={[".zip"]}
          action={t.uploadButton}
          onAction={() => input.current?.click()}
          extra={
            <input
              ref={input}
              type="file"
              accept=".zip,application/zip"
              className="sr-only"
              aria-label={t.uploadButton}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onUpload(f);
              }}
            />
          }
        />
      </div>
    </div>
  );
}
