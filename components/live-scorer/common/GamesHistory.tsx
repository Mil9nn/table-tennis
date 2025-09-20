"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GamesHistory({ games, currentGame, participants }) {
  if (!games || games.length === 0) return null;

  // Filter out placeholder/empty games: show only games that:
  // - have a winner OR
  // - have a non-zero score OR
  // - are earlier than the currentGame (so partial current game can be excluded if empty)
  const meaningfulGames = (games || []).filter((g) => {
    const hasScores = (g.side1Score ?? 0) > 0 || (g.side2Score ?? 0) > 0;
    const hasWinner = !!g.winner;
    const earlierThanCurrent = g.gameNumber < currentGame;
    return hasWinner || hasScores || earlierThanCurrent;
  });

  if (meaningfulGames.length === 0) return null;

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Games History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {meaningfulGames.map((game) => {
            const winnerName =
              game.winner === "side1"
                ? participants?.[0]?.fullName ??
                  participants?.[0]?.username ??
                  "Player 1"
                : game.winner === "side2"
                ? participants?.[1]?.fullName ??
                  participants?.[1]?.username ??
                  "Player 2"
                : null;

            return (
              <div
                key={game.gameNumber}
                className={`flex justify-between items-center p-3 border rounded ${
                  game.gameNumber === currentGame && !game.winner
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
              >
                <span className="font-medium">Game {game.gameNumber}</span>

                <span className="font-semibold text-lg">
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
      </CardContent>
    </Card>
  );
}
