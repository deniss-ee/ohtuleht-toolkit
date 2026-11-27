import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Download, FileText, Gift, Image, Loader2, Mail, Palette } from "lucide-react";
import { toast } from "sonner";
import { layoutBack, layoutCard, type Drawing, type Fonts, type GiftCardSpec } from "@ohtuleht/templates";
import { AutoColorField } from "@/components/editor/ColorField";
import { Choice } from "@/components/editor/Fields";
import { Section, SwitchRow } from "@/components/editor/FormParts";
import { ToolShell } from "@/components/editor/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { giftCard as t, ui } from "@/content";
import { formatSize } from "@/lib/format";
import { COPY, PERIODS } from "@/giftcard-content";
import { EMAIL_STYLES, PRINT_STYLES, codesOf, downloadEmailPictures, downloadPdf, formatUntil, loadFonts, loadLogos, logoAddress, MAX_CARDS, newForm, paint, titleOf, titles, validEmail, withTitle, type CardForm } from "@/lib/giftcard";
import { DESK_STYLE } from "@/components/editor/SettingsTabs";

const KEY = "ol-giftcard";

// Remembered in this browser only, so the form is filled the next time.
function load(): CardForm {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<CardForm>;
    const fresh = newForm();
    return {
      ...fresh,
      ...saved,
      title: titles.some((x) => x.id === saved.title) ? saved.title! : fresh.title,
      printStyle: PRINT_STYLES.find((s) => s === saved.printStyle) ?? fresh.printStyle,
      emailStyle: EMAIL_STYLES.find((s) => s === saved.emailStyle) ?? fresh.emailStyle,
    };
  } catch {
    return newForm();
  }
}

// A drawing on a canvas, as sharp as the window needs.
function Picture({ drawing, label, width }: { drawing: Drawing; label: string; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paint(ref.current, drawing, width);
  }, [drawing, width]);
  return <canvas ref={ref} role="img" aria-label={label} className="block h-auto w-full rounded-md border bg-white shadow-xs" />;
}

// The titles as a grid of logos in a popover, so the person sees what they pick.
function TitlePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = titleOf(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id="gc-title" type="button" aria-label={`${t.titleChoose}: ${current.name}`} className="flex w-full items-center gap-3 rounded-lg border bg-background p-2 text-left hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <span className="flex h-12 w-28 shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-border">
            <img src={logoAddress(current)} alt="" className="max-h-full max-w-full object-contain" />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{current.name}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(34rem,90vw)] p-2">
        <ul aria-label={t.titleChoose} className="grid max-h-[22rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {titles.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                aria-pressed={x.id === value}
                className={`flex h-full w-full flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-xs hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${x.id === value ? "border-primary bg-primary/5" : ""}`}
                onClick={() => {
                  onChange(x.id);
                  setOpen(false);
                }}
              >
                <span className="flex h-14 w-full items-center justify-center rounded-md bg-white p-1 ring-1 ring-border">
                  <img src={logoAddress(x)} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                </span>
                {x.name}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// Tool: gift cards for any title. The form on the left, the card and the e-mail picture on the right; PDF and picture to download.
