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
import type { PlayerStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { getDisplayName, getInitials } from "../utils";

interface PlayerLeaderboardProps {
  data: PlayerStats[];
  loading: boolean;
  emptyMessage: string;
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

export function PlayerLeaderboard({ data, loading, emptyMessage }: PlayerLeaderboardProps) {
  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message={emptyMessage} />;

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
                MP
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                W
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                L
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">SW</TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">SL</TableHead>
              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Win%
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Streak
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

                  {/* SW */}
                  <TableCell className="text-center">{entry.stats.setsWon}</TableCell>

                  {/* SL */}
                  <TableCell className="text-center">{entry.stats.setsLost}</TableCell>

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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
