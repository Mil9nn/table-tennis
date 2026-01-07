"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import {
  Tournament,
  Participant,
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
import { ManageDoublesPairsDialog } from "@/components/tournaments/ManageDoublesPairsDialog";
import KnockoutBracketView from "@/components/tournaments/KnockoutBracketView";
import { HybridTournamentManager } from "@/components/tournaments/HybridTournamentManager";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { SeedingManager } from "@/components/tournaments/SeedingManager";
import { TournamentHeaderSkeleton } from "@/components/skeletons/TournamentHeaderSkeleton";
import { KnockoutStatistics as KnockoutStatisticsComponent } from "@/components/tournaments/KnockoutStatistics";


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
  const [generatingStats, setGeneratingStats] = useState(false);
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [manageParticipantsOpen, setManageParticipantsOpen] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [seedingManagerOpen, setSeedingManagerOpen] = useState(false);
  const [manageScorersOpen, setManageScorersOpen] = useState(false);
  const [manageDoublesPairsOpen, setManageDoublesPairsOpen] = useState(false);
  const [managementExpanded, setManagementExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);

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

      // Check if this is a custom matching tournament (knockout or hybrid in knockout phase)
      const isCustomMatching =
        (tournament?.format === "knockout" ||
          (tournament?.format === "hybrid" &&
            tournament?.currentPhase === "knockout")) &&
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

  const handleScorersUpdate = async (scorers: any[]) => {
    // Update local state immediately for responsive UI
    setTournament((prev) =>
      prev
        ? {
            ...prev,
            scorers,
          }
        : null
    );
    // Also refresh tournament data to ensure consistency
    await fetchTournament(true);
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

  const handleGenerateStatistics = async () => {
    setGeneratingStats(true);
    try {
      await axiosInstance.post(`/tournaments/${tournamentId}/finalize`);
      toast.success("Statistics generated successfully!");
      await fetchTournament(true);
    } catch (err: any) {
      console.error("Error generating statistics:", err);
      toast.error(err.response?.data?.error || "Failed to generate statistics");
    } finally {
      setGeneratingStats(false);
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

  // Check if user is a scorer (organizer or in scorers array)
  const isScorer =
    isOrganizer ||
    (user &&
      tournament.scorers?.some(
        (scorer: any) =>
          scorer._id === user._id || scorer.toString() === user._id
      ));

  // Check if tournament is in knockout phase (either pure knockout or hybrid after transition)
  const isInKnockoutPhase =
    tournament.format === "knockout" ||
    (tournament.format === "hybrid" && tournament.currentPhase === "knockout");

  // For knockout tournaments, allowCustomMatching defaults to true
  // Only disable if explicitly set to false
  const isCustomMatchingTournament =
    isInKnockoutPhase &&
    (tournament.knockoutConfig?.allowCustomMatching !== false);

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

  // Separate functions to get round-robin and knockout matches
  // This ensures clear separation between schedule (round-robin) and bracket (knockout) data

  /**
   * Get round-robin matches only (for Schedule tab)
   * For hybrid tournaments in knockout phase, this returns the historical round-robin matches
   */
  const getRoundRobinMatches = () => {
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

  /**
   * Get knockout matches only (for Bracket tab)
   * Only returns matches if tournament has a bracket structure
   */
  const getKnockoutMatches = () => {
    if (!tournament.bracket) {
      return [];
    }

    const matches: any[] = [];

    // Collect matches from all bracket rounds
    if (tournament.bracket.rounds && Array.isArray(tournament.bracket.rounds)) {
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
  };

  /**
   * Get all matches (for statistics and progress calculation)
   * For hybrid tournaments in knockout phase, includes both round-robin and knockout matches
   * For pure knockout tournaments, only includes knockout matches
   * For pure round-robin tournaments, only includes round-robin matches
   */
  const getAllMatches = () => {
    const roundRobinMatches = getRoundRobinMatches();
    const knockoutMatches = getKnockoutMatches();

    // For hybrid tournaments in knockout phase, return both
    if (
      tournament.format === "hybrid" &&
      tournament.currentPhase === "knockout"
    ) {
      return [...roundRobinMatches, ...knockoutMatches];
    }

    // For pure knockout tournaments, return only knockout matches
    if (isInKnockoutPhase && tournament.bracket) {
      return knockoutMatches;
    }

    // For round-robin tournaments, return only round-robin matches
    return roundRobinMatches;
  };

  const allMatchObjects = getAllMatches();
  const roundRobinMatches = getRoundRobinMatches();
  const knockoutMatches = getKnockoutMatches();

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
  // IMPORTANT: This function ONLY returns round-robin rounds (from tournament.groups or tournament.rounds)
  // It NEVER includes bracket rounds (from tournament.bracket) - those belong in the Bracket tab
  const getRoundsForSchedule = () => {
    // For hybrid tournaments in knockout phase, we still want to show historical round-robin rounds
    // in the Schedule tab, but NOT the knockout bracket rounds

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
    // NOTE: This is tournament.rounds (round-robin rounds), NOT tournament.bracket.rounds (knockout rounds)
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

    // Return empty array - never include bracket rounds here
    return [];
  };

  const roundsWithIds = getRoundsForSchedule();

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "upcoming":
        return "text-orange-500";
      case "draft":
        return "text-gray-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <TournamentErrorBoundary>
      <div className="min-h-screen bg-[#ffffff]">
        {/* Clean Header */}
        <header className="sticky top-0 z-10 border-b border-[#d9d9d9] bg-[#ffffff]">
          <div className="mx-auto px-4 py-3">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 space-y-1">
                {/* Title + Status */}
                <div className="flex items-center gap-4 justify-between">
                  <h1 className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#353535] leading-none">
                    {tournament.name}
                  </h1>

                  <span className={`${getStatusColor(tournament.status)} text-xs font-medium capitalize`}>
                    {tournament.status?.replace("_", " ") || "Draft"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 justify-between flex-wrap pt-3 mt-3 border-t border-[#d9d9d9]">
              <p className="text-xs font-medium text-[#353535]">
                {tournament.startDate
                  ? formatDateShort(tournament.startDate)
                  : "N/A"}
              </p>
              <p className="text-xs font-medium text-[#353535]">
                {tournament.city || "N/A"}
                {tournament.venue && `, ${tournament.venue}`}
              </p>
              <p className="text-xs font-medium text-[#353535]">
                {tournament.participants?.length || 0}
                {hasGroups() && (
                  <span className="text-xs font-normal text-[#3c6e71]">
                    {" "}
                    (
                    {tournament.format === "hybrid"
                      ? tournament.hybridConfig?.roundRobinNumberOfGroups || 0
                      : tournament.numberOfGroups || 0}
                    G)
                  </span>
                )}{" "}
                {isTeamTournament ? "Teams" : "Participants"}
              </p>

              {tournament.status !== "draft" && totalMatches > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-[#353535]">
                    Progress: {completedMatches}/{totalMatches}
                  </p>
                  <div className="w-24 h-1.5 bg-[#d9d9d9] overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(completedMatches / totalMatches) * 100}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-[#353535] rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scorer View Indicator */}
        {isScorer && !isOrganizer && (
          <div className="border-b border-[#d9d9d9] bg-blue-50">
            <div className="mx-auto px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <span className="font-medium">Scorer View</span>
                <span className="text-blue-600">
                  - You can score matches in this tournament. Navigate to the
                  Schedule or Bracket tab to view and score matches.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings & Utilities Section */}
        {isOrganizer && (
          <div className="border-b border-[#d9d9d9] bg-[#f9f9f9]">
            <div className="mx-auto px-4 py-2">
              <div className="flex flex-col gap-2">
                {/* Management Section */}
                <div className="flex flex-col gap-2">
                  {/* Toggle Header */}
                  <button
                    onClick={() => setManagementExpanded(!managementExpanded)}
                    className="flex items-center gap-2 text-left hover:bg-[#f0f0f0] px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                      Management
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#3c6e71] transition-transform duration-300 ${
                        managementExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expandable Content */}
                  {managementExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2">
                        {/* Manage Participants */}
                        <Button
                          onClick={() => setManageParticipantsOpen(true)}
                          disabled={tournament.status === "completed" || tournament.drawGenerated}
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                        >
                          {isTeamTournament ? "Teams" : "Participants"}
                        </Button>

                        {/* Manage Doubles Pairs - Show only for doubles tournaments before draw generation */}
                        {tournament.category === "individual" &&
                          tournament.matchType === "doubles" && (
                            <Button
                              onClick={() => setManageDoublesPairsOpen(true)}
                              disabled={tournament.status === "completed" || tournament.drawGenerated}
                              variant="outline"
                              size="sm"
                              className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                            >
                              Pairs ({tournament.doublesPairs?.length ||
                                0} /{" "}
                              {Math.floor(tournament.participants.length / 2)}
                              )
                            </Button>
                          )}

                        {/* Manage Groups - Show only if tournament uses groups */}
                        {hasGroups() && (
                          <Button
                            onClick={() => setManageGroupsOpen(true)}
                            disabled={tournament.status === "completed" || tournament.drawGenerated || hasPlayedMatches}
                            variant="outline"
                            size="sm"
                            className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                          >
                            Groups
                          </Button>
                        )}

                        {/* Manage Scorers */}
                        <Button
                          onClick={() => setManageScorersOpen(true)}
                          disabled={tournament.status === "completed"}
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                        >
                          Scorers
                        </Button>

                        {/* Join Code */}
                        <Button
                          onClick={() => setJoinCodeDialogOpen(true)}
                          disabled={tournament.status === "completed" || tournament.drawGenerated}
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                        >
                          Join Code
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-2">
                  {/* Toggle Header */}
                  <button
                    onClick={() => setActionsExpanded(!actionsExpanded)}
                    className="flex items-center gap-2 text-left hover:bg-[#f0f0f0] px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                      Actions
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#3c6e71] transition-transform duration-300 ${
                        actionsExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expandable Content */}
                  {actionsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Generate Draw/Bracket */}
                        {canGenerateMatches && (
                          <Button
                            onClick={generateMatches}
                            disabled={generating || tournament.status === "completed" || tournament.drawGenerated}
                            size="sm"
                            className="bg-[#3c6e71] hover:bg-[#284b63] text-xs text-[#ffffff] disabled:opacity-50"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isCustomMatchingTournament
                                  ? "Generating Bracket..."
                                  : "Generating..."}
                              </>
                            ) : (
                              <>
                                {isCustomMatchingTournament
                                  ? "Generate Bracket"
                                  : "Generate Draw"}
                              </>
                            )}
                          </Button>
                        )}

                        {/* Configure Matchups - Show only for custom matching tournaments after bracket is generated */}
                        {isCustomMatchingTournament &&
                          tournament.drawGenerated && (
                            <Button
                              onClick={() =>
                                router.push(
                                  `/tournaments/${tournamentId}/custom-matching`
                                )
                              }
                              disabled={tournament.status === "completed"}
                              variant="outline"
                              size="sm"
                              className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                            >
                              Configure Matchups
                            </Button>
                          )}

                        {/* Manage Seeding */}
                        <Button
                          onClick={() => setSeedingManagerOpen(true)}
                          disabled={
                            tournament.status === "completed" ||
                            hasPlayedMatches ||
                            !tournament.drawGenerated
                          }
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] disabled:opacity-50"
                        >
                          Seeding
                        </Button>

                        {/* Reset Button - Disabled when tournament is completed or no draw generated */}
                        <Button
                          onClick={handleReset}
                          disabled={
                            resetting ||
                            tournament.status === "completed" ||
                            !tournament.drawGenerated
                          }
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#d9d9d9] hover:text-[#353535] disabled:opacity-50"
                        >
                          {resetting ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>Reset</>
                          )}
                        </Button>

                        {/* Cancel Button - Show if tournament is not cancelled/completed */}
                        {tournament.status !== "cancelled" &&
                          tournament.status !== "completed" && (
                            <Button
                              onClick={handleCancel}
                              disabled={cancelling}
                              variant="outline"
                              size="sm"
                              className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#d9d9d9] text-[#353535] hover:bg-[#d9d9d9] hover:text-[#353535] disabled:opacity-50"
                            >
                              {cancelling ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>Cancel</>
                              )}
                            </Button>
                          )}

                        {/* Generate Statistics Button - Show for completed knockout tournaments or hybrid with completed knockout phase */}
                        {isInKnockoutPhase &&
                          tournament.bracket?.completed && (
                            <Button
                              onClick={handleGenerateStatistics}
                              disabled={generatingStats}
                              variant="outline"
                              size="sm"
                              className="text-[10px] font-semibold px-2.5 py-1.5 border border-[#3c6e71] text-[#3c6e71] hover:bg-[#3c6e71] hover:text-[#ffffff] disabled:opacity-50"
                            >
                              {generatingStats ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : tournament.knockoutStatistics ? (
                                <>Regenerate Statistics</>
                              ) : (
                                <>Generate Statistics</>
                              )}
                            </Button>
                          )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="mx-auto">
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
            <TabsList className="flex flex-wrap w-full p-0 h-auto justify-start gap-1">
              {/* Info Tab */}
              <TabsTrigger
                value="info"
                className="
                  text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                  data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                  data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
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
                    text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                    data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                    data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
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
                    text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                    data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                    data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
                    transition-all
                  "
                >
                  Standings
                </TabsTrigger>
              )}

              {/* Schedule Tab - Show only for round-robin and hybrid formats */}
              {tournament.format !== "knockout" && (
                <TabsTrigger
                  value="schedule"
                  className="
                    text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                    data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                    data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
                    transition-all
                  "
                >
                  Schedule
                </TabsTrigger>
              )}

              <TabsTrigger
                value="participants"
                className="
                  text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                  data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                  data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
                  transition-all
                "
              >
                {isTeamTournament ? "Teams" : "Players"}
              </TabsTrigger>

              {/* Bracket Tab - Show for knockout tournaments and hybrid tournaments in knockout phase */}
              {isInKnockoutPhase && tournament.bracket && (
                <TabsTrigger
                  value="bracket"
                  className="
                    text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                    data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                    data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
                    transition-all
                  "
                >
                  Bracket
                </TabsTrigger>
              )}

              {/* Statistics Tab - Show for knockout tournaments with statistics */}
              {isInKnockoutPhase && tournament.knockoutStatistics && (
                <TabsTrigger
                  value="statistics"
                  className="
                      text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em]
                      data-[state=active]:bg-[#3c6e71] data-[state=active]:text-[#ffffff]
                      data-[state=inactive]:text-[#353535] data-[state=inactive]:hover:bg-[#3c6e71] data-[state=inactive]:hover:text-[#ffffff]
                      transition-all
                    "
                >
                  Statistics
                </TabsTrigger>
              )}
            </TabsList>

            {/* Groups Tab */}
            {hasGroups() && (
              <TabsContent value="groups" className="">
                <div className="border border-[#d9d9d9] bg-[#ffffff]">
                  {tournament.groups && tournament.groups.length > 0 ? (
                    <GroupsView
                      groups={tournament.groups}
                      advancePerGroup={tournament.advancePerGroup}
                      showDetailedStats={true}
                      category={tournament.category}
                      matchType={tournament.matchType}
                    />
                  ) : (
                    <div className="py-12 text-center text-[#353535]">
                      <p className="text-sm text-[#353535]">
                        No groups generated yet
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Standings Tab */}
            <TabsContent value="standings" className="">
              <div className="border border-[#d9d9d9] bg-[#ffffff] overflow-hidden">
                <div className="p-4 border-b border-[#d9d9d9]">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                    Tournament Standings
                  </h3>
                  <p className="text-xs text-[#3c6e71] mt-0.5">
                    View detailed statistics and match history
                  </p>
                </div>
                <div>
                  {tournament.standings && tournament.standings.length > 0 ? (
                    <EnhancedStandingsTable
                      standings={tournament.standings}
                      showDetailedStats={true}
                      highlightTop={3}
                      tournamentId={tournamentId}
                      category={tournament.category}
                      matchType={tournament.matchType}
                      isCompleted={tournament.status === "completed"}
                    />
                  ) : (
                    <div className="py-12 text-center text-[#353535]">
                      <p className="text-sm">No standings available yet</p>
                      <p className="text-xs mt-2 text-[#3c6e71]">
                        Generate matches to create standings
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Bracket Tab - For knockout tournaments and hybrid tournaments in knockout phase */}
            {/* IMPORTANT: Bracket tab ONLY shows knockout matches from bracket structure, never round-robin matches */}
            {isInKnockoutPhase && tournament.bracket && (
              <TabsContent value="bracket" className="">
                <div className="border border-[#d9d9d9] bg-[#ffffff] p-4">
                  <KnockoutBracketView
                    bracket={tournament.bracket}
                    participants={
                      tournament.format === "hybrid" &&
                      tournament.qualifiedParticipants
                        ? tournament.qualifiedParticipants
                        : tournament.participants
                    }
                    matches={knockoutMatches as any}
                    onMatchClick={(matchId) =>
                      router.push(
                        `/matches/${matchId}?category=${
                          isTeamTournament ? "team" : "individual"
                        }`
                      )
                    }
                    showThirdPlace={tournament.knockoutConfig?.thirdPlaceMatch}
                    category={tournament.category}
                    matchType={tournament.matchType}
                    doublesPairs={tournament.doublesPairs}
                  />
                </div>
              </TabsContent>
            )}

            {/* Schedule Tab - Shows match schedules only, NOT bracket visualization */}
            {/* Show only for round-robin and hybrid formats */}
            {tournament.format !== "knockout" && (
              <TabsContent value="schedule" className="">
                <div className="border border-[#d9d9d9] bg-[#ffffff] p-4">
                  {/* For hybrid tournaments in knockout phase, show round-robin schedules (historical) */}
                  {/* The bracket visualization is shown in the dedicated Bracket tab */}
                  {/* IMPORTANT: Schedule tab ONLY shows round-robin matches, never knockout matches */}
                  {roundsWithIds && roundsWithIds.length > 0 ? (
                    <TournamentSchedule
                      rounds={roundsWithIds as any}
                      matches={roundRobinMatches as any}
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
                    <div className="py-12 text-center text-[#353535]">
                      <p className="text-sm">Bracket structure created</p>
                      <p className="text-xs mt-2 text-[#3c6e71]">
                        Use the Actions section above to configure matchups and
                        create matches
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[#353535]">
                      <p className="text-sm">No schedule available yet</p>
                      <p className="text-xs mt-2 text-[#3c6e71]">
                        {isCustomMatchingTournament
                          ? "Generate bracket to get started"
                          : "Generate matches to create the schedule"}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Participants Tab */}
            <TabsContent value="participants" className="">
              <div className="border border-[#d9d9d9] bg-[#ffffff] overflow-hidden">
                <div className="p-4 border-b border-[#d9d9d9]">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
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
                        border border-[#d9d9d9]
                        bg-[#ffffff] 
                        hover:bg-[#3c6e71] hover:text-[#ffffff]
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
                                className="w-8 h-8 object-cover"
                              />
                            ) : (
                              <div
                                className="
                              w-8 h-8 bg-[#d9d9d9] text-[#353535]
                              flex items-center justify-center text-xs font-semibold 
                              border border-[#d9d9d9]
                            "
                              >
                                {displayName.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                          </div>

                          {/* Participant Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-[#353535] group-hover:text-[#ffffff] truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-[#3c6e71] group-hover:text-[#ffffff] truncate">
                              {subtext}
                            </p>
                          </div>

                          {/* Seed */}
                          {seed && (
                            <span className="text-[10px] font-medium text-[#353535]">
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
            <TabsContent value="info" className="">
              <div className="border border-[#d9d9d9] bg-[#ffffff] overflow-hidden">
                <div className="p-4 border-b border-[#d9d9d9]">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
                    Tournament Information
                  </h3>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DETAILS */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                        Details
                      </h4>

                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-[#d9d9d9]">
                          <dt className="text-[#3c6e71] text-xs">Format</dt>
                          <dd className="font-medium text-[#353535] capitalize text-xs">
                            {tournament.format?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-[#d9d9d9]">
                          <dt className="text-[#3c6e71] text-xs">Category</dt>
                          <dd className="font-medium text-[#353535] text-xs">
                            {tournament.category || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-[#d9d9d9]">
                          <dt className="text-[#3c6e71] text-xs">Match Type</dt>
                          <dd className="font-medium text-[#353535] text-xs">
                            {tournament.matchType?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <dt className="text-[#3c6e71] text-xs">Seeding</dt>
                          <dd className="font-medium text-[#353535] text-xs">
                            {tournament.seedingMethod || "none"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* RULES */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                        Rules
                      </h4>

                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-[#d9d9d9]">
                          <dt className="text-[#3c6e71] text-xs">
                            {tournament.category === "team"
                              ? "Sets per submatch"
                              : "Sets per match"}
                          </dt>
                          <dd className="font-medium text-[#353535] text-xs">
                            {tournament.category === "team"
                              ? (tournament as any).teamConfig
                                  ?.setsPerSubMatch || "N/A"
                              : tournament.rules?.setsPerMatch || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-[#d9d9d9]">
                          <dt className="text-[#3c6e71] text-xs">
                            Points per set
                          </dt>
                          <dd className="font-medium text-[#353535] text-xs">
                            {tournament.rules?.pointsPerSet || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <dt className="text-[#3c6e71] text-xs">Win / Loss</dt>
                          <dd className="font-medium text-[#353535] text-xs">
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
            {isInKnockoutPhase &&
              tournament.knockoutStatistics && (
                <TabsContent value="statistics" className="">
                  <div className="border border-[#d9d9d9] bg-[#ffffff] overflow-hidden">
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
            participants={
              // For doubles tournaments, use pairs instead of individual players
              tournament.matchType === "doubles" && tournament.doublesPairs && tournament.doublesPairs.length > 0
                ? tournament.doublesPairs.map((pair: any) => {
                    const player1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
                    const player2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
                    return {
                      _id: pair._id?.toString() || pair._id,
                      fullName: `${player1Name} / ${player2Name}`,
                      username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
                      profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
                      isPair: true,
                      player1: pair.player1,
                      player2: pair.player2,
                    } as Participant;
                  })
                : tournament.participants
            }
            onUpdate={handleGroupsUpdate}
            drawGenerated={tournament.drawGenerated}
            hasPlayedMatches={hasPlayedMatches}
            numberOfGroups={
              tournament.format === "hybrid"
                ? tournament.hybridConfig?.roundRobinNumberOfGroups
                : tournament.numberOfGroups
            }
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

        {/* Manage Doubles Pairs Dialog */}
        {tournament &&
          tournament.category === "individual" &&
          tournament.matchType === "doubles" && (
            <ManageDoublesPairsDialog
              open={manageDoublesPairsOpen}
              onOpenChange={setManageDoublesPairsOpen}
              tournamentId={tournament._id}
              participants={
                tournament.participants.filter(
                  (p: any) => typeof p === "object" && p !== null
                ) as any as Array<{ _id: string; username: string }>
              }
              existingPairs={tournament.doublesPairs || []}
              onUpdate={() => fetchTournament(true)}
              disabled={tournament.drawGenerated}
            />
          )}
      </div>
    </TournamentErrorBoundary>
  );
}
