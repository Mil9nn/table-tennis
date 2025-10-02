// components/live-scorer/LiveScorer.tsx
"use client";

import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import TeamMatchScorer from "./team/TeamMatchScorer";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { IndividualMatch } from "@/types/match.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";

export default function LiveScorer({ matchId }: { matchId: string }) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const loading = useMatchStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const router = useRouter();

  useEffect(() => {
    if (matchId) fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  useEffect(() => {
    if (!authLoading && !user) {
      fetchUser().catch(() => {
        // ignore error
      });
    }
  }, [authLoading, user, fetchUser]);

  useEffect(() => {
    if (authLoading || loading) return;
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
  }, [authLoading, loading, match, user, router]);

  if (loading || authLoading)
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!match) return <div>
    <p className="p-6 text-center">Match not found</p>
  </div>;

  // Handle Team Matches
  if (match.matchCategory === "team") {
    return <TeamMatchScorer matchId={matchId} />;
  }

  // Handle Individual Matches
  if (match.matchCategory === "individual") {
    const individualMatch = match as IndividualMatch;

    if (individualMatch.matchType === "singles") {
      return <SinglesScorer match={individualMatch} />;
    }

    if (
      individualMatch.matchType === "doubles" ||
      individualMatch.matchType === "mixed_doubles"
    ) {
      return <DoublesScorer match={individualMatch} />;
    }
  }

  return <div>Unsupported match type</div>;
}