import { useMemo, useState } from "react";
import { ArrowLeft, Code, Copy, PenLine } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/editor/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { signature as t, ui } from "@/content";
import { copyText } from "@/lib/clipboard";
import { copyRich, emptySignature, signatureHtml, signatureText, type SignatureData } from "@/lib/signature";

const KEY = "ol-signature";

// Remembered in this browser only, so the form is filled the next time.
function load(): SignatureData {
  try {
    return { ...emptySignature(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return emptySignature();
  }
}

type TextField = Exclude<keyof SignatureData, "logo">;
const FIELDS: { id: TextField; type?: string; auto?: string }[] = [
  { id: "name", auto: "name" },
  { id: "title" },
  { id: "department" },
  { id: "phone", type: "tel" },
  { id: "mobile", type: "tel" },
  { id: "email", type: "email" },
  { id: "website" },
  { id: "address" },
  { id: "company" },
];

// Tool: an email signature for Outlook or any mail program. Fill the form, copy, paste into the signature settings.
export function SignatureGenerator({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<SignatureData>(load);
  const set = (patch: Partial<SignatureData>) =>
    setData((d) => {
      const next = { ...d, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private window: the form simply is not remembered */
      }
      return next;
    });
  // The preview uses the logo from this site (works before the site is published); the copied signature uses the live address.
  const html = useMemo(() => signatureHtml(data), [data]);
  const preview = useMemo(() => signatureHtml(data, `${import.meta.env.BASE_URL}signature/ohtuleht-logo.png`), [data]);
  const text = useMemo(() => signatureText(data), [data]);
  const empty = !data.name.trim();

  const copySignature = async () => {
    if (await copyRich(html, text)) toast.success(t.copied);
    else toast.error(ui.copyFailed);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> {t.back}
      </Button>
      <PageHeader icon={PenLine} title={t.title} intro={t.intro} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label={t.formTitle} className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={`sig-${f.id}`}>{t.fields[f.id]}</Label>
              <Input id={`sig-${f.id}`} type={f.type ?? "text"} autoComplete={f.auto} value={data[f.id]} placeholder={t.placeholders[f.id]} onChange={(e) => set({ [f.id]: e.target.value })} />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <Switch id="sig-logo" checked={data.logo} onCheckedChange={(logo) => set({ logo })} />
            <Label htmlFor="sig-logo">{t.logo}</Label>
          </div>
        </section>

        <section aria-label={t.previewTitle} className="space-y-4">
          <div className="rounded-xl border bg-white p-5 text-black">
            {empty ? <p className="text-sm text-neutral-500">{t.empty}</p> : <div dangerouslySetInnerHTML={{ __html: preview }} />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" disabled={empty} onClick={() => void copySignature()}>
              <Copy className="size-4" /> {t.copy}
            </Button>
            <Button variant="outline" className="gap-2" disabled={empty} onClick={() => void copyText(html, t.copiedCode)}>
              <Code className="size-4" /> {t.copyCode}
            </Button>
            <Button variant="outline" disabled={empty} onClick={() => void copyText(text, t.copiedText)}>
              {t.copyText}
            </Button>
          </div>
          <div className="rounded-xl border border-dashed bg-muted/50 p-4 text-sm">
            <h2 className="mb-1 font-semibold">{t.stepsTitle}</h2>
            <ol className="list-decimal space-y-1 pl-5">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">{t.logoNote}</p>
        </section>
      </div>
    </div>
  );
}
