"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isIndividualMatch } from "@/types/match.type";
import { useMatchStore } from "@/hooks/useMatchStore";
import { TeamMatchFormat } from "@/components/match-details/TeamMatchInfo";
import TeamMatchLineup from "@/components/match-details/TeamMatchLineup";
import MatchInfo from "@/components/match-details/MatchInfo";
import GamesHistory from "@/components/match-details/GameHistory";
import MatchActions from "@/components/match-details/MatchActions";
import MatchScore from "@/components/match-details/MatchScore";
import MatchStatusBadge from "@/components/MatchStatusBadge";

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matchId = params.id as string;
  const categoryParam = searchParams.get("category");

  const fetchMatch = useMatchStore((state) => state.fetchMatch);
  const fetchingMatch = useMatchStore((state) => state.fetchingMatch);
  const match = useMatchStore((state) => state.match);
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const authLoading = useAuthStore((state) => state.authLoading);

  useEffect(() => {
    fetchMatch(matchId, categoryParam === "team" ? "team" : "individual");
  }, [matchId, categoryParam]);

  // Ensure user is loaded
  useEffect(() => {
    if (!authLoading && !user) {
      fetchUser().catch(() => {});
    }
  }, [authLoading, user, fetchUser]);

  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center gap-2 px-4">
        <Loader2 className="animate-spin size-5 text-blue-600" />
        <span className="text-sm font-medium">Loading match...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-12 px-4 text-center text-lg font-semibold">
        Match not found
      </div>
    );
  }

  // Handle scorer comparison - scorer can be string, ObjectId, or populated object
  const getScorerId = (scorer: any): string | null => {
    if (!scorer) return null;
    if (typeof scorer === "string") return scorer;
    if (scorer._id) return String(scorer._id);
    if (scorer.toString) return String(scorer);
    return null;
  };

  const scorerId = getScorerId(match.scorer);
  const userId = user?._id ? String(user._id) : null;
  const isScorer = !!(scorerId && userId && scorerId === userId);
  
  // Debug logging (remove after fixing)
  if (process.env.NODE_ENV === "development") {
    console.log("Match scorer check:", {
      scorerId,
      userId,
      scorerRaw: match.scorer,
      isScorer,
      matchStatus: match.status,
      scorerType: typeof match.scorer,
    });
  }
  const isSingles = isIndividualMatch(match) && match.matchType === "singles";

  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="capitalize font-semibold text-zinc-900 dark:text-zinc-100">
                {isIndividualMatch(match) ? `${match.matchType} Match` : "Team Match"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Match Details</p>
            </div>
            <MatchStatusBadge status={match.status} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Score Card */}
        <MatchScore match={match} />

        {/* Team Participants (Team matches only) */}
        {!isIndividualMatch(match) && (
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <TeamMatchFormat match={match} />
            <TeamMatchLineup match={match} />
          </section>
        )}

        {/* Match Info */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <MatchInfo match={match} />
        </section>

        {/* Games History (Individual only) */}
        {isIndividualMatch(match) && match.games?.length > 0 && (
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <GamesHistory match={match} />
          </section>
        )}

        {/* Actions */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <MatchActions match={match} matchId={matchId} isScorer={isScorer} />
        </section>
      </main>
    </div>
  );
}
