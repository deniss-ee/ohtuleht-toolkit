import type { LucideIcon } from "lucide-react";

// Coloured round icon in front of a title: makes cards easy to tell apart at a glance.
const TONES = {
  red: "bg-red-600/10 text-red-600 dark:text-red-400",
  yellow: "bg-yellow-300/25 text-yellow-700 dark:text-yellow-300",
  ink: "bg-ink-500/15 text-ink-700 dark:text-ink-300",
} as const;

export type Tone = keyof typeof TONES;

export function IconChip({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
      <Icon className="size-4" />
    </span>
  );
}
