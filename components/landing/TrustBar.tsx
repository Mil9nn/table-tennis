import {
  BarChart3,
  Building2,
  Radio,
} from "lucide-react";
import { StaggerContainer, StaggerItem } from "./motion";

const TRUST_ITEMS = [
  { icon: Building2, label: "Club-ready" },
  { icon: Radio, label: "Live sync" },
  { icon: BarChart3, label: "Stats & standings" },
] as const;

export function TrustBar() {
  return (
    <section aria-label="Platform capabilities" className="border-y border-[var(--lp-border)] bg-[var(--lp-surface)]/50 py-5">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <StaggerContainer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <StaggerItem key={label}>
              <div className="flex items-center gap-2.5 text-sm text-[var(--lp-text-muted)]">
                <Icon className="size-4 shrink-0 text-[var(--lp-accent)]" aria-hidden="true" />
                <span>{label}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
