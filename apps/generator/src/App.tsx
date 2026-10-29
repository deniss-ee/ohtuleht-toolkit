import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { contentMarketing, editor, type PageId, type ToolInfo } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { newDraft, type Draft } from "@/lib/banner";
import { importHeaderZip, newHeaderDraft, type HeaderDraft } from "@/lib/header";
import { importZip } from "@/lib/zip";
import { BannerEditor } from "@/pages/BannerEditor";
import { BrandManual } from "@/pages/BrandManual";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";
import { HeaderBarEditor } from "@/pages/HeaderBarEditor";
import { ImageCropper } from "@/pages/ImageCropper";
import { ToolsHome } from "@/pages/ToolsHome";

// What is being edited right now: nothing (start screen), an articles banner, or a header bar.
type Work = { kind: "banner"; draft: Draft } | { kind: "header"; draft: HeaderDraft } | null;

export function App() {
  const [page, setPage] = useState<PageId>("content");
  const [work, setWork] = useState<Work>(null);
  const [tool, setTool] = useState<ToolInfo["id"] | null>(null); // open tool in the Tools section
  const [notes, setNotes] = useState<string[]>([]); // things to check after opening an old banner

  const create = (typeId: string) => setWork(typeId === "header-bar" ? { kind: "header", draft: newHeaderDraft() } : { kind: "banner", draft: newDraft(typeId === "articles-mobile" ? "articles-mobile" : "articles-1250x400") });

  // A zip may be a banner or a header bar made with this tool.
  const open = async (file: File) => {
    try {
      const header = await importHeaderZip(file);
      if (header) {
        setWork({ kind: "header", draft: header });
        toast.success(editor.imported);
      } else {
        const opened = await importZip(file);
        setWork({ kind: "banner", draft: opened.draft });
        if (opened.notes.length) setNotes(opened.notes);
        else toast.success(editor.imported);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : contentMarketing.uploadFailed);
    }
  };

  const close = () => setWork(null);

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
              <BannerEditor draft={work.draft} onChange={(draft) => setWork({ kind: "banner", draft })} onBack={close} />
            ) : work?.kind === "header" ? (
              <HeaderBarEditor draft={work.draft} onChange={(draft) => setWork({ kind: "header", draft })} onBack={close} />
            ) : (
              <ContentMarketingHome onCreate={create} onUpload={open} />
            ))}
          {page === "tools" && (tool === "image-cropper" ? <ImageCropper onBack={() => setTool(null)} /> : <ToolsHome onOpen={setTool} />)}
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
