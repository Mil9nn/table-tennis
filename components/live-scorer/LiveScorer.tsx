"use client";

import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import SwaythlingFormatScorer from "./team/SwaythlingScorer";
import SingleDoubleSingleScorer from "./team/SingleDoubleSingleScorer";
import ThreeSinglesScorer from "./team/ThreeSinglesScorer";
import ExtendedFormatScorer from "./team/ExtendedFormatScorer";

import { useMatchStore } from "@/hooks/useMatchStore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { TeamMatch } from "@/types/match.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import CustomFormatScorer from "./team/CustomFormatScorer";

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

  const router = useRouter();

  useEffect(() => {
    if (matchId && category) fetchMatch(matchId, category);
  }, [matchId, fetchMatch, category]);

  useEffect(() => {
    if (!authLoading && !user) {
      fetchUser().catch(() => {
        // ignore error
      });
    }
  }, [authLoading, user, fetchUser]);

  useEffect(() => {
    if (authLoading || fetchingMatch) return;
    if (!match) return;

    // scorer id may be string or populated object
    const scorerId =
      typeof match.scorer === "string"
        ? match.scorer
        : match.scorer?._id ?? match.scorer?.toString();

    // If there's no authenticated user -> not allowed to score
    if (!user) {
      router.replace(`/matches/${match._id}/live`);
      return;
    }

    // Only redirect if current user is NOT the scorer
    if (scorerId && String(user._id) !== String(scorerId)) {
      router.replace(`/matches/${match._id}/live`);
    }
    // else: user is scorer -> allow to stay
  }, [authLoading, fetchingMatch, match, user, router]);

  if (fetchingMatch || authLoading)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
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

    if (match.matchType === "doubles" || match.matchType === "mixed_doubles") {
      return <DoublesScorer match={match} />;
    }
  }

  // ✅ Team Matches
  if (match.matchCategory === "team") {
    const teamMatch = match as TeamMatch;

    switch (teamMatch.matchFormat) {
      case "five_singles":
        return <SwaythlingFormatScorer match={teamMatch} />;

      case "single_double_single":
        return <SingleDoubleSingleScorer match={teamMatch} />;

      case "three_singles":
        return <ThreeSinglesScorer match={teamMatch} />;

      case "extended_format":
        return <ExtendedFormatScorer match={teamMatch} />;

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

    return <div>Unsupported match type</div>;
  }

  // Team Matches
  if (match.matchCategory === "team") {
    const teamMatch = match as TeamMatch;

    switch (teamMatch.matchFormat) {
      case "five_singles":
        return <SwaythlingFormatScorer match={teamMatch} />;

      case "single_double_single":
        return <SingleDoubleSingleScorer match={teamMatch} />;

      case "three_singles":
        return <ThreeSinglesScorer match={teamMatch} />;

      case "extended_format":
        return <ExtendedFormatScorer match={teamMatch} />;

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
}
