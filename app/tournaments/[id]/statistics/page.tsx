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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-600 font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Tournament not found</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Statistics Available</h3>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Statistics are only available for knockout tournaments or hybrid tournaments with completed knockout phase.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mt-2"
          >
            Return to Tournament
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Back to Tournament</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {tournament.name}
                </h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Statistics Overview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <KnockoutStatistics
          statistics={tournament.knockoutStatistics as KnockoutStatisticsType}
          category={tournament.category as "individual" | "team"}
        />
      </div>
    </div>
  );
}
