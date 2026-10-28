import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/layout/AppShell";
import { GeneratorHome } from "@/pages/GeneratorHome";
import type { PageId } from "@/content";

export function App() {
  const [page, setPage] = useState<PageId>("generator");
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppShell page={page} onNavigate={setPage}>
          {page === "generator" && <GeneratorHome />}
        </AppShell>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
