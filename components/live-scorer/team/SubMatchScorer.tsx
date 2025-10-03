"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, RotateCcw } from "lucide-react";
import { TeamMatch, TeamSubMatch } from "@/types/match.type";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { useMatchStore } from "@/hooks/useMatchStore";

interface SubMatchScorerProps {
  match: TeamMatch;
  subMatch: TeamSubMatch;
  subMatchIndex: number;
}

export default function SubMatchScorer({ match, subMatch, subMatchIndex }: SubMatchScorerProps) {
  const {
    side1Score,
    side2Score,
    side1Sets,
    side2Sets,
    currentGame,
    isUpdatingScore,
    addPoint,
    subtractPoint,
    resetCurrentGame,
  } = useTeamMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);

  const currentGameData = subMatch.games[currentGame - 1];
  const isGameCompleted = currentGameData?.completed || false;

  const handleAddPoint = (side: "side1" | "side2") => {
    if (subMatch.type === "singles") {
      // Singles: Get the player ID directly
      const playerId = side === "side1" 
        ? subMatch.team1Players[0]?._id 
        : subMatch.team2Players[0]?._id;
      
      setPendingPlayer({ side, playerId });
      setShotDialogOpen(true);
    } else {
      // Doubles: Need to select which player
      setPendingPlayer({ side });
      setShotDialogOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>{subMatch.matchLabel}</span>
          <Badge variant="outline" className="text-xs">
            {subMatch.type.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player Names */}
        <div className="flex justify-between items-center gap-4">
          <div className="text-center flex-1">
            {subMatch.team1Players?.map((p: any, idx: number) => (
              <div key={idx} className="font-bold text-base sm:text-lg text-emerald-700">
                {p.fullName || p.username}
              </div>
            ))}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-300">VS</div>
          <div className="text-center flex-1">
            {subMatch.team2Players?.map((p: any, idx: number) => (
              <div key={idx} className="font-bold text-base sm:text-lg text-rose-700">
                {p.fullName || p.username}
              </div>
            ))}
          </div>
        </div>

        {/* Set Score */}
        <div className="flex justify-center gap-8 sm:gap-12 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">Sets Won</div>
            <div className="text-3xl font-bold text-emerald-600">
              {side1Sets}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-400">-</div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Sets Won</div>
            <div className="text-3xl font-bold text-rose-600">
              {side2Sets}
            </div>
          </div>
        </div>

        {/* Current Game Score */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <div className="text-center text-sm font-medium text-gray-600 mb-4">
            Game {currentGame} {isGameCompleted && "✓ Completed"}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Team 1 Score */}
            <div className="relative">
              <button
                onClick={() => handleAddPoint("side1")}
                disabled={isGameCompleted || isUpdatingScore}
                className="w-full bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-8 sm:p-12 transition shadow-lg active:scale-95"
              >
                <div className="text-5xl sm:text-7xl font-extrabold">
                  {side1Score}
                </div>
              </button>
              <button
                onClick={() => subtractPoint("side1")}
                disabled={isGameCompleted || side1Score === 0 || isUpdatingScore}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Subtract point"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Team 2 Score */}
            <div className="relative">
              <button
                onClick={() => handleAddPoint("side2")}
                disabled={isGameCompleted || isUpdatingScore}
                className="w-full bg-gradient-to-br from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-8 sm:p-12 transition shadow-lg active:scale-95"
              >
                <div className="text-5xl sm:text-7xl font-extrabold">
                  {side2Score}
                </div>
              </button>
              <button
                onClick={() => subtractPoint("side2")}
                disabled={isGameCompleted || side2Score === 0 || isUpdatingScore}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Subtract point"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => resetCurrentGame(false)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUpdatingScore}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Game
            </Button>
          </div>
        </div>

        {/* Games History */}
        <div className="flex gap-2 flex-wrap justify-center">
          {subMatch.games.map((game, idx) => {
            const isWon = (game.team1Score >= 11 || game.team2Score >= 11) && 
                         Math.abs(game.team1Score - game.team2Score) >= 2;
            const winner = game.team1Score > game.team2Score ? "team1" : "team2";
            const isCurrent = idx === currentGame - 1;
            
            return (
              <div
                key={idx}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium ${
                  game.completed
                    ? winner === "team1"
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                      : "bg-rose-100 text-rose-700 border-2 border-rose-300"
                    : isCurrent
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300 animate-pulse"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                G{game.gameNumber}: {game.team1Score}-{game.team2Score}
                {game.completed && " ✓"}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
