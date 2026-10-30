import { useId, useMemo, useState } from "react";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { tracker as t } from "@/content";
import type { Client } from "@/lib/clients";

// Client dropdown: opens a list of all clients, filters while typing, and offers "add as new" for a name that is not there yet.
export function ClientCombobox({ id, value, clients, onChange, invalid }: { id?: string; value: string; clients: Client[]; onChange: (name: string) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useId();
  const q = value.trim().toLowerCase();
  const exact = clients.some((c) => c.name.trim().toLowerCase() === q);
  const matches = useMemo(() => clients.filter((c) => !q || c.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "et")), [clients, q]);
  const options = [...matches.map((c) => ({ name: c.name, isNew: false, hint: c.contact })), ...(q && !exact ? [{ name: value.trim(), isNew: true, hint: "" }] : [])];
  const pick = (i: number) => {
    const o = options[i];
    if (o) onChange(o.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Building2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={list}
        aria-autocomplete="list"
        aria-invalid={invalid}
        autoComplete="off"
        value={value}
        placeholder={t.pickClient}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => (onChange(e.target.value), setOpen(true), setActive(0))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") (e.preventDefault(), setOpen(true), setActive((a) => Math.min(a + 1, options.length - 1)));
          else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
          else if (e.key === "Enter" && open && options.length) (e.preventDefault(), pick(active));
          else if (e.key === "Escape") setOpen(false);
        }}
        className="h-9 w-full rounded-lg border border-input bg-transparent pr-8 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
      />
      <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      {open && options.length > 0 && (
        <ul id={list} role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10">
          {options.map((o, i) => (
            <li
              key={o.name + o.isNew}
              role="option"
              aria-selected={o.name.toLowerCase() === q}
              // mouse down (not click) so the input keeps its focus until the choice is made
              onMouseDown={(e) => (e.preventDefault(), pick(i))}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${i === active ? "bg-muted" : ""}`}
            >
              {o.isNew ? <Plus className="size-4 text-primary" aria-hidden /> : <Check className={`size-4 ${o.name.toLowerCase() === q ? "" : "opacity-0"}`} aria-hidden />}
              <span className="min-w-0 flex-1 truncate">{o.isNew ? t.addAsNew(o.name) : o.name}</span>
              {o.hint && <span className="truncate text-xs text-muted-foreground">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
