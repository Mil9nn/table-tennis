"use client";

import { useParams } from "next/navigation";
import LiveMatchDetails from "@/components/live-match/LiveMatchDetails";

export default function MatchLivePage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;

  return (
    <div className="bg-gray-50 min-h-screen">
      <LiveMatchDetails matchId={matchId} />
    </div>
  );
}
