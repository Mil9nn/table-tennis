"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GamesHistory({ games, currentGame }) {
  if (!games || games.length === 0) return null;

  return (
    <Card className="rounded-md">
      <CardHeader>
        <CardTitle>Games History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {games.map((game, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-3 border rounded ${
                game.gameNumber === currentGame && !game.winner
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
            >
              <span className="font-medium">Game {game.gameNumber}</span>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-lg">
                  {game.side1Score} - {game.side2Score}
                </span>
              </div>
              {game.winner && (
                <Badge variant="outline" className="text-xs">
                  Won by {game.winner === "player1" ? "Player 1" : "Player 2"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
