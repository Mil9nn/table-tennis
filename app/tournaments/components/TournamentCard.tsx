"use client";

import Link from "next/link";
import React from "react";
import { ChevronRight } from "lucide-react";
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
  const status = tournament.status;
  const statusCfg = getStatusConfig(status);

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className="group block border border-[#d9d9d9] bg-[#ffffff] p-5 transition-colors hover:bg-[#3c6e71]"
    >
      <div className="w-full flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
          <h3 className="truncate text-sm font-bold text-[#353535] group-hover:text-[#ffffff] transition-colors uppercase tracking-wide">
            {tournament.name}
          </h3>
        </div>

        {/* Format type */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold bg-[#d9d9d9] text-[#353535] uppercase tracking-wider">
            {tournament.format === "hybrid"
              ? "Hybrid"
              : tournament.format.replace(/_/g, " ")}
          </span>

          <ChevronRight className="size-4 text-[#d9d9d9] transition group-hover:translate-x-1 group-hover:text-[#ffffff]" />
        </div>
      </div>

      <div className="mt-3 text-xs text-[#353535] group-hover:text-[#ffffff] transition-colors">
        {[
          formatDateShort(tournament.startDate),
          tournament.city,
          `${tournament.participants.length}${
            tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""
          } players`,
        ]
          .filter(Boolean)
          .join(" • ")}
      </div>
    </Link>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#d9d9d9] px-2.5 py-1">
      <span className="truncate">{label}</span>
    </div>
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

export default TournamentCard;
