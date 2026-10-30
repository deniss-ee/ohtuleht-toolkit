import { History } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { Button } from "@/components/ui/button";
import { contentMarketing as t, editor, getLang, headerBar, sliderEditor } from "@/content";
import type { SavedInfo } from "@/lib/storage";

// "Continue where you left off": shown on the start screens when an unfinished banner or header bar is saved in this browser.
export function ContinueCard({ saved, onContinue, onDiscard }: { saved: SavedInfo; onContinue: () => void; onDiscard: () => void }) {
  const name = saved.name.trim() || (saved.kind === "header" ? headerBar.untitled : saved.kind === "slider" ? sliderEditor.untitled : editor.untitled);
  const when = new Date(saved.savedAt).toLocaleString(getLang() === "et" ? "et-EE" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div role="region" aria-label={t.continueTitle} className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <IconChip icon={History} tone="red" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{t.continueTitle}</div>
        <div className="truncate text-sm text-muted-foreground">{t.continueText(saved.kind === "header" ? t.continueHeader : saved.kind === "slider" ? t.continueSlider : t.continueBanner, name, when)}</div>
      </div>
      <Button onClick={onContinue}>{t.continueButton}</Button>
      <Button variant="outline" onClick={onDiscard}>
        {t.continueDiscard}
      </Button>
    </div>
  );
}
