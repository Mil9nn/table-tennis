"use client";

import Link from "next/link";
import React from "react";
import { formatDateShort } from "@/lib/utils";

export type TournamentCardProps = {
  tournament: {
    _id: string;
    name: string;
    format: string;
    category?: string;
    matchType?: string;
    startDate: string;
    endDate?: string;
    status: string;
    city: string;
    venue?: string;
    participants: any[];
    organizer?: any;
    maxParticipants?: number;
  };
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getTournamentTypeLabel = () => {
    // For team tournaments, show "Team"
    if (tournament.category === "team") {
      return "Team";
    }
    // For individual tournaments, show matchType (Singles/Doubles)
    if (tournament.matchType) {
      return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
    }
    // Fallback to "Singles" if no matchType specified
    return "Singles";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "upcoming":
        return "text-orange-500";
      case "draft":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const tournamentTypeLabel = getTournamentTypeLabel();
  const formatLabel = tournament.format === "hybrid"
    ? "Hybrid"
    : tournament.format.replace(/_/g, " ");
  const statusLabel = tournament.status.replace(/_/g, " ");
  const statusColor = getStatusColor(tournament.status);

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className="group block border border-[#d9d9d9] bg-[#ffffff] p-4 transition-colors hover:bg-[#3c6e71]"
    >
      {/* Line 1: Tournament name */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm text-gray-800 group-hover:text-[#ffffff] transition-colors">
          {tournament.name}
        </h3>
      </div>

      {/* Line 2: Meta info - Status, Type, Format */}
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        <span className={`capitalize ${statusColor} group-hover:text-[#ffffff] transition-colors`}>{statusLabel}</span>
        <span>•</span>
        <span className="capitalize">{tournamentTypeLabel}</span>
        <span>•</span>
        <span className="capitalize">{formatLabel}</span>
      </div>

      {/* Line 3: Meta info - Date, City, Participants */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        <span>{formatDateShort(tournament.startDate)}</span>
        {tournament.city && (
          <>
            <span>•</span>
            <span>{tournament.city}</span>
          </>
        )}
        <span>•</span>
        <span>
          {tournament.participants.length}
          {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""} players
        </span>
      </div>
    </Link>
  );
}

export default TournamentCard;
