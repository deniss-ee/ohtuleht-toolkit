import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bookmark, Copy, FileSearch } from "lucide-react";
import { BrandStrip, CopyField } from "@/components/editor/MarketingParts";
import { PageHeader } from "@/components/editor/PageHeader";
import { PictureConverter } from "@/pages/PictureConverter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketing as t } from "@/content";
import { scraperHref, scraperText } from "@/lib/bookmarklet";
import { copyText } from "@/lib/clipboard";
import { readScraped } from "@/lib/scraped";
import type { BrandTab } from "@/lib/route";

const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

// Tool: the marketing scraper. The bookmark on an article page opens this page with the article in the address (#a=...).
export function ArticleScraper({ onBack, onBrand }: { onBack: () => void; onBrand: (tab: BrandTab) => void }) {
  const [article] = useState(() => readScraped(location.hash)); // read once; the hash is removed below
  const link = useRef<HTMLAnchorElement | null>(null);
  // React blocks "javascript:" in href props, so the bookmark link is set directly on the element.
  useEffect(() => link.current?.setAttribute("href", scraperHref));
  useEffect(() => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }, []);

  const copyAll = () => {
    if (!article) return;
    void copyText([article.title, article.lead, article.url, article.image].join("\n"), t.copiedAll);
  };
  const copyBanner = () => {
    if (!article) return;
    const snippet: Record<string, string> = { url: article.url, title: article.title, image: article.image };
    if (article.badge) snippet.badge = article.badge;
    void copyText(JSON.stringify(snippet), t.copiedBanner);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> {t.back}
      </Button>
      <PageHeader icon={FileSearch} title={t.scraperTitle} intro={t.scraperIntro} />

      {article ? (
        <section aria-labelledby="scraped" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="scraped" className="text-lg font-semibold">
              {t.resultTitle}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-2" onClick={copyAll}>
                <Copy className="size-4" /> {t.copyAll}
              </Button>
              <Button size="sm" variant="outline" onClick={copyBanner}>
                {t.copyBanner}
              </Button>
            </div>
          </div>
          <CopyField label={t.fields.title} value={article.title} />
          <CopyField label={t.fields.lead} value={article.lead} missing={t.leadMissing} />
          <CopyField label={t.fields.url} value={article.url} />
          <CopyField label={t.fields.image} value={article.image} />
          {article.image && <img src={article.image} alt={t.pictureAlt} className="max-h-60 rounded-xl border object-cover" />}
        </section>
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t.noData}</p>
      )}

      <section aria-labelledby="install" className="space-y-3 rounded-xl border bg-card p-4">
        <h2 id="install" className="text-lg font-semibold">
          {t.installTitle}
        </h2>
        {isLocal && (
          <p role="alert" className="rounded-md border border-yellow-500/50 bg-yellow-300/20 p-3 text-sm">
            {t.installLocal}
          </p>
        )}
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li className="space-y-2">
            <p>{t.installStep1}</p>
            <a
              ref={link}
              draggable
              onClick={(e) => e.preventDefault()}
              className="inline-flex cursor-grab items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <Bookmark className="size-4" /> {t.installName}
            </a>
            <div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => void copyText(scraperText, t.installCopied)}>
                <Copy className="size-4" /> {t.installCopyCode}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">{t.installCopyHint}</p>
            </div>
          </li>
          <li>{t.installStep2}</li>
        </ol>
      </section>

      <section aria-labelledby="by-id" className="space-y-2 rounded-xl border bg-card p-4 opacity-70">
        <h2 id="by-id" className="font-semibold">
          {t.idTitle}
        </h2>
        <Input disabled placeholder={t.idPlaceholder} aria-label={t.idTitle} />
        <Label className="text-xs font-normal text-muted-foreground">{t.idHint}</Label>
      </section>

      <PictureConverter embedded />
      <BrandStrip onGo={onBrand} />
    </div>
  );
}
