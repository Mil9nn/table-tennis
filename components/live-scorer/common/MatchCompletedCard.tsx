// components/live-scorer/common/MatchCompletedCard.tsx - Updated
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeDuration } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";
import { ArrowBigLeft, Trophy } from "lucide-react";
import TournamentMatchCompletedCard from "./TournamentMatchCompletedCard";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";

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
      const { data } = await axiosInstance.get(`/tournaments/${match.tournament}`);
      setTournament(data.tournament);
    } catch (err) {
      console.error("Failed to fetch tournament:", err);
    } finally {
      setLoadingTournament(false);
    }
  };

  // If this is a tournament match, show tournament-specific card
  if (match?.tournament && !loadingTournament) {
    return (
      <TournamentMatchCompletedCard 
        match={match} 
        tournamentId={match.tournament.toString()}
        tournamentName={tournament?.name}
      />
    );
  }

  // Regular match completion card
  if (!match) return null;

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