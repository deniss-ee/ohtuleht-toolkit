import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { DayPicker, type DateRange } from "@daypicker/react";
import { enGB, et } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import "./calendar.css";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLang, ui } from "@/content";

// Dates travel as "yyyy-mm-dd" text (what the brief stores); the calendar works with real dates at local noon.
export const toDate = (s: string): Date | undefined => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : undefined);
export const toText = (d: Date | undefined) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
const show = (s: string) => {
  const d = toDate(s);
  return d ? d.toLocaleDateString(getLang() === "et" ? "et-EE" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
};

// The calendar look: brand red for the chosen days, rounded squares, Monday first. DayPicker reads these CSS variables; they are set inline
// because its own stylesheet is not inside a Tailwind layer and would win over classes.
const THEME = {
  "--rdp-accent-color": "var(--primary)",
  "--rdp-accent-background-color": "color-mix(in oklab, var(--primary) 14%, transparent)",
  "--rdp-today-color": "var(--primary)",
  "--rdp-nav_button-height": "1.9rem",
  "--rdp-nav_button-width": "1.9rem",
  "--rdp-nav-height": "2.1rem",
} as React.CSSProperties;

function Trigger({ text, placeholder, onClear, id, invalid }: { text: string; placeholder: string; onClear?: () => void; id?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" aria-invalid={invalid} className={`h-9 w-full justify-start gap-2 pr-8 pl-2.5 font-normal ${text ? "" : "text-muted-foreground"}`}>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{text || placeholder}</span>
        </Button>
      </PopoverTrigger>
      {text && onClear && (
        <button type="button" aria-label={ui.clear} onClick={onClear} className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function DatePicker({ id, value, onChange, placeholder, invalid }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger id={id} text={show(value)} placeholder={placeholder} invalid={invalid} onClear={() => onChange("")} />
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="single"
          autoFocus
          style={THEME}
          weekStartsOn={1}
          showOutsideDays
          locale={getLang() === "et" ? et : enGB}
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            onChange(toText(d));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// From and to in one calendar: click the first day, then the last.
export function RangePicker({ id, from, to, onChange, placeholder }: { id?: string; from: string; to: string; onChange: (from: string, to: string) => void; placeholder: string }) {
  const range: DateRange | undefined = toDate(from) ? { from: toDate(from), to: toDate(to) } : undefined;
  const text = from ? (to && to !== from ? `${show(from)} - ${show(to)}` : show(from)) : "";
  return (
    <Popover>
      <Trigger id={id} text={text} placeholder={placeholder} onClear={() => onChange("", "")} />
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="range"
          autoFocus
          style={THEME}
          weekStartsOn={1}
          showOutsideDays
          numberOfMonths={1}
          locale={getLang() === "et" ? et : enGB}
          selected={range}
          defaultMonth={range?.from}
          onSelect={(r) => onChange(toText(r?.from), toText(r?.to))}
        />
      </PopoverContent>
    </Popover>
  );
}
