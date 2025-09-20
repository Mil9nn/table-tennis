"use client";

import SinglesScorer from "./individual/SinglesScorer";
import DoublesScorer from "./individual/DoublesScorer";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useEffect } from "react";
import { Loader, Loader2 } from "lucide-react";

export default function LiveScorer({ matchId }) {
  const match = useMatchStore((s) => s.match);
  const fetchMatch = useMatchStore((s) => s.fetchMatch);
  const loading = useMatchStore((s) => s.loading);

  useEffect(() => {
    if (matchId) fetchMatch(matchId);
  }, [matchId, fetchMatch]);

  if (loading) return <div className="flex items-center justify-center w-screen h-[calc(100vh-80px)]"><Loader2 className="animate-spin" /></div>
  if (!match) return <div>Match not found</div>;

  if (match.matchCategory === "individual") {
    if (match.matchType === "singles") {
      return <SinglesScorer match={match} />;
    }
    if (match.matchType === "doubles" || match.matchType === "mixed_doubles") {
      return <DoublesScorer match={match} />;
    }
  }

  return <div>Unsupported match type</div>;
}

