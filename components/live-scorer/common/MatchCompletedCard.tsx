"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatTimeDuration } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";

interface MatchCompletedCardProps {
  match: IndividualMatch | null;
}

export default function MatchCompletedCard({ match }: MatchCompletedCardProps) {
  if (!match) return null;

  const renderWinnerName = () => {
    if (!match.winnerSide) return "Draw";

    if (match.matchType === "singles") {
      const winnerIndex = match.winnerSide === "side1" ? 0 : 1;
      const participant = match.participants?.[winnerIndex];
      return participant?.fullName || participant?.username || `Side ${match.winnerSide === "side1" ? "1" : "2"}`;
    }

    // doubles / mixed_doubles
    if (match.winnerSide === "side1") {
      const p1 = match.participants?.[0];
      const p2 = match.participants?.[1];
      return `${p1?.fullName || p1?.username || "Player 1"} & ${p2?.fullName || p2?.username || "Player 2"}`;
    } else {
      const p1 = match.participants?.[2];
      const p2 = match.participants?.[3];
      return `${p1?.fullName || p1?.username || "Player 3"} & ${p2?.fullName || p2?.username || "Player 4"}`;
    }
  };

  const finalScore = match.finalScore;
  const matchScore = `${finalScore?.side1Sets ?? 0} - ${finalScore?.side2Sets ?? 0}`;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-4xl">🏆</div>
        
        <h2 className="text-2xl font-bold text-green-700">
          MATCH COMPLETED!
        </h2>
        
        <div className="space-y-2">
          <div className="text-xl font-semibold">
            Winner: <span className="text-green-800">{renderWinnerName()}</span>
          </div>
          
          <div className="text-lg text-gray-600">
            Final Score: <span className="font-medium">{matchScore}</span>
          </div>
          
          {match.matchDuration && (
            <div className="text-sm text-gray-500">
              Duration: {formatTimeDuration(match.matchDuration)}
            </div>
          )}
        </div>

        <div className="pt-2 text-xs text-gray-500">
          Match completed at {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}