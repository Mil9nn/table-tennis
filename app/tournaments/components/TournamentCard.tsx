"use client";

import Link from "next/link";
import React from "react";
import {
  Award,
  Calendar,
  ChevronRight,
  MapPin,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
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

import ModeIcon from '@mui/icons-material/Mode';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import TimelapseIcon from '@mui/icons-material/Timelapse';

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
          <span>{statusCfg.icon}</span>
          <h3 className="truncate text-base font-semibold text-zinc-900">
            {tournament.name}
          </h3>
        </div>

        {/* Format type */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
              tournament.format === "hybrid"
                ? "bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700 ring-purple-300"
                : "bg-purple-50 text-purple-700 ring-purple-200"
            }`}
          >
            {tournament.format === "hybrid" ? (
              <div className="text-xs">
                <span className="text-blue-600">RR</span>
                <span className="mx-0.5">→</span>
                <span className="text-purple-600">KO</span>
              </div>
            ) : (
              tournament.format.replace(/_/g, " ")
            )}
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
        icon: <Award className="size-4 text-emerald-600" />,
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        iconRing: "ring-emerald-200 bg-emerald-50",
      };
    case "in_progress":
      return {
        label: "In Progress",
        icon: <DonutLargeIcon className="size-4 text-blue-600" />,
        badge: "bg-blue-50 text-blue-700 ring-blue-200",
        iconRing: "ring-blue-200 bg-blue-50",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        icon: <TimelapseIcon className="size-4 text-orange-600" />,
        badge: "bg-orange-50 text-orange-700 ring-orange-200",
        iconRing: "ring-orange-200 bg-orange-50",
      };
    case "draft":
      return {
        label: "Draft",
        icon: <ModeIcon className="size-4 text-zinc-500" />,
        badge: "bg-zinc-50 text-zinc-700 ring-zinc-200",
        iconRing: "ring-zinc-200 bg-zinc-50",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        icon: <Trophy className="size-4 text-zinc-500" />,
        badge: "bg-zinc-50 text-zinc-700 ring-zinc-200",
        iconRing: "ring-zinc-200 bg-zinc-50",
      };
  }
}

export default TournamentCard;
