"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Award,
  Play,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Tournament } from "@/types/tournament.type";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingStandings, setUpdatingStandings] = useState(false);

  const fetchTournament = async () => {
    try {
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      setTournament(data.tournament);
    } catch (err) {
      console.error("Error fetching tournament:", err);
      toast.error("Failed to load tournament");
    } finally {
      setLoading(false);
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
      toast.success("Matches generated successfully!");
    } catch (err: any) {
      console.error("Error generating matches:", err);
      toast.error(err.response?.data?.error || "Failed to generate matches");
    } finally {
      setGenerating(false);
    }
  };

  const updateStandings = async () => {
    setUpdatingStandings(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/update-standings`
      );
      setTournament((prev) =>
        prev ? { ...prev, standings: data.standings } : null
      );
      toast.success("Standings updated!");
    } catch (err) {
      console.error("Error updating standings:", err);
      toast.error("Failed to update standings");
    } finally {
      setUpdatingStandings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
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
    tournament.status === "draft" &&
    tournament.participants.length >= 2;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <p className="text-sm text-gray-600">
                {tournament.format.replace("_", " ").toUpperCase()} •{" "}
                {tournament.matchType.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              tournament.status === "completed"
                ? "default"
                : tournament.status === "in_progress"
                ? "destructive"
                : "secondary"
            }
          >
            {tournament.status.replace("_", " ").toUpperCase()}
          </Badge>

          {isOrganizer && tournament.status !== "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={updateStandings}
              disabled={updatingStandings}
            >
              {updatingStandings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Update Standings
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-semibold">
                  {formatDate(tournament.startDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold">{tournament.city}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Participants</p>
                <p className="font-semibold">{tournament.participants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-500">Prize Pool</p>
                <p className="font-semibold">
                  {tournament.prizePool || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Matches Button */}
      {canGenerateMatches && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Ready to Start?</h3>
                <p className="text-sm text-gray-600">
                  Generate matches for all participants to begin the tournament
                </p>
              </div>
              <Button
                onClick={generateMatches}
                disabled={generating}
                size="lg"
                className="shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Matches
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Standings</CardTitle>
            </CardHeader>
            <CardContent>
              {tournament.standings?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">SW</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-center">SD</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tournament.standings.map((standing, idx) => {
                        const setDiff = standing.setsWon - standing.setsLost;
                        return (
                          <TableRow key={standing.participant._id}>
                            <TableCell className="font-bold">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  idx === 0
                                    ? "bg-yellow-400 text-yellow-900"
                                    : idx === 1
                                    ? "bg-gray-300 text-gray-800"
                                    : idx === 2
                                    ? "bg-orange-400 text-orange-900"
                                    : "bg-gray-100"
                                }`}
                              >
                                {standing.rank}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/profile/${standing.participant._id}`}
                                className="font-medium hover:underline"
                              >
                                {standing.participant.fullName ||
                                  standing.participant.username}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              {standing.played}
                            </TableCell>
                            <TableCell className="text-center text-green-600 font-semibold">
                              {standing.won}
                            </TableCell>
                            <TableCell className="text-center text-red-600 font-semibold">
                              {standing.lost}
                            </TableCell>
                            <TableCell className="text-center">
                              {standing.setsWon}
                            </TableCell>
                            <TableCell className="text-center">
                              {standing.setsLost}
                            </TableCell>
                            <TableCell
                              className={`text-center font-semibold ${
                                setDiff > 0
                                  ? "text-green-600"
                                  : setDiff < 0
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {setDiff > 0 ? "+" : ""}
                              {setDiff}
                            </TableCell>
                            <TableCell className="text-center font-bold text-lg">
                              {standing.points}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No standings available yet. Generate matches to begin the
                  tournament.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6 space-y-4">
          {tournament.rounds?.length > 0 ? (
            tournament.rounds.map((round) => (
              <Card key={round.roundNumber}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Round {round.roundNumber}</CardTitle>
                    <Badge variant={round.completed ? "default" : "secondary"}>
                      {round.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {round.matches.map((matchId, idx) => (
                      <Link
                        key={matchId.toString()}
                        href={`/matches/${matchId}?category=individual`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                      >
                        <span className="font-medium">Match {idx + 1}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No matches scheduled yet. Generate matches to begin the
                tournament.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants ({tournament.participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournament.participants.map((p) => (
                  <Link
                    key={p._id}
                    href={`/profile/${p._id}`}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    {p.profileImage ? (
                      <img
                        src={p.profileImage}
                        alt={p.fullName || p.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {(p.fullName || p.username)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{p.fullName || p.username}</p>
                      <p className="text-xs text-gray-500">@{p.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}