"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarFallbackStyle } from "@/lib/utils";
import type { TournamentPlayerStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading, RankBadge } from "./shared";
import { getDisplayName, getInitials } from "../utils";
import { TournamentPlayerModal } from "./TournamentPlayerModal";
import { Trophy, Medal, Award } from "lucide-react";

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface TournamentLeaderboardProps {
  data: TournamentPlayerStats[];
  loading: boolean;
  currentUserId?: string;
}

const TournamentRow = ({
  entry,
  isTopThree,
  isCurrentUser,
  onClick,
}: {
  entry: TournamentPlayerStats;
  isTopThree: boolean;
  isCurrentUser: boolean;
  onClick: () => void;
}) => {
  const isRank1 = entry.rank === 1;
  const isRank2or3 = entry.rank === 2 || entry.rank === 3;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:shadow-sm"
      style={{
        backgroundColor: isCurrentUser
          ? "rgba(60, 110, 113, 0.05)"
          : isRank1
          ? "rgba(60, 110, 113, 0.03)"
          : "#ffffff",
        borderLeft: isRank1
          ? "4px solid #3c6e71"
          : isRank2or3
          ? "4px solid #d9d9d9"
          : "4px solid transparent",
        paddingTop: "18px",
        paddingBottom: "18px",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = "#3c6e71";
        e.currentTarget.style.backgroundColor = "rgba(60, 110, 113, 0.02)";
      }}
      onMouseLeave={(e) => {
        const originalBorderColor =
          isCurrentUser || isRank1
            ? "#3c6e71"
            : isRank2or3
            ? "#d9d9d9"
            : "transparent";
        const originalBgColor = isCurrentUser
          ? "rgba(60, 110, 113, 0.05)"
          : isRank1
          ? "rgba(60, 110, 113, 0.03)"
          : "#ffffff";
        e.currentTarget.style.borderLeftColor = originalBorderColor;
        e.currentTarget.style.backgroundColor = originalBgColor;
      }}
    >
      <div className="flex items-center gap-2">
        <RankBadge rank={entry.rank} />

        <Link
          href={`/profile/${entry.player._id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            className="h-12 w-12 transition-all"
            style={
              isTopThree
                ? {
                    borderWidth: isRank1 ? "2.5px" : "1.5px",
                    borderColor: isRank1 ? "#3c6e71" : "#d9d9d9",
                    borderStyle: "solid",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = "2px";
                e.currentTarget.style.borderColor = "#3c6e71";
              }
            }}
            onMouseLeave={(e) => {
              if (isTopThree) {
                e.currentTarget.style.borderWidth = isRank1 ? "2.5px" : "1.5px";
                e.currentTarget.style.borderColor = isRank1
                  ? "#3c6e71"
                  : "#d9d9d9";
              }
            }}
          >
            <AvatarImage src={entry.player.profileImage} />
            <AvatarFallback style={getAvatarFallbackStyle(entry.player._id)}>
              {getInitials(getDisplayName(entry.player))}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-[#353535]">
              {getDisplayName(entry.player)}
            </p>
            {isCurrentUser && (
              <Badge
                className="text-xs font-semibold px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(60, 110, 113, 0.15)",
                  color: "#3c6e71",
                  border: "1px solid rgba(60, 110, 113, 0.3)",
                }}
              >
                You
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
            <div className="flex items-center gap-1 text-[#353535]">
              <Trophy className="h-3 w-3" style={{ color: "#FFD700" }} />
              <strong className="font-semibold">{entry.stats.tournamentsWon}</strong>
              <span className="text-[#a8a8a8] font-medium"> wins</span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.tournamentsPlayed}</strong>
              <span className="text-[#a8a8a8] font-medium"> played</span>
            </div>
            <span style={{ color: "#d9d9d9" }}>•</span>
            <div className="flex items-center gap-1 text-[#353535]">
              <Medal className="h-3 w-3" style={{ color: "#C0C0C0" }} />
              <strong className="font-semibold">{entry.stats.finalsReached}</strong>
              <span className="text-[#a8a8a8] font-medium"> finals</span>
            </div>
            {entry.stats.semiFinalsReached > 0 && (
              <>
                <span style={{ color: "#d9d9d9" }}>•</span>
                <div className="flex items-center gap-1 text-[#353535]">
                  <Award className="h-3 w-3" style={{ color: "#CD7F32" }} />
                  <strong className="font-semibold">{entry.stats.semiFinalsReached}</strong>
                  <span className="text-[#a8a8a8] font-medium"> semis</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="flex items-center gap-1 text-[#353535]">
              <strong className="font-semibold">{entry.stats.tournamentMatchWins}</strong>
              <span className="text-[#a8a8a8] font-medium">-</span>
              <strong className="font-semibold">{entry.stats.tournamentMatchLosses}</strong>
              <span className="text-[#a8a8a8] font-medium"> matches</span>
            </div>
            {entry.stats.tournamentSetDifferential !== 0 && (
              <>
                <span style={{ color: "#d9d9d9" }}>•</span>
                <div className="flex items-center gap-1 text-[#353535]">
                  <strong className="font-semibold">
                    {entry.stats.tournamentSetDifferential > 0 ? "+" : ""}
                    {entry.stats.tournamentSetDifferential}
                  </strong>
                  <span className="text-[#a8a8a8] font-medium"> set diff</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-right min-w-fit">
          <div className="text-xs font-medium text-[#6c6868] uppercase tracking-wider mb-1">
            Win Rate
          </div>
          <div className="text-sm font-bold" style={{ color: "#3c6e71" }}>
            {entry.stats.tournamentMatchWinRate.toFixed(1)}%
          </div>
          {entry.stats.totalTournamentPoints > 0 && (
            <>
              <div className="text-xs font-medium text-[#6c6868] uppercase tracking-wider mt-2 mb-1">
                Points
              </div>
              <div className="text-sm font-semibold" style={{ color: "#353535" }}>
                {entry.stats.totalTournamentPoints}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export function TournamentLeaderboard({
  data,
  loading,
  currentUserId,
}: TournamentLeaderboardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentPlayerStats | null>(
    null
  );

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0)
    return (
      <LeaderboardEmpty
        message="No tournament data available yet."
        icon={<EmojiEventsIcon className="size-10 text-muted-foreground" />}
      />
    );

  // Find current user's entry
  const currentUserEntry = currentUserId
    ? data.find((entry) => entry.player._id === currentUserId)
    : null;

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <>
      {/* CURRENT USER ROW - shown at top if user is not in top 3 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <>
          <div
            style={{
              backgroundColor: "rgba(60, 110, 113, 0.05)",
              border: "1px solid rgba(60, 110, 113, 0.15)",
            }}
          >
            <div
              className="divide-y"
              style={{ borderColor: "rgba(217, 217, 217, 0.5)" }}
            >
              <TournamentRow
                entry={currentUserEntry}
                isTopThree={false}
                isCurrentUser={true}
                onClick={() => setSelectedPlayer(currentUserEntry)}
              />
            </div>
          </div>
          <div
            className="h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(217, 217, 217, 0.4), transparent)",
            }}
          />
        </>
      )}

      {/* TOP 3 — enhanced styling */}
      <div
        className="divide-y"
        style={{ borderColor: "rgba(217, 217, 217, 0.6)" }}
      >
        {topThree.map((entry) => {
          const isCurrentUser = currentUserId === entry.player._id;
          const isTopThree = entry.rank <= 3;

          return (
            <TournamentRow
              key={entry.player._id}
              entry={entry}
              isTopThree={isTopThree}
              isCurrentUser={isCurrentUser}
              onClick={() => setSelectedPlayer(entry)}
            />
          );
        })}
      </div>

      {/* OTHERS — list style */}
      <div
        className="divide-y"
        style={{ borderColor: "rgba(217, 217, 217, 0.6)" }}
      >
        {others.map((entry) => {
          const isCurrentUser = currentUserId === entry.player._id;
          return (
            <TournamentRow
              key={entry.player._id}
              entry={entry}
              isTopThree={false}
              isCurrentUser={isCurrentUser}
              onClick={() => setSelectedPlayer(entry)}
            />
          );
        })}
      </div>

      {/* Player Modal */}
      <TournamentPlayerModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}
