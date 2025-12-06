"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Trophy, Calendar, MapPin, Loader2, Users2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Tournament } from "@/types/tournament.type";
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

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/PersonAdd";
import QrCodeIcon from "@mui/icons-material/QrCode";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [manageParticipantsOpen, setManageParticipantsOpen] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);

  const fetchTournament = async (skipLoadingState = false) => {
    if (!skipLoadingState) {
      setLoading(true);
    }
    try {
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
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
  };

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

  const isOrganizer = user && tournament.organizer._id === user._id;
  const canGenerateMatches =
    isOrganizer &&
    !tournament.drawGenerated &&
    tournament.status === "draft" &&
    tournament.participants.length >= 2;

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
      tournament.bracket.rounds.forEach((round: any) => {
        round.matches.forEach((bracketMatch: any) => {
          // After API population, matchId is now a full match object (not a string)
          if (bracketMatch.matchId && typeof bracketMatch.matchId === "object") {
            matches.push(bracketMatch.matchId);
          }
        });
      });

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
    if (hasGroups() && tournament.groups) {
      return tournament.groups.flatMap((g) =>
        g.rounds.flatMap((r) => r.matches)
      );
    }

    // For regular round-robin
    return tournament.rounds?.flatMap((r) => r.matches) || [];
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
    if (
      hasGroups() &&
      tournament.groups &&
      tournament.groups.length > 0
    ) {
      // Keep rounds separated by group for clear organization
      const roundsWithGroups: any[] = [];

      tournament.groups.forEach((group: any) => {
        group.rounds?.forEach((round: any) => {
          const matchIds =
            round.matches?.map((m: any) =>
              typeof m === "string" ? m : String(m._id)
            ) || [];

          roundsWithGroups.push({
            roundNumber: round.roundNumber,
            matches: matchIds,
            completed: round.completed,
            scheduledDate: round.scheduledDate,
            groupName: group.groupName, // Add group name to identify which group
            groupId: group.groupId,
          });
        });
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
    return (
      tournament.rounds?.map((round: any) => ({
        ...round,
        matches:
          round.matches?.map((m: any) =>
            typeof m === "string" ? m : String(m._id)
          ) || [],
      })) || []
    );
  };

  const roundsWithIds = getRoundsForSchedule();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-white p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left section */}
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight">
              {tournament.name}
            </h1>

            <p className="text-xs text-white/89">
              {tournament.format.replace("_", " ").toUpperCase()} •{" "}
              {tournament.matchType.replace("_", " ")}
            </p>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {isOrganizer && !tournament.drawGenerated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManageParticipantsOpen(true)}
                  className="
                  transition-all duration-150
                  active:scale-95 hover:scale-[1.03]
                "
                >
                  <PersonIcon className="size-4 text-blue-500" />
                  <span className="text-blue-500">Manage Players</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJoinCodeDialogOpen(true)}
                  className="
                  border-indigo-300 text-indigo-700 hover:bg-indigo-50
                  transition-all duration-150
                  active:scale-95 hover:scale-[1.03]
                "
                >
                  <QrCodeIcon className="size-4 text-indigo-500" />
                  <span className="text-indigo-500">Join Code</span>
                </Button>
              </>
            )}
            {isOrganizer && hasGroups() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (hasPlayedMatches) {
                    toast.error(
                      "Cannot modify groups after matches have been played. This would reset all match results and standings."
                    );
                  } else {
                    setManageGroupsOpen(true);
                  }
                }}
                disabled={hasPlayedMatches}
                className={`
                  transition-all duration-150
                  active:scale-95 hover:scale-[1.03]
                  ${hasPlayedMatches ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={
                  hasPlayedMatches
                    ? "Group management is locked because matches have been played"
                    : "Manage group assignments"
                }
              >
                <GroupsIcon className="size-4 text-blue-500" />
                <span className="text-blue-500">Manage Groups</span>
                {hasPlayedMatches && <span className="ml-1 text-xs">🔒</span>}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {tournament.status !== "draft" && totalMatches > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-white/89 mb-2">
              <span>Tournament Progress</span>
              <span>
                {completedMatches} / {totalMatches} matches
              </span>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(completedMatches / totalMatches) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-indigo-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-4">
          {/* Start Date */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">
                Start Date
              </p>
              <p className="text-[13px] font-semibold text-slate-700">
                {formatDateShort(tournament.startDate)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Location</p>
              <p className="text-[13px] font-semibold text-slate-700">
                {tournament.city}
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">
                Participants
              </p>
              <p className="text-[13px] font-semibold text-slate-700">
                {tournament.participants.length}
                {hasGroups() &&
                  ` (${tournament.format === "hybrid" 
                    ? tournament.hybridConfig?.roundRobinNumberOfGroups 
                    : tournament.numberOfGroups} groups)`}
              </p>
            </div>
          </div>
        </div>

        {/* Generate Matches CTA */}
        {canGenerateMatches && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-blue-200 rounded-none bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">
                      Ready to Start?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Generate the tournament draw to create all matches
                      {hasGroups() && " and assign groups"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Button
                      onClick={generateMatches}
                      disabled={generating}
                      size="lg"
                      className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>Generate Draw</>
                      )}
                    </Button>
                  </div>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Card className="border-2 border-purple-200 rounded-none bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        Custom Matching
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manually configure matchups for knockout rounds
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <Button
                        onClick={() => router.push(`/tournaments/${tournamentId}/custom-matching`)}
                        size="lg"
                        className="shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        Configure Matchups
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        {/* Hybrid Tournament Manager */}
        {tournament.format === "hybrid" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
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
          <TabsList className="grid w-full max-w-3xl p-0 rounded-none mx-auto shadow-sm grid-cols-4">
            {/* Groups Tab - Show for tournaments with groups */}
            {hasGroups() && (
              <TabsTrigger
                value="groups"
                className="
                  rounded-none text-xs font-medium
                  data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                  data-[state=inactive]:text-slate-600
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
                className=" rounded-none text-xs font-medium
                  data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                  data-[state=inactive]:text-slate-600
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
                rounded-none text-xs font-medium
                data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                data-[state=inactive]:text-slate-600
                transition-all
              "
            >
              Schedule
            </TabsTrigger>

            <TabsTrigger
              value="participants"
              className="
                rounded-none text-xs font-medium
                data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                data-[state=inactive]:text-slate-600
                transition-all
              "
            >
              Players
            </TabsTrigger>

            <TabsTrigger
              value="info"
              className="
                rounded-none text-xs font-medium
                data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                data-[state=inactive]:text-slate-600
                transition-all
                "
            >
              Info
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          {hasGroups() && (
            <TabsContent value="groups" className="mt-6">
              {tournament.groups && tournament.groups.length > 0 ? (
                <GroupsView
                  groups={tournament.groups}
                  advancePerGroup={tournament.advancePerGroup}
                  showDetailedStats={true}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No groups generated yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Standings Tab */}
          <TabsContent value="standings" className="">
            <div className="flex items-center gap-2 p-4 bg-slate-50 border-b border-slate-200">
              <EmojiEventsIcon className="size-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Tournament Standings</p>
                <p className="text-xs text-slate-500">
                  View detailed statistics and match history
                </p>
              </div>
            </div>
            {tournament.standings && tournament.standings.length > 0 ? (
              <EnhancedStandingsTable
                standings={tournament.standings}
                showDetailedStats={true}
                highlightTop={3}
                tournamentId={tournamentId}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No standings available yet</p>
                  <p className="text-sm mt-2">
                    Generate matches to create standings
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="p-4">
            {tournament.format === "knockout" && tournament.bracket ? (
              <KnockoutBracketView
                bracket={tournament.bracket}
                participants={tournament.participants}
                matches={allMatchObjects as any}
                onMatchClick={(matchId) => router.push(`/matches/${matchId}`)}
                showThirdPlace={tournament.knockoutConfig?.thirdPlaceMatch}
              />
            ) : roundsWithIds && roundsWithIds.length > 0 ? (
              <TournamentSchedule
                rounds={roundsWithIds as any}
                matches={allMatchObjects as any}
                onMatchClick={(id) => router.push(`/matches/${id}`)}
                showDate={false}
                showTime={false}
                venue={tournament.venue}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No schedule available yet</p>
                  <p className="text-sm mt-2">
                    Generate matches to create the schedule
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="p-4">
            <section className="bg-white/40 p-4">
              <header className="mb-3">
                <h2 className="text-sm font-semibold text-slate-800 tracking-wide">
                  Tournament Participants
                </h2>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {tournament.participants.map((p) => {
                  const seed = tournament.seeding?.find(
                    (s) => s.participant._id === p._id
                  );

                  return (
                    <Link
                      key={p._id}
                      href={`/profile/${p._id}`}
                      className="
            flex items-center gap-3 p-2
            rounded-lg border border-slate-200
            bg-slate-50/50 
            hover:bg-slate-100 
            transition-all duration-200
            group
          "
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {p?.profileImage ? (
                          <img
                            src={p.profileImage}
                            alt={p.fullName || p.username || "Player"}
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
                            {(
                              p?.fullName?.[0] ||
                              p?.username?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-slate-900 truncate">
                          {p?.fullName || p?.username || "Unknown Player"}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          @{p?.username || "unknown"}
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
            </section>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="p-4">
            <Card className="">
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
                          {tournament.format.replace("_", " ")}
                        </dd>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/5">
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="font-medium text-neutral-700">
                          {tournament.category}
                        </dd>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/5">
                        <dt className="text-muted-foreground">Match Type</dt>
                        <dd className="font-medium text-neutral-700">
                          {tournament.matchType.replace("_", " ")}
                        </dd>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <dt className="text-muted-foreground">Seeding</dt>
                        <dd className="font-medium text-neutral-700">
                          {tournament.seedingMethod}
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
                          Best of {tournament.rules.setsPerMatch}
                        </dd>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/5">
                        <dt className="text-muted-foreground">
                          Points per set
                        </dt>
                        <dd className="font-medium text-neutral-700">
                          {tournament.rules.pointsPerSet}
                        </dd>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-black/5">
                        <dt className="text-muted-foreground">Win / Loss</dt>
                        <dd className="font-medium text-neutral-700">
                          {tournament.rules.pointsForWin}/
                          {tournament.rules.pointsForLoss}
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

    </div>
  );
}
