import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: "ink" | "brand" | "green" | "amber" | "red";
  className?: string;
}) {
  const tones = {
    ink: "bg-ink-100 text-ink-700",
    brand: "bg-brand-100 text-brand-800",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    red: "bg-rose-100 text-rose-800",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", extra?: string) {
  const base =
    "focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
    ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return cn(base, variants[variant], extra);
}

export function Progress({ valor, max }: { valor: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100" role="presentation">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-ink-900">{value}</div>
      {hint ? <div className="text-xs text-ink-500">{hint}</div> : null}
    </div>
  );
}
