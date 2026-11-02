import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// A number box with a label (and an optional hint under it).
export function Num({ id, label, value, min, max, step = 1, onChange, hint }: { id: string; label: string; value: number; min: number; max?: number; step?: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(ev) => onChange(Number(ev.target.value))} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// A choice of a few options as buttons (a radio group underneath, so it works with the keyboard).
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border p-2 text-center text-sm has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
            <input type="radio" name={label} className="sr-only" checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.label}
            {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
