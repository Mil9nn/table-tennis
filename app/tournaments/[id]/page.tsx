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
  X,
  MoreVertical,
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
import KnockoutBracketView from "@/components/tournaments/KnockoutBracketView";
import { HybridTournamentManager } from "@/components/tournaments/HybridTournamentManager";
import { TournamentErrorBoundary } from "@/components/tournaments/TournamentErrorBoundary";
import { SeedingManager } from "@/components/tournaments/SeedingManager";

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
      setTournament(data.tournament);
      toast.success(
        `Tournament draw generated! ${data.stats.totalMatches} matches created.`
      );
    } catch (err: any) {
      console.error("Error generating matches:", err);
      toast.error(err.response?.data?.error || "Failed to generate matches");
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

  const handleGroupsUpdate = async (groups: any[]) => {
    // If matches were already generated, groups update will regenerate matches
    // So we need to fetch the full tournament data to get the updated matches
    if (tournament?.drawGenerated) {
      // Fetch full tournament data to get regenerated matches
      await fetchTournament(true); // Skip loading state to avoid flash
    } else {
      // Just update groups in state if matches haven't been generated yet
      setTournament((prev) =>
        prev
          ? {
              ...prev,
              groups,
            }
          : null
      );
    }
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
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="h-8 bg-white/20 rounded animate-pulse mb-4 w-1/3" />
          <div className="h-4 bg-white/20 rounded animate-pulse w-1/2" />
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-slate-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p>Tournament not found</p>
      </div>
    );
  }

  const isOrganizer = user && tournament.organizer?._id === user._id;
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
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <TournamentErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        {/* Modern Header */}
        <div className="bg-blue-200 border-b border-slate-400">
          <div className="max-w-7xl mx-auto">
            <div className="">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 p-2 px-4">
                <div className="flex-1">
                  {/* Title + Status */}
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                      {tournament.name}
                    </h1>

                    <Badge
                      variant="outline"
                      className={`${getStatusColor(
                        tournament.status
                      )} text-xs font-semibold px-2 rounded-full border-slate-400`}
                    >
                      {tournament.status?.replace("_", " ").toUpperCase() ||
                        "DRAFT"}
                    </Badge>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-black/80">
                    <span className="font-medium">
                      {tournament.format?.replace("_", " ").toUpperCase() ||
                        "N/A"}
                    </span>

                    <span>•</span>

                    <span>
                      {tournament.matchType?.replace("_", " ") || "N/A"}
                    </span>

                    {tournament.venue && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {tournament.venue}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                {isOrganizer && (
                  <div className="flex items-center gap-2">
                    {/* Primary Action */}
                    {canGenerateMatches && (
                      <Button
                        onClick={generateMatches}
                        disabled={generating}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4  animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 " />
                            Generate Draw
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
                          className="border-slate-300"
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
                              <PersonIcon className="w-4 h-4 " />
                              Manage {isTeamTournament ? "Teams" : "Players"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSeedingManagerOpen(true)}
                            >
                              <EmojiEventsIcon className="w-4 h-4 " />
                              Manage Seeding
                            </DropdownMenuItem>
                            {hasGroups() && (
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
                                <GroupsIcon className="w-4 h-4 " />
                                Manage Groups
                                {hasPlayedMatches && (
                                  <span className="ml-auto text-xs">🔒</span>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setJoinCodeDialogOpen(true)}
                            >
                              <QrCodeIcon className="w-4 h-4 " />
                              Join Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
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
                                <RestartAltIcon className="w-4 h-4 " />
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
                              <CancelIcon className="w-4 h-4 " />
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

              {/* Stats Row - Compact */}
              <div className="bg-white p-2 px-4 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500">
                    {tournament.startDate
                      ? formatDateShort(tournament.startDate)
                      : "N/A"}
                  </p>
                </div>
                <span className="text-slate-500">•</span>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-500">
                    {tournament.city || "N/A"}
                  </p>
                </div>
                <span className="text-slate-500">•</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users2 className="size-3 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">
                      Participants:
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {tournament.participants?.length || 0}
                    {hasGroups() && (
                      <span className="text-xs text-slate-500">
                        (
                        {tournament.format === "hybrid"
                          ? tournament.hybridConfig?.roundRobinNumberOfGroups ||
                            0
                          : tournament.numberOfGroups || 0}{" "}
                        groups)
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-slate-500">•</span>
                {tournament.status !== "draft" && totalMatches > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">
                        Progress:
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-blue-500">
                      {completedMatches} / {totalMatches}
                    </p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(completedMatches / totalMatches) * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          {/* Generate Matches CTA - Compact */}
          {canGenerateMatches && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardContent className="">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Ready to Start?
                      </h3>
                      <p className="text-sm text-slate-600">
                        Generate the tournament draw to create all matches
                        {hasGroups() && " and assign groups"}
                      </p>
                    </div>
                    <Button
                      onClick={generateMatches}
                      disabled={generating}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4  animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 " />
                          Generate Draw
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Custom Matching Button for Knockout */}
          {isOrganizer &&
            tournament.format === "knockout" &&
            tournament.knockoutConfig?.allowCustomMatching === true &&
            tournament.drawGenerated === true && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          Custom Matching
                        </h3>
                        <p className="text-sm text-slate-600">
                          Manually configure matchups for knockout rounds
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          router.push(
                            `/tournaments/${tournamentId}/custom-matching`
                          )
                        }
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        Configure Matchups
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
          <Tabs
            defaultValue={hasGroups() ? "groups" : "standings"}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-3xl p-1 bg-slate-100 rounded-lg grid-cols-4 h-auto">
              {/* Groups Tab - Show for tournaments with groups */}
              {hasGroups() && (
                <TabsTrigger
                  value="groups"
                  className="
                    rounded-md text-sm font-medium px-4 py-2
                    data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
                    data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                    transition-all
                  "
                >
                  Groups
                </TabsTrigger>
              )}

              {/* Standings Tab - Show for tournaments without groups */}
              {!hasGroups() && (
                <TabsTrigger
                  value="standings"
                  className="
                    rounded-md text-sm font-medium px-4 py-2
                    data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
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
                  rounded-md text-sm font-medium px-4 py-2
                  data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                Schedule
              </TabsTrigger>

              <TabsTrigger
                value="participants"
                className="
                  rounded-md text-sm font-medium px-4 py-2
                  data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                {isTeamTournament ? "Teams" : "Players"}
              </TabsTrigger>

              <TabsTrigger
                value="info"
                className="
                  rounded-md text-sm font-medium px-4 py-2
                  data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm
                  data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900
                  transition-all
                "
              >
                Info
              </TabsTrigger>
            </TabsList>

            {/* Groups Tab */}
            {hasGroups() && (
              <TabsContent value="groups" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    {tournament.groups && tournament.groups.length > 0 ? (
                      <GroupsView
                        groups={tournament.groups}
                        advancePerGroup={tournament.advancePerGroup}
                        showDetailedStats={true}
                        category={tournament.category}
                      />
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No groups generated yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Standings Tab */}
            <TabsContent value="standings" className="">
              <Card className="rounded-none p-0">
                <CardHeader className="flex items-center gap-2">
                  <EmojiEventsIcon className="size-5 text-slate-600" />
                  <div>
                    <CardTitle className="text-base">
                      Tournament Standings
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View detailed statistics and match history
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {tournament.standings && tournament.standings.length > 0 ? (
                    <EnhancedStandingsTable
                      standings={tournament.standings}
                      showDetailedStats={true}
                      highlightTop={3}
                      tournamentId={tournamentId}
                      category={tournament.category}
                    />
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No standings available yet</p>
                      <p className="text-sm mt-2">
                        Generate matches to create standings
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="p-0">
              <Card className="rounded-none p-0">
                <CardContent className="p-4">
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
                    />
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No schedule available yet</p>
                      <p className="text-sm mt-2">
                        Generate matches to create the schedule
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="mt-0">
              <Card className="rounded-none p-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isTeamTournament
                      ? "Tournament Teams"
                      : "Tournament Participants"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                          <div className="flex-shrink-0">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-0">
              <Card className="rounded-none p-0">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-neutral-800">
                    Tournament Information
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DETAILS */}
                    <div>
                      <h3 className="font-medium text-sm text-neutral-700 mb-2 tracking-wide">
                        Details
                      </h3>

                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">Format</dt>
                          <dd className="font-medium text-neutral-700 capitalize">
                            {tournament.format?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">Category</dt>
                          <dd className="font-medium text-neutral-700">
                            {tournament.category || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">Match Type</dt>
                          <dd className="font-medium text-neutral-700">
                            {tournament.matchType?.replace("_", " ") || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <dt className="text-muted-foreground">Seeding</dt>
                          <dd className="font-medium text-neutral-700">
                            {tournament.seedingMethod || "none"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* RULES */}
                    <div>
                      <h3 className="font-medium text-sm text-neutral-700 mb-2 tracking-wide">
                        Rules
                      </h3>

                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">
                            Sets per match
                          </dt>
                          <dd className="font-medium text-neutral-700">
                            Best of {tournament.rules?.setsPerMatch || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">
                            Points per set
                          </dt>
                          <dd className="font-medium text-neutral-700">
                            {tournament.rules?.pointsPerSet || "N/A"}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-black/5">
                          <dt className="text-muted-foreground">Win / Loss</dt>
                          <dd className="font-medium text-neutral-700">
                            {tournament.rules?.pointsForWin || 0}/
                            {tournament.rules?.pointsForLoss || 0}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
      </div>
    </TournamentErrorBoundary>
  );
}
