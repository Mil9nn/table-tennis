"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { NormalMatch } from "@/hooks/useMatchStore";

// Utility for status → color
const statusColors: Record<string, string> = {
  completed: "bg-white text-green-700 border-green-400",
  in_progress: "bg-white text-yellow-700 border-yellow-400 animate-pulse",
  scheduled: "bg-white text-blue-700 border-blue-400",
  cancelled: "bg-white text-red-700 border-red-400",
};

export default function MatchesList({ matches }: { matches: NormalMatch[] }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No matches found.</p>
      </div>
    );
  }

  console.log("Rendering MatchesList with matches:", matches);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const winner =
          match.winner === "side1"
            ? match.participants?.[0]?.fullName || "Side 1"
            : match.winner === "side2"
            ? match.participants?.[1]?.fullName || "Side 2"
            : null;

        const statusClass = statusColors[match.status || "scheduled"] || "";

        return (
          <Link key={match._id} href={`/matches/${match._id}`}>
            <Card className="hover:shadow-lg transition duration-200 border rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    {match.matchType.toUpperCase()} • Best of{" "}
                    {match.numberOfSets}
                  </span>
                  <Badge className={`rounded-full ${statusClass}`}>
                    {match.status?.replace("_", " ") || "scheduled"}
                  </Badge>
                </div>

                {/* Participants */}
                <div className="text-center">
                  {match.matchType === "singles" ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-right space-y-1">
                        <p className="font-semibold">
                          {match.participants?.[0]?.fullName || "Player 1"}
                        </p>
                      </div>
                      <div className="text-left space-y-1">
                        <p className="font-semibold">
                          {match.participants?.[1]?.fullName || "Player 2"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-right space-y-1">
                        <p className="font-semibold">
                          {match.participants?.[0]?.fullName || "P1A"}
                        </p>
                        <p className="font-semibold">
                          {match.participants?.[1]?.fullName || "P1B"}
                        </p>
                      </div>
                      <div className="text-left space-y-1">
                        <p className="font-semibold">
                          {match.participants?.[2]?.fullName || "P2A"}
                        </p>
                        <p className="font-semibold">
                          {match.participants?.[3]?.fullName || "P2B"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Score */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">
                    {match.finalScore?.side1Sets ?? 0} -{" "}
                    {match.finalScore?.side2Sets ?? 0}
                  </p>
                  {winner && (
                    <p className="text-sm text-gray-500">🏆 Winner: {winner}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>{match.city || "Unknown City"}</span>
                  <span>
                    {match.createdAt
                      ? format(new Date(match.createdAt), "dd MMM yyyy")
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
