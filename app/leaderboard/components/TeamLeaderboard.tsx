"use client";

import { useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { getDisplayName, getInitials } from "../utils";

import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface TeamLeaderboardProps {
  data: TeamStats[];
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

const streakBadge = (streak: number) => {
  if (streak === 0) return null;

  const isWinning = streak > 0;
  const absStreak = Math.abs(streak);

  return (
    <Badge
      className={cn(
        "text-[10px] px-1.5 py-0 rounded-md font-medium",
        isWinning
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      )}
    >
      {isWinning ? "W" : "L"}{absStreak}
    </Badge>
  );
};

export function TeamLeaderboard({ data, loading }: TeamLeaderboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message="No team matches yet" icon={<GroupWorkIcon className="size-10 text-muted-foreground" />} />;

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
                Team
              </TableHead>
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                MP
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                W
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                L
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">T</TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">SM.W</TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">SM.L</TableHead>
              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Win%
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Streak
              </TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((entry) => {
              const highlight = entry.rank <= 3;
              const isExpanded = expandedTeam === entry.team._id;

              return (
                <>
                  <TableRow
                    key={entry.team._id}
                    className={cn(
                      "transition-all",
                      highlight ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    {/* Rank */}
                    <TableCell className="text-center">{rankChip(entry.rank)}</TableCell>

                    {/* Team */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {entry.team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">
                          {entry.team.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* MP */}
                    <TableCell className="text-center text-slate-700">
                      {entry.stats.totalMatches}
                    </TableCell>

                    {/* W */}
                    <TableCell className="text-center text-green-600 font-medium">
                      {entry.stats.wins}
                    </TableCell>

                    {/* L */}
                    <TableCell className="text-center text-red-600 font-medium">
                      {entry.stats.losses}
                    </TableCell>

                    {/* T (Ties) */}
                    <TableCell className="text-center text-slate-500">
                      {entry.stats.ties}
                    </TableCell>

                    {/* SM.W (SubMatches Won) */}
                    <TableCell className="text-center">{entry.stats.subMatchesWon}</TableCell>

                    {/* SM.L (SubMatches Lost) */}
                    <TableCell className="text-center">{entry.stats.subMatchesLost}</TableCell>

                    {/* Win% */}
                    <TableCell className="text-center">
                      <Badge className="bg-indigo-100 text-indigo-700 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                        {entry.stats.winRate}%
                      </Badge>
                    </TableCell>

                    {/* Streak */}
                    <TableCell className="text-center">
                      {streakBadge(entry.stats.currentStreak)}
                    </TableCell>

                    {/* Expand button */}
                    <TableCell className="text-center">
                      {entry.playerStats.length > 0 && (
                        <button
                          onClick={() => setExpandedTeam(isExpanded ? null : entry.team._id)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-500 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded player stats row */}
                  {isExpanded && entry.playerStats.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="bg-slate-50/50 p-0">
                        <div className="px-6 py-4">
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Player Performance
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entry.playerStats.map((ps) => (
                              <Link
                                key={ps.player._id}
                                href={`/profile/${ps.player._id}`}
                                className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                              >
                                <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-indigo-200 transition-all">
                                  <AvatarImage src={ps.player.profileImage} />
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {getInitials(getDisplayName(ps.player))}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[12px] flex-1 truncate font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                                  {getDisplayName(ps.player)}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {ps.subMatchesWon}/{ps.subMatchesPlayed}
                                </span>
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                                  {ps.winRate}%
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
