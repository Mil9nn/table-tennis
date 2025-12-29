"use client";

import Link from "next/link";
import React from "react";
import { ChevronRight, MapPin, Users, Calendar, CheckCircle2, Users2 } from "lucide-react";
import { formatDateShort } from "@/lib/utils";

export type ScorerCardProps = {
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
    scorers?: any[];
    currentPhase?: "round_robin" | "knockout" | "transition";
    drawGenerated?: boolean;
    maxParticipants?: number;
  };
};

export function ScorerCard({ tournament }: ScorerCardProps) {
  const status = tournament.status;
  const statusCfg = getStatusConfig(status);

  const getPhaseLabel = () => {
    if (tournament.format === "hybrid" && tournament.currentPhase) {
      if (tournament.currentPhase === "round_robin") return "Round-Robin Phase";
      if (tournament.currentPhase === "knockout") return "Knockout Phase";
      if (tournament.currentPhase === "transition") return "Transitioning";
    }
    return null;
  };

  const phaseLabel = getPhaseLabel();
  const getMatchTypeLabel = () => {
    if (!tournament.matchType) return "Singles";
    return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
  };

  const organizerName = tournament.organizer?.fullName || tournament.organizer?.username || "Unknown";
  const otherScorersCount =
    (tournament.scorers?.length || 0) > 0 ? tournament.scorers!.length - 1 : 0;
  const capacityDisplay = tournament.maxParticipants
    ? `${tournament.participants.length}/${tournament.maxParticipants}`
    : `${tournament.participants.length}`;

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className="group block border border-[#d9d9d9] bg-[#ffffff] p-5 transition-colors hover:bg-[#3c6e71]"
    >
      {/* Header Row: Status, Name, Badges */}
      <div className="w-full flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 shrink-0 ${statusCfg.badge}`}
          >
            {statusCfg.label}
          </span>
          <h3 className="truncate text-sm font-bold text-[#353535] group-hover:text-[#ffffff] transition-colors uppercase tracking-wide">
            {tournament.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tournament.matchType && (
            <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold bg-[#f0f0f0] text-[#353535] uppercase tracking-wider group-hover:bg-[#284b63] group-hover:text-[#ffffff] transition-colors">
              {getMatchTypeLabel()}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold bg-[#d9d9d9] text-[#353535] uppercase tracking-wider group-hover:bg-[#284b63] group-hover:text-[#ffffff] transition-colors">
            {tournament.format === "hybrid"
              ? "Hybrid"
              : tournament.format.replace(/_/g, " ")}
          </span>
          <ChevronRight className="size-4 text-[#d9d9d9] transition group-hover:translate-x-1 group-hover:text-[#ffffff]" />
        </div>
      </div>

      {/* Phase Label */}
      {phaseLabel && (
        <div className="mb-2 text-xs font-medium text-[#3c6e71] group-hover:text-[#ffffff] transition-colors">
          {phaseLabel}
        </div>
      )}

      {/* Organizer & Seeding Status */}
      <div className="mb-2.5 flex items-center gap-2 text-xs text-[#353535] group-hover:text-[#ffffff] transition-colors">
        <span className="text-[#353535] group-hover:text-[#ffffff] font-medium">Organizer:</span>
        <span className="font-medium truncate">{organizerName}</span>
        {tournament.drawGenerated && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 group-hover:text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Schedule Finalized</span>
          </div>
        )}
      </div>

      {/* Venue & Location */}
      {tournament.venue && (
        <div className="mb-2.5 flex items-center gap-2 text-xs text-[#353535] group-hover:text-[#ffffff] transition-colors">
          <MapPin className="h-3.5 w-3.5 text-[#3c6e71] group-hover:text-[#ffffff] shrink-0" />
          <span className="truncate">
            {tournament.venue}
            {tournament.city && `, ${tournament.city}`}
          </span>
        </div>
      )}

      {/* Details Footer: Dates, Capacity, Scorers */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-[#353535] group-hover:text-[#ffffff] transition-colors">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-[#3c6e71] group-hover:text-[#ffffff]" />
          <span>{formatDateShort(tournament.startDate)}</span>
          {tournament.endDate && (
            <>
              <span className="text-[#d9d9d9] group-hover:text-[#ffffff]">→</span>
              <span>{formatDateShort(tournament.endDate)}</span>
            </>
          )}
        </div>

        <span className="text-[#d9d9d9] group-hover:text-[#ffffff]">•</span>

        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-[#3c6e71] group-hover:text-[#ffffff]" />
          <span>{capacityDisplay} players</span>
        </div>

        {otherScorersCount > 0 && (
          <>
            <span className="text-[#d9d9d9] group-hover:text-[#ffffff]">•</span>
            <div className="flex items-center gap-1">
              <Users2 className="h-3.5 w-3.5 text-[#3c6e71] group-hover:text-[#ffffff]" />
              <span className="text-[10px]">+{otherScorersCount} scorer{otherScorersCount > 1 ? "s" : ""}</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        badge: "bg-emerald-100 text-emerald-700",
      };
    case "in_progress":
      return {
        label: "In Progress",
        badge: "bg-blue-100 text-blue-700",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        badge: "bg-orange-100 text-orange-700",
      };
    case "draft":
      return {
        label: "Draft",
        badge: "bg-[#d9d9d9] text-[#353535]",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        badge: "bg-[#d9d9d9] text-[#353535]",
      };
  }
}

export default ScorerCard;
