// components/live-scorer/common/TeamMatchCompletedCard.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamMatch } from "@/types/match.type";
import { ArrowBigLeft, Trophy } from "lucide-react";

interface TeamMatchCompletedCardProps {
  match: TeamMatch | null;
}

export default function TeamMatchCompletedCard({ match }: TeamMatchCompletedCardProps) {
  if (!match) return null;

  const winnerTeam = match.winnerTeam === "team1" ? match.team1 : match.team2;
  const loserTeam = match.winnerTeam === "team1" ? match.team2 : match.team1;

  const finalScore = `${match.finalScore.team1Matches} - ${match.finalScore.team2Matches}`;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-none">
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-lg" />
        </div>
        
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
          TEAM MATCH COMPLETED
        </h2>
        
        <div className="space-y-4">
          <div className="text-2xl font-semibold">
            Winner: <span className="text-emerald-700">{winnerTeam?.name}</span>
          </div>
          
          <div className="text-lg text-gray-700">
            Final Score: <span className="font-bold text-gray-900">{finalScore}</span>
          </div>

          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{match.team1.name}</p>
              <p className={`text-3xl font-bold ${match.winnerTeam === "team1" ? "text-emerald-600" : "text-gray-400"}`}>
                {match.finalScore.team1Matches}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{match.team2.name}</p>
              <p className={`text-3xl font-bold ${match.winnerTeam === "team2" ? "text-emerald-600" : "text-gray-400"}`}>
                {match.finalScore.team2Matches}
              </p>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="border-t border-green-200 pt-4 space-y-2">
          <p className="text-xs text-gray-500 italic">
            Match completed at {new Date().toLocaleString()}
          </p>
        </div>

        <div className="pt-6">
          <Link href="/matches">
            <Button variant="default" className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md transition">
              <ArrowBigLeft className="size-4" />
               <span className="pb-0.5">Return to Matches</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}