import { Monitor, Smartphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// The desktop / phone switch at the top of the banner editors: two icons instead of words.
// The name and the size show as a tip when the pointer rests on an icon, and screen readers read them.
export function FormatSwitch({
  value,
  desktop,
  mobile,
  label,
  onChange,
}: {
  value: string;
  desktop: { value: string; label: string }; // label e.g. "Desktop 1250x400"
  mobile: { value: string; label: string };
  label: string; // name of the whole switch
  onChange: (value: string) => void;
}) {
  const items = [
    { ...desktop, icon: Monitor },
    { ...mobile, icon: Smartphone },
  ];
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList aria-label={label}>
        {items.map(({ value: v, label: text, icon: Icon }) => (
          <Tooltip key={v}>
            <TooltipTrigger asChild>
              <TabsTrigger value={v} aria-label={text} className="px-3">
                <Icon className="size-4" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>{text}</TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}
