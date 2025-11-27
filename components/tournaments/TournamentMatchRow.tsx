"use client";

import { IndividualMatch } from "@/types/match.type";
import { Calendar, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TournamentMatchRowProps {
  match: IndividualMatch;
  roundNumber?: number;
  matchNumber?: number;
}

export default function TournamentMatchRow({
  match,
  roundNumber,
  matchNumber
}: TournamentMatchRowProps) {
  const [side1Player1, side1Player2] = match.matchType === "singles"
    ? [match.participants[0], null]
    : [match.participants[0], match.participants[1]];

  const [side2Player1, side2Player2] = match.matchType === "singles"
    ? [match.participants[1], null]
    : [match.participants[2], match.participants[3]];

  const isCompleted = match.status === "completed";
  const isLive = match.status === "in_progress";
  const side1Won = match.winnerSide === "side1";
  const side2Won = match.winnerSide === "side2";

  const getStatusBadge = () => {
    switch (match.status) {
      case "completed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>;
      case "in_progress":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium animate-pulse">Live</span>;
      case "scheduled":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Scheduled</span>;
      default:
        return null;
    }
  };

  return (
    <Link
      href={`/matches/${match._id}`}
      className="grid grid-cols-12 gap-2 items-center py-3 px-4 hover:bg-blue-50/50 transition-colors border-b border-gray-100 last:border-b-0 group"
    >
      {/* Round/Match Number */}
      <div className="col-span-1 text-center">
        <div className="text-xs text-gray-500 font-medium">
          {roundNumber && <div>R{roundNumber}</div>}
          {matchNumber && <div className="text-[10px] text-gray-400">#{matchNumber}</div>}
        </div>
      </div>

      {/* Side 1 Players */}
      <div className="col-span-4 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="size-8 border-2 border-gray-200">
            <AvatarImage src={side1Player1?.profileImage} />
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {side1Player1?.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className={`text-sm truncate font-medium ${side1Won ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
              {side1Player1?.fullName || "TBD"}
            </div>
            {side1Player2 && (
              <div className={`text-xs truncate ${side1Won ? "text-blue-500" : "text-gray-500"}`}>
                {side1Player2?.fullName}
              </div>
            )}
          </div>
          {side1Won && <Trophy className="size-3 text-yellow-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Score */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        {isCompleted ? (
          <div className="flex items-center gap-2 font-mono">
            <span className={`text-lg font-bold ${side1Won ? "text-blue-600" : "text-gray-600"}`}>
              {match.finalScore?.side1Sets || 0}
            </span>
            <span className="text-gray-400">-</span>
            <span className={`text-lg font-bold ${side2Won ? "text-blue-600" : "text-gray-600"}`}>
              {match.finalScore?.side2Sets || 0}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400">vs</div>
        )}
      </div>

      {/* Side 2 Players */}
      <div className="col-span-4 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {side2Won && <Trophy className="size-3 text-yellow-500 flex-shrink-0" />}
          <Avatar className="size-8 border-2 border-gray-200">
            <AvatarImage src={side2Player1?.profileImage} />
            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
              {side2Player1?.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className={`text-sm truncate font-medium ${side2Won ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
              {side2Player1?.fullName || "TBD"}
            </div>
            {side2Player2 && (
              <div className={`text-xs truncate ${side2Won ? "text-blue-500" : "text-gray-500"}`}>
                {side2Player2?.fullName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="col-span-1 flex justify-end">
        {getStatusBadge()}
      </div>
    </Link>
  );
}
