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
import { cn, getAvatarFallbackStyle } from "@/lib/utils";
import type { TeamStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading, StreakBadge } from "./shared";
import { getDisplayName, getInitials } from "../utils";

import GroupWorkIcon from '@mui/icons-material/GroupWork';

interface TeamLeaderboardProps {
  data: TeamStats[];
  loading: boolean;
  currentUserId?: string;
}

const rankChip = (rank: number) => {
  return (
    <div
      className="lb-font-mono font-semibold text-sm"
      style={{ color: rank <= 3 ? '#18c3f8' : 'rgba(50, 49, 57, 0.5)' }}
    >
      {rank}
    </div>
  );
};

export function TeamLeaderboard({ data, loading, currentUserId }: TeamLeaderboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message="No team matches yet" icon={<GroupWorkIcon className="size-10 text-muted-foreground" />} />;

  // Find teams where current user is a member
  const currentUserTeams = currentUserId
    ? data.filter((entry) =>
        entry.playerStats.some((ps) => ps.player._id === currentUserId)
      )
    : [];

  // Separate current user teams that are not in top 3
  const currentUserTeamsNotInTop3 = currentUserTeams.filter(
    (team) => team.rank > 3
  );

  return (
    <div className="lb-font-primary">
      {/* CURRENT USER TEAMS - shown at top if user teams are not in top 3 */}
      {currentUserTeamsNotInTop3.length > 0 && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            backgroundColor: 'rgba(24, 195, 248, 0.05)',
            border: '2px solid rgba(24, 195, 248, 0.2)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: '#18c3f8' }}
          >
            Your Teams
          </p>
          <div className="space-y-2">
            {currentUserTeamsNotInTop3.map((team) => (
              <div
                key={team.team._id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'rgba(24, 195, 248, 0.08)',
                  border: '1px solid rgba(24, 195, 248, 0.2)',
                }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #18c3f8, #323139)',
                  }}
                >
                  <span className="font-bold text-sm" style={{ color: '#ffffff' }}>
                    {team.team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#323139' }}>
                      {team.team.name}
                    </span>
                    <Badge
                      className="text-xs font-semibold px-2 py-0.5"
                      style={{
                        backgroundColor: 'rgba(24, 195, 248, 0.15)',
                        color: '#18c3f8',
                        border: '1px solid rgba(24, 195, 248, 0.3)',
                      }}
                    >
                      You
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span style={{ color: '#323139' }}>
                      <strong className="lb-font-mono">{team.stats.wins}</strong>W
                    </span>
                    <span style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                      <strong className="lb-font-mono">{team.stats.losses}</strong>L
                    </span>
                    <span style={{ color: '#18c3f8' }}>
                      <strong className="lb-font-mono">{team.stats.winRate}%</strong>
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs" style={{ color: '#ccbcbc' }}>Rank</div>
                  <div
                    className="text-lg font-bold lb-font-mono"
                    style={{ color: '#18c3f8' }}
                  >
                    #{team.rank}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(204, 188, 188, 0.25)',
          boxShadow: '0 4px 16px rgba(50, 49, 57, 0.06)'
        }}
      >
        <div className="overflow-x-auto">
          <Table className="text-sm">
          <TableHeader>
            <TableRow
              style={{
                backgroundColor: 'rgba(204, 188, 188, 0.08)',
                borderBottom: '2px solid rgba(204, 188, 188, 0.3)'
              }}
            >
              <TableHead
                className="text-center font-semibold text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Rank
              </TableHead>
              <TableHead
                className="font-semibold text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Team
              </TableHead>
              <TableHead
                className="text-center font-semibold text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                MP
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] font-semibold uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                W
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] font-semibold uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                L
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                T
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                SM.W
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                SM.L
              </TableHead>
              <TableHead
                className="text-center font-semibold text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Win%
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Streak
              </TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((entry) => {
              const highlight = entry.rank <= 3;
              const isExpanded = expandedTeam === entry.team._id;
              const isCurrentUserTeam = currentUserTeams.some(
                (team) => team.team._id === entry.team._id
              );

              return (
                <>
                  <TableRow
                    key={entry.team._id}
                    className="transition-all duration-250 cursor-pointer"
                    style={{
                      backgroundColor: isCurrentUserTeam
                        ? 'rgba(24, 195, 248, 0.08)'
                        : highlight
                        ? 'rgba(24, 195, 248, 0.04)'
                        : '#ffffff',
                      borderBottom: '1px solid rgba(204, 188, 188, 0.15)',
                      borderLeft: isCurrentUserTeam
                        ? '3px solid #18c3f8'
                        : highlight
                        ? '3px solid #18c3f8'
                        : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(204, 188, 188, 0.05)';
                      e.currentTarget.style.borderLeftColor = '#18c3f8';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      const originalBg = isCurrentUserTeam
                        ? 'rgba(24, 195, 248, 0.08)'
                        : highlight
                        ? 'rgba(24, 195, 248, 0.04)'
                        : '#ffffff';
                      const originalBorderLeft = isCurrentUserTeam || highlight ? '#18c3f8' : 'transparent';
                      e.currentTarget.style.backgroundColor = originalBg;
                      e.currentTarget.style.borderLeftColor = originalBorderLeft;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Rank */}
                    <TableCell className="text-center">{rankChip(entry.rank)}</TableCell>

                    {/* Team */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #18c3f8, #323139)',
                          }}
                        >
                          <span className="font-bold text-sm" style={{ color: '#ffffff' }}>
                            {entry.team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: '#323139' }}>
                            {entry.team.name}
                          </span>
                          {isCurrentUserTeam && (
                            <Badge
                              className="text-xs font-semibold px-2 py-0.5"
                              style={{
                                backgroundColor: 'rgba(24, 195, 248, 0.15)',
                                color: '#18c3f8',
                                border: '1px solid rgba(24, 195, 248, 0.3)',
                              }}
                            >
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* MP */}
                    <TableCell className="text-center lb-font-mono" style={{ color: '#323139' }}>
                      {entry.stats.totalMatches}
                    </TableCell>

                    {/* W */}
                    <TableCell className="text-center lb-font-mono font-semibold" style={{ color: '#18c3f8' }}>
                      {entry.stats.wins}
                    </TableCell>

                    {/* L */}
                    <TableCell className="text-center lb-font-mono font-semibold" style={{ color: '#ef4444' }}>
                      {entry.stats.losses}
                    </TableCell>

                    {/* T (Ties) */}
                    <TableCell className="text-center lb-font-mono" style={{ color: 'rgba(50, 49, 57, 0.6)' }}>
                      {entry.stats.ties}
                    </TableCell>

                    {/* SM.W (SubMatches Won) */}
                    <TableCell className="text-center lb-font-mono" style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                      {entry.stats.subMatchesWon}
                    </TableCell>

                    {/* SM.L (SubMatches Lost) */}
                    <TableCell className="text-center lb-font-mono" style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                      {entry.stats.subMatchesLost}
                    </TableCell>

                    {/* Win% */}
                    <TableCell className="text-center">
                      <Badge
                        className="font-bold text-xs px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(24, 195, 248, 0.12)',
                          border: '1px solid rgba(24, 195, 248, 0.3)',
                          color: '#18c3f8',
                        }}
                      >
                        {entry.stats.winRate}%
                      </Badge>
                    </TableCell>

                    {/* Streak */}
                    <TableCell className="text-center">
                      <StreakBadge streak={entry.stats.currentStreak} />
                    </TableCell>

                    {/* Expand button */}
                    <TableCell className="text-center">
                      {entry.playerStats.length > 0 && (
                        <button
                          onClick={() => setExpandedTeam(isExpanded ? null : entry.team._id)}
                          className="p-1.5 rounded-full transition-all duration-250"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(24, 195, 248, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-250",
                              isExpanded && "rotate-180"
                            )}
                            style={{ color: isExpanded ? '#18c3f8' : 'rgba(50, 49, 57, 0.6)' }}
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
                                  <AvatarFallback style={getAvatarFallbackStyle(ps.player._id)} className="text-[10px]">
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
    </div>
  );
}
