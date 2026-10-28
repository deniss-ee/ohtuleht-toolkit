import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/layout/AppShell";
import { ContentMarketingHome } from "@/pages/ContentMarketingHome";
import type { PageId } from "@/content";

export function App() {
  const [page, setPage] = useState<PageId>("content");
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppShell page={page} onNavigate={setPage}>
          {page === "content" && <ContentMarketingHome />}
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
