import { ChevronRight, LayoutTemplate } from "lucide-react";
import { ContinueCard } from "@/components/editor/ContinueCard";
import { PageHeader } from "@/components/editor/PageHeader";
import { OpenZipCard } from "@/components/editor/OpenZipCard";
import { PictureTile } from "@/components/editor/BannerPicture";
import { bannerTypes, contentMarketing as t } from "@/content";
import type { SavedInfo } from "@/lib/saved";


// Start screen of the category: pick a banner type or open an existing zip.
// Every card is built the same way (title, details, button at the bottom) so rows line up.
export function ContentMarketingHome({ onCreate, onUpload, saved, onContinue, onDiscard }: { onCreate: (typeId: string) => void; onUpload: (file: File) => void; saved: SavedInfo | null; onContinue: () => void; onDiscard: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={LayoutTemplate} title={t.title} intro={t.intro} />

      {saved && <ContinueCard saved={saved} onContinue={onContinue} onDiscard={onDiscard} />}

      <OpenZipCard onUpload={onUpload} />

      <ol className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-panel ring-1 ring-foreground/[0.07] sm:flex-row sm:items-stretch sm:gap-2">
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

      {/* v2: the same tiles with a drawing as on the first screen */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {bannerTypes.map((b) => (
          <PictureTile key={b.id} id={b.id} title={b.name} text={b.description} badges={[b.size, b.device]} disabled={!b.ready} soon={t.soon} onOpen={() => onCreate(b.id)} />
        ))}
      </div>
    </div>
  );
}
