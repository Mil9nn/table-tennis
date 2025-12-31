"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Shot } from "@/types/shot.type";
import { Participant } from "@/types/match.type";
import {
  computeStats,
  getShotColor,
} from "@/lib/match-stats-utils";
import { formatStrokeName } from "@/lib/utils";
import { generateShortCommentary, generateFullCommentary } from "@/lib/shot-commentary-utils";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useInView } from "@/hooks/useInView";

function formatShotType(stroke?: string | null) {
  if (!stroke) return "—";
  return stroke
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Game {
  gameNumber: number;
  side1Score: number;
  side2Score: number;
  winnerSide?: string | null;
  shots: Shot[];
}

interface GameByGameBreakdownProps {
  games: Game[];
  side1Name: string;
  side2Name: string;
  participants?: Participant[];
  finalScore?: { side1Sets?: number; side2Sets?: number };
}

export function GameByGameBreakdown({
  games,
  side1Name,
  side2Name,
  participants,
  finalScore,
}: GameByGameBreakdownProps) {
  const [expandedGames, setExpandedGames] = useState<Set<number>>(new Set());

  const toggleGameExpanded = (gameIndex: number) => {
    setExpandedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameIndex)) {
        newSet.delete(gameIndex);
      } else {
        newSet.add(gameIndex);
      }
      return newSet;
    });
  };

  return (
    <section>
      <header className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-[#353535]">
          Game-by-Game Analysis
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Detailed breakdown of each individual game
        </p>
      </header>

      <div className="space-y-4">
        {games.map((game, idx) => {
          const gameShots = game.shots || [];
          const stats = computeStats(gameShots);
          const isExpanded = expandedGames.has(idx);

          const strokeData = Object.entries(stats.shotTypes).map(
            ([type, value]) => ({
              name: formatStrokeName(type),
              value,
            })
          );

          return (
            <div
              key={idx}
              className=""
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-sm sm:text-base">
                    Game {game.gameNumber}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Score: {game.side1Score} - {game.side2Score}
                  </span>
                </div>

                {game.winnerSide && (
                  <Badge
                    variant="outline"
                    className="text-xs border-[#3c6e71] text-[#3c6e71]"
                  >
                    Winner:{" "}
                    {game.winnerSide === "side1"
                      ? side1Name
                      : side2Name}
                  </Badge>
                )}
              </div>

              {/* CHART */}
              {strokeData.length > 0 && (
                <GameStrokeChart strokeData={strokeData} />
              )}

              {/* SHOT FEED */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleGameExpanded(idx)}
                  className="flex items-center gap-2 w-full hover:bg-[#f8f8f8] p-2 transition-colors"
                >
                  <h4 className="text-sm font-semibold text-[#353535]">
                    Shot Feed (This Game)
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-[#3c6e71]/10 text-[#3c6e71]">
                    {gameShots.length} winning shots
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 ml-auto text-[#d9d9d9]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto text-[#d9d9d9]" />
                  )}
                </button>

                {isExpanded && (
                   <ul className="divide-y divide-[#d9d9d9] px-4 py-2">
                     {gameShots.length ? (
                       [...gameShots].reverse().map((shot, i) => {
                       const playerName =
                         shot.player.fullName ||
                         shot.player.username ||
                         "Unknown Player";

                       const shotType = formatShotType(shot.stroke);
                       const hasCoordinates =
                         shot.originX != null &&
                         shot.originY != null &&
                         shot.landingX != null &&
                         shot.landingY != null;
                       
                       // Calculate game score at the time of this shot
                       // Since array is reversed, calculate the original index
                       const originalIndex = gameShots.length - 1 - i;
                       let gameScoreSide1 = 0;
                       let gameScoreSide2 = 0;
                       for (let j = 0; j <= originalIndex; j++) {
                         if (gameShots[j].side === "side1") {
                           gameScoreSide1++;
                         } else if (gameShots[j].side === "side2") {
                           gameScoreSide2++;
                         }
                       }
                       const currentGameScore = {
                         side1Score: gameScoreSide1,
                         side2Score: gameScoreSide2,
                       };
                       
                       // Generate full commentary with server, game score, and set score if available
                       let commentary: string | null = null;
                       if (hasCoordinates) {
                         if (participants && finalScore) {
                           // Calculate set score at the time of this shot
                           // Count completed games before this one
                           let setsWonSide1 = 0;
                           let setsWonSide2 = 0;
                           for (let j = 0; j < idx; j++) {
                             if (games[j].winnerSide === "side1") setsWonSide1++;
                             if (games[j].winnerSide === "side2") setsWonSide2++;
                           }
                           // For current game, the set score is what it was at the start
                           // (since this shot is part of this game)
                           const currentSetScore = {
                             side1Sets: setsWonSide1,
                             side2Sets: setsWonSide2,
                           };
                           
                           commentary = generateFullCommentary(
                             shot,
                             participants,
                             games,
                             currentSetScore,
                             side1Name,
                             side2Name,
                             currentGameScore
                           );
                         } else {
                           // Fallback to short commentary
                           commentary = generateShortCommentary(shot);
                         }
                       }

                       return (
                         <li
                           key={originalIndex}
                           className="flex gap-3 text-xs sm:text-sm py-3 hover:bg-[#f8f8f8] transition-colors rounded-lg px-2"
                         >
                           {/* Shot number */}
                           <span className="text-[#d9d9d9] font-mono text-xs pt-0.5">
                             {gameShots.length - i}.
                           </span>

                           {/* Shot commentary with color accent */}
                           <div className="flex-1 flex gap-2.5">
                             {/* Color accent bar */}
                             <div
                               className={`w-1 rounded-full flex-shrink-0 ${
                                 shot.side === "side1"
                                   ? "bg-gradient-to-b from-[#3c6e71] to-[#2a5056]"
                                   : "bg-gradient-to-b from-[#284b63] to-[#1a3547]"
                               }`}
                             />

                             {/* Commentary content */}
                             <div className="flex-1 space-y-1">
                               {commentary ? (
                                 <div
                                   className="text-[#353535] leading-relaxed"
                                   dangerouslySetInnerHTML={{
                                     __html: commentary.replace(
                                       /<strong>(.*?)<\/strong>/g,
                                       '<strong class="font-semibold text-[#353535]">$1</strong>'
                                     ),
                                   }}
                                 />
                               ) : (
                                 // Fallback if no commentary available
                                 <div className="text-[#353535]">
                                   <strong className="font-semibold text-[#353535]">
                                     {playerName}
                                   </strong>{" "}
                                   <span className="text-[#d9d9d9] text-xs">
                                     ({shot.side})
                                   </span>{" "}
                                   →{" "}
                                   <span
                                     className={`font-medium ${
                                       shot.side === "side1"
                                         ? "text-[#3c6e71]"
                                         : "text-[#284b63]"
                                     }`}
                                   >
                                     {shotType}
                                   </span>
                                 </div>
                               )}
                             </div>
                           </div>
                         </li>
                       );
                     })
                     ) : (
                       <li className="flex items-center gap-2 text-sm text-[#d9d9d9] italic py-3">
                         <span className="w-2 h-2 bg-[#d9d9d9] rounded-full" />
                         No shots recorded…
                       </li>
                     )}
                   </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GameStrokeChart({ strokeData }: { strokeData: Array<{ name: string; value: number }> }) {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <div className="space-y-2 py-3" ref={ref}>
      <h4 className="text-sm font-semibold text-[#353535]">
        Shot Type Frequency
      </h4>
      <div className="h-56 bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={strokeData}>
            <XAxis 
              dataKey="name" 
              style={{ fontSize: "11px" }} 
              tick={{ fill: '#353535' }}
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
            />
            <YAxis 
              width={25} 
              tick={{ fill: '#353535' }}
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d9d9d9',
                borderRadius: 0,
                boxShadow: 'none',
              }}
            />
            <Bar
              dataKey="value"
              radius={0}
              isAnimationActive={isInView}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {strokeData.map((entry, i) => (
                <Cell key={i} fill={getShotColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

