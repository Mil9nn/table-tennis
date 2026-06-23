import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  accent?: "accent" | "live" | "muted" | "warning";
  className?: string;
  highlight?: boolean;
}

const accentStyles = {
  accent: "bg-[var(--lp-accent)]/15 text-[var(--lp-accent)]",
  live: "bg-[var(--lp-live)]/15 text-[var(--lp-live)]",
  muted: "bg-white/5 text-[var(--lp-text-muted)]",
  warning: "bg-amber-400/15 text-amber-300",
};

export function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "accent",
  className,
  highlight = false,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-[border-color,box-shadow] duration-200 hover:border-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-5",
        highlight && "border-[var(--lp-live)]/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-text-muted)]">
            {label}
          </p>
          <p className="mt-1.5 truncate font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-[var(--lp-text)] tabular-nums sm:text-[1.75rem]">
            {value}
          </p>
          {subtext ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--lp-text-muted)]">{subtext}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              accentStyles[accent]
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
