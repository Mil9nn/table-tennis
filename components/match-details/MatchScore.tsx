"use client";

import { isIndividualMatch, Match } from "@/types/match.type";

interface Props {
  match: Match;
}

export default function MatchScore({ match }: Props) {
  const isIndividual = isIndividualMatch(match);
  const isCompleted = match.status === "completed";

  return (
    <div className="p-6 border-b border-zinc-100">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header Label */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            {isIndividual ? "Individual Match" : "Team Match"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            {isIndividual ? "Sets" : "Matches"}
          </span>
        </div>

        {/* Competitors List */}
        <div className="space-y-3">
          {isIndividual ? (
            <IndividualRows match={match} />
          ) : (
            <TeamRows match={match} />
          )}
        </div>

        {/* Status / Footer */}
        <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex justify-center">
          <p className="text-[11px] font-medium text-zinc-500 italic">
            {isCompleted ? "Result" : "Match in Progress"}
          </p>
        </div>
      </div>
    </div>
  );
}

function IndividualRows({ match }: { match: any }) {
  const isDoubles = match.matchType === "doubles";

  const side1Players = isDoubles
    ? `${match.participants?.[0]?.fullName || "P1"} / ${
        match.participants?.[1]?.fullName || "P2"
      }`
    : match.participants?.[0]?.fullName || "Player 1";

  const side2Players = isDoubles
    ? `${match.participants?.[2]?.fullName || "P3"} / ${
        match.participants?.[3]?.fullName || "P4"
      }`
    : match.participants?.[1]?.fullName || "Player 2";

  return (
    <div>
      <ScoreRow
        name={side1Players}
        score={match.finalScore?.side1Sets || 0}
        isWinner={match.winnerSide === "side1"}
      />
      <ScoreRow
        name={side2Players}
        score={match.finalScore?.side2Sets || 0}
        isWinner={match.winnerSide === "side2"}
      />
    </div>
  );
}

function TeamRows({ match }: { match: any }) {
  return (
    <div>
      <ScoreRow
        name={match.team1.name}
        score={match.finalScore?.team1Matches || 0}
        isWinner={match.winnerTeam === "team1"}
      />
      <ScoreRow
        name={match.team2.name}
        score={match.finalScore?.team2Matches || 0}
        isWinner={match.winnerTeam === "team2"}
      />
    </div>
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
    <div className={`flex items-center justify-between gap-4`}>
      <p
        className={`text-sm font-semibold truncate ${
          isWinner ? "text-emerald-600 dark:text-white" : "text-zinc-500"
        }`}
      >
        {name}
      </p>

      <span
        className={`text-xl font-black tabular-nums ${
          isWinner ? "text-emerald-600 dark:text-white" : "text-zinc-400"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
