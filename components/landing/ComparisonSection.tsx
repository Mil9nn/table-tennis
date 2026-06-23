import { Check, X } from "lucide-react";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn } from "./motion";

const ROWS = [
  { feature: "Team formats (Swaythling, SDS)", ttpro: true, basic: false },
  { feature: "Tournament engine (RR, KO, hybrid)", ttpro: true, basic: false },
  { feature: "Live sync across devices", ttpro: true, basic: false },
  { feature: "Player profiles & history", ttpro: true, basic: false },
  { feature: "Global leaderboards", ttpro: true, basic: false },
  { feature: "Competition analytics", ttpro: true, basic: false },
  { feature: "Multi-scorer collaboration", ttpro: true, basic: false },
  { feature: "Basic point counting", ttpro: true, basic: true },
] as const;

function CellIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="mx-auto size-5 text-[var(--lp-live)]" aria-label="Yes" />
  ) : (
    <X className="mx-auto size-5 text-[var(--lp-text-muted)]/40" aria-label="No" />
  );
}

export function ComparisonSection() {
  return (
    <SectionShell id="compare" ariaLabelledBy="compare-heading">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>Compare</SectionLabel>
        <SectionHeading id="compare-heading" className="mt-3">
          TTPro vs basic score apps
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          A ping pong score tracker counts points. TTPro runs your entire
          competition—matches, teams, tournaments, and rankings in one place.
        </SectionLead>
      </FadeIn>

      <FadeIn className="mt-12 overflow-hidden rounded-2xl border border-[var(--lp-border)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--lp-border)] bg-[var(--lp-surface)]">
                <th scope="col" className="px-6 py-4 font-medium text-[var(--lp-text-muted)]">
                  Capability
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center font-[family-name:var(--font-syne)] font-bold text-[var(--lp-accent)]"
                >
                  TTPro
                </th>
                <th scope="col" className="px-6 py-4 text-center font-medium text-[var(--lp-text-muted)]">
                  Basic apps
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={
                    i % 2 === 0
                      ? "bg-[var(--lp-bg)]/40"
                      : "bg-[var(--lp-surface)]/40"
                  }
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-normal text-[var(--lp-text)]"
                  >
                    {row.feature}
                  </th>
                  <td className="px-6 py-4">
                    <CellIcon value={row.ttpro} />
                  </td>
                  <td className="px-6 py-4">
                    <CellIcon value={row.basic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeIn>
    </SectionShell>
  );
}
