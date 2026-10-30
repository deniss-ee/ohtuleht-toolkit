import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { contentMarketing, editor, getLang, setLang, subscribeLang, type PageId, type ToolInfo } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { newDraft } from "@/lib/banner";
import { importHeaderZip, newHeaderDraft } from "@/lib/header";
import { importSliderAny } from "@/lib/legacySlider";
import { newSliderDraft } from "@/lib/slider";
import { buildSearch, parseRoute, type BrandTab } from "@/lib/route";
import { clearWork, loadWork, savedInfo, saveWork, type SavedInfo, type Work } from "@/lib/storage";
import { importZip } from "@/lib/zip";
import { BannerEditor } from "@/pages/BannerEditor";
import { BrandManual } from "@/pages/BrandManual";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";
import { HeaderBarEditor } from "@/pages/HeaderBarEditor";
import { Home, type Destination } from "@/pages/Home";
import { ImageCropper } from "@/pages/ImageCropper";
import { SliderEditor } from "@/pages/SliderEditor";
import { MovieBanner } from "@/pages/MovieBanner";
import { ToolsHome } from "@/pages/ToolsHome";
import { ArticleScraper } from "@/pages/ArticleScraper";
import { PictureConverter } from "@/pages/PictureConverter";
import { TaskTracker } from "@/pages/TaskTracker";
import { UtmBuilder } from "@/pages/UtmBuilder";
import { SignatureGenerator } from "@/pages/SignatureGenerator";

const newWork = (typeId: string): Work => (typeId === "header-bar" ? { kind: "header", draft: newHeaderDraft() } : typeId === "image-slider-1250x400" || typeId === "image-slider-600x500" ? { kind: "slider", draft: newSliderDraft(typeId) } : { kind: "banner", draft: newDraft(typeId === "articles-mobile" ? "articles-mobile" : "articles-1250x400") });

export function App() {
  const lang = useSyncExternalStore(subscribeLang, getLang); // render everything again when the language changes
  const link = useRef(parseRoute(location.search)).current; // where the address says to start
  // The address says where to start; a plain address opens the Home page.
  const [page, setPage] = useState<PageId>(() => link.page ?? "home");
  const [tab, setTab] = useState<BrandTab>(link.tab);
  const [work, setWork] = useState<Work>(() => (link.make ? newWork(link.make) : null)); // what is being edited: nothing (start screen), an articles banner or a header bar
  const [saved, setSaved] = useState<SavedInfo | null>(savedInfo); // unfinished work from an earlier visit
  const edited = useRef(false); // changed since it was opened and not downloaded yet
  const workRef = useRef<Work>(null);
  workRef.current = work;
  const [tool, setTool] = useState<ToolInfo["id"] | null>(link.tool); // open tool in the Tools section
  const [notes, setNotes] = useState<string[]>([]); // things to check after opening an old banner

  const start = (w: Work) => {
    edited.current = false;
    setWork(w);
  };
  const change = (w: Work) => {
    edited.current = true;
    setWork(w);
  };

  const create = (typeId: string) => start(newWork(typeId));

  // A zip may be a header bar, an image slider or an articles banner made with this tool (or an old Swiper banner).
  const open = async (file: File) => {
    const loading = toast.loading(editor.opening);
    try {
      const header = await importHeaderZip(file);
      const slider = header ? null : await importSliderAny(file);
      if (header) {
        start({ kind: "header", draft: header });
        toast.success(editor.imported);
      } else if (slider) {
        start({ kind: "slider", draft: slider.draft });
        if (slider.notes.length) setNotes(slider.notes);
        else toast.success(editor.imported);
      } else {
        const opened = await importZip(file);
        start({ kind: "banner", draft: opened.draft });
        if (opened.notes.length) setNotes(opened.notes);
        else toast.success(editor.imported);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : contentMarketing.uploadFailed);
    } finally {
      toast.dismiss(loading);
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

  // The address follows the app, so it can be copied and sent. A new place is a new history entry (Back works);
  // changing only the language replaces the entry.
  const placeKey = useRef<string | null>(null);
  useEffect(() => {
    const search = buildSearch(page, tool, tab, lang);
    const key = `${page}/${tool}/${tab}`;
    if (search !== location.search) history[placeKey.current === null || placeKey.current === key ? "replaceState" : "pushState"](null, "", search);
    placeKey.current = key;
  }, [page, tool, tab, lang]);

  // Back and Forward buttons of the browser.
  useEffect(() => {
    const onPop = () => {
      const r = parseRoute(location.search);
      if (workRef.current) saveWork(workRef.current);
      setSaved(savedInfo());
      edited.current = false;
      setWork(null);
      setPage(r.page ?? "home");
      setTool(r.tool);
      setTab(r.tab);
      if (r.lang && r.lang !== getLang()) setLang(r.lang);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const close = () => {
    if (workRef.current) saveWork(workRef.current);
    setSaved(savedInfo());
    edited.current = false;
    setWork(null);
  };

  const resume = () => {
    const w = loadWork();
    if (!w) return;
    setPage("content");
    setTool(null);
    start(w);
  };
  // A card on the Home page: open that section, tool, tab or a new banner.
  const go = (to: Destination) => {
    if (workRef.current) saveWork(workRef.current);
    setSaved(savedInfo());
    setPage(to.page);
    setTool(to.tool ?? null);
    if (to.tab) setTab(to.tab);
    start(to.make ? newWork(to.make) : null);
    window.scrollTo(0, 0);
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
          {page === "home" && <Home saved={saved} onContinue={resume} onDiscard={discard} onGo={go} />}
          {page === "content" &&
            (work?.kind === "banner" ? (
              <BannerEditor draft={work.draft} onChange={(draft) => change({ kind: "banner", draft })} onBack={close} />
            ) : work?.kind === "slider" ? (
              <SliderEditor draft={work.draft} onChange={(draft) => change({ kind: "slider", draft })} onBack={close} />
            ) : work?.kind === "header" ? (
              <HeaderBarEditor draft={work.draft} onChange={(draft) => change({ kind: "header", draft })} onBack={close} />
            ) : (
              <ContentMarketingHome onCreate={create} onUpload={open} saved={saved} onContinue={resume} onDiscard={discard} />
            ))}
          {page === "tools" && (tool === "image-cropper" ? <ImageCropper onBack={() => setTool(null)} /> : tool === "movie-banner" ? <MovieBanner onBack={() => setTool(null)} /> : tool === "article-scraper" ? <ArticleScraper onBack={() => setTool(null)} onBrand={(tab) => go({ page: "brand", tab })} /> : tool === "picture-converter" ? <PictureConverter onBack={() => setTool(null)} onBrand={(tab) => go({ page: "brand", tab })} /> : tool === "email-signature" ? <SignatureGenerator onBack={() => setTool(null)} /> : tool === "utm-builder" ? <UtmBuilder onBack={() => setTool(null)} /> : <ToolsHome onOpen={setTool} />)}
          {page === "tasks" && <TaskTracker onMake={(id) => go({ page: "content", make: id })} />}
          {page === "brand" && <BrandManual tab={tab} onTab={setTab} />}
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
