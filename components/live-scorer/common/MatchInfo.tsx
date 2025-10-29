// components/live-scorer/common/MatchInfo.tsx
"use client";

import { Clock, Timer, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchInfoProps {
  currentGame: number;
  totalGames: number;
  matchStartTime?: Date;
  expediteActive?: boolean;
  rallyCount?: number;
}

export default function MatchInfo({
  currentGame,
  totalGames,
  matchStartTime,
  expediteActive = false,
  rallyCount = 0,
}: MatchInfoProps) {
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    if (!matchStartTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(matchStartTime).getTime();
      const diff = now - start;

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime]);

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

          {/* Match Duration */}
          {matchStartTime && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-mono font-semibold text-sm">{elapsedTime}</span>
            </div>
          )}

          {/* Rally Counter */}
          {rallyCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
              <Timer className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">
                <span className="font-semibold">{rallyCount}</span> rallies
              </span>
            </div>
          )}

          {/* Expedite System Indicator */}
          {expediteActive && (
            <Badge 
              variant="outline" 
              className="bg-orange-50 border-orange-200 text-orange-700 
                shadow-md flex items-center gap-2 px-4 py-2"
            >
              <Wind className="w-4 h-4" />
              <span className="font-semibold">Expedite Active</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}