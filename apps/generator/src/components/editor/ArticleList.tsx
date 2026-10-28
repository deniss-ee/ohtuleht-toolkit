import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ArticleItem } from "@ohtuleht/templates";
import { MIN_ARTICLES } from "@ohtuleht/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editor as t } from "@/content";
import { emptyArticle } from "@/lib/banner";
import { parseSnippets } from "@/lib/snippets";

export function ArticleList({ articles, onChange }: { articles: ArticleItem[]; onChange: (next: ArticleItem[]) => void }) {
  const [paste, setPaste] = useState("");

  const patch = (i: number, field: keyof ArticleItem, value: string) => onChange(articles.map((a, j) => (j === i ? { ...a, [field]: value } : a)));
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
        <CardTitle>
          {t.articles} ({articles.length})
        </CardTitle>
        <CardDescription>{t.articlesHint(MIN_ARTICLES)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paste">{t.pasteLabel}</Label>
          <Textarea id="paste" rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={t.pastePlaceholder} className="font-mono text-xs" />
          <Button variant="secondary" size="sm" className="gap-2" disabled={!paste.trim()} onClick={addSnippets}>
            <ClipboardPaste className="size-4" /> {t.pasteButton}
          </Button>
        </div>

        <ol className="space-y-3">
          {articles.map((a, i) => (
            <li key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">#{i + 1}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={t.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={t.moveDown} disabled={i === articles.length - 1} onClick={() => move(i, 1)}>
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={t.remove} onClick={() => onChange(articles.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Input aria-label={t.titleField} placeholder={t.titleField} value={a.title} onChange={(e) => patch(i, "title", e.target.value)} />
              <Input aria-label={t.articleUrl} placeholder={t.articleUrl} value={a.url} onChange={(e) => patch(i, "url", e.target.value)} />
              <Input aria-label={t.imageUrl} placeholder={t.imageUrl} value={a.image} onChange={(e) => patch(i, "image", e.target.value)} />
            </li>
          ))}
        </ol>
        <Button variant="outline" className="gap-2" onClick={() => onChange([...articles, emptyArticle()])}>
          <Plus className="size-4" /> {t.addArticle}
        </Button>
      </CardContent>
    </Card>
  );
}
