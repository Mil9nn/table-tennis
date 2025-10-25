"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeDuration } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";
import { ArrowBigLeft, ArrowBigLeftDash, ArrowLeft, ArrowLeftFromLine, LucideTrophy, Trophy } from "lucide-react";

interface MatchCompletedCardProps {
  match: IndividualMatch | null;
}

export default function MatchCompletedCard({ match }: MatchCompletedCardProps) {
  if (!match) return null;

  const renderWinnerName = () => {
    if (!match.winnerSide) return "Draw";

    if (match.matchType === "singles") {
      const winnerIndex = match.winnerSide === "side1" ? 0 : 1;
      const participant = match.participants?.[winnerIndex];
      return participant?.fullName || participant?.username || `Side ${match.winnerSide === "side1" ? "1" : "2"}`;
    }

    // doubles / mixed_doubles
    if (match.winnerSide === "side1") {
      const p1 = match.participants?.[0];
      const p2 = match.participants?.[1];
      return `${p1?.fullName || p1?.username || "Player 1"} & ${p2?.fullName || p2?.username || "Player 2"}`;
    } else {
      const p1 = match.participants?.[2];
      const p2 = match.participants?.[3];
      return `${p1?.fullName || p1?.username || "Player 3"} & ${p2?.fullName || p2?.username || "Player 4"}`;
    }
  };

  const finalScore = match.finalScore;
  const matchScore = `${finalScore?.side1Sets ?? 0} - ${finalScore?.side2Sets ?? 0}`;

  return (
    <Card className="h-[calc(100vh-60px)] border border-green-300 bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg rounded-none">
      <CardContent className="p-8 text-center space-y-5">
        <div className="p-4 w-fit mx-auto rounded-full bg-emerald-300 ">
        <Trophy className="size-8 text-amber-400 mx-auto" />
        </div>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
          MATCH COMPLETED
        </h2>
        
        <div className="space-y-3">
          <div className="text-2xl font-semibold">
            Winner: <span className="text-emerald-700">{renderWinnerName()}</span>
          </div>
          
          <div className="text-lg text-gray-700">
            Final Score: <span className="font-bold text-gray-900">{matchScore}</span>
          </div>
          
          {match.matchDuration && (
            <div className="text-sm text-gray-500 italic">
              Duration: {formatTimeDuration(match.matchDuration)}
            </div>
          )}
        </div>

        <div className="pt-2 text-xs text-gray-500">
          Match completed at {formatDate(new Date())}
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