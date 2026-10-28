import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { contentMarketing, editor, type PageId } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { newDraft, type Draft } from "@/lib/banner";
import { importHeaderZip, newHeaderDraft, type HeaderDraft } from "@/lib/header";
import { importZip } from "@/lib/zip";
import { BannerEditor } from "@/pages/BannerEditor";
import { BrandManual } from "@/pages/BrandManual";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";
import { HeaderBarEditor } from "@/pages/HeaderBarEditor";

// What is being edited right now: nothing (start screen), an articles banner, or a header bar.
type Work = { kind: "banner"; draft: Draft } | { kind: "header"; draft: HeaderDraft } | null;

export function App() {
  const [page, setPage] = useState<PageId>("content");
  const [work, setWork] = useState<Work>(null);

  const create = (typeId: string) => setWork(typeId === "header-bar" ? { kind: "header", draft: newHeaderDraft() } : { kind: "banner", draft: newDraft() });

  // A zip may be a banner or a header bar made with this tool.
  const open = async (file: File) => {
    try {
      const header = await importHeaderZip(file);
      setWork(header ? { kind: "header", draft: header } : { kind: "banner", draft: await importZip(file) });
      toast.success(editor.imported);
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
          {page === "brand" && <BrandManual />}
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
