"use client";

import { useParams } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2">
        <Loader2 className="animate-spin size-4" />
        <span className="text-sm">Loading match</span>
      </div>
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

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {/* Go Back */}
      <Link href="/matches" className="flex items-center gap-2 text-sm hover:bg-blue-300 w-fit rounded-full px-3 py-1 bg-blue-100 text-blue-800 transition-all">
        <ArrowLeftCircle />
        <span className="font-semibold">Go back</span>
      </Link>
        <div>
          <p className="font-bold">Match Details</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Match Info + Players */}
        <div className="space-y-4">
          {/* Match Info */}
          <div className="sm:border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold mb-2">Match Information</h2>
              <Badge
                className={`rounded-full border-2 ${
                  match.status === "completed"
                    ? "text-green-500 border-green-500 bg-white"
                    : "bg-blue-500"
                }`}
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
          <div className="sm:border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">
              {match.matchCategory === "individual" ? "Players" : "Teams"}
            </h2>

            {match.matchCategory === "individual" ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <ul className="space-y-1 text-sm font-semibold text-gray-600">
                    {match.participants
                      ?.slice(0, 2)
                      .map((p: any, i: number) => (
                        <li key={i}>{p.fullName || p.username || "Unknown"}</li>
                      ))}
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1 text-sm font-semibold text-gray-600">
                    {match.participants
                      ?.slice(2, 4)
                      .map((p: any, i: number) => (
                        <li key={i}>{p.fullName || p.username || "Unknown"}</li>
                      ))}
                  </ul>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Games History */}
          {match.games?.length > 0 && (
            <div className="sm:border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Games</h2>
              <div className="space-y-2">
                {match.games.map((g: any) => (
                  <div
                    key={g.gameNumber}
                    className="flex justify-between text-sm text-gray-700"
                  >
                    <span className="font-semibold">Game {g.gameNumber}</span>
                    <span className="font-medium">
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
          {match.status !== "completed" && <div className="sm:border rounded-lg p-4">
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
            </div>
          </div>}

          {/* Current Score */}
          {match.finalScore && (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Score</h2>
              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {match.finalScore.side1Sets}
                  </div>
                </div>
                <div className="text-2xl text-gray-400">-</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {match.finalScore.side2Sets}
                  </div>
                </div>
              </div>

              {match.winner && (
                <div className="mt-4 text-center">
                  <Badge className="bg-green-500">
                    Winner: {match.winner === "side1" ? side1Name : side2Name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Match Summary Stats */}
          {match.games && match.games.some((g: any) => g.shots?.length) && (
            <div className="sm:border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Match Stats</h2>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-medium mb-2">{side1Name}</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      Winners:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side1" && s.outcome === "winner"
                          ).length,
                        0
                      )}
                    </li>
                    <li>
                      Errors:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side1" && s.outcome === "error"
                          ).length,
                        0
                      )}
                    </li>
                    <li>
                      Lets:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side1" && s.outcome === "let"
                          ).length,
                        0
                      )}
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">{side2Name}</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      Winners:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side2" && s.outcome === "winner"
                          ).length,
                        0
                      )}
                    </li>
                    <li>
                      Errors:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side2" && s.outcome === "error"
                          ).length,
                        0
                      )}
                    </li>
                    <li>
                      Lets:{" "}
                      {match.games.reduce(
                        (sum: number, g: any) =>
                          sum +
                          g.shots.filter(
                            (s: any) =>
                              s.side === "side2" && s.outcome === "let"
                          ).length,
                        0
                      )}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href={`/matches/${matchId}/stats`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View full statistics →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
