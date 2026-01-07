"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Standing,
  TeamPlayerStats,
  getParticipantDisplayName,
  getParticipantImage,
  isUserParticipant,
} from "@/types/tournament.type";
import { axiosInstance } from "@/lib/axiosInstance";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye, Flame, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailedPlayerStats {
  participant: {
    _id: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
    name?: string;
    logo?: string;
  };
  standing: {
    rank: number;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    points: number;
    form: string[];
  };
  matchHistory: {
    matchId: string;
    opponent: {
      _id: string;
      username?: string;
      fullName?: string;
      name?: string;
    };
    result: "win" | "loss" | "draw";
    score: string;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
    date?: Date;
    roundNumber?: number;
    groupId?: string;
  }[];
  headToHead: {
    opponentId: string;
    opponent: {
      username?: string;
      fullName?: string;
      name?: string;
    };
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
  }[];
}

interface Props {
  standings: Standing[];
  showDetailedStats?: boolean;
  highlightTop?: number;
  groupName?: string;
  tournamentId?: string;
  category?: "individual" | "team";
  matchType?: "singles" | "doubles";
  isCompleted?: boolean;
}

export function EnhancedStandingsTable({
  standings,
  showDetailedStats = true,
  highlightTop = 3,
  groupName,
  tournamentId,
  category = "individual",
  matchType = "singles",
  isCompleted = false,
}: Props) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<DetailedPlayerStats | null>(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const isTeamTournament = category === "team";
  const isDoubles = matchType === "doubles";

  // Use standings directly - no filtering workarounds
  // If there are data integrity issues, they should be fixed at the source
  // Show all standings, even if they have errors (with visual indicators)
  const deduplicatedStandings = React.useMemo(() => {
    // Simple deduplication by participant ID (keep first occurrence)
    const seen = new Map<string, Standing>();
    const result: Standing[] = [];
    
    standings.forEach((s) => {
      if (!s.participant || !s.participant._id) {
        // Include invalid standings but mark them
        result.push(s);
        return;
      }
      
      // Normalize participant ID to string for consistent comparison
      const participantId = typeof s.participant._id === 'string' 
        ? s.participant._id 
        : String(s.participant._id);
      
      // Keep only the first occurrence of each participant
      if (!seen.has(participantId)) {
        seen.set(participantId, s);
        result.push(s);
      }
      // Skip duplicates silently - they should be fixed at the source
    });
    
    return result;
  }, [standings]);

  const formChip = (r: string) => {
    const base =
      "text-[10px] w-4 h-4 flex items-center justify-center rounded-[4px] font-medium";

    switch (r) {
      case "W":
        return <div className={`${base} bg-green-100 text-green-700`}>W</div>;
      case "L":
        return <div className={`${base} bg-red-100 text-red-700`}>L</div>;
      default:
        return <div className={`${base} bg-slate-200 text-slate-600`}>D</div>;
    }
  };

  const calculateWinRate = (won: number, played: number) => {
    if (played === 0) return 0;
    return (won / played) * 100;
  };

  const calculateStreak = (form: string[]) => {
    if (form.length === 0) return 0;
    const lastResult = form[form.length - 1];
    let streak = 0;
    for (let i = form.length - 1; i >= 0; i--) {
      if (form[i] === lastResult) {
        streak += lastResult === "W" ? 1 : lastResult === "L" ? -1 : 0;
      } else {
        break;
      }
    }
    return streak;
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0)
      return <span className="text-slate-400 text-[11px]">-</span>;
    const isWinStreak = streak > 0;
    return (
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0.5 font-semibold ${
          isWinStreak
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}
      >
        <Flame className="w-2.5 h-2.5 mr-0.5" />
        {Math.abs(streak)}
        {isWinStreak ? "W" : "L"}
      </Badge>
    );
  };

  const handleViewPlayer = async (participantId: string) => {
    if (!tournamentId) return;

    setLoadingDetails(true);
    try {
      // Find the participant from standings first to get full participant data
      const standingParticipant = deduplicatedStandings.find(
        (s) => {
          const id = typeof s.participant._id === 'string' 
            ? s.participant._id 
            : String(s.participant._id);
          return id === participantId;
        }
      )?.participant;

      const { data } = await axiosInstance.get(
        `tournaments/${tournamentId}/leaderboard/detailed`
      );
      const player = data.leaderboard.find(
        (p: DetailedPlayerStats) => {
          const id = typeof p.participant._id === 'string'
            ? p.participant._id
            : String(p.participant._id);
          return id === participantId;
        }
      );
      
      if (player) {
        // Merge participant data from standings with API response to ensure we have full participant info
        const standingParticipantData = standingParticipant as any;
        const mergedPlayer: DetailedPlayerStats = {
          ...player,
          participant: {
            ...player.participant,
            // Override with standing participant data if available (more complete)
            ...(standingParticipantData && {
              username: standingParticipantData.username || player.participant.username,
              fullName: standingParticipantData.fullName || player.participant.fullName,
              profileImage: standingParticipantData.profileImage || player.participant.profileImage,
              name: standingParticipantData.name || player.participant.name,
              logo: standingParticipantData.logo || player.participant.logo,
            }),
          },
        };
        setSelectedPlayer(mergedPlayer);
        setShowPlayerDialog(true);
      }
    } catch (error) {
      console.error("Error fetching player details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getDisplayName = (p: any): string => {
    if (!p) return "Unknown";
    
    // Check if this is a doubles pair
    if (isDoubles) {
      // First check if participant has pair info directly (preferred method)
      if ((p as any).isPair || ((p as any).player1 && (p as any).player2)) {
        const player1Name = getParticipantDisplayName((p as any).player1);
        const player2Name = getParticipantDisplayName((p as any).player2);
        return `${player1Name}/${player2Name}`;
      }
      
      // Fallback: Check if fullName is already in "Player1 / Player2" format (from API)
      // and convert it to "Player1/Player2" format
      if (p.fullName && typeof p.fullName === 'string' && p.fullName.includes(" / ")) {
        return p.fullName.replace(" / ", "/");
      }
      
      // Another fallback: Check if username is in "p1 & p2" format and try to extract names
      if (p.username && typeof p.username === 'string' && p.username.includes(" & ")) {
        // If we have fullName with spaces, use that
        if (p.fullName && p.fullName.includes(" / ")) {
          return p.fullName.replace(" / ", "/");
        }
      }
    }
    
    return getParticipantDisplayName(p);
  };

  const getSubtext = (p: any): string => {
    if (!p) return "";
    
    // For team participants
    if (!isUserParticipant(p)) {
      return (p as any).city || `${(p as any).players?.length || 0} players`;
    }
    
    // For doubles pairs, show usernames
    if (isDoubles && ((p as any).isPair || ((p as any).player1 && (p as any).player2))) {
      const player1Username = (p as any).player1?.username || "p1";
      const player2Username = (p as any).player2?.username || "p2";
      return `@${player1Username} & @${player2Username}`;
    }
    
    return `@${(p as any).username || "unknown"}`;
  };

  const getImage = (p: any): string | undefined => {
    if (!p) return undefined;
    
    // For doubles pairs, prefer first player's image
    if (isDoubles && ((p as any).isPair || ((p as any).player1 && (p as any).player2))) {
      return getParticipantImage((p as any).player1) || getParticipantImage((p as any).player2);
    }
    
    return getParticipantImage(p);
  };

  const getInitial = (p: any): string => {
    if (!p) return "?";
    
    // For doubles pairs, use first letter of first player
    if (isDoubles && ((p as any).isPair || ((p as any).player1 && (p as any).player2))) {
      const player1Name = getParticipantDisplayName((p as any).player1);
      return player1Name.charAt(0).toUpperCase() || "?";
    }
    
    const name = getDisplayName(p);
    return name.charAt(0).toUpperCase() || "?";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border border-slate-200 shadow-sm">
      {groupName && (
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <h3 className="font-semibold text-sm tracking-wide text-slate-700">
            {groupName}
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                Rank
              </TableHead>
              <TableHead className="font-medium text-[11px] text-slate-600">
                {isTeamTournament ? "Team" : "Player"}
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
              <TableHead className="text-center text-[11px] text-slate-600">
                D
              </TableHead>

              {isTeamTournament ? (
                <>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    SM.W
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    SM.L
                  </TableHead>
                </>
              ) : (
                showDetailedStats && (
                  <>
                    <TableHead className="text-center text-[11px] text-slate-600">
                      SW
                    </TableHead>
                    <TableHead className="text-center text-[11px] text-slate-600">
                      SL
                    </TableHead>
                    <TableHead className="text-center text-[11px] text-slate-600">
                      SD
                    </TableHead>
                    <TableHead className="text-center text-[11px] text-slate-600">
                      PS
                    </TableHead>
                    <TableHead className="text-center text-[11px] text-slate-600">
                      PD
                    </TableHead>
                  </>
                )
              )}

              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Pts
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Win%
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Streak
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Form
              </TableHead>
              {isTeamTournament ? (
                <TableHead className="w-8"></TableHead>
              ) : (
                tournamentId && (
                  <TableHead className="text-right text-[11px] text-slate-600">
                    Actions
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {deduplicatedStandings.map((s, index) => {
              const highlight = s.rank <= highlightTop;
              const hasError = (s.participant as any)?._error || !s.participant || !s.participant._id;
              const participantLink = hasError 
                ? "#" 
                : (isTeamTournament
                    ? `/teams/${s.participant._id}`
                    : `/profile/${s.participant._id}`);
              const isExpanded = expandedTeam === s.participant._id;
              const hasPlayerStats =
                isTeamTournament && s.playerStats && s.playerStats.length > 0;

              // Use index as the primary key to ensure uniqueness even with duplicate entries
              // This handles cases where the same participant/rank appears multiple times
              // Index is always unique in the array, so this guarantees unique keys
              const uniqueKey = `standing-${index}`;

              return (
                <React.Fragment key={uniqueKey}>
                  <TableRow
                    className={cn(
                      "transition-all",
                      hasError ? "bg-red-50/50" : highlight ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    {/* Rank */}
                    <TableCell className="text-center">
                      {s.rank}
                    </TableCell>

                    {/* Player/Team */}
                    <TableCell>
                      {hasError ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border-2 border-red-300">
                            <AvatarFallback className="text-xs bg-red-100 text-red-700">
                              !
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-[13px] font-medium text-red-700">
                              {getDisplayName(s.participant) || "[ERROR: Invalid participant]"}
                            </span>
                            <span className="text-[11px] text-red-600">
                              Data integrity issue
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={participantLink}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={getImage(s.participant)}
                              alt={getDisplayName(s.participant)}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(s.participant)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-[13px] font-medium text-slate-700">
                              {getDisplayName(s.participant)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {getSubtext(s.participant)}
                            </span>
                          </div>
                        </Link>
                      )}
                    </TableCell>

                    {/* MP */}
                    <TableCell className="text-center text-slate-700">
                      {s.played}
                    </TableCell>

                    {/* W */}
                    <TableCell className="text-center text-green-600 font-medium">
                      {s.won}
                    </TableCell>

                    {/* L */}
                    <TableCell className="text-center text-red-600 font-medium">
                      {s.lost}
                    </TableCell>

                    {/* D */}
                    <TableCell className="text-center text-slate-500">
                      {s.drawn}
                    </TableCell>

                    {isTeamTournament ? (
                      <>
                        {/* SM.W (SubMatches Won) */}
                        <TableCell className="text-center text-green-600">
                          {s.subMatchesWon ?? s.setsWon}
                        </TableCell>

                        {/* SM.L (SubMatches Lost) */}
                        <TableCell className="text-center text-red-600">
                          {s.subMatchesLost ?? s.setsLost}
                        </TableCell>
                      </>
                    ) : (
                      showDetailedStats && (
                        <>
                          <TableCell className="text-center">
                            {s.setsWon}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.setsLost}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                s.setsDiff > 0
                                  ? "text-green-600"
                                  : s.setsDiff < 0
                                  ? "text-red-600"
                                  : "text-slate-500"
                              }
                            >
                              {s.setsDiff > 0 && "+"}
                              {s.setsDiff}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {s.pointsScored}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                s.pointsDiff > 0
                                  ? "text-green-600"
                                  : s.pointsDiff < 0
                                  ? "text-red-600"
                                  : "text-slate-500"
                              }
                            >
                              {s.pointsDiff > 0 && "+"}
                              {s.pointsDiff}
                            </span>
                          </TableCell>
                        </>
                      )
                    )}

                    {/* Points */}
                    <TableCell className="text-center">
                      <Badge className="bg-indigo-100 text-indigo-700 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                        {s.points}
                      </Badge>
                    </TableCell>

                    {/* Win Rate */}
                    <TableCell className="text-center text-slate-700 font-medium">
                      {calculateWinRate(s.won, s.played).toFixed(0)}%
                    </TableCell>

                    {/* Streak */}
                    <TableCell className="text-center">
                      {getStreakDisplay(calculateStreak(s.form))}
                    </TableCell>

                    {/* Form */}
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {s.form.slice(-5).map((r, i) => (
                          <div key={i}>{formChip(r)}</div>
                        ))}
                      </div>
                    </TableCell>

                    {/* Actions / Expand */}
                    {isTeamTournament ? (
                      <TableCell className="text-center">
                        {hasPlayerStats && (
                          <button
                            onClick={() =>
                              setExpandedTeam(
                                isExpanded ? null : s.participant._id
                              )
                            }
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
                    ) : (
                      tournamentId && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPlayer(s.participant._id)}
                            disabled={loadingDetails}
                            className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      )
                    )}
                  </TableRow>

                  {/* Expanded player stats row for teams */}
                  {isTeamTournament && isExpanded && hasPlayerStats && (
                    <TableRow>
                      <TableCell
                        colSpan={isTeamTournament ? 13 : 16}
                        className="bg-slate-50/50 p-0"
                      >
                        <div className="px-6 py-4">
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Player Performance
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {s.playerStats!.map((ps: TeamPlayerStats) => (
                              <Link
                                key={ps.player._id}
                                href={`/profile/${ps.player._id}`}
                                className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                              >
                                <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-indigo-200 transition-all">
                                  <AvatarImage src={ps.player.profileImage} />
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {getInitials(
                                      ps.player.fullName ||
                                        ps.player.username ||
                                        "?"
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[12px] flex-1 truncate font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                                  {ps.player.fullName || ps.player.username}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {ps.subMatchesWon}/{ps.subMatchesPlayed}
                                </span>
                                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                                  {ps.winRate.toFixed(0)}%
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Player Details Dialog (for individual tournaments only) */}
      {!isTeamTournament && (
        <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
          <DialogContent className="max-w-4xl max-h-[75vh] overflow-y-auto">
            {selectedPlayer && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getImage(selectedPlayer.participant)}
                          alt={getDisplayName(selectedPlayer.participant)}
                        />
                        <AvatarFallback className="text-[11px]">
                          {getInitial(selectedPlayer.participant)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-base font-semibold text-slate-800">
                          {getDisplayName(selectedPlayer.participant)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {getSubtext(selectedPlayer.participant)}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold px-2.5 py-1">
                      Rank #{selectedPlayer.standing.rank}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-500">
                    Complete match history
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  {selectedPlayer.matchHistory.length === 0 ? (
                    <div className="text-center text-slate-500 text-[12px] py-12">
                      No matches played yet
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {selectedPlayer.matchHistory.map((match) => (
                        <div
                          key={match.matchId}
                          className="flex items-center justify-between py-2.5 px-3 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                match.result === "win"
                                  ? "bg-green-100 text-green-700"
                                  : match.result === "loss"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {match.result === "win"
                                ? "W"
                                : match.result === "loss"
                                ? "L"
                                : "D"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-[13px] text-slate-700 truncate">
                                {getDisplayName(match.opponent)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {match.groupId ? "Group Stage" : "Round Robin"}
                                {match.roundNumber &&
                                  ` • Round ${match.roundNumber}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-semibold text-slate-800">
                              {match.score}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {match.pointsScored}-{match.pointsConceded} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
