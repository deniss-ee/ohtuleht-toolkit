import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editor as t } from "@/content";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Colour picker plus a hex text box that stay in sync. Invalid hex is held back until fixed.
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          id={id}
          value={text}
          maxLength={7}
          aria-invalid={!HEX.test(text)}
          onChange={(e) => {
            setText(e.target.value);
            if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          className="font-mono"
        />
      </div>
    </div>
  );
}

// A colour that is normally worked out automatically. Editing it sets a manual override; the button goes back to automatic.
export function AutoColorField({ label, value, custom, onChange, onReset }: { label: string; value: string; custom: boolean; onChange: (hex: string) => void; onReset: () => void }) {
  return (
    <div className="space-y-1.5">
      <ColorField label={custom ? label : `${label} (${t.automatic.toLowerCase()})`} value={value} onChange={onChange} />
      {custom && (
        <button type="button" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground" onClick={onReset}>
          {t.useAutomatic}
        </button>
      )}
    </div>
  );
}
