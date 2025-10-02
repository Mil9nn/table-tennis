"use client";

import { Badge } from "@/components/ui/badge";
import {
  IndividualGame,
  Participant,
  TeamTie,
  TeamMatch,
  IndividualMatch,
} from "@/types/match.type";

interface GamesHistoryProps {
  games: IndividualGame[]; // for individual
  currentGame?: number;
  participants?: Participant[];
  ties?: TeamTie[]; // for team
  matchCategory?: "individual" | "team";
}

export default function GamesHistory({
  games,
  currentGame,
  participants,
  ties,
  matchCategory = "individual",
}: GamesHistoryProps) {
  if (matchCategory === "team") {
    if (!ties || ties.length === 0) return null;
    return (
      <div className="p-2 space-y-4">
        <h3 className="font-semibold">Ties History</h3>
        <div className="space-y-2 flex items-center gap-4 flex-wrap">
          {ties.map((tie, i) => (
            <div
              key={i}
              className="w-fit flex text-sm items-center gap-6 p-2 px-4 border-2 rounded-full"
            >
              <span className="font-medium">Tie {i + 1}:</span>
              <span>
                {tie.a} vs {tie.b}
              </span>
              {tie.result && (
                <Badge variant="outline" className="text-xs">
                  Won by {tie.result === "side1" ? "Team A" : "Team B"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Default = individual
  if (!games || games.length === 0) return null;

  return (
    <div className="p-2 space-y-4">
      <h3 className="font-semibold">Games History</h3>
      <div>
        <div className="space-y-2 flex items-center gap-4 flex-wrap">
          {games.map((game) => {
            const winnerName =
              game.winnerSide === "side1"
                ? participants?.[0]?.fullName ??
                  participants?.[0]?.username ??
                  "Player 1"
                : game.winnerSide === "side2"
                ? participants?.[1]?.fullName ??
                  participants?.[1]?.username ??
                  "Player 2"
                : null;

            return (
              <div
                key={game.gameNumber}
                className={`w-fit flex text-sm items-center justify-between gap-6 p-2 px-4 border-2 rounded-full ${
                  game.gameNumber === currentGame && !game.winnerSide
                    ? "border-blue-500"
                    : ""
                }`}
              >
                <span className="font-medium">Game {game.gameNumber}:</span>
                <span>
                  {game.side1Score ?? 0} - {game.side2Score ?? 0}
                </span>
                {winnerName && (
                  <Badge variant="outline" className="text-xs">
                    Won by {winnerName}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}