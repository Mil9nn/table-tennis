"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { IndividualMatch } from "@/types/match.type";
import { PlusCircle, Trophy } from "lucide-react";

// Status styles + labels
const statusStyles: Record<string, string> = {
  completed: "bg-white text-emerald-700 border-emerald-400",
  in_progress: "bg-white text-yellow-700 border-yellow-400",
  scheduled: "bg-white text-blue-700 border-blue-400",
  cancelled: "bg-white text-red-700 border-red-400",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
};

// Player avatar + name
function Player({
  name,
  profileImage,
  align = "left",
  highlight = false,
}: {
  name?: string;
  profileImage?: string;
  align?: "left" | "right";
  highlight?: boolean;
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
      } ${highlight ? "text-emerald-700 font-semibold" : "text-gray-800"}`}
    >
      {align === "left" && avatar}
      <p className="truncate max-w-[120px]">{name}</p>
      {align === "right" && avatar}
    </div>
  );
}

export default function MatchesList({
  matches,
}: {
  matches: IndividualMatch[];
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No matches found.</p>
        <Link href="/match/create">
          <Button className="mt-4">
            <PlusCircle className="size-5" /> Start New Match
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const isWinnerSide1 = match.winnerSide === "side1";
        const isWinnerSide2 = match.winnerSide === "side2";

        const winner =
          match.winnerSide === "side1"
            ? match.participants?.[0]?.fullName || "Side 1"
            : match.winnerSide === "side2"
            ? match.participants?.[1]?.fullName || "Side 2"
            : null;

        const statusClass = statusStyles[match.status || "scheduled"] || "";
        const statusLabel = statusLabels[match.status || "scheduled"];

        return (
          <Link key={match._id} href={`/matches/${match._id}`}>
            <Card className="hover:shadow-xl hover:scale-[1.02] transition-transform duration-200 border rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">
                    {match.matchType.toUpperCase()} • Best of{" "}
                    {match.numberOfSets}
                  </span>
                  <Badge className={`rounded-full text-xs px-3 ${statusClass}`}>
                    {statusLabel}
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
                        highlight={isWinnerSide1}
                      />
                      <Player
                        name={match.participants?.[1]?.fullName}
                        profileImage={match.participants?.[1]?.profileImage}
                        align="left"
                        highlight={isWinnerSide2}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <Player
                          name={match.participants?.[0]?.fullName}
                          profileImage={match.participants?.[0]?.profileImage}
                          align="right"
                          highlight={isWinnerSide1}
                        />
                        <Player
                          name={match.participants?.[1]?.fullName}
                          profileImage={match.participants?.[1]?.profileImage}
                          align="right"
                          highlight={isWinnerSide1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Player
                          name={match.participants?.[2]?.fullName}
                          profileImage={match.participants?.[2]?.profileImage}
                          align="left"
                          highlight={isWinnerSide2}
                        />
                        <Player
                          name={match.participants?.[3]?.fullName}
                          profileImage={match.participants?.[3]?.profileImage}
                          align="left"
                          highlight={isWinnerSide2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Score */}
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    <span
                      className={
                        isWinnerSide1 ? "text-emerald-600" : "text-gray-600"
                      }
                    >
                      {match.finalScore?.side1Sets ?? 0}
                    </span>
                    {" - "}
                    <span
                      className={
                        isWinnerSide2 ? "text-emerald-600" : "text-gray-600"
                      }
                    >
                      {match.finalScore?.side2Sets ?? 0}
                    </span>
                  </p>
                  {winner && (
                    <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                      <Trophy className="size-4 text-yellow-400 drop-shadow-md stroke-[2]" />
                      <span>Winner: {winner}</span>
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
