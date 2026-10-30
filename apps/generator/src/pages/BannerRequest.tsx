import { useState } from "react";
import { CheckCircle2, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { BriefPage } from "@/components/editor/BriefPage";
import { Button } from "@/components/ui/button";
import { tracker as t } from "@/content";
import { emptyClient, loadClients, mergeClients, saveClients, type Client } from "@/lib/clients";
import { push } from "@/lib/sync";
import { loadBriefs, newBrief, saveBriefs, type Brief } from "@/lib/tracker";

// Tool: the banner request form. Anyone can use it; what is sent also lands on the task tracker board (same browser, for now).
export function BannerRequest({ onOpenBoard, onMake }: { onOpenBoard: () => void; onMake: (typeId: string) => void }) {
  const [fresh, setFresh] = useState<Brief>(newBrief);
  const [clients] = useState<Client[]>(loadClients);
  const [sent, setSent] = useState(false);

  const save = (b: Brief) => {
    saveBriefs([b, ...loadBriefs().filter((x) => x.id !== b.id)]);
    void push("briefs", "put", b.id, b);
    if (b.client.trim() && !clients.some((c) => c.name.trim().toLowerCase() === b.client.trim().toLowerCase())) {
      const c = { ...emptyClient(), name: b.client.trim() };
      saveClients(mergeClients(loadClients(), [c]));
      void push("clients", "put", c.id, c);
    }
    toast.success(t.added);
    window.scrollTo(0, 0);
    setSent(true);
  };

  if (sent)
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-xs">
        <CheckCircle2 className="mx-auto size-10 text-green-600" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold">{t.sentTitle}</h1>
          <p className="text-muted-foreground">{t.sentText}</p>
        </div>
        <div className="grid gap-2">
          <Button className="gap-2" onClick={onOpenBoard}>
            <ListChecks className="size-4" /> {t.openBoard}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => (setFresh(newBrief()), setSent(false))}>
            <Plus className="size-4" /> {t.another}
          </Button>
        </div>
      </div>
    );
  return <BriefPage key={fresh.id} initial={fresh} isNew clients={clients} onSave={save} onBack={onOpenBoard} onDelete={() => {}} onMake={onMake} />;
}
