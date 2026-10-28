import { FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generatorHome as t } from "@/content";

// Start screen. The buttons get real behaviour in the form issues.
export function GeneratorHome() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.newBanner}</CardTitle>
            <CardDescription>Start from a template.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="gap-2">
              <Plus className="size-4" /> {t.newBanner}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.uploadZip}</CardTitle>
            <CardDescription>Edit a banner you made before.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              <FileUp className="size-4" /> {t.uploadZip}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
