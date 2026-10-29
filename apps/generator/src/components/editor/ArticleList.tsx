import { useEffect, useState } from "react";
import { Bookmark, ChevronDown, ChevronRight, ChevronUp, ClipboardPaste, ImageOff, Newspaper, Plus, Trash2, TriangleAlert } from "lucide-react";
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

// Small picture for the closed row.
function MiniThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const bad = !src || failed === src;
  return (
    <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
      {bad ? <ImageOff className="size-4 text-muted-foreground" /> : <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(src)} />}
    </div>
  );
}

// One article. Closed: a single line (picture, number, title, buttons). Open: the whole form.
// The form stays in the page while closed (hidden), so "to fix" links can find its fields.
function ArticleRow({
  index,
  total,
  article,
  defaultBadge,
  defaultColor,
  open,
  onToggle,
  onPatch,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  article: ArticleItem;
  defaultBadge: string;
  defaultColor: string;
  open: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<ArticleItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = `a${index}`;
  const shownBadge = article.badge?.trim() || defaultBadge;
  const incomplete = !article.title.trim() || !article.url.trim() || !article.image.trim();
  return (
    <li className="rounded-lg border bg-card">
      <div className="flex items-center gap-1 p-1.5">
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left hover:bg-muted/60" onClick={onToggle}>
          <MiniThumb src={article.image} />
          <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{article.title.trim() || t.untitledArticle}</span>
          {incomplete && <TriangleAlert className="size-4 shrink-0 text-yellow-600" aria-label={t.articleIncomplete} />}
          <ChevronRight className={"size-4 shrink-0 text-muted-foreground transition-transform" + (open ? " rotate-90" : "")} />
        </button>
        <div className="flex shrink-0">
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
      <div id={`${id}-body`} hidden={!open} className="border-t p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Thumb src={article.image} badge={shownBadge} badgeColor={article.badgeColor || defaultColor} />
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
        </div>
      </div>
      </div>
    </li>
  );
}

export function ArticleList({
  articles,
  defaultBadge,
  defaultColor,
  onChange,
  onOpenBookmark,
}: {
  articles: ArticleItem[];
  defaultBadge: string;
  defaultColor: string;
  onChange: (next: ArticleItem[]) => void;
  onOpenBookmark: () => void;
}) {
  const [paste, setPaste] = useState("");
  const [open, setOpen] = useState<number | null>(null); // one article open at a time keeps the list short

  // "To fix" links jump to a field inside a closed article: open it first.
  useEffect(() => {
    const reveal = (e: Event) => {
      const m = /^a(\d+)-/.exec((e as CustomEvent<string>).detail);
      if (m) setOpen(Number(m[1]));
    };
    window.addEventListener("ol-reveal", reveal);
    return () => window.removeEventListener("ol-reveal", reveal);
  }, []);

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
    if (open === i) setOpen(j);
    else if (open === j) setOpen(i);
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
          <ol className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {articles.map((a, i) => (
              <ArticleRow
                key={i}
                index={i}
                total={articles.length}
                article={a}
                defaultBadge={defaultBadge}
                defaultColor={defaultColor}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
                onPatch={(p) => patch(i, p)}
                onMove={(d) => move(i, d)}
                onRemove={() => {
                  onChange(articles.filter((_, j) => j !== i));
                  setOpen(open === null || open === i ? null : open > i ? open - 1 : open);
                }}
              />
            ))}
          </ol>
        )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            onChange([...articles, emptyArticle()]);
            setOpen(articles.length);
          }}
        >
          <Plus className="size-4" /> {t.addArticle}
        </Button>
      </CardContent>
    </Card>
  );
}
