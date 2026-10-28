import { FileUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { bannerTypes, contentMarketing as t } from "@/content";

// Start screen of the category. Buttons get real behaviour in the form issues.
export function ContentMarketingHome() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bannerTypes.map((b) => (
          <Card key={b.id} className={b.ready ? undefined : "opacity-60"}>
            <CardHeader>
              <CardTitle>{b.name}</CardTitle>
              <CardDescription>{b.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Badge variant="secondary">{b.size}</Badge>
              <Badge variant="outline">{b.device}</Badge>
            </CardContent>
            <CardFooter>
              <Button disabled={!b.ready}>{b.ready ? t.create : t.soon}</Button>
            </CardFooter>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle>{t.uploadTitle}</CardTitle>
            <CardDescription>{t.uploadText}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="gap-2">
              <FileUp className="size-4" /> {t.uploadButton}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
