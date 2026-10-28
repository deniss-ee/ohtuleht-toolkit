import { useRef } from "react";
import { FileUp, Images, Newspaper, Smartphone, type LucideIcon } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { bannerTypes, contentMarketing as t } from "@/content";

// One icon per banner type (picked by id so new types only need an entry here).
const ICONS: Record<string, LucideIcon> = {
  "articles-1250x400": Newspaper,
  "articles-ad-1250x400": Newspaper,
  "image-slider-1250x400": Images,
  "articles-600x500": Smartphone,
  "image-slider-600x500": Smartphone,
};

// Start screen of the category: pick a banner type or open an existing zip.
// Every card is built the same way (title, details, button at the bottom) so rows line up.
export function ContentMarketingHome({ onCreate, onUpload }: { onCreate: (typeId: string) => void; onUpload: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {t.steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3 rounded-xl border p-4">
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
          <Card key={b.id} className={b.ready ? "h-full" : "h-full opacity-60"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconChip icon={ICONS[b.id] ?? Newspaper} tone={b.ready ? "red" : "ink"} />
                <div>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription>{b.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Badge variant="secondary">{b.size}</Badge>
              <Badge variant="outline">{b.device}</Badge>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant={b.ready ? "default" : "secondary"} disabled={!b.ready} onClick={() => onCreate(b.id)}>
                {b.ready ? t.create : t.soon}
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconChip icon={FileUp} tone="yellow" />
              <div>
                <CardTitle>{t.uploadTitle}</CardTitle>
                <CardDescription>{t.uploadText}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="outline">.zip</Badge>
          </CardContent>
          <CardFooter className="mt-auto">
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
            <Button variant="outline" className="gap-2" onClick={() => input.current?.click()}>
              <FileUp className="size-4" /> {t.uploadButton}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
