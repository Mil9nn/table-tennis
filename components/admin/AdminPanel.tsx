import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AdminPanel({
  title,
  icon: Icon,
  children,
  className,
  contentClassName,
  action,
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--lp-border)] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <Icon className="size-4 shrink-0 text-[var(--lp-accent)]" aria-hidden="true" />
            ) : null}
            <h3 className="truncate text-sm font-medium text-[var(--lp-text)]">{title}</h3>
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
