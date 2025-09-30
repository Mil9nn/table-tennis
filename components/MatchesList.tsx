"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IndividualMatch } from "@/types/match.type";

// Utility for status → color
const statusColors: Record<string, string> = {
  completed: "bg-white text-green-700 border-green-400",
  in_progress: "bg-white text-yellow-700 border-yellow-400 animate-pulse",
  scheduled: "bg-white text-blue-700 border-blue-400",
  cancelled: "bg-white text-red-700 border-red-400",
};

// Minimal avatar with fallback
function Player({
  name,
  profileImage,
  align = "left",
}: {
  name?: string;
  profileImage?: string;
  align?: "left" | "right";
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";

  const avatar = profileImage ? (
    <Image
      src={profileImage}
      alt={name || "Player"}
      width={28}
      height={28}
      className="w-7 h-7 rounded-full object-cover bg-white border"
    />
  ) : (
    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold border">
      {fallbackInitial}
    </div>
  );

  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "left" && avatar}
      <p className="font-medium text-gray-800 truncate max-w-[120px]">
        {name || "Unknown Player"}
      </p>
      {align === "right" && avatar}
    </div>
  );
}

export default function MatchesList({ matches }: { matches: IndividualMatch[] }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg font-medium">No matches found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const winner =
          match.winnerSide === "side1"
            ? match.participants?.[0]?.fullName || "Side 1"
            : match.winnerSide === "side2"
            ? match.participants?.[1]?.fullName || "Side 2"
            : null;

        const statusClass = statusColors[match.status || "scheduled"] || "";

        return (
          <Link key={match._id} href={`/matches/${match._id}`}>
            <Card className="hover:shadow-xl transition duration-200 border rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">
                    {match.matchType.toUpperCase()} • Best of {match.numberOfSets}
                  </span>
                  <Badge className={`rounded-full text-xs px-3 ${statusClass}`}>
                    {match.status?.replace("_", " ") || "scheduled"}
                  </Badge>
                </div>

                {/* Participants */}
                <div>
                  {match.matchType === "singles" ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Player
                        name={match.participants?.[0]?.fullName}
                        profileImage={match.participants?.[0]?.profileImage}
                        align="right"
                      />
                      <Player
                        name={match.participants?.[1]?.fullName}
                        profileImage={match.participants?.[1]?.profileImage}
                        align="left"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <Player
                          name={match.participants?.[0]?.fullName}
                          profileImage={match.participants?.[0]?.profileImage}
                          align="right"
                        />
                        <Player
                          name={match.participants?.[1]?.fullName}
                          profileImage={match.participants?.[1]?.profileImage}
                          align="right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Player
                          name={match.participants?.[2]?.fullName}
                          profileImage={match.participants?.[2]?.profileImage}
                          align="left"
                        />
                        <Player
                          name={match.participants?.[3]?.fullName}
                          profileImage={match.participants?.[3]?.profileImage}
                          align="left"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Score */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">
                    {match.finalScore?.side1Sets ?? 0} -{" "}
                    {match.finalScore?.side2Sets ?? 0}
                  </p>
                  {winner && (
                    <p className="text-xs text-gray-500 mt-1">
                      🏆 Winner: {winner}
                    </p>
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