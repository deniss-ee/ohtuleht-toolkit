import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { contentMarketing, editor, getLang, setLang, subscribeLang, type PageId, type ToolInfo } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { buildSearch, parseRoute, type BrandTab } from "@/lib/route";
import { clearWork, savedInfo, type SavedInfo } from "@/lib/saved";
import type { Work } from "@/lib/storage";
import { Home, type Destination } from "@/pages/Home";

// Everything but the Home page is loaded when it is opened, so the first visit downloads little.
const page = <T extends Record<string, unknown>, K extends keyof T>(load: () => Promise<T>, name: K) => lazy(async () => ({ default: (await load())[name] as ComponentType<any> })) as unknown as T[K];
const BannerEditor = page(() => import("@/pages/BannerEditor"), "BannerEditor");
const SliderEditor = page(() => import("@/pages/SliderEditor"), "SliderEditor");
const FrameBannerEditor = page(() => import("@/pages/FrameBannerEditor"), "FrameBannerEditor");
const ResponsiveBannerEditor = page(() => import("@/pages/ResponsiveBannerEditor"), "ResponsiveBannerEditor");
const HeaderBarEditor = page(() => import("@/pages/HeaderBarEditor"), "HeaderBarEditor");
const ContentMarketingHome = page(() => import("@/pages/ContentMarketingHome"), "ContentMarketingHome");
const ToolsHome = page(() => import("@/pages/ToolsHome"), "ToolsHome");
const ImageCropper = page(() => import("@/pages/ImageCropper"), "ImageCropper");
const MovieBanner = page(() => import("@/pages/MovieBanner"), "MovieBanner");
const ArticleScraper = page(() => import("@/pages/ArticleScraper"), "ArticleScraper");
const PictureConverter = page(() => import("@/pages/PictureConverter"), "PictureConverter");
const SignatureGenerator = page(() => import("@/pages/SignatureGenerator"), "SignatureGenerator");
const UtmBuilder = page(() => import("@/pages/UtmBuilder"), "UtmBuilder");
const GiftCard = page(() => import("@/pages/GiftCard"), "GiftCard");
const BrandManual = page(() => import("@/pages/BrandManual"), "BrandManual");
const Guide = page(() => import("@/pages/Guide"), "Guide");

// The banner code (drafts, templates, zip, saved work): loaded with the first banner, then kept.
const workLib = () => import("@/lib/work");

