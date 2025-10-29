"use client";

import { useEffect } from "react";
import { Loader2, Trophy, Clock, MapPin, Users } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { IndividualMatch } from "@/types/match.type";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import ShotFeed from "../live-scorer/common/ShotFeed";
import { useSearchParams } from "next/navigation";

export default function LiveMatchDetails({ matchId }: { matchId: string }) {
  const fetchMatch = useMatchStore((s) => s.fetchMatch);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const match = useMatchStore((s) => s.match);

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId, categoryParam === "team" ? "team" : "individual");
    }
  }, [matchId, fetchMatch]);

  if (!match) {
    return (
      <div className="flex items-center justify-center gap-2 w-full h-screen">
        <Loader2 className="animate-spin size-5" />
        <p className="text-slate-600 text-sm font-medium">Loading match...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-3">
          <Trophy className="w-16 h-16 mx-auto text-slate-300" />
          <p className="text-slate-500 font-medium text-lg">
            No match data available
          </p>
        </div>
      </div>
    );
  }

  const individualMatch = match as IndividualMatch;
  const participants = individualMatch.participants || [];
  const isDoubles = participants.length === 4;

  const side1 = isDoubles ? participants.slice(0, 2) : participants.slice(0, 1);
  const side2 = isDoubles ? participants.slice(2, 4) : participants.slice(1, 2);

  const currentGame =
    individualMatch.games?.[individualMatch.currentGame - 1] || {};

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  if (individualMatch.status === "completed") {
    const winnerSide = individualMatch.winnerSide;
    const winners = winnerSide === "side1" ? side1 : side2;

    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="border-none">
            <CardContent className="p-12 text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20"></div>
                <Trophy className="w-24 h-24 mx-auto text-yellow-500 relative" />
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  MATCH COMPLETED
                </h1>

                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {winners.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-teal-100 px-6 py-3 rounded-full"
                    >
                      <Avatar className="h-10 w-10 border-2 border-emerald-400">
                        <AvatarImage src={p.profileImage} alt={p.fullName} />
                        <AvatarFallback className="bg-emerald-200 text-emerald-700 font-bold">
                          {getInitial(p.fullName || p.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm text-emerald-900">
                        {p.fullName || p.username}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-5xl font-black">
                  <span className="text-emerald-600">
                    {individualMatch.finalScore?.side1Sets}
                  </span>
                  <span className="text-slate-300">-</span>
                  <span className="text-rose-600">
                    {individualMatch.finalScore?.side2Sets}
                  </span>
                </div>
              </div>

              <div className="pt-6 space-y-3 text-slate-600">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{individualMatch.city}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDate(individualMatch.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Games History */}
          <Card className="mt-6 border-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
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
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="font-semibold text-slate-700">
                        Game {game.gameNumber}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-lg font-bold text-slate-900">
                          {game.side1Score} - {game.side2Score}
                        </span>
                        {winnerName && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
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
    );
  }

  // Live match view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div className="max-w-6xl mx-auto p-4 px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">
                  {individualMatch.matchType.replace("_", " ").toUpperCase()}
                </h1>
                <Badge className="bg-red-500 tracking-wide font-semibold rounded-full">
                  LIVE
                </Badge>
              </div>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {individualMatch.city} • Best of {individualMatch.numberOfSets}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">
                Game {individualMatch.currentGame}
              </p>
              <p className="text-xs text-slate-400">
                {formatDate(individualMatch.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Live Score */}
        <Card className="border-black/20 rounded-none overflow-hidden">
          <div className="p-6">
            <h2 className=" font-bold text-lg mb-6 text-center">Live Score</h2>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
              {/* Side 1 */}
              <div className="space-y-4 text-emerald-500">
                {side1.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="font-bold  text-sm">
                        {p.fullName || p.username}
                      </p>
                      {isDoubles && i === 0 && (
                        <p className="text-xs text-blue-200">Main</p>
                      )}
                      {isDoubles && i === 1 && (
                        <p className="text-xs text-blue-200">Partner</p>
                      )}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-emerald-500">
                      <AvatarImage src={p.profileImage} alt={p.fullName} />
                      <AvatarFallback className="bg-blue-200 text-blue-700 font-bold text-lg">
                        {getInitial(p.fullName || p.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                <div className="flex justify-end">
                  <div className="backdrop-blur-sm rounded-2xl px-8 py-4">
                    <p className="text-7xl font-black">
                      {currentGame?.side1Score ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <span className="/80 font-extrabold text-sm">VS</span>

              {/* Side 2 */}
              <div className="space-y-4 text-rose-500">
                {side2.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-rose-500">
                      <AvatarImage src={p.profileImage} alt={p.fullName} />
                      <AvatarFallback className="bg-indigo-200 text-indigo-700 font-bold text-lg">
                        {getInitial(p.fullName || p.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-bold  text-sm">
                        {p.fullName || p.username}
                      </p>
                      {isDoubles && i === 0 && (
                        <p className="text-xs text-blue-200">Main</p>
                      )}
                      {isDoubles && i === 1 && (
                        <p className="text-xs text-blue-200">Partner</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-start">
                  <div className="rounded-2xl px-8 py-4">
                    <p className="text-7xl font-black">
                      {currentGame?.side2Score ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Set Tracker */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {Array.from({ length: individualMatch.numberOfSets }).map(
                (_, idx) => {
                  const setNum = idx + 1;
                  const side1Won =
                    individualMatch.finalScore?.side1Sets >= setNum;
                  const side2Won =
                    individualMatch.finalScore?.side2Sets >= setNum;
                  const currentSet =
                    individualMatch.finalScore?.side1Sets +
                      individualMatch.finalScore?.side2Sets +
                      1 ===
                    setNum;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all ${
                          side1Won
                            ? "bg-emerald-500 scale-110"
                            : side2Won
                            ? "bg-rose-500 scale-110"
                            : currentSet
                            ? "bg-blue-500"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {setNum}
                      </div>
                      {currentSet && (
                        <span className="text-xs font-bold text-blue-600">
                          Current
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              First to {Math.ceil(individualMatch.numberOfSets / 2)} sets wins
            </p>
          </div>
        </Card>

        {/* Games History */}
        {individualMatch.games?.length > 0 && (
          <Card className="border-none rounded-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                Game History
              </h3>
              <div className="grid gap-3">
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
                      className={`flex items-center justify-between p-2 rounded-md border-2 transition-all ${
                        isCurrent
                          ? "border-blue-300"
                          : game.winnerSide
                          ? "border-slate-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">
                          Game {game.gameNumber}
                        </span>
                        {isCurrent && (
                          <Badge className="bg-blue-500 rounded-full text-xs ">
                            Live
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xl font-bold text-slate-900">
                          {game.side1Score} - {game.side2Score}
                        </span>
                        {winnerName && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
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
        )}
      </div>

      <ShotFeed
        games={individualMatch.games}
        currentGame={individualMatch.currentGame}
        participants={individualMatch.participants}
      />
    </div>
  );
}
