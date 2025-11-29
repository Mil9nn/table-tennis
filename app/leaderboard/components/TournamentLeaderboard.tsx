"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TournamentPlayerStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { getDisplayName, getInitials } from "../utils";

interface TournamentLeaderboardProps {
  data: TournamentPlayerStats[];
  loading: boolean;
}

const rankChip = (rank: number) => {
  if (rank <= 3)
    return (
      <div className="text-indigo-600 font-semibold text-[12px]">
        {rank}
      </div>
    );

  return <div className="text-slate-400 text-[12px]">{rank}</div>;
};

export function TournamentLeaderboard({
  data,
  loading,
}: TournamentLeaderboardProps) {
  if (loading) return <LeaderboardLoading />;
  if (data.length === 0)
    return <LeaderboardEmpty message="No tournament participation yet" />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                Rank
              </TableHead>
              <TableHead className="font-medium text-[11px] text-slate-600">
                Player
              </TableHead>
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                Played
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                Won
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                Finals
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">Semis</TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">M.Record</TableHead>
              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Win%
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Points
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((entry) => {
              const highlight = entry.rank <= 3;

              return (
                <TableRow
                  key={entry.player._id}
                  className={cn(
                    "transition-all",
                    highlight ? "bg-indigo-50/60" : "hover:bg-slate-50"
                  )}
                >
                  {/* Rank */}
                  <TableCell className="text-center">{rankChip(entry.rank)}</TableCell>

                  {/* Player */}
                  <TableCell>
                    <Link 
                      href={`/profile/${entry.player._id}`}
                      className="flex items-center gap-2 group"
                    >
                      <Avatar className="h-7 w-7 ring-2 ring-transparent group-hover:ring-indigo-200 transition-all">
                        <AvatarImage
                          src={entry.player.profileImage}
                          alt={getDisplayName(entry.player)}
                        />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {getInitials(getDisplayName(entry.player))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {getDisplayName(entry.player)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          @{entry.player.username}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="text-center text-slate-700">
                    {entry.stats.tournamentsPlayed}
                  </TableCell>

                  {/* Won */}
                  <TableCell className="text-center text-amber-600 font-medium">
                    {entry.stats.tournamentsWon}
                  </TableCell>

                  {/* Finals */}
                  <TableCell className="text-center text-blue-600 font-medium">
                    {entry.stats.finalsReached}
                  </TableCell>

                  {/* Semis */}
                  <TableCell className="text-center text-purple-600">
                    {entry.stats.semiFinalsReached}
                  </TableCell>

                  {/* M.Record */}
                  <TableCell className="text-center">
                    {entry.stats.tournamentMatchWins}-{entry.stats.tournamentMatchLosses}
                  </TableCell>

                  {/* Win% */}
                  <TableCell className="text-center">
                    <Badge className="bg-indigo-100 text-indigo-700 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                      {entry.stats.tournamentMatchWinRate}%
                    </Badge>
                  </TableCell>

                  {/* Points */}
                  <TableCell className="text-center font-medium text-slate-700">
                    {entry.stats.totalPoints}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
