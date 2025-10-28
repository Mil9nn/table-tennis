"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { TeamMatch } from "@/types/match.type";
import { formatDate } from "@/lib/utils";
import MatchStatusBadge from "./MatchStatusBadge";

interface TeamMatchesListProps {
  matches: TeamMatch[];
}

export default function TeamMatchesList({ matches }: TeamMatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No team matches found</p>
        <p className="text-gray-400 text-sm mt-2">
          Team matches will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => {
        const isCompleted = match.status === "completed";

        return (
          <Link key={match._id} href={`/matches/${match._id}?category=team`}>
            <Card className="group hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
              <CardContent className="p-5 space-y-4">
                {/* Header with Status and Format */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {match.matchFormat.toUpperCase()} • Best of{" "}
                    {match.numberOfSetsPerSubMatch}
                  </span>
                  <MatchStatusBadge status={match.status} size="sm" showIcon={false} />
                </div>

                {/* Team Names and Score */}
                <div className="space-y-3">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate group-hover:text-blue-600 transition-colors">
                        {match.team1?.name || "Team 1"}
                      </p>
                      {match.team1?.city && (
                        <p className="text-xs text-gray-500 truncate">
                          {match.team1.city}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <span
                        className={`text-2xl font-bold ml-3 ${
                          match.winnerTeam === "team1"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {match.finalScore?.team1Matches || 0}
                      </span>
                    )}
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-3 text-xs font-medium text-gray-500">
                      VS
                    </span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate group-hover:text-blue-600 transition-colors">
                        {match.team2?.name || "Team 2"}
                      </p>
                      {match.team2?.city && (
                        <p className="text-xs text-gray-500 truncate">
                          {match.team2.city}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <span
                        className={`text-2xl font-bold ml-3 ${
                          match.winnerTeam === "team2"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {match.finalScore?.team2Matches || 0}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Info */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(match.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {match.city || match.venue || "Unknown Location"}
                    </span>
                  </div>
                  </div>

                  {/* Winner Badge */}
                  {isCompleted && match.winnerTeam && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-semibold text-green-600">
                        {match.winnerTeam === "team1"
                          ? match.team1?.name
                          : match.team2?.name}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
