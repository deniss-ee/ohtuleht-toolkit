import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { contentMarketing, editor, type PageId } from "@/content";
import { AppShell } from "@/layout/AppShell";
import { newDraft, type Draft } from "@/lib/banner";
import { importZip } from "@/lib/zip";
import { BannerEditor } from "@/pages/BannerEditor";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";

export function App() {
  const [page, setPage] = useState<PageId>("content");
  // null = start screen; a draft = editing that banner.
  const [draft, setDraft] = useState<Draft | null>(null);

  const open = async (file: File) => {
    try {
      setDraft(await importZip(file));
      toast.success(editor.imported);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : contentMarketing.uploadFailed);
    }
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppShell
          page={page}
          onNavigate={(p) => {
            setPage(p);
            setDraft(null);
          }}
        >
          {page === "content" &&
            (draft ? <BannerEditor draft={draft} onChange={setDraft} onBack={() => setDraft(null)} /> : <ContentMarketingHome onCreate={() => setDraft(newDraft())} onUpload={open} />)}
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
