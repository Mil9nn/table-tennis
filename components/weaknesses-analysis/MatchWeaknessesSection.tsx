// components/weaknesses-analysis/MatchWeaknessesSection.tsx

"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeaknessInsightsPanel } from "./WeaknessInsightsPanel";
import { ShotWeaknessChart } from "./ShotWeaknessChart";
import { ServeReceiveWeaknessCard } from "./ServeReceiveWeaknessCard";
import { ZoneHeatmap } from "./ZoneHeatmap";
import { OpponentPatternAnalysis } from "./OpponentPatternAnalysis";
import { ZoneSectorWeaknessTable } from "./ZoneSectorWeaknessTable";
import { LineWeaknessChart } from "./LineWeaknessChart";
import { OriginDistanceAnalysis } from "./OriginDistanceAnalysis";
import {
  hasZoneSectorData,
  hasLineData,
  hasOriginDistanceData,
} from "@/lib/weaknesses-analysis-utils";

interface MatchWeaknessesSectionProps {
  matchId: string;
  category: "individual" | "team";
}

export function MatchWeaknessesSection({
  matchId,
  category,
}: MatchWeaknessesSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    if (matchId) {
      fetchWeaknesses();
    }
  }, [matchId, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
          <span className="text-gray-600">Analyzing match weaknesses...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="ml-2">
          <p className="font-semibold text-yellow-900">No Analysis Available</p>
          <p className="text-sm text-yellow-800 mt-1">
            {error || "Insufficient data for weakness analysis in this match."}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const participants = data.participants || [];

  if (participants.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-5 w-5" />
        <AlertDescription>
          No participant data available for weakness analysis.
        </AlertDescription>
      </Alert>
    );
  }

  // If only one participant, show single view
  if (participants.length === 1) {
    const participant = participants[0];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={participant.profileImage} />
            <AvatarFallback>{participant.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{participant.name}</h3>
            <p className="text-sm text-gray-500">Match Weaknesses Analysis</p>
          </div>
        </div>

        <WeaknessInsightsPanel insights={participant.weaknesses.overallInsights} />

        <div className="grid md:grid-cols-2 gap-4">
          <ShotWeaknessChart
            shotWeaknesses={participant.weaknesses.shotWeaknesses.byStrokeType}
            variant="weaknesses"
            showTop={8}
          />
          <ZoneHeatmap
            zoneData={participant.weaknesses.zoneWeaknesses}
            viewMode="winRate"
          />
        </div>

        <ServeReceiveWeaknessCard
          serveStats={participant.weaknesses.serveReceiveWeaknesses.serve}
          receiveStats={participant.weaknesses.serveReceiveWeaknesses.receive}
        />

        <OpponentPatternAnalysis
          patterns={participant.weaknesses.opponentPatternAnalysis.successfulStrokes}
          maxDisplay={5}
        />

        {/* Semantic Zone Analysis Section */}
        {participant.weaknesses.semanticZoneAnalysis && (
          <div className="space-y-4 mt-6">
            {/* Only show header if at least one sub-section has data */}
            {(hasZoneSectorData(participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses) ||
              hasLineData(participant.weaknesses.semanticZoneAnalysis.lineWeaknesses) ||
              hasOriginDistanceData(participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses)) && (
              <div>
                <h3 className="text-xl font-semibold">Semantic Zone Analysis</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Advanced analysis using table zones, sectors, and shot trajectories
                </p>
              </div>
            )}

            {/* Each component returns null if no data */}
            <ZoneSectorWeaknessTable
              weaknesses={participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses}
              showAll={false}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <LineWeaknessChart
                lineWeaknesses={participant.weaknesses.semanticZoneAnalysis.lineWeaknesses}
              />
              <OriginDistanceAnalysis
                distanceWeaknesses={participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple participants - use tabs
  return (
    <Tabs defaultValue="0" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        {participants.map((participant: any, index: number) => (
          <TabsTrigger key={index} value={index.toString()} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={participant.profileImage} />
              <AvatarFallback>{participant.name[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate">{participant.name}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {participants.map((participant: any, index: number) => (
        <TabsContent key={index} value={index.toString()} className="space-y-6">
          <WeaknessInsightsPanel insights={participant.weaknesses.overallInsights} />

          <div className="grid md:grid-cols-2 gap-4">
            <ShotWeaknessChart
              shotWeaknesses={participant.weaknesses.shotWeaknesses.byStrokeType}
              variant="weaknesses"
              showTop={8}
            />
            <ZoneHeatmap
              zoneData={participant.weaknesses.zoneWeaknesses}
              viewMode="winRate"
            />
          </div>

          <ServeReceiveWeaknessCard
            serveStats={participant.weaknesses.serveReceiveWeaknesses.serve}
            receiveStats={participant.weaknesses.serveReceiveWeaknesses.receive}
          />

          <OpponentPatternAnalysis
            patterns={participant.weaknesses.opponentPatternAnalysis.successfulStrokes}
            maxDisplay={5}
          />

          {/* Semantic Zone Analysis Section */}
          {participant.weaknesses.semanticZoneAnalysis && (
            <div className="space-y-4 mt-6">
              {/* Only show header if at least one sub-section has data */}
              {(hasZoneSectorData(participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses) ||
                hasLineData(participant.weaknesses.semanticZoneAnalysis.lineWeaknesses) ||
                hasOriginDistanceData(participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses)) && (
                <div>
                  <h3 className="text-xl font-semibold">Semantic Zone Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Advanced analysis using table zones, sectors, and shot trajectories
                  </p>
                </div>
              )}

              {/* Each component returns null if no data */}
              <ZoneSectorWeaknessTable
                weaknesses={participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses}
                showAll={false}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <LineWeaknessChart
                  lineWeaknesses={participant.weaknesses.semanticZoneAnalysis.lineWeaknesses}
                />
                <OriginDistanceAnalysis
                  distanceWeaknesses={participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses}
                />
              </div>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
