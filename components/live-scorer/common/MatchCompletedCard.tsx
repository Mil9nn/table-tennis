// components/live-scorer/common/MatchCompletedCard.tsx - Merged with TournamentMatchCompletedCard
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeDuration } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";
import { ArrowBigLeft, ArrowLeft, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { motion } from "framer-motion";

interface MatchCompletedCardProps {
  match: IndividualMatch | null;
}

export default function MatchCompletedCard({ match }: MatchCompletedCardProps) {
  const [tournament, setTournament] = useState<any>(null);
  const [loadingTournament, setLoadingTournament] = useState(false);

  useEffect(() => {
    if (match?.tournament) {
      fetchTournament();
    }
  }, [match?.tournament]);

  const fetchTournament = async () => {
    if (!match?.tournament) return;
    
    setLoadingTournament(true);
    try {
      // Extract tournament ID - handle both ObjectId and populated object
      let tournamentId: string;
      if (typeof match.tournament === 'string') {
        tournamentId = match.tournament;
      } else if (match.tournament && typeof match.tournament === 'object') {
        // Handle ObjectId or populated object
        tournamentId = (match.tournament as any)._id?.toString() || match.tournament.toString();
      } else {
        tournamentId = String(match.tournament);
      }
      
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      setTournament(data.tournament);
    } catch (err) {
      console.error("Failed to fetch tournament:", err);
    } finally {
      setLoadingTournament(false);
    }
  };

  // Show loading state while fetching tournament data
  if (!match) return null;
  
  if (match.tournament && loadingTournament) {
    return (
      <Card className="mx-auto max-w-lg border-border shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Trophy className="h-6 w-6 text-emerald-600 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading tournament information...</p>
        </CardContent>
      </Card>
    );
  }

  const isTournamentMatch = !!match.tournament;
  
  // Extract tournament ID for navigation
  let tournamentId: string | null = null;
  if (isTournamentMatch) {
    if (typeof match.tournament === 'string') {
      tournamentId = match.tournament;
    } else if (match.tournament && typeof match.tournament === 'object') {
      tournamentId = (match.tournament as any)._id?.toString() || match.tournament.toString();
    } else {
      tournamentId = String(match.tournament);
    }
  }

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

  // Tournament match: Use enhanced styling with tournament badge
  if (isTournamentMatch) {
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
                {tournament?.name || "Tournament Match"}
              </span>
            </div>

            <CardContent className="p-8 space-y-6">
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
                {tournamentId && (
                  <Link href={`/tournaments/${tournamentId}`} className="flex-1">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back To Tournament
                    </Button>
                  </Link>
                )}
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

  // Regular match completion card
  return (
    <Card className="mx-auto max-w-lg border-border shadow-sm">
      <CardContent className="p-8 text-center space-y-4">
        {/* Status */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <Trophy className="h-6 w-6 text-emerald-600" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            Match completed
          </h2>
        </div>

        {/* Result */}
        <div className="space-y-2">
          <div className="text-lg">
            <span className="text-muted-foreground">Winner</span>
            <div className="font-semibold text-foreground">
              {renderWinnerName()}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Final score{" "}
            <span className="font-medium text-foreground">
              {matchScore}
            </span>
          </div>

          {match.matchDuration && (
            <div className="text-xs text-muted-foreground">
              Duration · {formatTimeDuration(match.matchDuration)}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="text-xs text-muted-foreground">
          Completed at {formatDate(new Date())}
        </div>

        {/* Actions */}
        <div className="pt-4">
          <Link href="/matches">
            <Button className="gap-2">
              <ArrowBigLeft className="h-4 w-4" />
              Back to matches
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}