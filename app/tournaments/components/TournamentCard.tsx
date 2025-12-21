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
      className="group block border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="w-full flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
          <h3 className="truncate text-base font-semibold text-zinc-900">
            {tournament.name}
          </h3>
        </div>

        {/* Format type */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
            {tournament.format === "hybrid"
              ? "Hybrid"
              : tournament.format.replace(/_/g, " ")}
          </span>

          <ChevronRight className="size-4 text-zinc-400 transition group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-600 truncate">
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
    <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 px-2.5 py-1 ring-1 ring-zinc-100">
      <span className="truncate">{label}</span>
    </div>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        badge: "bg-emerald-50 text-emerald-700",
      };
    case "in_progress":
      return {
        label: "In Progress",
        badge: "bg-blue-50 text-blue-700",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        badge: "bg-orange-50 text-orange-700",
      };
    case "draft":
      return {
        label: "Draft",
        badge: "bg-zinc-50 text-zinc-700",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        badge: "bg-zinc-50 text-zinc-700",
      };
  }
}

export default TournamentCard;
