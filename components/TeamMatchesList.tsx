"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TeamMatch } from "@/types/match.type";
import { formatDate, getAvatarFallbackStyle } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMatchesListProps {
  matches: TeamMatch[];
}

export default function TeamMatchesList({ matches }: TeamMatchesListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No team matches found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {matches.map((match) => {
        const isCompleted = match.status === "completed";
        const team1Won = match.winnerTeam === "team1";
        const team2Won = match.winnerTeam === "team2";

        return (
          <Link
            key={match._id}
            href={`/matches/${match._id}?category=team`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            {/* Teams & Score */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {/* Team 1 with Logo */}
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={match.team1?.logo} alt={match.team1?.name} />
                    <AvatarFallback className="text-[10px]" style={getAvatarFallbackStyle(match.team1?._id)}>
                      {match.team1?.name?.charAt(0)?.toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`font-medium text-sm truncate ${
                      team1Won ? "text-green-600" : "text-gray-800"
                    }`}
                  >
                    {match.team1?.name || "Team 1"}
                  </span>
                </div>

                {/* Score */}
                {isCompleted ? (
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                    {match.finalScore?.team1Matches || 0} - {match.finalScore?.team2Matches || 0}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">vs</span>
                )}

                {/* Team 2 with Logo */}
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={match.team2?.logo} alt={match.team2?.name} />
                    <AvatarFallback className="text-[10px]" style={getAvatarFallbackStyle(match.team2?._id)}>
                      {match.team2?.name?.charAt(0)?.toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`font-medium text-sm truncate ${
                      team2Won ? "text-green-600" : "text-gray-800"
                    }`}
                  >
                    {match.team2?.name || "Team 2"}
                  </span>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">
                  {formatDate(match.createdAt)}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  {match.city || match.venue || "—"}
                </span>
              </div>
            </div>

            {/* Status & Arrow */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Minimal status dot - only show for non-completed matches */}
              {match.status !== "completed" && (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    match.status === "scheduled"
                      ? "bg-yellow-500"
                      : match.status === "in_progress"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                  title={match.status}
                />
              )}
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
