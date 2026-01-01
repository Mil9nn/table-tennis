import { Play, BarChart3, Radio } from "lucide-react";
import Link from "next/link";
import { IndividualGame, Match, SubMatch } from "@/types/match.type";
import clsx from "clsx";

interface Props {
  match: Match;
  matchId: string;
  isScorer: boolean;
}

export default function MatchActions({ match, matchId, isScorer }: Props) {
  const status = match.status;

  const isScheduled = status === "scheduled";
  const isInProgress = status === "in_progress";

  const hasShots =
    match.matchCategory === "individual"
      ? match.games?.some((g: IndividualGame) => g.shots?.length)
      : match.subMatches?.some((sm: SubMatch) =>
          sm.games?.some((g) => g.shots?.length)
        );

  const primaryAction =
    isScorer && (isScheduled || isInProgress)
      ? {
          label: isScheduled ? "Start match" : "Continue match",
          href: `/matches/${matchId}/score?category=${match.matchCategory}`,
          icon: Play,
        }
      : !isScorer && isInProgress
      ? {
          label: "View live",
          href: `/matches/${matchId}/live?category=${match.matchCategory}`,
          icon: Radio,
        }
      : null;

  if (!primaryAction && !hasShots) return null;

  return (
    <section className="p-6 border-t border-zinc-100 dark:border-zinc-800">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
        Actions
      </h3>

      <div className="flex flex-col gap-3">
        {primaryAction && (
          <ActionButton
            href={primaryAction.href}
            icon={primaryAction.icon}
            variant="primary"
          >
            {primaryAction.label}
          </ActionButton>
        )}

        {hasShots && (
          <ActionButton
            href={`/matches/${matchId}/stats?category=${match.matchCategory}`}
            icon={BarChart3}
            variant="secondary"
          >
            View match insights
          </ActionButton>
        )}
      </div>
    </section>
  );
}

function ActionButton({
  href,
  icon: Icon,
  variant,
  children,
}: {
  href: string;
  icon: any;
  variant: "primary" | "secondary";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all",
        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow",
        variant === "secondary" &&
          "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
      {children}
    </Link>
  );
}

