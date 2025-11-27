// components/live-scorer/common/MatchInfo.tsx
"use client";

import { Timer, Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchInfoProps {
  currentGame: number;
  totalGames: number;
  matchStartTime?: Date;
  rallyCount?: number;
}

export default function MatchInfo({
  currentGame,
  totalGames,
  matchStartTime,
  rallyCount = 0,
}: MatchInfoProps) {
  return (
    <Card className="rounded-none border-none shadow-none p-2">
      <CardContent>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Game Progress */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white
                flex items-center justify-center font-bold shadow-lg">
                {currentGame}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Game {currentGame}</p>
                <p className="text-xs text-gray-500">of {totalGames}</p>
              </div>
            </div>
          </div>

          {/* Rally Counter */}
          {rallyCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
              <Timer className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">
                <span className="font-semibold">{rallyCount}</span> rallies
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}