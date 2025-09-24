"use client";

import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { IndividualMatch } from "@/types/match.type";

export default function LiveScorer({ matchId }: { matchId: string }) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const loading = useMatchStore((s) => s.loading);

  useEffect(() => {
    if (matchId) fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  if (loading) return <div className="flex items-center justify-center w-full h-[calc(100vh-65px)]"><Loader2 className="animate-spin" /></div>
  if (!match) return <div>Match not found</div>;

  if (match.matchCategory === "individual") {
    const individualMatch = match as IndividualMatch;

    if (individualMatch.matchType === "singles") {
      return <SinglesScorer match={individualMatch} />;
    }

    if (individualMatch.matchType === "doubles" || individualMatch.matchType === "mixed_doubles") {
      return <DoublesScorer match={individualMatch} />;
    }
  }

  return <div>Unsupported match type</div>;
}

