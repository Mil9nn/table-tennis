"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  Trophy,
  Calendar,
  MapPin,
  Loader2,
  RefreshCw,
  Settings,
  Users2,
  QrCode,
  UserPlus,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Tournament } from "@/types/tournament.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { motion } from "framer-motion";
import { EnhancedStandingsTable } from "@/components/tournaments/EnhancedStandingsTable";
import { GroupsView } from "@/components/tournaments/GroupsView";
import TournamentSchedule from "@/components/tournaments/TournamentSchedule";
import KnockoutBracket from "@/components/tournaments/KnockoutBracket";
import TournamentLeaderboard from "@/components/tournaments/TournamentLeaderboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoinCodeDialog } from "@/components/tournaments/JoinCodeDialog";
import { ManageParticipantsDialog } from "@/components/tournaments/ManageParticipantsDialog";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingKnockout, setGeneratingKnockout] = useState(false);
  const [joinCodeDialogOpen, setJoinCodeDialogOpen] = useState(false);
  const [manageParticipantsOpen, setManageParticipantsOpen] = useState(false);
  const [knockoutStatus, setKnockoutStatus] = useState<{
    canGenerateKnockout: boolean;
    roundRobinComplete: boolean;
    qualifiedCount: number;
  } | null>(null);

  const fetchTournament = async () => {
    try {
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      setTournament(data.tournament);

      // Check knockout status for round robin tournaments (they are multi-stage)
      if (
        data.tournament.isMultiStage ||
        data.tournament.format === "multi_stage" ||
        data.tournament.format === "round_robin"
      ) {
        fetchKnockoutStatus();
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
      toast.error("Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  const fetchKnockoutStatus = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/tournaments/${tournamentId}/generate-knockout`
      );
      setKnockoutStatus(data);
    } catch (err) {
      console.error("Error fetching knockout status:", err);
    }
  };

  useEffect(() => {
    fetchTournament();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTournament, 30000);
    return () => clearInterval(interval);
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


  const generateKnockout = async () => {
    setGeneratingKnockout(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/generate-knockout`
      );
      setTournament(data.tournament);
      setKnockoutStatus(null); // Reset status as knockout is now generated
      toast.success(
        `Knockout bracket generated! ${data.knockoutStats.qualifiedParticipants} players qualified.`
      );
    } catch (err: any) {
      console.error("Error generating knockout:", err);
      toast.error(
        err.response?.data?.error || "Failed to generate knockout bracket"
      );
    } finally {
      setGeneratingKnockout(false);
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

  // Calculate progress and extract matches
  const getAllMatches = () => {
    if (tournament.useGroups && tournament.groups) {
      return tournament.groups.flatMap((g) =>
        g.rounds.flatMap((r) => r.matches)
      );
    }
    return tournament.rounds?.flatMap((r) => r.matches) || [];
  };

  const allMatchObjects = getAllMatches();

  // For knockout tournaments, calculate total matches from bracket structure
  // since future rounds may not have match documents created yet
  const getTotalMatchCount = () => {
    if (tournament.format === "knockout" && tournament.bracket) {
      // Count all matches in the bracket structure, excluding bye-only matches
      return tournament.bracket.rounds.reduce((sum, round) => {
        return (
          sum +
          round.matches.filter((match: any) => {
            // Exclude matches where both participants are byes
            const p1IsBye = match.participant1?.type === "bye";
            const p2IsBye = match.participant2?.type === "bye";
            return !(p1IsBye && p2IsBye);
          }).length
        );
      }, 0);
    }
    // For other formats, use the actual match documents count
    return allMatchObjects.length;
  };

  const totalMatches = getTotalMatchCount();
  const completedMatches = allMatchObjects.filter(
    (m: any) => m?.status === "completed"
  ).length;

  // Transform rounds to have match IDs instead of full objects for TournamentSchedule
  // For group tournaments, extract rounds from groups and combine them
  const getRoundsForSchedule = () => {
    if (
      tournament.useGroups &&
      tournament.groups &&
      tournament.groups.length > 0
    ) {
      // Combine rounds from all groups, prefixing with group name for clarity
      const combinedRounds: any[] = [];

      tournament.groups.forEach((group: any) => {
        group.rounds?.forEach((round: any) => {
          // Find if we already have this round number
          const existingRound = combinedRounds.find(
            (r) => r.roundNumber === round.roundNumber
          );

          const matchIds =
            round.matches?.map((m: any) =>
              typeof m === "string" ? m : String(m._id)
            ) || [];

          if (existingRound) {
            // Add matches to existing round
            existingRound.matches.push(...matchIds);
          } else {
            // Create new round entry
            combinedRounds.push({
              roundNumber: round.roundNumber,
              matches: matchIds,
              completed: round.completed,
              scheduledDate: round.scheduledDate,
            });
          }
        });
      });

      // Sort by round number
      return combinedRounds.sort((a, b) => a.roundNumber - b.roundNumber);
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
          <div className="flex items-center gap-2">
            {isOrganizer && !tournament.drawGenerated && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManageParticipantsOpen(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <UserPlus className="size-4" />
                  <span className="ml-1 hidden sm:inline">Manage Players</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJoinCodeDialogOpen(true)}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <QrCode className="size-4" />
                  <span className="ml-1 hidden sm:inline">Join Code</span>
                </Button>
              </>
            )}

            {isOrganizer && !tournament.drawGenerated && tournament.format === "knockout" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/tournaments/${tournamentId}/custom-matching`)
                }
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Swords className="size-4" />
                <span className="ml-1 hidden sm:inline">Custom Matches</span>
              </Button>
            )}

            {isOrganizer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/tournaments/${tournamentId}/seeding`)
                }
                className="border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                <Settings className="size-4" />
                <span className="ml-1 hidden sm:inline">Settings</span>
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
                {formatDate(tournament.startDate)}
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
                {tournament.useGroups &&
                  ` (${tournament.numberOfGroups} groups)`}
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
                      {tournament.useGroups && " and assign groups"}
                    </p>
                  </div>
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
                      <>Generate</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Generate Knockout CTA (Round Robin Tournaments) */}
        {isOrganizer &&
          (tournament.isMultiStage ||
            tournament.format === "multi_stage" ||
            tournament.format === "round_robin") &&
          knockoutStatus?.canGenerateKnockout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-4"
            >
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        Round Robin Complete!
                      </h3>
                      <p className="text-sm text-gray-600">
                        All group stage matches are done. Generate the knockout
                        bracket to start the elimination rounds.
                      </p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        {knockoutStatus.qualifiedCount} players qualified for
                        knockout stage
                      </p>
                    </div>
                    <Button
                      onClick={generateKnockout}
                      disabled={generatingKnockout}
                      size="lg"
                      className="shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {generatingKnockout ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Knockout...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5 mr-2" />
                          Generate Knockout
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        {/* Round Robin Progress (Not Yet Complete) */}
        {isOrganizer &&
          (tournament.isMultiStage ||
            tournament.format === "multi_stage" ||
            tournament.format === "round_robin") &&
          knockoutStatus &&
          !knockoutStatus.canGenerateKnockout &&
          !knockoutStatus.roundRobinComplete &&
          !tournament.bracket?.rounds?.length && (
            <div className="">
              <Card className="border-none rounded-none mb-4 bg-amber-50">
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Round Robin in Progress
                      </p>
                      <p className="text-xs text-amber-600">
                        Complete all group stage matches to advance to knockout
                        bracket generation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        {/* Main Tabs */}
        <Tabs
          defaultValue={
            tournament.format === "knockout"
              ? "bracket"
              : (tournament.format === "multi_stage" ||
                  tournament.format === "round_robin") &&
                tournament.bracket?.rounds?.length
              ? "bracket"
              : tournament.useGroups
              ? "groups"
              : "standings"
          }
          className="w-full"
        >
          <TabsList
            className={`grid w-full max-w-3xl p-0 rounded-none mx-auto shadow-sm ${
              tournament.format === "knockout"
                ? "grid-cols-4"
                : (tournament.format === "multi_stage" ||
                    tournament.format === "round_robin") &&
                  tournament.bracket?.rounds?.length
                ? "grid-cols-6"
                : "grid-cols-5"
            }`}
          >
            {/* Bracket Tab - Show for knockout OR round_robin with bracket generated */}
            {(tournament.format === "knockout" ||
              ((tournament.format === "multi_stage" ||
                tournament.format === "round_robin") &&
                !!tournament.bracket?.rounds?.length)) && (
              <TabsTrigger
                value="bracket"
                className="text-xs rounded-none font-medium
                data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                data-[state=inactive]:text-slate-600
                transition-all
              "
              >
                Bracket
              </TabsTrigger>
            )}

            {/* Groups Tab - Show for tournaments with groups (round_robin or multi_stage) */}
            {tournament.format !== "knockout" && tournament.useGroups && (
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

            {/* Standings Tab - Show for non-knockout formats without groups */}
            {tournament.format !== "knockout" && !tournament.useGroups && (
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

            {/* Schedule Tab - Hide for knockout tournaments */}
            {tournament.format !== "knockout" && (
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
            )}

            <TabsTrigger
              value="leaderboard"
              className="
                rounded-none text-xs font-medium
                data-[state=active]:bg-indigo-500 data-[state=active]:text-white
                data-[state=inactive]:text-slate-600
                transition-all
              "
            >
              Leaderboard
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
          {/* Bracket Tab (Knockout and Round Robin Tournaments) */}
          {(tournament.format === "knockout" ||
            ((tournament.format === "multi_stage" ||
              tournament.format === "round_robin") &&
              !!tournament.bracket?.rounds?.length)) && (
            <TabsContent value="bracket">
              {tournament.bracket && tournament.bracket.rounds.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      {tournament.format === "multi_stage" ||
                      tournament.format === "round_robin"
                        ? "Knockout Stage"
                        : "Tournament Bracket"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KnockoutBracket
                      bracket={tournament.bracket}
                      participants={tournament.participants}
                      onMatchClick={(matchId) =>
                        router.push(`/matches/${matchId}`)
                      }
                      tournamentId={tournamentId}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No bracket generated yet</p>
                    <p className="text-sm mt-2">
                      {tournament.format === "multi_stage" ||
                      tournament.format === "round_robin"
                        ? "Complete round robin matches to generate knockout bracket"
                        : "Generate matches to create the knockout bracket"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Groups Tab */}
          {tournament.useGroups && (
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
          <TabsContent value="standings" className="p-4">
            {tournament.standings && tournament.standings.length > 0 ? (
              <EnhancedStandingsTable
                standings={tournament.standings}
                showDetailedStats={true}
                highlightTop={3}
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
          {/* Schedule Tab Content - Hide for knockout tournaments */}
          {tournament.format !== "knockout" && (
            <TabsContent value="schedule" className="p-4">
              {roundsWithIds && roundsWithIds.length > 0 ? (
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
          )}

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="">
            {tournament.standings && tournament.standings.length > 0 ? (
              <TournamentLeaderboard tournamentId={tournamentId} />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No leaderboard data available yet</p>
                <p className="text-sm mt-2">
                  Complete matches and update standings to view the leaderboard
                </p>
              </div>
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
                        <dt className="text-muted-foreground">
                          Win / Loss
                        </dt>
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
    </div>
  );
}
