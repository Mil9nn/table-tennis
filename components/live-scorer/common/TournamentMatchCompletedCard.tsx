// components/live-scorer/common/TournamentMatchCompletedCard.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndividualMatch } from "@/types/match.type";
import { ArrowLeft, Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";

interface TournamentMatchCompletedCardProps {
  match: IndividualMatch;
  tournamentId: string;
  tournamentName?: string;
}

export default function TournamentMatchCompletedCard({ 
  match, 
  tournamentId,
  tournamentName 
}: TournamentMatchCompletedCardProps) {
  const renderWinnerName = () => {
    if (!match.winnerSide) return "Draw";

    if (match.matchType === "singles") {
      const winnerIndex = match.winnerSide === "side1" ? 0 : 1;
      const participant = match.participants?.[winnerIndex];
      return participant?.fullName || participant?.username || `Side ${match.winnerSide === "side1" ? "1" : "2"}`;
    }

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
    <div className="bg-blue-500 h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="shadow-md rounded-xl max-w-xl mx-auto bg-white overflow-hidden">
          {/* Tournament Badge */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 flex items-center gap-2">
            <span className="font-semibold text-sm">
              {tournamentName || "Tournament Match"}
            </span>
          </div>

          <CardContent className="p-8 space-y-6">
            {/* Trophy Icon */}
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex justify-center"
            >
            </motion.div>

            {/* Match Completed Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                MATCH COMPLETED
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto rounded-full"></div>
            </div>

            {/* Winner Info */}
            <div className="space-y-4 rounded-2xl p-2 border-2 border-green-100">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span className="text-sm font-medium">Winner</span>
              </div>
              <p className="text-xl font-bold text-center text-emerald-700">
                {renderWinnerName()}
              </p>
              
              <div className="flex items-center justify-center gap-8 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">Final Score</p>
                  <p className="text-2xl font-bold text-gray-900">{matchScore}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href={`/tournaments/${tournamentId}`} className="flex-1">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back To Tournament
                </Button>
              </Link>
            </div>

            {/* Subtle hint */}
            <p className="text-center text-xs text-gray-400 italic">
              Standings will be updated automatically
            </p>
          </CardContent>
        </div>
      </motion.div>
    </div>
  );
}