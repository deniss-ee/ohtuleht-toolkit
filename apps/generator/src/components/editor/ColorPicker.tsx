import { HexColorPicker } from "react-colorful";
import { brand } from "@ohtuleht/brand";
import { ui } from "@/content";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Brand colours offered as one-click choices under the picker.
const quick = () => [
  { name: "Red 600", hex: brand.colors.find((c) => c.id === "red")?.steps["600"] ?? "#F50000" },
  { name: "Red 700", hex: brand.colors.find((c) => c.id === "red")?.steps["700"] ?? "#C70000" },
  { name: "Yellow 300", hex: brand.colors.find((c) => c.id === "yellow")?.steps["300"] ?? "#FAC500" },
  { name: "Ink 950", hex: brand.colors.find((c) => c.id === "ink")?.steps["950"] ?? "#2A2A2D" },
  { name: "Ink 100", hex: brand.colors.find((c) => c.id === "ink")?.steps["100"] ?? "#EFEFF1" },
  { name: ui.white, hex: "#FFFFFF" },
  { name: ui.black, hex: "#000000" },
];

// Our own colour picker. It looks and works the same on every system (the built-in one changes with the operating system).
export function ColorPicker({ value, onChange, label, className }: { value: string; onChange: (hex: string) => void; label: string; className?: string }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={ui.chooseColour(label)} className={`h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 ${className ?? ""}`}>
          <span className="block size-full rounded-sm border border-black/10" style={{ background: safe }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3">
        <HexColorPicker color={safe} onChange={(hex) => onChange(hex.toLowerCase())} style={{ width: "100%" }} />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={ui.brandColours}>
          {quick().map((q) => (
            <button
              key={q.name}
              type="button"
              title={`${q.name} ${q.hex}`}
              aria-label={`${q.name} ${q.hex}`}
              className="size-6 rounded-md border border-black/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              style={{ background: q.hex }}
              onClick={() => onChange(q.hex.toLowerCase())}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
