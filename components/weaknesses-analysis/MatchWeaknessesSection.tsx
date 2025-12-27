// components/weaknesses-analysis/MatchWeaknessesSection.tsx

"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WeaknessInsightsPanel } from "./WeaknessInsightsPanel";
import { ServeReceiveWeaknessCard } from "./ServeReceiveWeaknessCard";
import { ZoneHeatmap } from "./ZoneHeatmap";
import { OpponentPatternAnalysis } from "./OpponentPatternAnalysis";
import { LineWeaknessChart } from "./LineWeaknessChart";
import { OriginDistanceAnalysis } from "./OriginDistanceAnalysis";
import {
  hasLineData,
  hasOriginDistanceData,
} from "@/lib/weaknesses-analysis-utils";
import { isUserParticipantInMatch } from "@/lib/matchHelpers";
import { IndividualMatch, TeamMatch } from "@/types/match.type";

interface MatchWeaknessesSectionProps {
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
}: MatchWeaknessesSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is participant before making API call
  const isParticipant = userId && match ? isUserParticipantInMatch(userId, match) : false;

  useEffect(() => {
    // Only fetch if user is a participant
    if (!isParticipant || !matchId) {
      setLoading(false);
      return;
    }

    const fetchWeaknesses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(
          `/matches/${matchId}/weaknesses?category=${category}`
        );

        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch weaknesses");
        }
      } catch (err: any) {
        console.error("Error fetching match weaknesses:", err);
        setError(err.response?.data?.message || "Failed to load weakness analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchWeaknesses();
  }, [matchId, category, isParticipant]);

  // Don't show anything if user is not a participant
  if (!isParticipant) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin h-6 w-6 text-[#3c6e71]" />
          <span className="text-[#353535]">Analyzing match weaknesses...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <AlertDescription className="ml-2">
          <p className="font-semibold text-[#353535]">No Analysis Available</p>
          <p className="text-sm text-[#353535]/70 mt-1">
            {error || "Insufficient data for weakness analysis in this match."}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // API now returns single participant object, not array
  const participant = data.participant || null;

  if (!participant || !participant.weaknesses) {
    return (
      <Alert className="border-[#d9d9d9]">
        <AlertCircle className="h-5 w-5 text-[#353535]" />
        <AlertDescription className="text-[#353535]">
          No participant data available for weakness analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // Show single participant view (user's own analysis)
  return (
    <div className="space-y-6 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={participant.profileImage} />
          <AvatarFallback className="bg-[#3c6e71]/10 text-[#3c6e71]">{participant.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-base text-[#353535]">Your Match Analysis</h3>
          <p className="text-sm text-[#d9d9d9]">Personal weakness analysis from this match</p>
        </div>
      </div>

      <WeaknessInsightsPanel insights={participant.weaknesses.overallInsights} />

      <ServeReceiveWeaknessCard
        serveStats={participant.weaknesses.serveReceiveWeaknesses.serve}
        receiveStats={participant.weaknesses.serveReceiveWeaknesses.receive}
      />

      <OpponentPatternAnalysis
        patterns={participant.weaknesses.opponentPatternAnalysis.successfulStrokes}
        maxDisplay={5}
      />

      <ZoneHeatmap
        zoneData={participant.weaknesses.zoneWeaknesses}
      />

      {/* Semantic Zone Analysis Section */}
      {participant.weaknesses.semanticZoneAnalysis && (
          <div className="grid md:grid-cols-2 gap-4">
            <LineWeaknessChart
              lineWeaknesses={participant.weaknesses.semanticZoneAnalysis.lineWeaknesses}
            />
            <OriginDistanceAnalysis
              distanceWeaknesses={participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses}
            />
        </div>
      )}
    </div>
  );
}
