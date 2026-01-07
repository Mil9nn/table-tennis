"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarFallbackStyle } from "@/lib/utils";
import type { TeamStats } from "../types";
import { LeaderboardEmpty, LeaderboardLoading, RankBadge, StreakBadge } from "./shared";
import { getDisplayName, getInitials } from "../utils";

interface TeamLeaderboardProps {
  data: TeamStats[];
  loading: boolean;
  currentUserId?: string;
}

const TeamRow = ({
  entry,
  isTopThree,
  isCurrentUser,
  isExpanded,
  onToggleExpand,
}: {
  entry: TeamStats;
  isTopThree: boolean;
  isCurrentUser: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const isRank1 = entry.rank === 1;
  const isRank2or3 = entry.rank === 2 || entry.rank === 3;

  return (
    <>
      <div
        onClick={onToggleExpand}
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
        <div className="flex items-center gap-4">
          <RankBadge rank={entry.rank} />

          <Link
            href={`/teams/${entry.team._id}`}
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
              <AvatarImage src={entry.team.logo} />
              <AvatarFallback className="bg-[#d9d9d9] text-[#353535] text-sm font-semibold">
                {entry.team.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-[#353535]">
                  {entry.team.name}
                </p>
                {entry.stats.currentStreak !== 0 && (
                  <StreakBadge streak={entry.stats.currentStreak} />
                )}
              </div>
              <div>
                <span className="text-xs text-[#353535]">
                  Winrate: <span className="font-semibold" style={{ color: "#3c6e71" }}>{entry.stats.winRate}%</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="flex items-center gap-1 text-[#353535]">
                <strong className="font-semibold">{entry.stats.wins}</strong>
                <span className="text-[#a8a8a8] font-medium"> wins</span>
              </div>
              <span style={{ color: "#d9d9d9" }}>•</span>
              <div className="flex items-center gap-1 text-[#353535]">
                <strong className="font-semibold">{entry.stats.losses}</strong>
                <span className="text-[#a8a8a8] font-medium"> losses</span>
              </div>
              {entry.stats.ties > 0 && (
                <>
                  <span style={{ color: "#d9d9d9" }}>•</span>
                  <div className="flex items-center gap-1 text-[#353535]">
                    <strong className="font-semibold">{entry.stats.ties}</strong>
                    <span className="text-[#a8a8a8] font-medium"> ties</span>
                  </div>
                </>
              )}
              <span style={{ color: "#d9d9d9" }}>•</span>
              <div className="flex items-center gap-1 text-[#353535]">
                <strong className="font-semibold">{entry.stats.subMatchesWon}</strong>
                <span className="text-[#a8a8a8] font-medium">
                  <span className="hidden sm:inline">submatches won</span>
                  <span className="sm:hidden">smw</span>
                </span>
              </div>
              <span style={{ color: "#d9d9d9" }}>•</span>
              <div className="flex items-center gap-1 text-[#353535]">
                <strong className="font-semibold">{entry.stats.subMatchesLost}</strong>
                <span className="text-[#a8a8a8] font-medium">
                  <span className="hidden sm:inline">submatches lost</span>
                  <span className="sm:hidden">sml</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded player stats */}
      {isExpanded && entry.playerStats.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(60, 110, 113, 0.02)",
            borderLeft: "4px solid #3c6e71",
            padding: "16px 20px",
          }}
        >
          <p className="text-[10px] font-medium text-[#353535] uppercase tracking-wide mb-3">
            Player Performance
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entry.playerStats.map((ps) => (
              <Link
                key={ps.player._id}
                href={`/profile/${ps.player._id}`}
                className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-[#d9d9d9] hover:border-[#3c6e71] hover:bg-[rgba(60,110,113,0.02)] transition-all group"
              >
                <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-[#3c6e71] transition-all">
                  <AvatarImage src={ps.player.profileImage} />
                  <AvatarFallback style={getAvatarFallbackStyle(ps.player._id)} className="text-[10px]">
                    {getInitials(getDisplayName(ps.player))}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12px] flex-1 truncate font-medium text-[#353535] group-hover:text-[#3c6e71] transition-colors">
                  {getDisplayName(ps.player)}
                </span>
                <span className="text-[11px] text-[#a8a8a8]">
                  {ps.subMatchesWon}/{ps.subMatchesPlayed}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: "#3c6e71" }}>
                  {ps.winRate}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export function TeamLeaderboard({ data, loading, currentUserId }: TeamLeaderboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message="No team matches yet" />;

  // Find teams where current user is a member
  const currentUserTeams = currentUserId
    ? data.filter((entry) =>
        entry.playerStats.some((ps) => ps.player._id === currentUserId)
      )
    : [];

  // Find current user's team entry (if not in top 3)
  const currentUserEntry = currentUserTeams.find((team) => team.rank > 3);

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <div>
      {/* CURRENT USER TEAM - shown at top if user team is not in top 3 */}
      {currentUserEntry && (
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
              <TeamRow
                entry={currentUserEntry}
                isTopThree={false}
                isCurrentUser={true}
                isExpanded={expandedTeam === currentUserEntry.team._id}
                onToggleExpand={() =>
                  setExpandedTeam(
                    expandedTeam === currentUserEntry.team._id
                      ? null
                      : currentUserEntry.team._id
                  )
                }
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
          const isCurrentUser = currentUserTeams.some(
            (team) => team.team._id === entry.team._id
          );
          const isTopThree = entry.rank <= 3;

          return (
            <TeamRow
              key={entry.team._id}
              entry={entry}
              isTopThree={isTopThree}
              isCurrentUser={isCurrentUser}
              isExpanded={expandedTeam === entry.team._id}
              onToggleExpand={() =>
                setExpandedTeam(
                  expandedTeam === entry.team._id ? null : entry.team._id
                )
              }
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
          const isCurrentUser = currentUserTeams.some(
            (team) => team.team._id === entry.team._id
          );
          return (
            <TeamRow
              key={entry.team._id}
              entry={entry}
              isTopThree={false}
              isCurrentUser={isCurrentUser}
              isExpanded={expandedTeam === entry.team._id}
              onToggleExpand={() =>
                setExpandedTeam(
                  expandedTeam === entry.team._id ? null : entry.team._id
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
