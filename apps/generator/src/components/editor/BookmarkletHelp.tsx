import { useEffect, useRef } from "react";
import { Bookmark, CircleHelp, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { editor as t } from "@/content";
import { bookmarkletHref, bookmarkletText } from "@/lib/bookmarklet";

// How to get article snippets: install the bookmark once, click it on every article.
export function BookmarkletHelp() {
  const link = useRef<HTMLAnchorElement>(null);
  // React blocks "javascript:" in href props, so the bookmark link is set directly on the element.
  const attach = (el: HTMLAnchorElement | null) => {
    link.current = el;
    el?.setAttribute("href", bookmarkletHref);
  };
  useEffect(() => link.current?.setAttribute("href", bookmarkletHref));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto gap-1.5 p-0">
          <CircleHelp className="size-4" /> {t.howToSnippet}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.bookmarkTitle}</DialogTitle>
          <DialogDescription>{t.bookmarkIntro}</DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-4 pl-5 text-sm">
          <li className="space-y-2">
            <p>{t.bookmarkStep1}</p>
            <a
              ref={attach}
              draggable
              onClick={(e) => e.preventDefault()}
              className="inline-flex cursor-grab items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <Bookmark className="size-4" /> {t.bookmarkName}
            </a>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  await navigator.clipboard.writeText(bookmarkletText);
                  toast.success(t.bookmarkCopied);
                }}
              >
                <Copy className="size-4" /> {t.bookmarkCopyCode}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">{t.bookmarkCopyHint}</p>
            </div>
          </li>
          <li>{t.bookmarkStep2}</li>
          <li>{t.bookmarkStep3}</li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