export function GiftCard({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<CardForm>(load);
  const set = (patch: Partial<CardForm>) => setForm((f) => ({ ...f, ...patch }));
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [logo, setLogo] = useState<{ id: string; colour: string; white: string; black: string } | null>(null);
  const [pick, setPick] = useState(0); // which code the preview shows
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(form));
    } catch {
      /* private window: the form simply is not remembered */
    }
  }, [form]);

  useEffect(() => {
    loadFonts().then(setFonts, () => toast.error(t.loadFailed));
  }, []);

  const title = titleOf(form.title);
  useEffect(() => {
    let current = true;
    void loadLogos(title).then((l) => current && setLogo({ id: title.id, ...l }));
    return () => {
      current = false;
    };
  }, [title]);

  const codes = codesOf(form);
  const code = codes[Math.min(pick, codes.length - 1)] ?? "";
  const color = form.color || title.main;
  const until = formatUntil(form.until);

  // how the logo and the text go on the title's colour: the title's own setting (its text colour only while its own colour is used)
  const onColour = { logoOnColour: { mode: title.onColour, main: title.main }, textOnColour: color.toLowerCase() === title.main.toLowerCase() ? title.textOnColour : undefined };
  const specFor = (c: string): GiftCardSpec => ({ ...onColour, header: form.header, logo: logo!.colour, logoWhite: logo!.white, logoBlack: logo!.black, color, code: c, email: form.email, until, copy: COPY, printStyle: form.printStyle, emailStyle: form.emailStyle });
  const ready = !!fonts && !!logo && logo.id === title.id;

  // Only the card on show is laid out while typing; all of them are made when a file is made.
  const shown = useMemo(() => {
    if (!fonts || !logo || logo.id !== title.id) return null;
    const spec: GiftCardSpec = { ...onColour, header: form.header, logo: logo.colour, logoWhite: logo.white, logoBlack: logo.black, color, code, email: form.email, until, copy: COPY, printStyle: form.printStyle, emailStyle: form.emailStyle };
    return { print: layoutCard("print", spec, fonts), mail: layoutCard("email", spec, fonts) };
  }, [fonts, logo, title.id, form.header, color, code, form.email, until, form.printStyle, form.emailStyle]);

  const problems = [
    ...(form.header.trim() ? [] : [{ field: "gc-header", message: t.needHeader }]),
    ...(validEmail(form.email) ? [] : [{ field: "gc-email", message: t.needEmail }]),
  ];

  const make = async (job: () => Promise<void>) => {
    setBusy(true);
    try {
      await job();
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  };

  const savePdf = () =>
    ready &&
    make(async () => {
      const pages = codes.flatMap((c) => [layoutCard("print", specFor(c), fonts), ...(form.back ? [layoutBack(specFor(c))] : [])]);
      await downloadPdf(pages, title, color);
      toast.success(t.pdfDone(codes.length));
    });

  const saveMail = () =>
    ready &&
    make(async () => {
      const bytes = await downloadEmailPictures(codes.map((c) => ({ code: c, drawing: layoutCard("email", specFor(c), fonts) })), title.id, form.sharp);
      toast.success(t.mailDone(codes.length, formatSize(bytes)));
    });

  const second = form.header.split("\n")[1]?.trim() ?? "";
  const setPeriod = (p: string) => {
    const first = form.header.split("\n")[0] ?? "";
    set({ header: `${first}\n${p}`, headerEdited: true });
  };

  return (
    <ToolShell
      title={t.title}
      subtitle={t.subtitle}
      problems={problems}
      readyText={ui.ready}
      doneText={t.doneText}
      busy={busy || !ready}
      onDownload={() => void savePdf()}
      onBack={onBack}
      moreDownloads={[
        {
          key: "mail",
          onClick: () => void saveMail(),
          label: (
            <>
              <Image className="size-4" /> {ui.downloadWord} {t.downloadMail}
            </>
          ),
        },
      ]}
      downloadLabel={
        <>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} {ui.downloadWord} {t.downloadPdf}
        </>
      }
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-24 pt-4">
        <p className="text-muted-foreground">{t.intro}</p>
        {/* v2: the card on the desk on the left, the form on the right, as in the editors; on a phone the form comes first */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">
            <Section title={t.titleSection} description={t.titleHint} icon={Gift} tone="red">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gc-title">{t.titleLabel}</Label>
                  <TitlePicker value={form.title} onChange={(id) => setForm((f) => withTitle(f, id))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-header">{t.headerLabel}</Label>
                  <Textarea id="gc-header" rows={3} value={form.header} onChange={(e) => set({ header: e.target.value, headerEdited: true })} />
                  <p className="text-xs text-muted-foreground">{t.headerHint}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1" role="group" aria-label={t.periodLabel}>
                    {PERIODS.map((p) => (
                      <Button key={p} type="button" size="sm" variant={second === p ? "secondary" : "outline"} onClick={() => setPeriod(p)}>
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <AutoColorField label={t.color} value={color} custom={!!form.color} onChange={(hex) => set({ color: hex })} onReset={() => set({ color: "" })} />
              </div>
            </Section>

            <Section title={t.detailsSection} description={t.detailsHint} icon={Mail} tone="ink">
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-code">{t.codeLabel}</Label>
                    <Input id="gc-code" value={form.code} placeholder="M" className="font-mono" onChange={(e) => set({ code: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gc-count">{t.countLabel}</Label>
                    <Input id="gc-count" type="number" inputMode="numeric" min={1} max={MAX_CARDS} value={form.count} disabled={!form.code.trim()} onChange={(e) => set({ count: Number(e.target.value) })} />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">{codes.length > 1 ? t.codesMade(codes[0]!, codes[codes.length - 1]!, codes.length) : t.codeHint}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-email">{t.emailLabel}</Label>
                  <Input id="gc-email" type="email" value={form.email} placeholder="nimi@example.com" aria-invalid={!validEmail(form.email)} onChange={(e) => set({ email: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.emailHint}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gc-until">{t.untilLabel}</Label>
                  <Input id="gc-until" type="date" value={form.until} onChange={(e) => set({ until: e.target.value })} />
                </div>
              </div>
            </Section>

            <Section title={t.styleSection} description={t.styleHint} icon={Palette} tone="yellow">
              <div className="space-y-4">
                <Choice label={t.printStyleLabel} value={form.printStyle} options={PRINT_STYLES.map((id) => ({ id, label: t.printStyles[id].name, hint: t.printStyles[id].hint }))} onChange={(printStyle) => set({ printStyle })} />
                <Choice label={t.emailStyleLabel} value={form.emailStyle} options={EMAIL_STYLES.map((id) => ({ id, label: t.emailStyles[id].name, hint: t.emailStyles[id].hint }))} onChange={(emailStyle) => set({ emailStyle })} />
              </div>
            </Section>

            <Section title={t.filesSection} icon={FileText} tone="yellow">
              <div className="space-y-3">
                <SwitchRow id="gc-back" label={t.back} checked={form.back} onChange={(v) => set({ back: v })} />
                <SwitchRow id="gc-sharp" label={t.sharp} checked={form.sharp} onChange={(v) => set({ sharp: v })} />
                <p className="text-xs text-muted-foreground">{t.note}</p>
              </div>
            </Section>
          </div>

          <div className="space-y-4 rounded-xl p-4 lg:sticky lg:top-4 lg:col-start-1 lg:row-start-1" style={DESK_STYLE}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="size-4 text-muted-foreground" /> {t.previewTitle}
              </h2>
              {codes.length > 1 && (
                <label className="flex items-center gap-2 text-sm">
                  {t.previewCode}
                  <select className="h-8 rounded-md border bg-background px-2 font-mono text-sm" value={Math.min(pick, codes.length - 1)} onChange={(e) => setPick(Number(e.target.value))}>
                    {codes.map((c, i) => (
                      <option key={`${c}-${i}`} value={i}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {shown ? (
              <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,17rem)_1fr]">
                <figure className="space-y-1.5">
                  <Picture drawing={shown.print} label={t.cardLabel} width={900} />
                  <figcaption className="text-xs text-muted-foreground">{t.previewCard}</figcaption>
                </figure>
                <figure className="space-y-1.5">
                  <Picture drawing={shown.mail} label={t.mailLabel} width={1200} />
                  <figcaption className="text-xs text-muted-foreground">{t.previewMail}</figcaption>
                </figure>
              </div>
            ) : (
              <p className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t.loading}
              </p>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
