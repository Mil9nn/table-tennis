"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Users,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeftCircle,
  Eye,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id;
  const categoryParam = searchParams.get('category'); // Get category from URL
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    try {
      fetchUser();
      const user = useAuthStore.getState().user;
      setCurrentUserId(user?._id || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      setCurrentUserId(null);
    }
  }, []);

  const fetchMatch = async () => {
    try {
      // If category is provided in URL, use that endpoint directly
      if (categoryParam === 'individual' || categoryParam === 'team') {
        const endpoint = categoryParam === 'team' 
          ? `/matches/team/${matchId}`
          : `/matches/individual/${matchId}`;
        
        const response = await axiosInstance.get(endpoint);
        if (response.status === 200) {
          setMatch({ ...response.data.match, matchCategory: categoryParam });
          setLoading(false);
          return;
        }
      }
      
      // Fallback: try both endpoints if no category provided
      try {
        const response = await axiosInstance.get(`/matches/individual/${matchId}`);
        if (response.status === 200) {
          setMatch({ ...response.data.match, matchCategory: "individual" });
          setLoading(false);
          return;
        }
      } catch (individualError: any) {
        if (individualError.response?.status === 404) {
          const response = await axiosInstance.get(`/matches/team/${matchId}`);
          if (response.status === 200) {
            setMatch({ ...response.data.match, matchCategory: "team" });
            setLoading(false);
            return;
          }
        } else {
          throw individualError;
        }
      }
      
      setMatch(null);
    } catch (error) {
      console.error("Error fetching match:", error);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId, categoryParam]);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-5 text-blue-600" />
        <span className="text-sm font-medium">Loading match...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-12 text-center text-lg font-semibold">
        Match not found
      </div>
    );
  }

  const side1Name =
    match.matchCategory === "individual"
      ? match.participants?.[0]?.fullName ||
        match.participants?.[0]?.username ||
        "Player 1"
      : match.team1?.name || "Team 1";

  const side2Name =
    match.matchCategory === "individual"
      ? match.participants?.[1]?.fullName ||
        match.participants?.[1]?.username ||
        "Player 2"
      : match.team2?.name || "Team 2";

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/matches"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          <span className="font-semibold">Go back</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Match Details</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Match Info + Players */}
        <div className="space-y-6">
          {/* Match Info */}
          <div className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Match Information</h2>
              <Badge
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  match.status === "completed"
                    ? "text-green-600 border border-green-600 bg-green-50"
                    : "bg-blue-500 text-white"
                }`}
              >
                {match.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(match.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{match.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="capitalize">{match.matchType}</span>
              </div>
              <div>
                <span>Best of {match.numberOfSets || match.setsPerTie}</span>
              </div>
            </div>
          </div>

          {/* Players / Teams */}
          <div className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <h2 className="text-lg font-semibold mb-4">
              {match.matchCategory === "individual" ? "Players" : "Teams"}
            </h2>

            {match.matchCategory === "individual" ? (
              <div className="grid grid-cols-2 gap-6">
                {match.participants?.slice(0, 2).map((p: any, i: number) => (
                  <p key={i} className="font-medium text-gray-800">
                    {p.fullName || p.username || "Unknown"}
                  </p>
                ))}
                {match.participants?.slice(2, 4).map((p: any, i: number) => (
                  <p key={i} className="font-medium text-gray-800">
                    {p.fullName || p.username || "Unknown"}
                  </p>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{side1Name}</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {match.team1?.players?.map((player: any, index: number) => (
                      <li key={index}>
                        {player.user?.fullName ||
                          player.user?.username ||
                          "Unnamed"}
                        {player.role ? ` (${player.role})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{side2Name}</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {match.team2?.players?.map((player: any, index: number) => (
                      <li key={index}>
                        {player.user?.fullName ||
                          player.user?.username ||
                          "Unnamed"}
                        {player.role ? ` (${player.role})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Games */}
          {match.games?.length > 0 && (
            <div className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <h2 className="text-lg font-semibold mb-4">Games</h2>
              <div className="divide-y divide-gray-100">
                {match.games.map((g: any) => (
                  <div
                    key={g.gameNumber}
                    className="flex justify-between py-2 text-sm font-medium"
                  >
                    <span>Game {g.gameNumber}</span>
                    <span className="text-gray-700">
                      {g.side1Score} - {g.side2Score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions + Score */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>

            {/* Team Match - Need to assign players first */}
            {match.matchCategory === "team" && 
             match.status === "scheduled" && 
             (!match.subMatches || match.subMatches.length === 0) && (
              <Button className="w-full gap-2 text-base py-6" asChild>
                <Link href={`/matches/${matchId}/score`}>
                  <Play className="w-4 h-4" />
                  Start Match
                </Link>
              </Button>
            )}

            {/* Team Match - Already initialized */}
            {match.matchCategory === "team" && 
             match.subMatches && 
             match.subMatches.length > 0 &&
             (match.status === "scheduled" || match.status === "in_progress") && (
              <Button className="w-full gap-2 text-base py-6" asChild>
                <Link
                  href={
                    match.scorer?._id === currentUserId
                      ? `/matches/${matchId}/score?category=${match.matchCategory}`
                      : `/matches/${matchId}/live?category=${match.matchCategory}`
                  }
                >
                  {match.scorer?._id === currentUserId ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {match.scorer?._id === currentUserId
                    ? match.status === "scheduled"
                      ? "Start Match"
                      : "Continue Match"
                    : "View Live Match"}
                </Link>
              </Button>
            )}

            {/* Individual Match */}
            {match.matchCategory === "individual" &&
             (match.status === "scheduled" || match.status === "in_progress") && (
              <Button className="w-full gap-2 text-base py-6" asChild>
                <Link
                  href={
                    match.scorer?._id === currentUserId
                      ? `/matches/${matchId}/score?category=${match.matchCategory}`
                      : `/matches/${matchId}/live?category=${match.matchCategory}`
                  }
                >
                  {match.scorer?._id === currentUserId ? <Play className="w-4 h-4" /> : <Eye className="size-5" />}
                  {match.scorer?._id === currentUserId
                    ? match.status === "scheduled"
                      ? "Start Match"
                      : "Continue Match"
                    : "View Live Match"}
                </Link>
              </Button>
            )}

            {/* Stats button */}
            {((match.matchCategory === "individual" && 
               match.games && 
               match.games.some((g: any) => g.shots?.length)) ||
              (match.matchCategory === "team" && 
               match.subMatches?.some((sm: any) => 
                 sm.games?.some((g: any) => g.shots?.length)
               ))) && (
              <Button
                variant="outline"
                className="w-full gap-2 text-base py-6 mt-3"
                asChild
              >
                <Link href={`/matches/${matchId}/stats`}>
                  View Statistics
                </Link>
              </Button>
            )}
          </div>

          {/* Score */}
          {match.finalScore && (
            <div className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
              <h2 className="text-lg font-semibold mb-6">Final Score</h2>
              <div className="flex justify-center items-center gap-6">
                <span className="text-4xl font-bold text-blue-600">
                  {match.finalScore.side1Sets}
                </span>
                <span className="text-2xl text-gray-400">-</span>
                <span className="text-4xl font-bold text-red-600">
                  {match.finalScore.side2Sets}
                </span>
              </div>
              {match.winner && (
                <div className="mt-6">
                  <Badge className="bg-green-500 text-white px-4 py-1 text-sm">
                    Winner: {match.winner === "side1" ? side1Name : side2Name}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}