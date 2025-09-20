"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function MatchCompletedCard({ match }) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6 text-center">
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          🏆 MATCH COMPLETED!
        </h2>
        <div className="text-lg">
          <strong>
            Winner:{" "}
            {match.winner === "player1"
              ? match.participants?.[0] || "Player 1"
              : match.winner === "player2"
              ? match.participants?.[1] || "Player 2"
              : "—"}
          </strong>
        </div>
        <p className="text-gray-600">
          Final Score: {match.finalScore?.side1Sets ?? 0} -{" "}
          {match.finalScore?.side2Sets ?? 0}
        </p>
      </CardContent>
    </Card>
  );
}
