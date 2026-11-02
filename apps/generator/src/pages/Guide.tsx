import { ArrowLeft, ArrowRight, BookOpen, Check, Gift, HandHelping, DoorOpen, Laptop, LifeBuoy, Lightbulb, TriangleAlert, User, Users, type LucideIcon } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { PageHeader } from "@/components/editor/PageHeader";
import { ShotPlaceholder } from "@/components/editor/ShotPlaceholder";
import { StartCard } from "@/components/editor/StartCard";
import { Button } from "@/components/ui/button";
import { guide as t } from "@/content";
import { FIRST_DAYS, TOPICS, type Step, type Topic } from "@/guide-content";
import { GuideLink, Rich, Secret, useChecklist, useGuideValues, ValuesProvider } from "@/lib/guide";

const ICONS: Record<Topic["icon"], LucideIcon> = { hand: HandHelping, door: DoorOpen, gift: Gift, users: Users, laptop: Laptop, "life-buoy": LifeBuoy };

// One step: a number, a short title, a line or two of text, small extras, and a screenshot slot.
function StepView({ n, step, topic }: { n: number; step: Step; topic: string }) {
  return (
    <li id={`${topic}-${n}`} className="scroll-mt-4 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden>
          {n}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <h2 className="text-lg leading-snug font-semibold">{step.title}</h2>
          {step.text && <p className="leading-relaxed [overflow-wrap:anywhere]">{<Rich text={step.text} />}</p>}
          {step.chips && (
            <ul className="flex flex-wrap gap-2">
              {step.chips.map((c) => (
                <li key={c} className="rounded-full bg-muted px-3 py-1 text-sm">
                  <Rich text={c} />
                </li>
              ))}
            </ul>
          )}
          {step.people && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {step.people.map((p) => (
                <li key={p.key} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
                    <User className="size-5" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block leading-snug font-medium">{p.role}</span>
                    {p.unit && <span className="block text-xs text-muted-foreground">{p.unit}</span>}
                    <span className="mt-0.5 block">
                      <Secret k={p.key} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {step.tip && (
            <p className="flex items-start gap-2 rounded-lg bg-yellow-300/20 px-3 py-2 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-700 dark:text-yellow-300" aria-hidden />
              <span>
                <span className="font-medium">{t.tip}: </span>
                <Rich text={step.tip} />
              </span>
            </p>
          )}
          {step.warn && (
            <p className="flex items-start gap-2 rounded-lg bg-red-600/10 px-3 py-2 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
              <span>
                <span className="font-medium">{t.warn}: </span>
                <Rich text={step.warn} />
              </span>
            </p>
          )}
          {step.links && (
            <div className="flex flex-wrap gap-2">
              {step.links.map((l) => (
                <GuideLink key={l.label} label={l.label} href={l.href} />
              ))}
            </div>
          )}
          {step.shot && <ShotPlaceholder id={step.shot.id} caption={step.shot.caption} ratio={step.shot.ratio} />}
        </div>
      </div>
    </li>
  );
}

// The guide: a start page (checklist and topics) and one page per topic.
export function Guide({ topic, onTopic }: { topic: string | null; onTopic: (id: string | null) => void }) {
  const values = useGuideValues();
  const [done, toggle] = useChecklist();
  const current = TOPICS.find((x) => x.id === topic);
  const index = current ? TOPICS.indexOf(current) : -1;
  const open = (id: string | null) => {
    onTopic(id);
    window.scrollTo(0, 0);
  };

  if (!current) {
    const count = FIRST_DAYS.filter((f) => done.has(f.id)).length;
    return (
      <ValuesProvider value={values}>
        <div className="mx-auto max-w-5xl space-y-6">
          <PageHeader icon={BookOpen} title={t.title} intro={t.intro} />

          <section aria-label={t.startHere} className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-semibold">{t.startHere}</h2>
              <span className="text-sm text-muted-foreground">{t.progress(count, FIRST_DAYS.length)}</span>
              <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={FIRST_DAYS.length} aria-valuenow={count}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / FIRST_DAYS.length) * 100}%` }} />
              </div>
            </div>
            <ul className="space-y-1">
              {FIRST_DAYS.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/50">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done.has(f.id)}
                    aria-label={f.text}
                    onClick={() => toggle(f.id)}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${done.has(f.id) ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
                  >
                    {done.has(f.id) && <Check className="size-4" aria-hidden />}
                  </button>
                  <span className={`flex-1 text-sm ${done.has(f.id) ? "text-muted-foreground line-through" : ""}`}>{f.text}</span>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => open(f.topic)}>
                    {t.open} <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((x) => (
              <StartCard key={x.id} icon={ICONS[x.icon]} title={x.title} text={x.text} badges={[t.steps(x.steps.length)]} action={t.open} onAction={() => open(x.id)} />
            ))}
          </div>
          <p className="rounded-xl border border-dashed bg-muted/50 p-4 text-center font-medium text-primary">{t.welcome}</p>
        </div>
      </ValuesProvider>
    );
  }

  const prev = TOPICS[index - 1];
  const next = TOPICS[index + 1];
  return (
    <ValuesProvider value={values}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => open(null)}>
          <ArrowLeft className="size-4" /> {t.back}
        </Button>
        <div className="flex items-center gap-3">
          <IconChip icon={ICONS[current.icon]} tone="red" />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{current.title}</h1>
            <p className="text-muted-foreground">{current.text}</p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label={t.contents} className="hidden lg:block">
            <ol className="sticky top-4 space-y-1 text-sm">
              {current.steps.map((s, i) => (
                <li key={s.title}>
                  <a href={`#${current.id}-${i + 1}`} onClick={(e) => (e.preventDefault(), document.getElementById(`${current.id}-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))} className="flex gap-2 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="w-4 shrink-0 text-right tabular-nums">{i + 1}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <ol className="space-y-4">
            {current.steps.map((s, i) => (
              <StepView key={s.title} n={i + 1} step={s} topic={current.id} />
            ))}
          </ol>
        </div>

        <nav aria-label={t.moreTopics} className="grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Button variant="outline" className="h-auto justify-start gap-3 p-3 text-left" onClick={() => open(prev.id)}>
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              <span>
                <span className="block text-xs text-muted-foreground">{t.prev}</span>
                {prev.title}
              </span>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button variant="outline" className="h-auto justify-end gap-3 p-3 text-right sm:col-start-2" onClick={() => open(next.id)}>
              <span>
                <span className="block text-xs text-muted-foreground">{t.next}</span>
                {next.title}
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Button>
          ) : (
            <Button className="gap-2 sm:col-start-2" onClick={() => open(null)}>
              {t.done}
            </Button>
          )}
        </nav>
      </div>
    </ValuesProvider>
  );
}
