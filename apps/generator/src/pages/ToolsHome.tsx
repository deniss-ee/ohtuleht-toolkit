import { Clapperboard, Crop, Wrench, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/editor/PageHeader";
import { IconChip } from "@/components/editor/IconChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tools as t, type ToolInfo } from "@/content";

const ICONS: Record<ToolInfo["id"], LucideIcon> = { "image-cropper": Crop, "movie-banner": Clapperboard };

// Start screen of the Tools section: one card per tool.
export function ToolsHome({ onOpen }: { onOpen: (id: ToolInfo["id"]) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader icon={Wrench} title={t.title} intro={t.intro} />
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((i) => (
          <Card key={i.id} className={i.ready ? "h-full" : "h-full opacity-60"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconChip icon={ICONS[i.id]} tone={i.ready ? "red" : "ink"} />
                <div>
                  <CardTitle>{i.name}</CardTitle>
                  <CardDescription>{i.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{i.tag}</Badge>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant={i.ready ? "default" : "secondary"} disabled={!i.ready} onClick={() => onOpen(i.id)}>
                {i.ready ? t.open : t.soon}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
