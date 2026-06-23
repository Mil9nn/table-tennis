// components/weaknesses-analysis/MatchWeaknessesSection.tsx

"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { WeaknessInsightsPanel } from "./WeaknessInsightsPanel";
import { ServeReceiveWeaknessCard } from "./ServeReceiveWeaknessCard";
import { ZoneHeatmap } from "./ZoneHeatmap";
import { OpponentPatternAnalysis } from "./OpponentPatternAnalysis";
import { LineWeaknessChart } from "./LineWeaknessChart";
import { OriginDistanceAnalysis } from "./OriginDistanceAnalysis";

import { isUserParticipantInMatch } from "@/lib/matchHelpers";
import { IndividualMatch, TeamMatch } from "@/types/match.type";

interface Props {
  matchId: string;
  category: "individual" | "team";
  match: IndividualMatch | TeamMatch | null;
  userId: string | null;
}

export function MatchWeaknessesSection({
  matchId,
  category,
  match,
  userId,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isParticipant =
    !!userId && !!match && isUserParticipantInMatch(userId, match);

  useEffect(() => {
    if (!isParticipant || !matchId) {
      setLoading(false);
      return;
    }

    const fetchWeaknesses = async () => {
      try {
        const res = await axiosInstance.get(
          `/matches/${matchId}/weaknesses?category=${category}`
        );

        if (res.data?.success) {
          setData(res.data.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeaknesses();
  }, [matchId, category, isParticipant]);

  if (!isParticipant) return null;

  /* Loading */
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#6b7280]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing match
        </div>
      </div>
    );
  }

  const participant = data?.participant;
  const weaknesses = participant?.weaknesses;

  if (!weaknesses) {
    return (
      <div className="rounded-lg bg-[#fafafa] p-4 text-sm text-[#6b7280]">
        No actionable weakness patterns were identified in this match.
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.profileImage} />
          <AvatarFallback className="bg-[#3c6e71]/10 text-[#3c6e71]">
            {participant.name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div>
          <h3 className="text-sm font-semibold text-[#353535]">
            Match weaknesses
          </h3>
          <p className="text-xs text-[#6b7280]">
            Based on this match
          </p>
        </div>
      </div>


      {/* Core insights */}
      <WeaknessInsightsPanel
        insights={weaknesses.overallInsights}
      />

      <ServeReceiveWeaknessCard
        serveStats={weaknesses.serveReceiveWeaknesses.serve}
        receiveStats={weaknesses.serveReceiveWeaknesses.receive}
      />

      <OpponentPatternAnalysis
        patterns={
          weaknesses.opponentPatternAnalysis.successfulStrokes
        }
        maxDisplay={5}
      />

      <ZoneHeatmap zoneData={weaknesses.zoneWeaknesses} />

      {weaknesses.semanticZoneAnalysis && (
        <div className="grid gap-4 md:grid-cols-2">
          <LineWeaknessChart
            lineWeaknesses={
              weaknesses.semanticZoneAnalysis.lineWeaknesses
            }
          />
          <OriginDistanceAnalysis
            distanceWeaknesses={
              weaknesses.semanticZoneAnalysis
                .originDistanceWeaknesses
            }
          />
        </div>
      )}
    </section>
  );
}
