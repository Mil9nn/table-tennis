"use client";

import { isIndividualMatch, Match } from "@/types/match.type";
import clsx from "clsx";

interface Props {
  match: Match;
}

export default function MatchScore({ match }: Props) {
  const isIndividual = isIndividualMatch(match);
  const isCompleted = match.status === "completed";

  return (
    <section className="p-4">
      <header className="flex justify-between items-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {isIndividual ? "Individual match" : "Team match"}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {isIndividual ? "Sets" : "Matches"}
        </span>
      </header>

      <div className="space-y-2">
        {isIndividual ? (
          <IndividualRows match={match} />
        ) : (
          <TeamRows match={match} />
        )}
      </div>
    </section>
  );
}

function IndividualRows({ match }: { match: any }) {
  const isDoubles = match.matchType === "doubles";

  const names = [
    isDoubles
      ? `${match.participants?.[0]?.fullName} / ${match.participants?.[1]?.fullName}`
      : match.participants?.[0]?.fullName,
    isDoubles
      ? `${match.participants?.[2]?.fullName} / ${match.participants?.[3]?.fullName}`
      : match.participants?.[1]?.fullName,
  ];

  return (
    <>
      <ScoreRow
        name={names[0] || "Side 1"}
        score={match.finalScore?.side1Sets ?? 0}
        isWinner={match.winnerSide === "side1"}
      />
      <ScoreRow
        name={names[1] || "Side 2"}
        score={match.finalScore?.side2Sets ?? 0}
        isWinner={match.winnerSide === "side2"}
      />
    </>
  );
}

function TeamRows({ match }: { match: any }) {
  return (
    <>
      <ScoreRow
        name={match.team1.name}
        score={match.finalScore?.team1Matches ?? 0}
        isWinner={match.winnerTeam === "team1"}
      />
      <ScoreRow
        name={match.team2.name}
        score={match.finalScore?.team2Matches ?? 0}
        isWinner={match.winnerTeam === "team2"}
      />
    </>
  );
}

function ScoreRow({
  name,
  score,
  isWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={"flex items-center justify-between"}>
      <p
        className={clsx(
          "text-sm font-medium truncate",
          isWinner
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-zinc-600"
        )}
      >
        {name}
      </p>

      <span
        className={clsx(
          "text-xl font-extrabold tabular-nums",
          isWinner
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-zinc-400"
        )}
      >
        {score}
      </span>
    </div>
  );
}