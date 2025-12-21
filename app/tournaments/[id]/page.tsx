"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  Trophy,
  Calendar,
  MapPin,
  Loader2,
  Users2,
  Settings,
  Play,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import {
  Tournament,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { motion } from "framer-motion";
import { EnhancedStandingsTable } from "@/components/tournaments/EnhancedStandingsTable";
import { GroupsView } from "@/components/tournaments/GroupsView";
import TournamentSchedule from "@/components/tournaments/TournamentSchedule";
import { JoinCodeDialog } from "@/components/tournaments/JoinCodeDialog";
import { ManageParticipantsDialog } from "@/components/tournaments/ManageParticipantsDialog";
import { ManageGroupsDialog } from "@/components/tournaments/ManageGroupsDialog";
import { ManageScorersDialog } from "@/components/tournaments/ManageScorersDialog";
import KnockoutBracketView from "@/components/tournaments/KnockoutBracketView";
import { HybridTournamentManager } from "@/components/tournaments/HybridTournamentManager";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { SeedingManager } from "@/components/tournaments/SeedingManager";
import { TournamentHeaderSkeleton } from "@/components/skeletons/TournamentHeaderSkeleton";
import { KnockoutStatistics as KnockoutStatisticsComponent } from "@/components/tournaments/KnockoutStatistics";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/PersonAdd";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CancelIcon from "@mui/icons-material/Cancel";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [manageParticipantsOpen, setManageParticipantsOpen] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [seedingManagerOpen, setSeedingManagerOpen] = useState(false);
  const [manageScorersOpen, setManageScorersOpen] = useState(false);

  const fetchTournament = useCallback(
    async (skipLoadingState = false) => {
      if (!skipLoadingState) {
        setLoading(true);
      }
      try {
        const { data } = await axiosInstance.get(
          `/tournaments/${tournamentId}`
        );
        const tournament = data.tournament;
        setTournament(tournament);
      } catch (err) {
        console.error("Error fetching tournament:", err);
        toast.error("Failed to load tournament");
      } finally {
        if (!skipLoadingState) {
          setLoading(false);
        }
      }
    },
    [tournamentId]
  );

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const generateMatches = async () => {
    setGenerating(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/generate-matches`
      );

      // Fetch the complete tournament data to ensure all matches are populated
      await fetchTournament(true);

      // Check if this is a custom matching tournament
      const isCustomMatching =
        tournament?.format === "knockout" &&
        tournament?.knockoutConfig?.allowCustomMatching === true;

      // Show appropriate message based on matches created
      if (data.stats.totalMatches === 0) {
        toast.error(
          "No matches were generated. Please check your tournament configuration and try again.",
          { duration: 5000 }
        );
      } else if (isCustomMatching) {
        toast.success(
          `Bracket structure created! Use the Custom Matching interface to assign participants and create matches.`,
          { duration: 6000 }
        );
      } else {
        toast.success(
          `Tournament draw generated! ${data.stats.totalMatches} matches created.`
        );
      }
    } catch (err: any) {
      console.error("Error generating matches:", err);
      toast.error(err.response?.data?.error || "Failed to generate matches");
      // Refresh tournament data even on error to ensure UI is in sync
      await fetchTournament(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleJoinCodeUpdate = (joinCode: string, allowJoinByCode: boolean) => {
    setTournament((prev) =>
      prev
        ? {
            ...prev,
            joinCode,
            allowJoinByCode,
          }
        : null
    );
  };

  const handleParticipantsUpdate = (participants: any[]) => {
    setTournament((prev) =>
      prev
        ? {
            ...prev,
            participants,
          }
        : null
    );
  };

  const handleScorersUpdate = (scorers: any[]) => {
    setTournament((prev) =>
      prev
        ? {
            ...prev,
            scorers,
          }
        : null
    );
  };

  const handleGroupsUpdate = async (groups: any[]) => {
    // Groups update now always generates/regenerates matches
    // Fetch full tournament data to get the generated matches
    await fetchTournament(true); // Skip loading state to avoid flash
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this tournament? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      await axiosInstance.post(`/tournaments/${tournamentId}/cancel`);
      toast.success("Tournament cancelled successfully");
      await fetchTournament();
    } catch (err: any) {
      console.error("Error cancelling tournament:", err);
      toast.error(err.response?.data?.error || "Failed to cancel tournament");
    } finally {
      setCancelling(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset this tournament? All matches and standings will be removed. This action cannot be undone."
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      await axiosInstance.post(`/tournaments/${tournamentId}/reset`);
      toast.success(
        "Tournament reset successfully. You can now regenerate the draw."
      );
      await fetchTournament();
    } catch (err: any) {
      console.error("Error resetting tournament:", err);
      toast.error(err.response?.data?.error || "Failed to reset tournament");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <TournamentHeaderSkeleton />;
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p>Tournament not found</p>
      </div>
    );
  }

  const isOrganizer = user && tournament.organizer?._id === user._id;
  const isCustomMatchingTournament =
    tournament.format === "knockout" &&
    tournament.knockoutConfig?.allowCustomMatching === true;

  const canGenerateMatches =
    isOrganizer &&
    !tournament.drawGenerated &&
    tournament.status === "draft" &&
    (tournament.participants?.length || 0) >= 2;

  const isTeamTournament = tournament.category === "team";

  // Helper function to check if tournament uses groups
  const hasGroups = () => {
    if (tournament.format === "round_robin") {
      return tournament.useGroups;
    }
    if (tournament.format === "hybrid") {
      return tournament.hybridConfig?.roundRobinUseGroups || false;
    }
    return false;
  };

  // Calculate progress and extract matches
  const getAllMatches = () => {
    // For knockout tournaments, extract matches from bracket
    if (tournament.format === "knockout" && tournament.bracket) {
      const matches: any[] = [];

      // Collect matches from all rounds
      if (
        tournament.bracket.rounds &&
        Array.isArray(tournament.bracket.rounds)
      ) {
        tournament.bracket.rounds.forEach((round: any) => {
          if (round.matches && Array.isArray(round.matches)) {
            round.matches.forEach((bracketMatch: any) => {
              // After API population, matchId is now a full match object (not a string)
              if (
                bracketMatch.matchId &&
                typeof bracketMatch.matchId === "object"
              ) {
                matches.push(bracketMatch.matchId);
              }
            });
          }
        });
      }

      // Add third place match if it exists
      if (
        tournament.bracket.thirdPlaceMatch?.matchId &&
        typeof tournament.bracket.thirdPlaceMatch.matchId === "object"
      ) {
        matches.push(tournament.bracket.thirdPlaceMatch.matchId);
      }

      return matches;
    }

    // For round-robin with groups (both round-robin and hybrid formats)
    if (hasGroups() && tournament.groups && Array.isArray(tournament.groups)) {
      return tournament.groups.flatMap((g: any) =>
        (g.rounds && Array.isArray(g.rounds) ? g.rounds : []).flatMap(
          (r: any) => (r.matches && Array.isArray(r.matches) ? r.matches : [])
        )
      );
    }

    // For regular round-robin
    if (tournament.rounds && Array.isArray(tournament.rounds)) {
      return tournament.rounds.flatMap((r: any) =>
        r.matches && Array.isArray(r.matches) ? r.matches : []
      );
    }

    return [];
  };

  const allMatchObjects = getAllMatches();

  const getTotalMatchCount = () => {
    return allMatchObjects.length;
  };

  const totalMatches = getTotalMatchCount();
  const completedMatches = allMatchObjects.filter(
    (m: any) => m?.status === "completed"
  ).length;

  // Check if any matches have been played (not just scheduled)
  const hasPlayedMatches = allMatchObjects.some(
    (m: any) => m?.status === "in_progress" || m?.status === "completed"
  );

  // For hybrid tournaments, allow group management before round-robin phase is generated
  const canManageGroups = () => {
    if (!hasGroups()) return false;

    // Check if any matches have been played
    const hasPlayedMatchesCheck = allMatchObjects.some(
      (m: any) => m?.status === "in_progress" || m?.status === "completed"
    );

    // If matches have been played, don't allow group management
    if (hasPlayedMatchesCheck) return false;

    if (tournament.format === "hybrid") {
      // For hybrid, allow if:
      // 1. No groups exist yet, OR
      // 2. Groups exist but are empty (no participants), OR
      // 3. Groups exist but draw hasn't been generated yet
      if (!tournament.groups || tournament.groups.length === 0) {
        return true;
      }

      // Check if groups are empty (no participants in any group)
      const groupsHaveParticipants = tournament.groups.some(
        (group: any) => group.participants && group.participants.length > 0
      );

      // Allow if groups are empty or if draw hasn't been generated
      return !groupsHaveParticipants || !tournament.drawGenerated;
    }

    // For other formats, allow if draw hasn't been generated
    return !tournament.drawGenerated;
  };

  // Transform rounds to have match IDs instead of full objects for TournamentSchedule
  // For group tournaments, keep rounds separated by group
  const getRoundsForSchedule = () => {
    if (hasGroups() && tournament.groups && tournament.groups.length > 0) {
      // Keep rounds separated by group for clear organization
      const roundsWithGroups: any[] = [];

      tournament.groups.forEach((group: any) => {
        if (group.rounds && Array.isArray(group.rounds)) {
          group.rounds.forEach((round: any) => {
            const matchIds =
              (round.matches && Array.isArray(round.matches)
                ? round.matches.map((m: any) =>
                    typeof m === "string" ? m : String(m._id || m)
                  )
                : []) || [];

            roundsWithGroups.push({
              roundNumber: round.roundNumber || 0,
              matches: matchIds,
              completed: round.completed || false,
              scheduledDate: round.scheduledDate,
              groupName: group.groupName || "Unknown", // Add group name to identify which group
              groupId: group.groupId,
            });
          });
        }
      });

      // Sort by group name first, then by round number
      return roundsWithGroups.sort((a, b) => {
        if (a.groupName !== b.groupName) {
          return a.groupName.localeCompare(b.groupName);
        }
        return a.roundNumber - b.roundNumber;
      });
    }

    // For non-group tournaments, use the regular rounds
    if (tournament.rounds && Array.isArray(tournament.rounds)) {
      return tournament.rounds.map((round: any) => ({
        ...round,
        matches:
          (round.matches && Array.isArray(round.matches)
            ? round.matches.map((m: any) =>
                typeof m === "string" ? m : String(m._id || m)
              )
            : []) || [],
      }));
    }
    return [];
  };

  const roundsWithIds = getRoundsForSchedule();

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "upcoming":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-green-50 text-green-700 border-green-200";
      case "completed":
        return "bg-purple-50 text-black border-purple-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <TournamentErrorBoundary>
      <div className="min-h-screen bg-white">
        {/* Clean Header */}
        <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto px-4 py-3">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 space-y-1">
                {/* Title + Status */}
                <div className="flex items-center gap-3">
                  <h1 className="text-[14px] font-bold uppercase tracking-[0.2em] text-slate-900 leading-none">
                    {tournament.name}
                  </h1>

                  <Badge
                    variant="outline"
                    className={`${getStatusColor(
                      tournament.status
                    )} text-xs font-semibold px-2 py-0.5 rounded-full border`}
                  >
                    {tournament.status?.replace("_", " ").toUpperCase() ||
                      "DRAFT"}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              {isOrganizer && (
                <div className="flex items-center gap-2">
                  {/* Primary Action */}
                  {canGenerateMatches && !isCustomMatchingTournament && (
                    <Button
                      onClick={generateMatches}
                      disabled={generating}
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Generate Draw
                        </>
                      )}
                    </Button>
                  )}
                  {canGenerateMatches && isCustomMatchingTournament && (
                    <Button
                      onClick={generateMatches}
                      disabled={generating}
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Generate Bracket
                        </>
                      )}
                    </Button>
                  )}

                  {/* Settings Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 hover:bg-slate-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        Tournament Settings
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {!tournament.drawGenerated && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setManageParticipantsOpen(true)}
                          >
                            <PersonIcon className="w-4 h-4" />
                            Manage {isTeamTournament ? "Teams" : "Players"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSeedingManagerOpen(true)}
                          >
                            <EmojiEventsIcon className="w-4 h-4" />
                            Manage Seeding
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setJoinCodeDialogOpen(true)}
                          >
                            <QrCodeIcon className="w-4 h-4" />
                            Join Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Manage Scorers - available anytime for organizer */}
                      <DropdownMenuItem
                        onClick={() => setManageScorersOpen(true)}
                      >
                        <Users2 className="w-4 h-4" />
                        Manage Scorers
                      </DropdownMenuItem>
                      {/* Show Manage Groups if groups are enabled and can be managed (outside drawGenerated check for hybrid tournaments) */}
                      {canManageGroups() && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (hasPlayedMatches) {
                              toast.error(
                                "Cannot modify groups after matches have been played."
                              );
                            } else {
                              setManageGroupsOpen(true);
                            }
                          }}
                          disabled={hasPlayedMatches}
                        >
                          <GroupsIcon className="w-4 h-4" />
                          Manage Groups
                          {hasPlayedMatches && (
                            <span className="ml-auto text-xs">🔒</span>
                          )}
                        </DropdownMenuItem>
                      )}

                      {tournament.drawGenerated &&
                        tournament.status !== "completed" &&
                        tournament.status !== "cancelled" && (
                          <>
                            <DropdownMenuItem
                              onClick={handleReset}
                              disabled={resetting || hasPlayedMatches}
                              variant="destructive"
                            >
                              <RestartAltIcon className="size-4" />
                              Reset Tournament
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                      {tournament.status !== "completed" &&
                        tournament.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={handleCancel}
                            disabled={cancelling}
                            variant="destructive"
                          >
                            <CancelIcon sx={{ fontSize: 16 }} />
                            {cancelling
                              ? "Cancelling..."
                              : "Cancel Tournament"}
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 justify-between flex-wrap pt-3 mt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-500" />
                <p className="text-xs font-medium text-slate-700">
                  {tournament.startDate
                    ? formatDateShort(tournament.startDate)
                    : "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-slate-500" />
                <p className="text-xs font-medium text-slate-700">
                  {tournament.city || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Users2 className="size-3.5 text-slate-500" />
                <p className="text-xs font-medium text-slate-700">
                  {tournament.participants?.length || 0}
                  {hasGroups() && (
                    <span className="text-xs font-normal text-slate-500">
                      {" "}
                      (
                      {tournament.format === "hybrid"
                        ? tournament.hybridConfig?.roundRobinNumberOfGroups ||
                          0
                        : tournament.numberOfGroups || 0}
                      G)
                    </span>
                  )}{" "}
                  {isTeamTournament ? "Teams" : "Participants"}
                </p>
              </div>

              {tournament.status !== "draft" && totalMatches > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="size-3.5 text-slate-500" />
                    <p className="text-xs font-medium text-slate-700">
                      Progress: {completedMatches}/{totalMatches}
                    </p>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (completedMatches / totalMatches) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="mx-auto px-4 py-6">
          {/* Error Recovery - Draw generated but no matches (only show if NOT custom matching) */}
          {isOrganizer &&
            tournament.drawGenerated &&
            !canGenerateMatches &&
            totalMatches === 0 &&
            !hasPlayedMatches &&
            tournament.format === "knockout" &&
            tournament.knockoutConfig?.allowCustomMatching !== true && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="border border-red-200 rounded-lg bg-red-50/50 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-1">
                        No Matches Generated
                      </h3>
                      <p className="text-sm text-red-700">
                        The draw was generated but no matches were created.
                        Please reset and try again, or check your tournament
                        configuration.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReset}
                        disabled={resetting}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {resetting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RestartAltIcon className="w-4 h-4" />
                            Reset & Retry
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          {/* Custom Matching Button for Knockout */}
          {isOrganizer &&
            tournament.format === "knockout" &&
            tournament.knockoutConfig?.allowCustomMatching === true &&
            tournament.drawGenerated === true && (
              <div className="mb-6 border border-slate-200 rounded-lg bg-slate-50/50 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-1">
                      {totalMatches === 0
                        ? "Action Required: Configure Custom Matchups"
                        : "Custom Matching"}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {totalMatches === 0
                        ? "The bracket has been created. Click below to assign participants and create matches."
                        : "Manually configure matchups for knockout rounds"}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      router.push(
                        `/tournaments/${tournamentId}/custom-matching`
                      )
                    }
                    variant="outline"
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    {totalMatches === 0
                      ? "Configure Matchups Now"
                      : "Configure Matchups"}
                  </Button>
                </div>
              </div>
            )}

          {/* Hybrid Tournament Manager */}
          {tournament.format === "hybrid" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <HybridTournamentManager
                tournamentId={tournamentId}
                isOrganizer={!!isOrganizer}
                onUpdate={() => fetchTournament(true)}
              />
            </motion.div>
          )}

          {/* Main Tabs */} 
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="flex w-full rounded-sm p-1 h-auto justify-start gap-1 bg-slate-100 border border-slate-200">
              {/* Info Tab */}
              <TabsTrigger
                value="info"
                className="
                  rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                  data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                Info
              </TabsTrigger>

              {/* Groups Tab - Show for tournaments with groups */}
              {hasGroups() && (
                <TabsTrigger
                  value="groups"
                  className="
                    rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                    data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                    transition-all
                  "
                >
                  Groups
                </TabsTrigger>
              )}

              {/* Standings Tab - Show for tournaments without groups (not knockout) */}
              {!hasGroups() && tournament.format !== "knockout" && (
                <TabsTrigger
                  value="standings"
                  className="
                    rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                    data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                    transition-all
                  "
                >
                  Standings
                </TabsTrigger>
              )}

              {/* Schedule Tab */}
              <TabsTrigger
                value="schedule"
                className="
                  rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                  data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                Schedule
              </TabsTrigger>

              <TabsTrigger
                value="participants"
                className="
                  rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                  data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                {isTeamTournament ? "Teams" : "Players"}
              </TabsTrigger>

              {/* Statistics Tab - Show for knockout tournaments with statistics */}
              {tournament.format === "knockout" &&
                tournament.knockoutStatistics && (
                  <TabsTrigger
                    value="statistics"
                    className="
                      rounded text-xs font-medium px-3 py-1.5 uppercase tracking-wide
                      data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900
                      data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                      transition-all
                    "
                  >
                    Statistics
                  </TabsTrigger>
                )}
            </TabsList>

            {/* Groups Tab */}
            {hasGroups() && (
              <TabsContent value="groups" className="mt-4">
                <div className="border border-slate-200 rounded-lg bg-white">
                  {tournament.groups && tournament.groups.length > 0 ? (
                    <GroupsView
                      groups={tournament.groups}
                      advancePerGroup={tournament.advancePerGroup}
                      showDetailedStats={true}
                      category={tournament.category}
                    />
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No groups generated yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Standings Tab */}
            <TabsContent value="standings" className="mt-4">
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-slate-100">
                  <EmojiEventsIcon className="size-4 text-slate-600" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                      Tournament Standings
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View detailed statistics and match history
                    </p>
                  </div>
                </div>
                <div>
                  {tournament.standings && tournament.standings.length > 0 ? (
                    <EnhancedStandingsTable
                      standings={tournament.standings}
                      showDetailedStats={true}
                      highlightTop={3}
                      tournamentId={tournamentId}
                      category={tournament.category}
                    />
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No standings available yet</p>
                      <p className="text-xs mt-2 text-slate-400">
                        Generate matches to create standings
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-4">
              <div className="border border-slate-200 rounded-lg bg-white p-4">
                {tournament.format === "knockout" && tournament.bracket ? (
                  <KnockoutBracketView
                    bracket={tournament.bracket}
                    participants={tournament.participants}
                    matches={allMatchObjects as any}
                    onMatchClick={(matchId) =>
                      router.push(
                        `/matches/${matchId}?category=${
                          isTeamTournament ? "team" : "individual"
                        }`
                      )
                    }
                    showThirdPlace={
                      tournament.knockoutConfig?.thirdPlaceMatch
                    }
                    category={tournament.category}
                  />
                ) : roundsWithIds && roundsWithIds.length > 0 ? (
                  <TournamentSchedule
                    rounds={roundsWithIds as any}
                    matches={allMatchObjects as any}
                    onMatchClick={(id) =>
                      router.push(
                        `/matches/${id}?category=${
                          isTeamTournament ? "team" : "individual"
                        }`
                      )
                    }
                    showDate={false}
                    showTime={false}
                    venue={tournament.venue}
                    isTeamTournament={isTeamTournament}
                  />
                ) : isCustomMatchingTournament && tournament.drawGenerated ? (
                  <div className="py-12 text-center text-slate-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Bracket structure created</p>
                    <p className="text-xs mt-2 text-slate-400">
                      Use the Custom Matching interface to configure matchups
                      and create matches
                    </p>
                    {isOrganizer && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/tournaments/${tournamentId}/custom-matching`
                          )
                        }
                        className="mt-4 bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        Configure Matchups
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No schedule available yet</p>
                    <p className="text-xs mt-2 text-slate-400">
                      {isCustomMatchingTournament
                        ? "Generate bracket to get started"
                        : "Generate matches to create the schedule"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="mt-4">
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                    {isTeamTournament
                      ? "Tournament Teams"
                      : "Tournament Participants"}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {(tournament.participants || []).map((p) => {
                      const seed = tournament.seeding?.find(
                        (s) => s.participant?._id === p._id
                      );

                      // Check if participant is a team
                      const isTeam = isTeamParticipant(p);
                      const displayName = getParticipantDisplayName(p);
                      const image = getParticipantImage(p);
                      const linkHref = isTeamTournament
                        ? `/teams/${p._id}`
                        : `/profile/${p._id}`;

                      // Get subtext - username for users, city/player count for teams
                      const subtext = isTeam
                        ? (p as any).city ||
                          `${(p as any).players?.length || 0} players`
                        : `@${(p as any).username || "unknown"}`;

                      return (
                        <Link
                          key={p._id}
                          href={linkHref}
                          className="
                        flex items-center gap-2 p-2
                        rounded-lg border border-slate-200
                        bg-slate-50/50 
                        hover:bg-slate-100 
                        transition-all duration-200
                        group
                      "
                        >
                          {/* Avatar */}
                          <div className="shrink-0">
                            {image ? (
                              <img
                                src={image}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="
                              w-8 h-8 rounded-full bg-slate-200 text-slate-700
                              flex items-center justify-center text-xs font-semibold 
                              border border-slate-300
                            "
                              >
                                {displayName.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                          </div>

                          {/* Participant Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-slate-900 truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {subtext}
                            </p>
                          </div>

                          {/* Seed Badge */}
                          {seed && (
                            <span
                              className="
                            text-[10px] px-2 py-0.5 rounded-full 
                            bg-slate-200 text-slate-700
                            border border-slate-300
                            font-medium
                          "
                            >
                              Seed {seed.seedNumber}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4">
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                    Tournament Information
                  </h3>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DETAILS */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-3">
                        Details
                      </h4>

                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <dt className="text-slate-600 text-xs">Format</dt>
                          <dd className="font-medium text-slate-900 capitalize text-xs">
                            {tournament.format?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <dt className="text-slate-600 text-xs">Category</dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.category || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <dt className="text-slate-600 text-xs">Match Type</dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.matchType?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <dt className="text-slate-600 text-xs">Seeding</dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.seedingMethod || "none"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* RULES */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-3">
                        Rules
                      </h4>

                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <dt className="text-slate-600 text-xs">
                            {tournament.category === "team"
                              ? "Sets per submatch"
                              : "Sets per match"}
                          </dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.category === "team"
                              ? (tournament as any).teamConfig
                                  ?.setsPerSubMatch || "N/A"
                              : tournament.rules?.setsPerMatch || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <dt className="text-slate-600 text-xs">
                            Points per set
                          </dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.rules?.pointsPerSet || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <dt className="text-slate-600 text-xs">Win / Loss</dt>
                          <dd className="font-medium text-slate-900 text-xs">
                            {tournament.rules?.pointsForWin || 0}/
                            {tournament.rules?.pointsForLoss || 0}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            {tournament.format === "knockout" &&
              tournament.knockoutStatistics && (
                <TabsContent value="statistics" className="mt-4">
                  <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <KnockoutStatisticsComponent
                      statistics={tournament.knockoutStatistics}
                      category={tournament.category as "individual" | "team"}
                    />
                  </div>
                </TabsContent>
              )}
          </Tabs>
        </div>

        {/* Join Code Dialog */}
        {tournament && (
          <JoinCodeDialog
            open={joinCodeDialogOpen}
            onOpenChange={setJoinCodeDialogOpen}
            tournamentId={tournament._id}
            tournamentName={tournament.name}
            joinCode={tournament.joinCode}
            allowJoinByCode={tournament.allowJoinByCode || false}
            onUpdate={handleJoinCodeUpdate}
          />
        )}

        {/* Manage Participants Dialog */}
        {tournament && (
          <ManageParticipantsDialog
            open={manageParticipantsOpen}
            onOpenChange={setManageParticipantsOpen}
            tournamentId={tournament._id}
            participants={tournament.participants}
            category={tournament.category}
            onUpdate={handleParticipantsUpdate}
          />
        )}

        {/* Manage Groups Dialog */}
        {tournament && hasGroups() && (
          <ManageGroupsDialog
            open={manageGroupsOpen}
            onOpenChange={setManageGroupsOpen}
            tournamentId={tournament._id}
            groups={tournament.groups || []}
            participants={tournament.participants}
            onUpdate={handleGroupsUpdate}
            drawGenerated={tournament.drawGenerated}
            hasPlayedMatches={hasPlayedMatches}
          />
        )}

        {/* Seeding Manager Dialog */}
        {tournament && (
          <SeedingManager
            open={seedingManagerOpen}
            onOpenChange={setSeedingManagerOpen}
            tournamentId={tournament._id}
            participants={tournament.participants}
            currentSeeding={tournament.seeding || []}
            onUpdate={() => fetchTournament(true)}
            category={tournament.category}
          />
        )}

        {/* Manage Scorers Dialog */}
        {tournament && (
          <ManageScorersDialog
            open={manageScorersOpen}
            onOpenChange={setManageScorersOpen}
            tournamentId={tournament._id}
            organizer={tournament.organizer}
            scorers={tournament.scorers || []}
            onUpdate={handleScorersUpdate}
          />
        )}
      </div>
    </TournamentErrorBoundary>
  );
}
