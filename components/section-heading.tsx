import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
      <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  );
}
