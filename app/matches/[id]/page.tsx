"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeftCircle,
  Eye,
  User,
  Settings,
  ListOrdered,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuthStore";
import Image from "next/image";
import {
  IndividualGame,
  isIndividualMatch,
  SubMatch,
} from "@/types/match.type";
import { useMatchStore } from "@/hooks/useMatchStore";
import { formatDate } from "@/lib/utils";
import MatchStatusBadge from "@/components/MatchStatusBadge";
import MatchTypeBadge from "@/components/MatchTypeBadge";

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id as string;
  const categoryParam = searchParams.get("category");

  const fetchMatch = useMatchStore((state) => state.fetchMatch);
  const fetchingMatch = useMatchStore((state) => state.fetchingMatch);
  const match = useMatchStore((state) => state.match);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchMatch(matchId, categoryParam === "team" ? "team" : "individual");
  }, [matchId, categoryParam]);

  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2 px-4">
        <Loader2 className="animate-spin size-5 text-blue-600" />
        <span className="text-sm font-medium">Loading match...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-12 px-4 text-center text-lg font-semibold">
        Match not found
      </div>
    );
  }

  const side1Name =
    match.matchCategory === "individual"
      ? match.participants?.[0]?.fullName
      : match.team1?.name;
  const side2Name =
    match.matchCategory === "individual"
      ? match.participants?.[1]?.fullName
      : match.team2?.name;

  const isScorer = match.scorer?._id === user?._id;

  return (
    <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
        <Link
          href="/matches"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md text-blue-700 transition w-fit"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          <span className="font-semibold">Go back</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Match Details
        </h1>
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        {/* Match Info + Players/Teams */}
        <div className="space-y-6">
          {/* Match Info */}
          <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold">
                Match Information
              </h2>
              <MatchStatusBadge status={match.status} size="sm" showIcon={false} />
            </div>

            {isIndividualMatch(match) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {formatDate(match.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{match.city}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="capitalize truncate">
                      {match.matchType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="truncate">
                      Best of {match.numberOfSets}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {formatDate(match.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{match.city}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="size-4" />
                    <span className="capitalize truncate">
                      {match.matchFormat.replace(/_/g, " ")} Format
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListOrdered className="size-4" />
                    <span className="truncate">
                      Best of {match.numberOfSetsPerSubMatch}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Players / Teams */}
          {match.matchCategory === "individual" ? (
            // INDIVIDUAL MATCHES - Players
            <div className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              <h2 className="text-base sm:text-lg font-semibold py-3 sm:py-4 px-4 sm:px-6">
                Players
              </h2>

              <div className="font-semibold text-base sm:text-xl p-4 sm:p-6 pt-0">
                {match.matchType === "singles" ? (
                  // Singles: Two players
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {match.participants
                      ?.slice(0, 2)
                      .map((p: any, i: number) => (
                        <div
                          key={i}
                          className="text-sm text-gray-600 flex items-center w-full sm:w-auto"
                        >
                          {p?.profileImage ? (
                            <Image
                              src={p.profileImage}
                              alt={p.fullName || "Player"}
                              width={40}
                              height={40}
                              className="inline-block w-10 h-10 rounded-full mr-2 object-cover border-gray-400 border shrink-0"
                            />
                          ) : (
                            <p className="inline-flex items-center justify-center w-10 h-10 mr-2 rounded-full bg-gray-200 text-gray-700 font-semibold border-gray-400 border shrink-0">
                              {(p?.fullName?.[0] || "?").toUpperCase()}
                            </p>
                          )}
                          <p className="text-xs truncate">
                            {p?.fullName || "Unnamed"}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  // Doubles
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600 gap-4">
                    <div className="space-y-2 w-full sm:w-auto">
                      {match.participants
                        ?.slice(0, 2)
                        .map((p: any, i: number) => (
                          <div key={i} className="flex items-center">
                            {p?.profileImage ? (
                              <Image
                                src={p.profileImage}
                                alt={p.fullName || "Player"}
                                width={40}
                                height={40}
                                className="inline-block w-10 h-10 rounded-full mr-2 object-cover border-gray-400 border shrink-0"
                              />
                            ) : (
                              <div className="inline-flex items-center justify-center w-10 h-10 mr-2 rounded-full bg-gray-200 text-gray-700 font-semibold border-gray-400 border shrink-0">
                                {(p?.fullName?.[0] || "?").toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">
                              {p?.fullName || "Unnamed"}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-2 w-full sm:w-auto">
                      {match.participants
                        ?.slice(2, 4)
                        .map((p: any, i: number) => (
                          <div key={i} className="flex items-center">
                            {p?.profileImage ? (
                              <Image
                                src={p.profileImage}
                                alt={p.fullName || "Player"}
                                width={40}
                                height={40}
                                className="inline-block w-10 h-10 rounded-full mr-2 object-cover border-gray-400 border shrink-0"
                              />
                            ) : (
                              <div className="inline-flex items-center justify-center w-10 h-10 mr-2 rounded-full bg-gray-200 text-gray-700 font-semibold border-gray-400 border shrink-0">
                                {(p?.fullName?.[0] || "?").toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">
                              {p?.fullName || "Unnamed"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // TEAM MATCHES - Format Info & Lineup
            <>
              {/* Match Format Info */}
              <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
                <h2 className="text-base sm:text-lg font-semibold mb-4">
                  Match Format
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600 shrink-0">
                      Total Matches:
                    </span>
                    <span className="font-medium text-right">
                      {match.subMatches?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600 shrink-0">
                      Sets per Match:
                    </span>
                    <span className="font-medium text-right">
                      Best of {match.numberOfSetsPerSubMatch}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-semibold shrink-0 truncate">
                      {match.team1.name}:
                    </span>
                    <span className="font-medium text-right">
                      {match.team1.players?.length || 0} players
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600 font-semibold shrink-0 truncate">
                      {match.team2.name}:
                    </span>
                    <span className="font-medium text-right">
                      {match.team2.players?.length || 0} players
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Lineup/Schedule */}
              <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
                <h2 className="text-base sm:text-lg font-semibold mb-4">
                  Match Lineup
                </h2>
                <div className="space-y-3">
                  {match.subMatches?.map((subMatch: SubMatch, idx: number) => {
                    const isCompleted = subMatch.status === "completed";
                    const isInProgress = subMatch.status === "in_progress";

                    const team1Players = Array.isArray(subMatch.playerTeam1)
                      ? subMatch.playerTeam1
                      : [subMatch.playerTeam1];
                    const team2Players = Array.isArray(subMatch.playerTeam2)
                      ? subMatch.playerTeam2
                      : [subMatch.playerTeam2];

                    const team1Names = team1Players
                      .map((p: any) => p?.fullName || p?.username || "TBD")
                      .join(" & ");
                    const team2Names = team2Players
                      .map((p: any) => p?.fullName || p?.username || "TBD")
                      .join(" & ");

                    return (
                      <div
                        key={idx}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                          isInProgress
                            ? "border-blue-500 bg-blue-50"
                            : isCompleted
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold">
                              Match {idx + 1}
                            </h3>
                            <MatchTypeBadge type={subMatch.matchType} size="sm" showIcon={false} />
                          </div>
                          <Badge
                            variant={"outline"}
                            className={`text-xs rounded-full w-fit ${
                              isCompleted
                                ? "text-green-700 ring-2 ring-green-200"
                                : isInProgress
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isCompleted
                              ? "Completed"
                              : isInProgress
                              ? "Live"
                              : "Scheduled"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                          <p className="font-medium text-gray-700">
                            {team1Names}
                          </p>
                          <p className="text-gray-400 shrink-0">vs</p>
                          <p className="font-medium text-gray-700">
                            {team2Names}
                          </p>
                        </div>

                        {isCompleted && subMatch.finalScore && (
                          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs gap-2 flex-wrap">
                            <span className="text-gray-600">Final Score:</span>
                            <span className="font-semibold">
                              {subMatch.finalScore.team1Sets} -{" "}
                              {subMatch.finalScore.team2Sets}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {subMatch.winnerSide && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  Won by{" "}
                                  {subMatch.winnerSide === "team1"
                                    ? team1Names
                                    : team2Names}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Games History - Only for Individual Matches */}
          {isIndividualMatch(match) && match.games?.length > 0 && (
            <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
              <h2 className="text-base sm:text-lg font-semibold mb-4">Games</h2>
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
          <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Actions</h2>

            {["individual", "team"].includes(match.matchCategory) &&
              ["scheduled", "in_progress"].includes(match.status) && (
                <Button className="w-full gap-2 text-base py-5 sm:py-6" asChild>
                  <Link
                    href={
                      isScorer
                        ? `/matches/${matchId}/score?category=${match.matchCategory}`
                        : `/matches/${matchId}/live?category=${match.matchCategory}`
                    }
                  >
                    {isScorer ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {isScorer
                      ? match.status === "scheduled"
                        ? "Start Match"
                        : "Continue Match"
                      : "View Live"}
                  </Link>
                </Button>
              )}

            {/* Stats button */}
            {((match.matchCategory === "individual" &&
              match.games?.some((g: IndividualGame) => g.shots?.length)) ||
              (match.matchCategory === "team" &&
                match.subMatches?.some((sm: SubMatch) =>
                  sm.games?.some((g) => g.shots?.length)
                ))) && (
              <Button
                variant="outline"
                className="w-full gap-2 text-base py-5 sm:py-6 mt-3"
                asChild
              >
                <Link
                  href={`/matches/${matchId}/stats?category=${match.matchCategory}`}
                >
                  View Statistics
                </Link>
              </Button>
            )}
          </div>

          {/* Score - Individual Matches */}
          {isIndividualMatch(match) && match.finalScore && (
            <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition text-center">
              <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                Final Score
              </h2>
              <div className="flex justify-center items-center gap-4 sm:gap-6">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {match.finalScore.side1Sets}
                </span>
                <span className="text-xl sm:text-2xl text-gray-400">-</span>
                <span className="text-3xl sm:text-4xl font-bold text-red-600">
                  {match.finalScore.side2Sets}
                </span>
              </div>
              {match.winnerSide && (
                <div className="mt-4 sm:mt-6">
                  <Badge className="bg-green-500 text-white px-4 py-1 text-sm">
                    Winner:{" "}
                    {match.winnerSide === "side1" ? side1Name : side2Name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Score - Team Matches */}
          {match.matchCategory === "team" && (
            <div className="border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition text-center">
              <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                Team Score
              </h2>
              <div className="flex justify-center items-center gap-4 sm:gap-6">
                <div className="text-center flex-1">
                  <div className="text-xs sm:text-sm text-gray-500 mb-2 truncate px-2">
                    {match.team1.name}
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                    {match.finalScore.team1Matches}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl text-gray-400">-</span>
                <div className="text-center flex-1">
                  <div className="text-xs sm:text-sm text-gray-500 mb-2 truncate px-2">
                    {match.team2.name}
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-red-600">
                    {match.finalScore.team2Matches}
                  </span>
                </div>
              </div>
              {match.status === "completed" && match.winnerTeam && (
                <div className="mt-4 sm:mt-6">
                  <Badge className="bg-green-500 text-white px-4 py-1 text-sm">
                    Winner:{" "}
                    {match.winnerTeam === "team1"
                      ? match.team1.name
                      : match.team2.name}
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
