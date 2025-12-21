"use client";

import { useEffect } from "react";
import {
  Loader2,
  Trophy,
  Clock,
  MapPin,
  Users,
  Flag,
  ChevronRight,
} from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { IndividualMatch } from "@/types/match.type";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import ShotFeed from "../live-scorer/common/ShotFeed";
import { useSearchParams } from "next/navigation";

export default function LiveMatchDetails({ matchId }: { matchId: string }) {
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const match = useMatchStore((s) => s.match);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const category = (categoryParam === "team" ? "team" : "individual") as "individual" | "team";

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId, category);
    }
  }, [matchId, fetchMatch, category]);

  // Socket integration for real-time updates - DISABLED
  const { isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory: category,
    role: "viewer",
    enabled: false, // Socket.IO disabled - enable when needed
  });

  // --- Loading state
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex items-center gap-4">
          <Loader2 className="animate-spin text-slate-400" />
          <p className="text-slate-300">Loading match details…</p>
        </div>
      </div>
    );
  }

  // safety cast
  const individualMatch = match as IndividualMatch;
  const participants = individualMatch.participants || [];
  const isDoubles = participants.length === 4;
  const side1 = isDoubles ? participants.slice(0, 2) : participants.slice(0, 1);
  const side2 = isDoubles ? participants.slice(2, 4) : participants.slice(1, 2);
  const currentGame =
    individualMatch.games?.[
      Math.max(0, (individualMatch.currentGame || 1) - 1)
    ] || {};

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  // Completed match view
  if (individualMatch.status === "completed") {
    const winnerSide = individualMatch.winnerSide;
    const winners = winnerSide === "side1" ? side1 : side2;

    return (
      <div className="min-h-screen bg-[#0b0f13] text-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Card className="bg-transparent border-0">
            <CardContent className="p-10 bg-gradient-to-b from-slate-800/60 to-slate-900/60 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 rounded-full bg-yellow-600/10 border border-yellow-600/20">
                  <Trophy className="w-20 h-20 text-yellow-400" />
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  MATCH COMPLETED
                </h1>

                <div className="flex items-center gap-6 flex-wrap justify-center">
                  {winners.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-slate-800/50 px-5 py-3 rounded-lg border border-slate-700"
                    >
                      <Avatar className="h-12 w-12 border-2 border-yellow-400">
                        <AvatarImage src={p.profileImage} alt={p.fullName} />
                        <AvatarFallback className="bg-yellow-100 text-yellow-700 font-semibold">
                          {getInitial(p.fullName || p.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">
                          {p.fullName || p.username}
                        </div>
                        <div className="text-xs text-slate-300">Winner</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-6xl font-black text-emerald-400">
                      {individualMatch.finalScore?.side1Sets}
                    </div>
                  </div>
                  <div className="text-4xl text-slate-500">—</div>
                  <div className="text-center">
                    <div className="text-6xl font-black text-rose-400">
                      {individualMatch.finalScore?.side2Sets}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    <span className="text-sm">{individualMatch.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span className="text-sm">
                      {formatDate(individualMatch.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Games history */}
          <div className="mt-8 grid gap-4">
            <Card className="bg-slate-800/40 border border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Game Results
                </h3>
                <div className="grid gap-3">
                  {individualMatch.games.map((game: any) => {
                    const winnerName =
                      game.winnerSide === "side1"
                        ? side1[0]?.fullName || side1[0]?.username
                        : side2[0]?.fullName || side2[0]?.username;

                    return (
                      <div
                        key={game.gameNumber}
                        className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-800"
                      >
                        <div className="text-slate-300 font-medium">
                          Game {game.gameNumber}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-xl font-extrabold text-white">
                            {game.side1Score} - {game.side2Score}
                          </div>
                          {winnerName && (
                            <Badge className="bg-emerald-600/10 text-emerald-300 border-emerald-700">
                              {winnerName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Live view
  return (
    <div className="min-h-screen bg-[#071018] text-slate-100">
      {/* Top header */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-300 tracking-wide">
                {individualMatch.matchType?.replaceAll("_", " ").toUpperCase()}
              </h2>
              <div className="px-3 py-1 rounded-full bg-red-600 text-xs font-semibold text-white shadow-sm">
                LIVE
              </div>
            </div>
            <div className="mt-2 text-slate-400 text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{individualMatch.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  Game {individualMatch.currentGame} • Best of{" "}
                  {individualMatch.numberOfSets}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-slate-400" />
                <div className="text-xs text-slate-400">Started:</div>
                <div className="text-xs text-slate-200">
                  {formatDate(individualMatch.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main scoreboard + details */}
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12">
        {/* Left / Scoreboard (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="bg-slate-900/60 border-none rounded-none shadow-lg">
            <CardContent className="p-6">
              {/* Participants */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-400">Side 1</div>
                  <div className="flex -space-x-2">
                    {side1.map((p: any, i: number) => (
                      <Avatar
                        key={i}
                        className="h-10 w-10 ring-1 ring-slate-700"
                      >
                        <AvatarImage src={p.profileImage} alt={p.fullName} />
                        <AvatarFallback className="bg-slate-700 text-white">
                          {getInitial(p.fullName || p.username)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {/* Side 2 */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">Side 2</div>
                    <div className="flex -space-x-2">
                      {side2.map((p: any, i: number) => (
                        <Avatar
                          key={i}
                          className="h-10 w-10 ring-1 ring-slate-700"
                        >
                          <AvatarImage src={p.profileImage} alt={p.fullName} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {getInitial(p.fullName || p.username)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Large score */}
              <div className="flex items-center justify-center gap-6 my-6">
                <div className="text-center">
                  <div className="text-6xl font-extrabold text-emerald-400">
                    {currentGame?.side1Score ?? 0}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Points</div>
                </div>

                <div className="text-slate-500 text-xl font-extrabold">VS</div>

                <div className="text-center">
                  <div className="text-6xl font-extrabold text-rose-400">
                    {currentGame?.side2Score ?? 0}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Points</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="">
                  <div className="text-xs text-slate-400">Sets</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {individualMatch.finalScore?.side1Sets ?? 0}
                  </div>
                </div>
                <div className="">
                  <div className="text-xs text-slate-400">Sets</div>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {individualMatch.finalScore?.side2Sets ?? 0}
                  </div>
                </div>
              </div>

              {/* Set tracker */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {Array.from({ length: individualMatch.numberOfSets }).map(
                    (_, idx) => {
                      const setNum = idx + 1;
                      const side1Won =
                        (individualMatch.finalScore?.side1Sets || 0) >= setNum;
                      const side2Won =
                        (individualMatch.finalScore?.side2Sets || 0) >= setNum;
                      const inFuture =
                        (individualMatch.finalScore?.side1Sets || 0) +
                          (individualMatch.finalScore?.side2Sets || 0) <
                        setNum - 1;
                      const isCurrent =
                        !side1Won &&
                        !side2Won &&
                        !inFuture &&
                        setNum === individualMatch.currentGame;

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${
                              side1Won
                                ? "bg-emerald-400 text-slate-900 shadow-[0_6px_18px_rgba(16,185,129,0.12)]"
                                : side2Won
                                ? "bg-rose-400 text-slate-900 shadow-[0_6px_18px_rgba(244,63,94,0.12)]"
                                : isCurrent
                                ? "bg-blue-600 text-white ring-1 ring-blue-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {setNum}
                          </div>
                          {isCurrent && (
                            <div className="text-xs text-blue-300">Live</div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="text-center text-xs text-slate-500 mt-3">
                  First to {Math.ceil(individualMatch.numberOfSets / 2)} sets
                  wins
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right / Details + history (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Match summary card */}
          <Card className="bg-slate-900/40 rounded-none border-none">
            <CardContent className="p-6">
              <div className="">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Match Summary
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {individualMatch.city} •{" "}
                    {individualMatch.venue || "Venue N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400">Current Game</p>
                    <p className="text-sm font-semibold text-slate-100">
                      {individualMatch.currentGame}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-slate-100">LIVE</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game history */}
          {individualMatch.games?.length > 0 && (
            <Card className="bg-slate-900/30 border-none rounded-none">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-slate-100 mb-2">
                  Game History
                </h4>
                <div className="grid gap-2">
                  {individualMatch.games.map((game: any) => {
                    const isCurrent =
                      game.gameNumber === individualMatch.currentGame &&
                      !game.winnerSide;
                    const winnerName =
                      game.winnerSide === "side1"
                        ? side1[0]?.fullName || side1[0]?.username
                        : game.winnerSide === "side2"
                        ? side2[0]?.fullName || side2[0]?.username
                        : null;

                    return (
                      <div
                        key={game.gameNumber}
                        className={`flex items-center justify-between p-3 rounded-md transition ${
                          isCurrent
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-slate-900/10 border border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-slate-200">
                            Game {game.gameNumber}
                          </div>
                          {isCurrent && (
                            <Badge className="bg-blue-600 text-white">
                              Live
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="font-mono text-lg font-bold text-white">
                            {game.side1Score} - {game.side2Score}
                          </div>
                          {winnerName && (
                            <div className="text-xs text-slate-300">
                              <span className="font-medium text-emerald-300">
                                {winnerName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shot feed */}
          <div>
            <ShotFeed
              games={individualMatch.games}
              currentGame={individualMatch.currentGame}
              participants={individualMatch.participants}
              finalScore={individualMatch.finalScore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
