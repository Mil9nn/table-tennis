"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Loader2, Info } from "lucide-react";
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
import { axiosInstance } from "@/lib/axiosInstance";

export default function MatchDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchId = params.id as string;
  const categoryParam = searchParams.get("category");

  const fetchMatch = useMatchStore((state) => state.fetchMatch);
  const fetchingMatch = useMatchStore((state) => state.fetchingMatch);
  const match = useMatchStore((state) => state.match);
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const authLoading = useAuthStore((state) => state.authLoading);
  const [isTournamentScorer, setIsTournamentScorer] = useState(false);
  const [checkingTournamentScorer, setCheckingTournamentScorer] =
    useState(false);
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    fetchMatch(matchId, categoryParam === "team" ? "team" : "individual");
  }, [matchId, categoryParam, fetchMatch]);

  // Only fetch user once if it's still null after AuthProvider has had a chance to initialize
  // AuthProvider sets user from server-side data, so we only fetch as a fallback
  useEffect(() => {
    // Only attempt once per component mount
    if (hasAttemptedFetch.current) return;
    hasAttemptedFetch.current = true;

    // Use a small delay to let AuthProvider's useEffect run first
    const timer = setTimeout(() => {
      // Check current state at the time the timer fires
      const currentUser = useAuthStore.getState().user;
      const currentAuthLoading = useAuthStore.getState().authLoading;

      if (!currentUser && !currentAuthLoading) {
        fetchUser().catch(() => {
          // Errors are handled silently - 404/401 are expected for unauthenticated users
        });
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Check if user is a tournament scorer when match is loaded
  useEffect(() => {
    const checkTournamentScorer = async () => {
      if (!match || !user || !match.tournament) {
        setIsTournamentScorer(false);
        return;
      }

      const tournament = match.tournament as any;

      // If tournament is already populated with organizer/scorers, use that data
      if (tournament.organizer || tournament.scorers) {
        const isOrganizer =
          tournament.organizer?._id === user._id ||
          tournament.organizer?.toString() === user._id ||
          (typeof tournament.organizer === "string" &&
            tournament.organizer === user._id);
        const isInScorersArray = tournament.scorers?.some(
          (scorer: any) =>
            scorer._id === user._id ||
            scorer.toString() === user._id ||
            (typeof scorer === "string" && scorer === user._id)
        );

        setIsTournamentScorer(isOrganizer || isInScorersArray);
        return;
      }

      // Otherwise, fetch tournament to check scorer permissions
      const tournamentId =
        typeof match.tournament === "string"
          ? match.tournament
          : tournament?._id || tournament?.id;

      if (!tournamentId) {
        setIsTournamentScorer(false);
        return;
      }

      setCheckingTournamentScorer(true);
      try {
        const { data } = await axiosInstance.get(
          `/tournaments/${tournamentId}`
        );
        const fetchedTournament = data.tournament;

        // Check if user is organizer or in scorers array
        const isOrganizer =
          fetchedTournament.organizer?._id === user._id ||
          fetchedTournament.organizer?.toString() === user._id;
        const isInScorersArray = fetchedTournament.scorers?.some(
          (scorer: any) =>
            scorer._id === user._id ||
            scorer.toString() === user._id ||
            (typeof scorer === "string" && scorer === user._id)
        );

        setIsTournamentScorer(isOrganizer || isInScorersArray);
      } catch (err) {
        console.error("Error checking tournament scorer:", err);
        setIsTournamentScorer(false);
      } finally {
        setCheckingTournamentScorer(false);
      }
    };

    checkTournamentScorer();
  }, [match, user]);

  if (fetchingMatch) {
    return (
      <div className="w-full h-[calc(100vh-70px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin size-6 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-600">
          Retrieving Match Data...
        </span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Match Not Found
        </h2>
        <p className="text-zinc-500 mt-2">
          The record you are looking for does not exist or has been moved.
        </p>
      </div>
    );
  }

  const getScorerId = (scorer: any): string | null => {
    if (!scorer) return null;
    if (typeof scorer === "string") return scorer;
    return scorer._id ? String(scorer._id) : null;
  };

  // Check if user is the assigned match scorer
  const isMatchScorer = !!(
    getScorerId(match.scorer) &&
    user?._id &&
    getScorerId(match.scorer) === String(user._id)
  );

  // User can score if they are:
  // 1. The assigned match scorer, OR
  // 2. A tournament scorer (organizer or in scorers array)
  const isScorer = isMatchScorer || isTournamentScorer;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-zinc-900/85 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">
                {isIndividualMatch(match) ? "Individual Match" : "Team Match"}
              </p>
              <h1 className="text-sm font-semibold tracking-tight">
                Match Details
              </h1>
            </div>
          </div>

          <MatchStatusBadge status={match.status} />
        </div>
      </header>

      {/* PAGE BODY */}
      <main className="max-w-6xl mx-auto px-2">
        <div className="">
          {/* Match Information */}
          <div className="bg-white">
            <MatchInfo match={match} />
          </div>

          {/* Match Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 bg-white">
            <section className="">
              <MatchScore match={match} />

              {!isIndividualMatch(match) && (
                <>
                  <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Teams & Lineup
                    </h3>
                  </div>

                  <TeamMatchFormat match={match} />
                  <TeamMatchLineup match={match} />
                </>
              )}

              {isIndividualMatch(match) && match.games?.length > 0 && (
                <GamesHistory match={match} />
              )}
            </section>

            {/* Actions */}
            <aside className="">
              <MatchActions match={match} matchId={matchId} isScorer={isScorer} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
