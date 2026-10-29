import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { contentMarketing, editor, getLang, subscribeLang, type PageId, type ToolInfo } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { newDraft } from "@/lib/banner";
import { importHeaderZip, newHeaderDraft } from "@/lib/header";
import { clearWork, loadWork, readPage, savedInfo, saveWork, writePage, type SavedInfo, type Work } from "@/lib/storage";
import { importZip } from "@/lib/zip";
import { BannerEditor } from "@/pages/BannerEditor";
import { BrandManual } from "@/pages/BrandManual";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";
import { HeaderBarEditor } from "@/pages/HeaderBarEditor";
import { ImageCropper } from "@/pages/ImageCropper";
import { MovieBanner } from "@/pages/MovieBanner";
import { ToolsHome } from "@/pages/ToolsHome";

const PAGES: PageId[] = ["content", "tools", "brand"];

export function App() {
  useSyncExternalStore(subscribeLang, getLang); // render everything again when the language changes
  const [page, setPage] = useState<PageId>(() => PAGES.find((p) => p === readPage()) ?? "content"); // the section used last time
  const [work, setWork] = useState<Work>(null); // what is being edited: nothing (start screen), an articles banner or a header bar
  const [saved, setSaved] = useState<SavedInfo | null>(savedInfo); // unfinished work from an earlier visit
  const edited = useRef(false); // changed since it was opened and not downloaded yet
  const workRef = useRef<Work>(null);
  workRef.current = work;
  const [tool, setTool] = useState<ToolInfo["id"] | null>(null); // open tool in the Tools section
  const [notes, setNotes] = useState<string[]>([]); // things to check after opening an old banner

  const start = (w: Work) => {
    edited.current = false;
    setWork(w);
  };
  const change = (w: Work) => {
    edited.current = true;
    setWork(w);
  };

  const create = (typeId: string) => start(typeId === "header-bar" ? { kind: "header", draft: newHeaderDraft() } : { kind: "banner", draft: newDraft(typeId === "articles-mobile" ? "articles-mobile" : "articles-1250x400") });

  // A zip may be a banner or a header bar made with this tool.
  const open = async (file: File) => {
    try {
      const header = await importHeaderZip(file);
      if (header) {
        start({ kind: "header", draft: header });
        toast.success(editor.imported);
      } else {
        const opened = await importZip(file);
        start({ kind: "banner", draft: opened.draft });
        if (opened.notes.length) setNotes(opened.notes);
        else toast.success(editor.imported);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : contentMarketing.uploadFailed);
    }
  };

  // Unfinished work is kept in the browser: saved a moment after each change, and when leaving the editor.
  useEffect(() => {
    if (!work) return;
    const timer = setTimeout(() => saveWork(work), 600);
    return () => clearTimeout(timer);
  }, [work]);

  // Warn before closing the tab with changes that were not downloaded.
  useEffect(() => {
    const reset = () => (edited.current = false);
    const warn = (e: BeforeUnloadEvent) => {
      if (workRef.current && edited.current) e.preventDefault();
    };
    window.addEventListener("ol-downloaded", reset);
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("ol-downloaded", reset);
      window.removeEventListener("beforeunload", warn);
    };
  }, []);

  useEffect(() => {
    writePage(page);
  }, [page]);

  const close = () => {
    if (workRef.current) saveWork(workRef.current);
    setSaved(savedInfo());
    edited.current = false;
    setWork(null);
  };

  const resume = () => {
    const w = loadWork();
    if (w) start(w);
  };
  const discard = () => {
    clearWork();
    setSaved(null);
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppShell
          page={page}
          onNavigate={(p) => {
            setPage(p);
            close();
            setTool(null);
          }}
        >
          {page === "content" &&
            (work?.kind === "banner" ? (
              <BannerEditor draft={work.draft} onChange={(draft) => change({ kind: "banner", draft })} onBack={close} />
            ) : work?.kind === "header" ? (
              <HeaderBarEditor draft={work.draft} onChange={(draft) => change({ kind: "header", draft })} onBack={close} />
            ) : (
              <ContentMarketingHome onCreate={create} onUpload={open} saved={saved} onContinue={resume} onDiscard={discard} />
            ))}
          {page === "tools" && (tool === "image-cropper" ? <ImageCropper onBack={() => setTool(null)} /> : tool === "movie-banner" ? <MovieBanner onBack={() => setTool(null)} /> : <ToolsHome onOpen={setTool} />)}
          {page === "brand" && <BrandManual />}
        </AppShell>
        <Dialog open={notes.length > 0} onOpenChange={(o) => !o && setNotes([])}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editor.legacyTitle}</DialogTitle>
              <DialogDescription>{editor.legacyIntro}</DialogDescription>
            </DialogHeader>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <DialogFooter>
              <Button onClick={() => setNotes([])}>{editor.legacyDone}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