// While the first screen is read, the parts people open most (the start screens and the banner code) are fetched quietly in the background,
// so a click does not wait for a download. Heavier or rarer pages (gift card, brand manual, guide) still load when opened.
function prefetchCommon() {
  const run = () => {
    void import("@/pages/ContentMarketingHome");
    void import("@/pages/ToolsHome");
    void import("@/pages/BannerEditor");
    void workLib();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}

export function App() {
  useEffect(prefetchCommon, []);
  const lang = useSyncExternalStore(subscribeLang, getLang); // render everything again when the language changes
  const link = useRef(parseRoute(location.search)).current; // where the address says to start
  // The address says where to start; a plain address opens the Home page.
  const [page, setPage] = useState<PageId>(() => link.page ?? "home");
  const [tab, setTab] = useState<BrandTab>(link.tab);
  const [topic, setTopic] = useState<string | null>(link.topic); // open topic of the guide
  const [step, setStep] = useState<number | null>(link.step); // the step of that topic to scroll to
  const [work, setWork] = useState<Work>(null); // what is being edited: nothing (start screen), an articles banner or a header bar
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

  const create = async (typeId: string) => start((await workLib()).newWork(typeId));
  // A direct link to a new banner (?make=...).
  useEffect(() => {
    if (link.make) void create(link.make);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the unfinished work in the browser and refreshes the "Continue" card.
  const keep = async () => {
    const w = workRef.current;
    if (w) (await workLib()).saveWork(w);
    setSaved(savedInfo());
  };

  // A zip may be a header bar, an image slider or an articles banner made with this tool (or an old Swiper banner).
  const open = async (file: File) => {
    const loading = toast.loading(editor.opening);
    try {
      const opened = await (await workLib()).openZip(file);
      start(opened.work);
      if (opened.notes.length) setNotes(opened.notes);
      else toast.success(editor.imported);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : contentMarketing.uploadFailed);
    } finally {
      toast.dismiss(loading);
    }
  };

  // Unfinished work is kept in the browser: saved a moment after each change, and when leaving the editor.
  useEffect(() => {
    if (!work) return;
    const timer = setTimeout(() => void workLib().then((m) => m.saveWork(work)), 600);
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
    const search = buildSearch(page, tool, tab, lang, topic, step);
    const key = `${page}/${tool}/${tab}/${topic}`;
    if (search !== location.search) history[placeKey.current === null || placeKey.current === key ? "replaceState" : "pushState"](null, "", search);
    placeKey.current = key;
  }, [page, tool, tab, lang, topic, step]);

  // Back and Forward buttons of the browser.
  useEffect(() => {
    const onPop = () => {
      const r = parseRoute(location.search);
      void keep();
      edited.current = false;
      setWork(null);
      setPage(r.page ?? "home");
      setTool(r.tool);
      setTab(r.tab);
      setTopic(r.topic);
      setStep(r.step);
      if (r.lang && r.lang !== getLang()) setLang(r.lang);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const close = () => {
    void keep();
    edited.current = false;
    setWork(null);
  };

  const resume = async () => {
    const w = (await workLib()).loadWork();
    if (!w) return;
    setPage("content");
    setTool(null);
    start(w);
  };
  // A card on the Home page: open that section, tool, tab or a new banner.
  const go = (to: Destination) => {
    void keep();
    setPage(to.page);
    setTool(to.tool ?? null);
    setTopic(null);
    setStep(null);
    if (to.tab) setTab(to.tab);
    start(null);
    if (to.make) void create(to.make);
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
            setTopic(null);
            setStep(null);
          }}
        >
          <Suspense fallback={null}>
          {page === "home" && <Home saved={saved} onContinue={resume} onDiscard={discard} onGo={go} />}
          {page === "content" &&
            (work?.kind === "banner" ? (
              <BannerEditor draft={work.draft} onChange={(draft) => change({ kind: "banner", draft })} onBack={close} />
            ) : work?.kind === "responsive" ? (
              <ResponsiveBannerEditor draft={work.draft} onChange={(draft) => change({ kind: "responsive", draft })} onBack={close} />
            ) : work?.kind === "frames" ? (
              <FrameBannerEditor draft={work.draft} onChange={(draft) => change({ kind: "frames", draft })} onBack={close} />
            ) : work?.kind === "slider" ? (
              <SliderEditor draft={work.draft} onChange={(draft) => change({ kind: "slider", draft })} onBack={close} />
            ) : work?.kind === "header" ? (
              <HeaderBarEditor draft={work.draft} onChange={(draft) => change({ kind: "header", draft })} onBack={close} />
            ) : (
              <ContentMarketingHome onCreate={create} onUpload={open} saved={saved} onContinue={resume} onDiscard={discard} />
            ))}
          {page === "tools" && (tool === "image-cropper" ? <ImageCropper onBack={() => setTool(null)} /> : tool === "movie-banner" ? <MovieBanner onBack={() => setTool(null)} /> : tool === "article-scraper" ? <ArticleScraper onBack={() => setTool(null)} onBrand={(tab) => go({ page: "brand", tab })} /> : tool === "picture-converter" ? <PictureConverter onBack={() => setTool(null)} onBrand={(tab) => go({ page: "brand", tab })} /> : tool === "email-signature" ? <SignatureGenerator onBack={() => setTool(null)} /> : tool === "utm-builder" ? <UtmBuilder onBack={() => setTool(null)} /> : tool === "gift-card" ? <GiftCard onBack={() => setTool(null)} /> : <ToolsHome onOpen={setTool} />)}
          {page === "guide" && <Guide topic={topic} step={step} onTopic={(id, s) => (setTopic(id), setStep(s ?? null))} />}
          {page === "brand" && <BrandManual tab={tab} onTab={setTab} />}
          </Suspense>
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
