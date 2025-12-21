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
import { cn, getAvatarFallbackStyle } from "@/lib/utils";
import type { TournamentPlayerStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { getDisplayName, getInitials } from "../utils";

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface TournamentLeaderboardProps {
  data: TournamentPlayerStats[];
  loading: boolean;
  currentUserId?: string;
}

const rankChip = (rank: number) => {
  const getColor = () => {
    if (rank === 1) return '#18c3f8';
    if (rank === 2 || rank === 3) return '#ccbcbc';
    return 'rgba(50, 49, 57, 0.5)';
  };

  return (
    <div
      className="lb-font-mono font-semibold text-sm"
      style={{ color: getColor() }}
    >
      {rank}
    </div>
  );
};

export function TournamentLeaderboard({
  data,
  loading,
  currentUserId,
}: TournamentLeaderboardProps) {
  if (loading) return <LeaderboardLoading />;
  if (data.length === 0)
    return <LeaderboardEmpty
  message="No tournament data available yet."
  icon={<EmojiEventsIcon className="size-10 text-muted-foreground" />}
/>;

  // Find current user's entry
  const currentUserEntry = currentUserId
    ? data.find((entry) => entry.player._id === currentUserId)
    : null;

  return (
    <div className="lb-font-primary">
      {/* CURRENT USER ROW - shown at top if user is not in top 3 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
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
            Your Tournament Ranking
          </p>
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(24, 195, 248, 0.08)',
              border: '1px solid rgba(24, 195, 248, 0.2)',
            }}
          >
            <Link
              href={`/profile/${currentUserEntry.player._id}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar
                className="h-10 w-10"
                style={{
                  borderWidth: '2px',
                  borderColor: '#18c3f8',
                }}
              >
                <AvatarImage
                  src={currentUserEntry.player.profileImage}
                  alt={getDisplayName(currentUserEntry.player)}
                />
                <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(currentUserEntry.player._id)}>
                  {getInitials(getDisplayName(currentUserEntry.player))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#323139' }}>
                    {getDisplayName(currentUserEntry.player)}
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
                    <strong className="lb-font-mono">{currentUserEntry.stats.tournamentsWon}</strong> won
                  </span>
                  <span style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                    <strong className="lb-font-mono">{currentUserEntry.stats.tournamentsPlayed}</strong> played
                  </span>
                  <span style={{ color: '#18c3f8' }}>
                    <strong className="lb-font-mono">{currentUserEntry.stats.tournamentMatchWinRate}%</strong>
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs" style={{ color: '#ccbcbc' }}>Rank</div>
                <div
                  className="text-lg font-bold lb-font-mono"
                  style={{ color: '#18c3f8' }}
                >
                  #{currentUserEntry.rank}
                </div>
              </div>
            </Link>
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
                Player
              </TableHead>
              <TableHead
                className="text-center font-semibold text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Played
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] font-semibold uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Won
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] font-semibold uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Finals
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                Semis
              </TableHead>
              <TableHead
                className="text-center text-[0.6875rem] uppercase"
                style={{ color: 'rgba(50, 49, 57, 0.7)' }}
              >
                M.Record
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
                Points
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((entry) => {
              const highlight = entry.rank <= 3;
              const isCurrentUser = currentUserId === entry.player._id;

              return (
                <TableRow
                  key={entry.player._id}
                  className="transition-all duration-250 cursor-pointer"
                  style={{
                    backgroundColor: isCurrentUser
                      ? 'rgba(24, 195, 248, 0.08)'
                      : entry.rank === 1
                      ? 'rgba(24, 195, 248, 0.05)'
                      : '#ffffff',
                    borderBottom: '1px solid rgba(204, 188, 188, 0.15)',
                    borderLeft: isCurrentUser
                      ? '4px solid #18c3f8'
                      : entry.rank === 1
                      ? '4px solid #18c3f8'
                      : entry.rank <= 3
                      ? '3px solid #ccbcbc'
                      : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(204, 188, 188, 0.05)';
                    e.currentTarget.style.borderLeftColor = '#18c3f8';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    const originalBg = isCurrentUser
                      ? 'rgba(24, 195, 248, 0.08)'
                      : entry.rank === 1
                      ? 'rgba(24, 195, 248, 0.05)'
                      : '#ffffff';
                    const originalBorderLeft = isCurrentUser || entry.rank === 1
                      ? '#18c3f8'
                      : entry.rank <= 3
                      ? '#ccbcbc'
                      : 'transparent';
                    e.currentTarget.style.backgroundColor = originalBg;
                    e.currentTarget.style.borderLeftColor = originalBorderLeft;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Rank */}
                  <TableCell className="text-center">{rankChip(entry.rank)}</TableCell>

                  {/* Player */}
                  <TableCell>
                    <Link
                      href={`/profile/${entry.player._id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar
                        className="h-8 w-8 transition-all"
                        style={{
                          borderWidth: '2px',
                          borderColor: '#ccbcbc',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#18c3f8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#ccbcbc';
                        }}
                      >
                        <AvatarImage
                          src={entry.player.profileImage}
                          alt={getDisplayName(entry.player)}
                        />
                        <AvatarFallback className="text-xs" style={getAvatarFallbackStyle(entry.player._id)}>
                          {getInitials(getDisplayName(entry.player))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: '#323139' }}>
                            {getDisplayName(entry.player)}
                          </span>
                          {isCurrentUser && (
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
                        <span className="text-xs" style={{ color: '#ccbcbc' }}>
                          @{entry.player.username}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="text-center lb-font-mono" style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                    {entry.stats.tournamentsPlayed}
                  </TableCell>

                  {/* Won */}
                  <TableCell className="text-center lb-font-mono font-bold" style={{ color: '#18c3f8' }}>
                    {entry.stats.tournamentsWon}
                  </TableCell>

                  {/* Finals */}
                  <TableCell className="text-center lb-font-mono font-semibold" style={{ color: '#18c3f8' }}>
                    {entry.stats.finalsReached}
                  </TableCell>

                  {/* Semis */}
                  <TableCell className="text-center lb-font-mono" style={{ color: 'rgba(50, 49, 57, 0.6)' }}>
                    {entry.stats.semiFinalsReached}
                  </TableCell>

                  {/* M.Record */}
                  <TableCell className="text-center lb-font-mono text-xs" style={{ color: 'rgba(50, 49, 57, 0.7)' }}>
                    {entry.stats.tournamentMatchWins}-{entry.stats.tournamentMatchLosses}
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
                      {entry.stats.tournamentMatchWinRate}%
                    </Badge>
                  </TableCell>

                  {/* Points */}
                  <TableCell className="text-center lb-font-mono font-semibold" style={{ color: '#323139' }}>
                    {entry.stats.totalPoints}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
}
