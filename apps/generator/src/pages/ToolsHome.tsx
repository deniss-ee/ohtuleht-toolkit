import { Clapperboard, Crop, FileSearch, PenLine, Replace, Wrench, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/editor/PageHeader";
import { StartCard } from "@/components/editor/StartCard";
import { tools as t, type ToolInfo } from "@/content";

const ICONS: Record<ToolInfo["id"], LucideIcon> = { "image-cropper": Crop, "movie-banner": Clapperboard, "article-scraper": FileSearch, "picture-converter": Replace, "email-signature": PenLine };

// Start screen of the Tools section: one card per tool.
export function ToolsHome({ onOpen }: { onOpen: (id: ToolInfo["id"]) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={Wrench} title={t.title} intro={t.intro} />
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((i) => (
          <StartCard key={i.id} icon={ICONS[i.id]} title={i.name} text={i.description} badges={[i.tag]} action={i.ready ? t.open : t.soon} disabled={!i.ready} onAction={() => onOpen(i.id)} />
        ))}
      </div>
    </div>
  );
}
