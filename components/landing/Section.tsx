import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lp-accent)]">
      {children}
    </p>
  );
}

export function SectionHeading({
  children,
  className,
  id,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-[var(--lp-text)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "max-w-2xl text-base leading-relaxed text-[var(--lp-text-muted)] sm:text-lg",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SectionShell({
  id,
  children,
  className,
  ariaLabelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  ariaLabelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn("relative scroll-mt-24 py-14 sm:py-16 lg:py-20", className)}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
