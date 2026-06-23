"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, getAvatarFallbackStyle } from "@/lib/utils";
import type { TournamentPlayerStats, TournamentHistoryEntry } from "../types";
import { RankBadge } from "./shared";
import { getDisplayName, getInitials } from "../utils";
import { Loader2, Trophy, Medal, Award, Calendar } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { format } from "date-fns";

interface TournamentPlayerModalProps {
  player: TournamentPlayerStats | null;
  onClose: () => void;
}

export function TournamentPlayerModal({
  player,
  onClose,
}: TournamentPlayerModalProps) {
  const [tournamentHistory, setTournamentHistory] = useState<
    TournamentHistoryEntry[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player) {
      setTournamentHistory([]);
      return;
    }

    const fetchTournamentHistory = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/leaderboard/tournaments/player/${player.player._id}`
        );
        setTournamentHistory(data.tournamentHistory || []);
      } catch (error) {
        console.error("Failed to fetch tournament history:", error);
        setTournamentHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentHistory();
  }, [player]);

  if (!player) return null;

  const stats = player.stats;
  const totalMatches = stats.tournamentMatches;

  // Format finish position with medal emoji
  const getFinishDisplay = (position: number | null) => {
    if (!position) return "N/A";
    if (position === 1) return "🥇 1st";
    if (position === 2) return "🥈 2nd";
    if (position === 3) return "🥉 3rd";
    return `${position}th`;
  };

  // Get finish color
  const getFinishColor = (position: number | null) => {
    if (!position) return "#d9d9d9";
    if (position === 1) return "#FFD700"; // Gold
    if (position === 2) return "#C0C0C0"; // Silver
    if (position === 3) return "#CD7F32"; // Bronze
    return "#353535";
  };

  return (
    <Dialog open={!!player} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto leaderboard-modal-content"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #d9d9d9",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(53, 53, 53, 0.15)",
        }}
      >
        {/* Header Section */}
        <DialogHeader
          className="pb-6"
          style={{
            background:
              "linear-gradient(to bottom, #ffffff, rgba(217, 217, 217, 0.03))",
            borderBottom: "1px solid #d9d9d9",
            marginBottom: "20px",
          }}
        >
          <div className="flex items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  className="h-20 w-20 shadow-sm ring-2 ring-offset-2"
                  style={{
                    borderWidth: "2px",
                    borderColor: "#3c6e71",
                    backgroundColor: "#284b63",
                  }}
                >
                  <AvatarImage
                    src={player.player.profileImage}
                    alt={getDisplayName(player.player)}
                  />
                  <AvatarFallback
                    className="text-xl font-bold text-white"
                    style={getAvatarFallbackStyle(player.player._id)}
                  >
                    {getInitials(getDisplayName(player.player))}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute bottom-0 -right-1 flex items-center justify-center rounded-full px-2.5 py-1.5 shadow-md font-bold"
                  style={{ backgroundColor: "#3c6e71", color: "#ffffff" }}
                >
                  <span className="text-xs">#{player.rank}</span>
                </div>
              </div>

              <div className="flex-1">
                <DialogTitle
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#353535" }}
                >
                  {getDisplayName(player.player)}
                </DialogTitle>
                <p className="text-sm" style={{ color: "#d9d9d9" }}>
                  @{player.player.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "#d9d9d9" }}
              >
                Tournament Win Rate
              </div>
              <div className="text-xl font-bold" style={{ color: "#3c6e71" }}>
                {stats.tournamentMatchWinRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Achievement Summary */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#d9d9d9" }}
            >
              Tournament Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                className="rounded-lg p-4 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5" style={{ color: "#FFD700" }} />
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    Wins
                  </span>
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#3c6e71" }}
                >
                  {stats.tournamentsWon}
                </div>
              </div>

              <div
                className="rounded-lg p-4 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="h-5 w-5" style={{ color: "#C0C0C0" }} />
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    Finals
                  </span>
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#3c6e71" }}
                >
                  {stats.finalsReached}
                </div>
              </div>

              <div
                className="rounded-lg p-4 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5" style={{ color: "#CD7F32" }} />
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    Semis
                  </span>
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#3c6e71" }}
                >
                  {stats.semiFinalsReached}
                </div>
              </div>

              <div
                className="rounded-lg p-4 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5" style={{ color: "#3c6e71" }} />
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    Played
                  </span>
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#3c6e71" }}
                >
                  {stats.tournamentsPlayed}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#d9d9d9" }}
            >
              Performance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                className="rounded-lg p-5 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#3c6e71" }}
                  >
                    {stats.tournamentMatchWins}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    wins
                  </span>
                </div>
                <div className="text-sm" style={{ color: "#a8a8a8" }}>
                  {stats.tournamentMatchLosses} losses
                </div>
              </div>

              <div
                className="rounded-lg p-5 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#3c6e71" }}
                  >
                    {stats.tournamentSetDifferential > 0 ? "+" : ""}
                    {stats.tournamentSetDifferential}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    set diff
                  </span>
                </div>
                <div className="text-sm" style={{ color: "#a8a8a8" }}>
                  {stats.tournamentSetsWon}W - {stats.tournamentSetsLost}L
                </div>
              </div>

              <div
                className="rounded-lg p-5 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9d9d9",
                }}
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#3c6e71" }}
                  >
                    {stats.averageFinish > 0
                      ? stats.averageFinish.toFixed(1)
                      : "N/A"}
                  </span>
                  <span
                    className="text-xs uppercase font-medium"
                    style={{ color: "#d9d9d9" }}
                  >
                    avg finish
                  </span>
                </div>
                <div className="text-sm" style={{ color: "#a8a8a8" }}>
                  Best: {stats.bestFinish > 0 ? stats.bestFinish : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Tournament History Table */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#d9d9d9" }}
            >
              Tournament History
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3c6e71" }} />
              </div>
            ) : tournamentHistory.length === 0 ? (
              <div
                className="rounded-lg p-8 text-center"
                style={{
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #d9d9d9",
                }}
              >
                <p className="text-sm" style={{ color: "#a8a8a8" }}>
                  No tournament history available
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid #d9d9d9" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "#f9f9f9" }}>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Tournament
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Format
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Finish
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Matches
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          W-L
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Sets
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "#353535" }}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentHistory.map((entry, index) => (
                        <tr
                          key={entry.tournamentId}
                          className="hover:bg-[#f9f9f9] transition-colors cursor-pointer"
                          onClick={() => {
                            window.location.href = `/tournaments/${entry.tournamentId}`;
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm" style={{ color: "#353535" }}>
                              {entry.tournamentName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: "#d9d9d9",
                                color: "#353535",
                              }}
                            >
                              {entry.format.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="font-semibold text-sm"
                              style={{
                                color: getFinishColor(entry.finishPosition),
                              }}
                            >
                              {getFinishDisplay(entry.finishPosition)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: "#353535" }}>
                            {entry.matchesPlayed}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: "#353535" }}>
                            {entry.matchesWon}-{entry.matchesLost}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: "#353535" }}>
                            {entry.setsWon}-{entry.setsLost}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: "#a8a8a8" }}>
                            {entry.startDate
                              ? format(new Date(entry.startDate), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

