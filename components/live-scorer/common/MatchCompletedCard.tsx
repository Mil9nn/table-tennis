"use client";

import { Card, CardContent } from "@/components/ui/card";

interface MatchCompletedCardProps {
  match: any; // Replace 'any' with the actual type of 'match'
}

export default function MatchCompletedCard({ match }: MatchCompletedCardProps) {
  if (!match) return null;

  const renderWinnerName = () => {
    if (!match.winner) return "—";

    if (match.matchType === "singles") {
      return match.winner === "side1"
        ? match.participants?.[0]?.fullName ||
            match.participants?.[0]?.username ||
            "Side 1"
        : match.participants?.[1]?.fullName ||
            match.participants?.[1]?.username ||
            "Side 2";
    }

    // doubles / mixed_doubles
    if (match.winner === "side1") {
      return `${match.participants?.[0]?.fullName || "Side 1A"} & ${
        match.participants?.[1]?.fullName || "Side 1B"
      }`;
    }
    if (match.winner === "side2") {
      return `${match.participants?.[2]?.fullName || "Side 2A"} & ${
        match.participants?.[3]?.fullName || "Side 2B"
      }`;
    }

    return "—";
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6 text-center">
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          🏆 MATCH COMPLETED!
        </h2>
        <div className="text-lg">
          <strong>Winner: {renderWinnerName()}</strong>
        </div>
        <p className="text-gray-600">
          Final Score: {match.finalScore?.side1Sets ?? 0} -{" "}
          {match.finalScore?.side2Sets ?? 0}
        </p>
      </CardContent>
    </Card>
  );
}