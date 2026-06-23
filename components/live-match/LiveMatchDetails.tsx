"use client";

import { useEffect, useMemo } from "react";
import { 
  Loader2, Trophy, Clock, MapPin, Flag, 
  Activity, Circle, ChevronRight, Zap 
} from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { IndividualMatch } from "@/types/match.type";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getAvatarFallbackStyle } from "@/lib/utils";
import ShotFeed from "../live-scorer/common/ShotFeed";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Suggest adding framer-motion

export default function LiveMatchDetails({ matchId }: { matchId: string }) {
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const match = useMatchStore((s) => s.match);
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") === "team" ? "team" : "individual") as "individual" | "team";

  useEffect(() => {
    if (matchId) fetchMatch(matchId, category);
  }, [matchId, fetchMatch, category]);

  const { isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory: category,
    role: "viewer",
    enabled: true,
  });

  // Derived state to keep the render clean
  const { side1, side2, currentGame, individualMatch } = useMemo(() => {
    if (!match) return { side1: [], side2: [], currentGame: {}, individualMatch: null };
    const m = match as IndividualMatch;
    const participants = m.participants || [];
    const isDoubles = participants.length === 4;
    return {
      individualMatch: m,
      side1: isDoubles ? participants.slice(0, 2) : participants.slice(0, 1),
      side2: isDoubles ? participants.slice(2, 4) : participants.slice(1, 2),
      currentGame: m.games?.[Math.max(0, (m.currentGame || 1) - 1)] || {},
    };
  }, [match]);

  if (!individualMatch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase">Syncing Match Data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      {/* 1. Slim Top Navigation Bar */}
      <nav className=" bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/5 px-2 py-0">
              <Circle className="w-2 h-2 fill-current mr-1.5 animate-pulse" />
              {isConnected ? "CONNECTED" : "RECONNECTING"}
            </Badge>
            <span className="text-xs text-slate-500 font-mono hidden md:block">
              MATCH_ID: {matchId.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-tighter">
            {individualMatch.matchType?.replace("_", " ")} <ChevronRight className="w-3 h-3" /> 
            <span className="text-slate-900">Live Dashboard</span>
          </div>
        </div>
      </nav>

      {/* Compact Match Info Bar */}
      <div className="border-b border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{individualMatch.venue || "Olympic Arena"}</span>
              <span className="text-slate-400">•</span>
              <span>{individualMatch.city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Best of {individualMatch.numberOfSets} Sets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(individualMatch.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-4 lg:py-10">
        
        {/* 2. Hero Scoreboard (The "Arena") */}
        <section className="relative overflow-hidden bg-linear-to-b from-white to-slate-50 border border-slate-200 ">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.1),transparent_70%)]" />
          
          <div className="relative p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 md:gap-4">
              
              {/* Side 1 */}
              <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-4">
                <ParticipantGroup players={side1} align="end" />
              </div>

              {/* Live Game Score Center */}
              <div className="bg-slate-100/80 backdrop-blur-xl  p-6 border border-slate-200">
                <div className="flex flex-col items-center justify-center">
                  <Badge className="mb-4 bg-blue-600 hover:bg-blue-600 text-[10px] font-bold px-3 py-0.5 rounded-full text-white">
                    GAME {individualMatch.currentGame}
                  </Badge>
                  <div className="flex items-center gap-8">
                    <span className="text-7xl md:text-8xl font-mono font-black text-emerald-600">
                      {currentGame?.side1Score ?? 0}
                    </span>
                    <div className="h-12 w-[2px] bg-slate-300 rotate-12" />
                    <span className="text-7xl md:text-8xl font-mono font-black text-slate-900">
                      {currentGame?.side2Score ?? 0}
                    </span>
                  </div>
                  {/* Sets Won Display */}
                  <div className="mt-6 pt-4 border-t border-slate-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">Sets Won</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter font-mono">
                      {individualMatch.finalScore?.side1Sets || 0} - {individualMatch.finalScore?.side2Sets || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Side 2 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <ParticipantGroup players={side2} align="start" />
              </div>

            </div>
          </div>
        </section>

        {/* 3. Secondary Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Left: Game History */}
          <div className="lg:col-span-4 space-y-4">
            {/* Set Progression */}
            <div className="bg-white border border-slate-200 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Set Progression</p>
              <div className="flex gap-2">
                {Array.from({ length: individualMatch.numberOfSets }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i + 1 < (individualMatch.currentGame || 1) 
                        ? 'bg-blue-500' 
                        : i + 1 === individualMatch.currentGame 
                          ? 'bg-blue-500/20 border border-blue-500/50' 
                          : 'bg-slate-200'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Set Scores Grid */}
            {individualMatch.games && individualMatch.games.length > 0 && (
              <div className="bg-white border border-slate-200 p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Set Scores</p>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* Header Row - Set Numbers */}
                    <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `repeat(${individualMatch.numberOfSets}, minmax(60px, 1fr))` }}>
                      {Array.from({ length: individualMatch.numberOfSets }).map((_, i) => {
                        const setNum = i + 1;
                        const isCurrent = setNum === individualMatch.currentGame;
                        return (
                          <div key={i} className="text-center">
                            <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                              Set {setNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Side 1 Scores Row */}
                    <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: `repeat(${individualMatch.numberOfSets}, minmax(60px, 1fr))` }}>
                      {Array.from({ length: individualMatch.numberOfSets }).map((_, i) => {
                        const setNum = i + 1;
                        const game = individualMatch.games?.find((g: any) => g.gameNumber === setNum);
                        const score = game?.side1Score ?? (setNum < (individualMatch.currentGame || 1) ? 0 : '-');
                        const isWinner = game && game.side1Score > game.side2Score;
                        const isCurrent = setNum === individualMatch.currentGame;
                        return (
                          <div key={i} className="text-center">
                            <span className={`font-mono text-lg font-bold ${
                              isWinner ? 'text-emerald-600' : 
                              isCurrent ? 'text-blue-600' : 
                              'text-slate-700'
                            }`}>
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Side 2 Scores Row */}
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${individualMatch.numberOfSets}, minmax(60px, 1fr))` }}>
                      {Array.from({ length: individualMatch.numberOfSets }).map((_, i) => {
                        const setNum = i + 1;
                        const game = individualMatch.games?.find((g: any) => g.gameNumber === setNum);
                        const score = game?.side2Score ?? (setNum < (individualMatch.currentGame || 1) ? 0 : '-');
                        const isWinner = game && game.side2Score > game.side1Score;
                        const isCurrent = setNum === individualMatch.currentGame;
                        return (
                          <div key={i} className="text-center">
                            <span className={`font-mono text-lg font-bold ${
                              isWinner ? 'text-emerald-600' : 
                              isCurrent ? 'text-blue-600' : 
                              'text-slate-700'
                            }`}>
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Feed (Main Action) */}
          <div className="lg:col-span-8">
            <div className="bg-white backdrop-blur-sm  border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Point Commentary
                </h3>
              </div>
              <div className="min-h-[400px]">
                <ShotFeed
                  games={individualMatch.games}
                  currentGame={individualMatch.currentGame}
                  participants={individualMatch.participants}
                  finalScore={individualMatch.finalScore}
                  serverConfig={individualMatch.serverConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for Cleaner Code
function ParticipantGroup({ players, align }: { players: any[], align: 'start' | 'end' }) {
  return (
    <div className={`flex items-center gap-3 ${align === 'end' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="flex -space-x-3">
        {players.map((p, i) => (
          <Avatar key={i} className="h-14 w-14 border-4 border-white ring-1 ring-slate-200">
            <AvatarImage src={p.profileImage} />
            <AvatarFallback style={getAvatarFallbackStyle(p._id)} className="text-lg font-bold bg-slate-100 text-slate-700">
              {p.fullName?.[0] || p.username?.[0]}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className={`flex flex-col ${align === 'end' ? 'items-end' : 'items-start'}`}>
        <h4 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
          {players.map(p => p.fullName || p.username).join(" & ")}
        </h4>
      </div>
    </div>
  );
}