"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KnockoutStatistics } from "@/components/tournaments/KnockoutStatistics";
import { Tournament } from "@/types/tournament.type";
import { KnockoutStatistics as KnockoutStatisticsType } from "@/types/knockoutStatistics.type";

export default function TournamentStatisticsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/tournaments/${tournamentId}`
        );
        setTournament(data.tournament);
      } catch (err) {
        console.error("Error fetching tournament:", err);
        toast.error("Failed to load tournament");
        router.push(`/tournaments/${tournamentId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Tournament not found</p>
      </div>
    );
  }

  // Check if tournament is in knockout phase and has statistics
  // Allow both pure knockout tournaments and hybrid tournaments with completed knockout phase
  const isInKnockoutPhase =
    tournament.format === "knockout" ||
    (tournament.format === "hybrid" && tournament.currentPhase === "knockout");

  if (!isInKnockoutPhase || !tournament.knockoutStatistics) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournament
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">
                No statistics available. This feature is only available for
                knockout tournaments or hybrid tournaments with completed knockout phase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Statistics Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <KnockoutStatistics
          statistics={tournament.knockoutStatistics as KnockoutStatisticsType}
          category={tournament.category as "individual" | "team"}
        />
      </div>
    </div>
  );
}
