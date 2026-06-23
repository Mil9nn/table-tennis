"use client";

import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import SwaythlingFormatScorer from "./team/SwaythlingScorer";
import SingleDoubleSingleScorer from "./team/SingleDoubleSingleScorer";
import CustomFormatScorer from "./team/CustomFormatScorer";

import { useMatchStore } from "@/hooks/useMatchStore";
import { useMatchSocket } from "@/hooks/useMatchSocket";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TeamMatch } from "@/types/match.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";

export default function LiveScorer({
  matchId,
  category,
}: {
  matchId: string;
  category?: "individual" | "team";
}) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const fetchingMatch = useMatchStore((s) => s.fetchingMatch);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [isTournamentScorer, setIsTournamentScorer] = useState(false);
  const [checkingTournamentScorer, setCheckingTournamentScorer] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (matchId && category) fetchMatch(matchId, category);
  }, [matchId, fetchMatch, category]);

  // Track when match has initially loaded to prevent showing loader during scoring
  useEffect(() => {
    if (match && !fetchingMatch && !authLoading) {
      setHasInitiallyLoaded(true);
    }
  }, [match, fetchingMatch, authLoading]);

  // Socket integration for real-time updates (scorer role)
  const { isConnected, isJoined } = useMatchSocket({
    matchId,
    matchCategory: category || "individual",
    role: "scorer",
    enabled: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      fetchUser().catch(() => {});
    }
  }, [authLoading, user, fetchUser]);

  // Check if user is a tournament scorer when match is loaded
  useEffect(() => {
    const checkTournamentScorer = async () => {
      // If no match, user, or tournament, mark as not a tournament scorer and don't check
      if (!match || !user || !match.tournament) {
        setIsTournamentScorer(false);
        setCheckingTournamentScorer(false);
        return;
      }

      // Start checking immediately to prevent redirect during check
      setCheckingTournamentScorer(true);

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
        setCheckingTournamentScorer(false);
        return;
      }

      // Otherwise, fetch tournament to check scorer permissions
      const tournamentId =
        typeof match.tournament === "string"
          ? match.tournament
          : tournament?._id || tournament?.id;

      if (!tournamentId) {
        setIsTournamentScorer(false);
        setCheckingTournamentScorer(false);
        return;
      }

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

  useEffect(() => {
    if (authLoading || fetchingMatch) return;
    if (!match) return;
    if (!user) {
      router.replace(`/matches/${match._id}/live`);
      return;
    }

    const scorerId =
      typeof match.scorer === "string"
        ? match.scorer
        : match.scorer?._id ?? match.scorer?.toString();

    // Check if user is the match scorer
    const isMatchScorer = scorerId && String(user._id) === String(scorerId);

    // If match has a tournament, check tournament scorer permissions
    if (match.tournament) {
      const tournament = match.tournament as any;
      
      // If tournament data is already populated, check synchronously
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
        const isTournamentScorerSync = isOrganizer || isInScorersArray;

        // User can score if they are match scorer OR tournament scorer
        const canScore = isMatchScorer || isTournamentScorerSync;

        if (!canScore) {
          router.replace(`/matches/${match._id}/live`);
        }
        return;
      }

      // Tournament data not populated - wait for async check to complete
      if (checkingTournamentScorer) return;
      
      // Tournament check completed - use the result
      const canScore = isMatchScorer || isTournamentScorer;
      
      if (!canScore) {
        router.replace(`/matches/${match._id}/live`);
      }
      return;
    }

    // No tournament - only check match scorer
    if (!isMatchScorer) {
      router.replace(`/matches/${match._id}/live`);
    }
  }, [authLoading, fetchingMatch, checkingTournamentScorer, match, user, isTournamentScorer, router]);

  // Only show loader on initial load, not during scoring operations
  // Once match is loaded, keep the UI visible even during updates
  if (!hasInitiallyLoaded && (fetchingMatch || authLoading || checkingTournamentScorer))
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!match)
    return (
      <div>
        <p className="p-6 text-center">Match not found</p>
      </div>
    );

  // Individual Matches
  if (match.matchCategory === "individual") {
    if (match.matchType === "singles") {
      return <SinglesScorer match={match} />;
    }

    if (match.matchType === "doubles") {
      return <DoublesScorer match={match} />;
    }
  }

  // Team Matches
  if (match.matchCategory === "team") {
    const teamMatch = match as TeamMatch;

    switch (teamMatch.matchFormat) {
      case "five_singles":
        return <SwaythlingFormatScorer match={teamMatch} />;

      case "single_double_single":
        return <SingleDoubleSingleScorer match={teamMatch} />;

      case "custom":
        return <CustomFormatScorer match={teamMatch} />;

      default:
        return (
          <div className="p-8 text-center">
            <p className="text-red-600 font-semibold">
              Format "{teamMatch.matchFormat}" is not yet supported
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact support or select a different format
            </p>
          </div> 
        );
    }
  }

  return <div>Unsupported match type</div>;
}
