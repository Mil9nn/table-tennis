"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { IndividualMatch } from "@/types/match.type";
import GamesHistory from "@/components/live-scorer/common/GamesHistory";
import ShotFeed from "@/components/live-scorer/common/ShotFeed";
import MatchCompletedCard from "@/components/live-scorer/common/MatchCompletedCard";

export default function LiveMatchDetails({ matchId }: { matchId: string }) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const loading = useMatchStore((s) => s.loading);

  useEffect(() => {
    if (matchId) fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  if (loading)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
        <Loader2 className="animate-spin text-gray-500 w-8 h-8" />
      </div>
    );

  if (!match)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
        <p className="text-gray-500 italic text-sm">No match data available.</p>
      </div>
    );

  const individualMatch = match as IndividualMatch;
  const participants = individualMatch.participants || [];
  const isDoubles = participants.length === 4;

  // Separate sides
  const side1 = isDoubles ? participants.slice(0, 2) : participants.slice(0, 1);
  const side2 = isDoubles ? participants.slice(2, 4) : participants.slice(1, 2);

  const currentGame =
    individualMatch.games?.[individualMatch.currentGame - 1] || {};

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      {/* Match Header */}
      <header className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 italic capitalize tracking-tight">
          {individualMatch.matchType} Match
        </h2>
        <p className="text-gray-500 text-sm sm:text-base">
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
          <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <h3 className="text-lg sm:text-2xl font-semibold mb-6 text-gray-800">
              Live Score
            </h3>

            <div className="flex flex-row justify-center items-center gap-8">
              {/* Side 1 */}
              <div className="flex flex-col items-end space-y-1">
                {side1.map((p: any, i: number) => (
                  <p
                    key={i}
                    className="w-fit text-right text-md sm:text-lg font-medium text-gray-700"
                  >
                    {p.fullName || p.username || `Player ${i + 1}`}
                  </p>
                ))}
                <p className="mt-2 text-4xl self-center sm:text-5xl font-bold text-emerald-600">
                  {currentGame?.side1Score ?? 0}
                </p>
              </div>

              <div className="text-gray-400 text-2xl font-bold select-none">
                VS
              </div>

              {/* Side 2 */}
              <div className="flex flex-col items-start space-y-1">
                {side2.map((p: any, i: number) => (
                  <p
                    key={i}
                    className="text-md sm:text-lg font-medium text-gray-700"
                  >
                    {p.fullName || p.username || `Player ${i + 3}`}
                  </p>
                ))}
                <p className="mt-2 text-4xl sm:text-5xl self-center font-bold text-rose-600">
                  {currentGame?.side2Score ?? 0}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-center text-gray-400">
              Game {individualMatch.currentGame} of{" "}
              {individualMatch.numberOfSets}
            </p>
          </section>

          {/* Games History */}
          <section className="bg-gray-50 rounded-2xl shadow-sm p-4 sm:p-6">
            <GamesHistory
              games={individualMatch.games}
              currentGame={individualMatch.currentGame}
              participants={individualMatch.participants}
            />
          </section>

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
