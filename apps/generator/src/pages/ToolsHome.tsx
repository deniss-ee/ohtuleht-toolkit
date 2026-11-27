import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/editor/PageHeader";
import { PictureTile } from "@/components/editor/BannerPicture";
import { tools as t, type ToolInfo } from "@/content";

// Start screen of the Tools section: one tile per tool.
export function ToolsHome({ onOpen }: { onOpen: (id: ToolInfo["id"]) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={Wrench} title={t.title} intro={t.intro} />
      {/* v2: the same tiles with a drawing as on the first screen */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {t.items.map((i) => (
          <PictureTile key={i.id} id={i.id} title={i.name} text={i.description} badges={[i.tag]} disabled={!i.ready} soon={t.soon} onOpen={() => onOpen(i.id)} />
        ))}
      </div>
    </div>
  );
}
