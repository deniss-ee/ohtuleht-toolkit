import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Download, FlaskConical, ImagePlus, Link2, PanelTop, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { headerTextColor } from "@ohtuleht/templates";
import { AutoColorField, ColorField } from "@/components/editor/ColorField";
import { goTo, HoverPill } from "@/components/editor/HoverPill";
import { IconChip } from "@/components/editor/IconChip";
import { SwapFrame } from "@/components/editor/SwapFrame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { headerBar as t, ui } from "@/content";
import { Toggles } from "@/layout/AppShell";
import { useSaveShortcut } from "@/components/editor/useSaveShortcut";
import { copyText } from "@/lib/clipboard";
import { downloadHeaderZip, exampleHeaderDraft, fileToPicture, headerEmbedCode, headerProblems, renderHeaderPreview, type HeaderDraft } from "@/lib/header";

// The bar is fluid (100% wide), so it is previewed at three real widths.
const widths = () => [
  { label: t.desktop, width: 1248 },
  { label: t.tablet, width: 768 },
  { label: t.phone, width: 375 },
];

// Full-screen editor for the header bar tool.
export function HeaderBarEditor({ draft, onChange, onBack }: { draft: HeaderDraft; onChange: (d: HeaderDraft) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const c = draft.config;
  const set = (patch: Partial<HeaderDraft["config"]>) => onChange({ ...draft, config: { ...c, ...patch } });
  const issues = headerProblems(draft);
  const embed = headerEmbedCode(draft);
  const autoText = headerTextColor({ ...c, textColor: undefined, picture: draft.picture ? { src: draft.picture.name, avg: draft.picture.avg } : undefined });

  const onPicture = async (file: File | undefined) => {
    if (!file) return;
    const picture = await fileToPicture(file);
    onChange({ ...draft, picture, config: { ...c, picture: { src: picture.name, avg: picture.avg } } });
  };
  const removePicture = () => onChange({ ...draft, picture: null, config: { ...c, picture: undefined } });

  const download = async () => {
    setBusy(true);
    try {
      await downloadHeaderZip(draft);
    } finally {
      setBusy(false);
    }
  };

  useSaveShortcut(download, issues.length === 0 && !busy);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b px-3 py-2 lg:h-14 lg:flex-nowrap lg:gap-3 lg:px-4 lg:py-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{ui.back}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{c.label.trim() || t.untitled}</div>
          <div className="text-xs text-muted-foreground">{t.heading}</div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:gap-3">
          <HoverPill
            tone={issues.length === 0 ? "ok" : "warn"}
            icon={issues.length === 0 ? <CheckCircle2 className="size-3.5 text-green-600" /> : <TriangleAlert className="size-3.5 text-yellow-600" />}
            label={
              <>
                <span className="hidden sm:inline">{issues.length === 0 ? t.ready : ui.toFix(issues.length)}</span>
                <span className="sm:hidden">{issues.length === 0 ? "" : issues.length}</span>
              </>
            }
          >
            {(close) =>
              issues.length === 0 ? (
                <p className="text-sm">{t.doneText}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{ui.toFixTitle}</p>
                  <ul className="space-y-1">
                    {issues.map((p) => (
                      <li key={p.field}>
                        <button
                          type="button"
                          className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            close();
                            goTo(p.field);
                          }}
                        >
                          {p.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </HoverPill>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              onChange(exampleHeaderDraft());
              toast.success(t.loadedExample);
            }}
          >
            <FlaskConical className="size-4" />
            <span className="hidden md:inline">{t.tryExample}</span>
          </Button>
          <Toggles />
          <Button className="ml-auto gap-2 sm:ml-0" disabled={issues.length > 0 || busy} onClick={download} title="Ctrl+S">
            <Download className="size-4" /> {busy ? ui.building : <>{ui.downloadWord}<span className="hidden sm:inline"> {ui.suffixZip}</span></>}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1282px] space-y-4 px-4 pb-24 pt-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">{t.previewTitle}</h2>
              <p className="text-xs text-muted-foreground">{t.previewNote}</p>
            </div>
            {widths().map((w) => (
              <div key={w.width} className="space-y-1">
                <div className="text-xs text-muted-foreground">{w.label}</div>
                <div className="relative overflow-hidden" style={{ width: `min(100%, ${w.width}px)`, height: 46 }}>
                  <SwapFrame build={(id) => renderHeaderPreview(draft, id)} deps={[draft]} width="100%" height={46} title={w.label} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconChip icon={PanelTop} tone="red" />
                  <div>
                    <CardTitle>{t.barTitle}</CardTitle>
                    <CardDescription>{t.barHint}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hb-label">{t.label}</Label>
                  <Input id="hb-label" value={c.label} onChange={(e) => set({ label: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.labelHint}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hb-href">{t.href}</Label>
                  <Input id="hb-href" placeholder="https://www.ohtuleht.ee/teemalehed/…" value={c.href} onChange={(e) => set({ href: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.hrefHint}</p>
                </div>
                <ColorField label={t.colour} value={c.primary} onChange={(primary) => set({ primary })} />
                <AutoColorField
                  label={t.textColour}
                  value={c.textColor ?? autoText}
                  custom={c.textColor !== undefined}
                  onChange={(textColor) => set({ textColor })}
                  onReset={() => set({ textColor: undefined })}
                />
                <div className="space-y-2">
                  <Label>{t.picture}</Label>
                  <input ref={fileInput} type="file" className="sr-only" aria-label={t.picture} accept="image/png,image/webp,image/svg+xml,image/jpeg" onChange={(e) => onPicture(e.target.files?.[0])} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()}>
                      <ImagePlus className="size-4" /> {draft.picture ? t.pictureChange : t.pictureChoose}
                    </Button>
                    {draft.picture && (
                      <Button variant="ghost" size="sm" className="gap-2" onClick={removePicture}>
                        <Trash2 className="size-4" /> {t.pictureRemove}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.pictureHint}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconChip icon={Link2} tone="yellow" />
                  <div>
                    <CardTitle>{t.embedTitle}</CardTitle>
                    <CardDescription>{t.embedHint}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-2 text-sm">
                  {t.embedSteps.map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
                      <span className="pt-0.5">{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="space-y-1.5">
                  <Label htmlFor="hb-embed">{t.embedUrl}</Label>
                  <Input id="hb-embed" placeholder={t.embedPlaceholder} value={draft.embedUrl} onChange={(e) => onChange({ ...draft, embedUrl: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hb-code">{t.embedCode}</Label>
                  <textarea id="hb-code" readOnly rows={3} value={embed} className="w-full rounded-lg border border-input bg-transparent p-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyText(embed, t.copied)}
                  >
                    <Copy className="size-4" /> {t.copy}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
