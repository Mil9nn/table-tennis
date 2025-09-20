"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  BarChart3,
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In app/matches/[id]/page.tsx, replace the fetchMatch function:
  const fetchMatch = async () => {
    try {
      // Try individual match first
      let response = await fetch(`/api/matches/individual/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch({ ...data.match, matchCategory: "individual" });
        return;
      }

      // Try team match
      response = await fetch(`/api/matches/team/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch({ ...data.match, matchCategory: "team" });
        return;
      }

      // Neither found
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
  }, [matchId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">Loading match...</div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-8 text-center">Match not found</div>
    );
  }

  // Resolve display names depending on category
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

  console.log("Team1 players:", match.team1?.players);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/matches">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {side1Name} vs {side2Name}
          </h1>
          <p className="text-gray-600">Match Details</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Match Info + Players */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Info */}
          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Match Information</h2>
              <Badge
                className={
                  match.status === "completed" ? "bg-green-500" : "bg-blue-500"
                }
              >
                {match.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(match.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{match.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="capitalize">{match.matchType}</span>
              </div>
              <div>
                <span>Best of {match.numberOfSets}</span>
              </div>
            </div>
          </div>

          {/* Players / Teams */}
          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">
              {match.matchCategory === "individual" ? "Players" : "Teams"}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{side1Name}</h3>
                {match.team1?.players && (
                  <ul className="space-y-1 text-sm text-gray-600">
                    {match.team1.players.map((player: any, index: number) => (
                      <li key={index}>
                        {player.user?.fullName ||
                          player.user?.username ||
                          "Unnamed"}
                        {player.role ? ` (${player.role})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{side2Name}</h3>
                {match.team2?.players && (
                  <ul className="space-y-1 text-sm text-gray-600">
                    {match.team2.players.map((player: any, index: number) => (
                      <li key={index}>
                        {player.user?.fullName ||
                          player.user?.username ||
                          "Unnamed"}
                        {player.role ? ` (${player.role})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions + Score */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="border rounded-lg p-6 shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {(match.status === "scheduled" ||
                match.status === "in_progress") && (
                <Button className="w-full gap-2" asChild>
                  <Link href={`/matches/${matchId}/score`}>
                    <Play className="w-4 h-4" />
                    {match.status === "scheduled"
                      ? "Start Match"
                      : "Continue Match"}
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/matches/${matchId}/stats`}>
                  <BarChart3 className="w-4 h-4" />
                  View Statistics
                </Link>
              </Button>
            </div>
          </div>

          {/* Current Score */}
          {match.finalScore && (
            <div className="border rounded-lg p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">Current Score</h2>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {match.finalScore.side1Sets}
                  </div>
                  <div className="text-sm text-gray-600">{side1Name}</div>
                </div>
                <div className="text-2xl text-gray-400">-</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {match.finalScore.side2Sets}
                  </div>
                  <div className="text-sm text-gray-600">{side2Name}</div>
                </div>
              </div>

              {match.winner && (
                <div className="mt-4 text-center">
                  <Badge className="bg-green-500">
                    Winner: {match.winner === "team1" ? side1Name : side2Name}
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
