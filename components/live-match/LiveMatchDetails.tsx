"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { IndividualMatch } from "@/types/match.type";
import GamesHistory from "@/components/live-scorer/common/GamesHistory";
import ShotFeed from "@/components/live-scorer/common/ShotFeed";
import MatchCompletedCard from "@/components/live-scorer/common/MatchCompletedCard";
import { useSearchParams } from "next/navigation";

export default function LiveMatchDetails({ matchId }: { matchId: string }) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const loading = useMatchStore((s) => s.loading);


  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId);
    }
  }, [matchId, fetchMatch]);

  if (loading)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!match)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
        <p className="text-gray-500 italic">No match data available.</p>
      </div>
    );

  const individualMatch = match as IndividualMatch;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Match Header */}
      <header className="text-center">
        <h2 className="text-2xl font-bold">
          {individualMatch.matchType.toUpperCase()} Match
        </h2>
        <p className="text-gray-600">
          Best of {individualMatch.numberOfSets} sets •{" "}
          {individualMatch.city || "Unknown venue"}
        </p>
      </header>

      {/* If completed */}
      {individualMatch.status === "completed" ? (
        <MatchCompletedCard match={individualMatch} />
      ) : (
        <>
          {/* Current Score Overview */}
          <section className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Current Score</h3>
            <div className="flex justify-center gap-12 text-3xl font-bold">
              <div>
                {individualMatch.participants?.[0]?.fullName ||
                  individualMatch.participants?.[0]?.username ||
                  "Side 1"}
                <div className="text-emerald-600 mt-2">
                  {individualMatch.games?.[individualMatch.currentGame - 1]
                    ?.side1Score ?? 0}
                </div>
              </div>
              <span className="text-gray-500">vs</span>
              <div>
                {individualMatch.participants?.[1]?.fullName ||
                  individualMatch.participants?.[1]?.username ||
                  "Side 2"}
                <div className="text-rose-600 mt-2">
                  {individualMatch.games?.[individualMatch.currentGame - 1]
                    ?.side2Score ?? 0}
                </div>
              </div>
            </div>
          </section>

          {/* Games History */}
          <GamesHistory
            games={individualMatch.games}
            currentGame={individualMatch.currentGame}
            participants={individualMatch.participants}
          />

          {/* Rally Feed */}
          <ShotFeed
            games={individualMatch.games}
            currentGame={individualMatch.currentGame}
            participants={individualMatch.participants}
          />
        </>
      )}
    </div>
  );
}