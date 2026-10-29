import { useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, ClipboardPaste, ImageOff, Newspaper, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ArticleItem } from "@ohtuleht/templates";
import { MIN_ARTICLES } from "@ohtuleht/templates";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/editor/ColorPicker";
import { IconChip } from "@/components/editor/IconChip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editor as t } from "@/content";
import { emptyArticle } from "@/lib/banner";
import { parseSnippets } from "@/lib/snippets";
import { readableOn } from "@ohtuleht/templates";
import { useTheme } from "@/components/theme-provider";

// Thumbnail of the article image so people can see what they are adding.
function Thumb({ src, badge, badgeColor }: { src: string; badge: string; badgeColor?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const bad = !src || failed === src;
  return (
    <div className="relative aspect-[300/215] w-full self-start overflow-hidden rounded-md bg-muted sm:w-56 sm:shrink-0">
      {bad ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
          <ImageOff className="size-5" />
          {t.noImage}
        </div>
      ) : (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} />
      )}
      {badge && (
        <span className="absolute bottom-0 left-0 bg-background px-1.5 pt-1 text-[11px] font-bold leading-none" style={{ color: badgeColor ? readableOn(badgeColor, resolvedTheme === "dark" ? "#111113" : "#ffffff") : "var(--foreground)" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function ArticleRow({
  index,
  total,
  article,
  defaultBadge,
  defaultColor,
  showBadge,
  onPatch,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  article: ArticleItem;
  defaultBadge: string;
  defaultColor: string;
  showBadge: boolean; // the mobile banner has no labels
  onPatch: (patch: Partial<ArticleItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = `a${index}`;
  const shownBadge = article.badge?.trim() || defaultBadge;
  return (
    <li className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{t.article(index + 1)}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={t.moveUp} disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t.moveDown} disabled={index === total - 1} onClick={() => onMove(1)}>
            <ChevronDown className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t.remove} onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Thumb src={article.image} badge={showBadge ? shownBadge : ""} badgeColor={article.badgeColor || defaultColor} />
        <div className="grid flex-1 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-title`}>{t.titleField}</Label>
            <Textarea id={`${id}-title`} rows={2} value={article.title} onChange={(e) => onPatch({ title: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-url`}>{t.articleUrl}</Label>
              <Input id={`${id}-url`} placeholder="https://www.ohtuleht.ee/…" value={article.url} onChange={(e) => onPatch({ url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-img`}>{t.imageUrl}</Label>
              <Input id={`${id}-img`} placeholder="https://p.ohtuleht.ee/…" value={article.image} onChange={(e) => onPatch({ image: e.target.value })} />
            </div>
          </div>
          {showBadge && (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-badge`}>{t.badgeField}</Label>
              <Input id={`${id}-badge`} placeholder={`${t.badgeDefault} (${defaultBadge || "—"})`} value={article.badge ?? ""} onChange={(e) => onPatch({ badge: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-color`}>{t.badgeColor}</Label>
              <div className="flex items-center gap-2">
                <ColorPicker label={t.badgeColor} value={article.badgeColor || defaultColor} onChange={(hex) => onPatch({ badgeColor: hex })} />
                <Button variant="ghost" size="sm" disabled={!article.badgeColor} onClick={() => onPatch({ badgeColor: undefined })}>
                  {t.useDefault}
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function ArticleList({
  articles,
  defaultBadge,
  defaultColor,
  showBadge = true,
  onChange,
  onOpenBookmark,
}: {
  articles: ArticleItem[];
  defaultBadge: string;
  defaultColor: string;
  showBadge?: boolean;
  onChange: (next: ArticleItem[]) => void;
  onOpenBookmark: () => void;
}) {
  const [paste, setPaste] = useState("");

  const patch = (i: number, p: Partial<ArticleItem>) =>
    onChange(
      articles.map((a, j) => {
        if (j !== i) return a;
        const next = { ...a, ...p };
        // Drop empty optional fields so exported files stay clean.
        if (!next.badge?.trim()) delete next.badge;
        if (!next.badgeColor) delete next.badgeColor;
        return next;
      }),
    );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= articles.length) return;
    const next = articles.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  const addSnippets = () => {
    const { articles: found, skipped } = parseSnippets(paste);
    if (!found.length) {
      toast.error(t.pasteNothing);
      return;
    }
    onChange([...articles, ...found]);
    setPaste("");
    toast.success(t.pasteAdded(found.length, skipped));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconChip icon={Newspaper} tone="red" />
          <div>
            <CardTitle>
              {t.articlesTitle} <span className="font-normal text-muted-foreground">({articles.length})</span>
            </CardTitle>
            <CardDescription>{t.articlesHint(MIN_ARTICLES)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="max-w-xl text-sm">{t.firstTime}</p>
          <Button className="gap-2" onClick={onOpenBookmark}>
            <Bookmark className="size-4" /> {t.howToSnippet}
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-dashed p-4">
          <Label htmlFor="paste">{t.pasteLabel}</Label>
          <Textarea id="paste" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={t.pastePlaceholder} className="font-mono text-xs" />
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2" disabled={!paste.trim()} onClick={addSnippets}>
              <ClipboardPaste className="size-4" /> {t.pasteButton}
            </Button>
          </div>
        </div>

        {articles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t.emptyArticles}</p>
        ) : (
          <ol className="space-y-3">
            {articles.map((a, i) => (
              <ArticleRow
                key={i}
                index={i}
                total={articles.length}
                article={a}
                defaultBadge={defaultBadge}
                defaultColor={defaultColor}
                showBadge={showBadge}
                onPatch={(p) => patch(i, p)}
                onMove={(d) => move(i, d)}
                onRemove={() => onChange(articles.filter((_, j) => j !== i))}
              />
            ))}
          </ol>
        )}
        <Button variant="outline" className="gap-2" onClick={() => onChange([...articles, emptyArticle()])}>
          <Plus className="size-4" /> {t.addArticle}
        </Button>
      </CardContent>
    </Card>
  );
}
