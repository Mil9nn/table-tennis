"use client";

import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight, Users, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HybridStatus {
  isHybrid: boolean;
  format: string;
  currentPhase: string;
  phaseTransitionDate?: Date;
  roundRobinComplete: boolean;
  knockoutComplete: boolean;
  qualifiedCount: number;
  totalParticipants: number;
  hybridConfig: any;
  canTransition: boolean;
  nextAction: string;
  qualificationSummary?: {
    method: string;
    qualifiedCount: number;
    eliminatedCount: number;
    qualificationRate: number;
  };
  roundRobinProgress?: {
    useGroups: boolean;
    groups?: Array<{
      groupId: string;
      groupName: string;
      participantCount: number;
      roundsTotal: number;
      roundsCompleted: number;
      isComplete: boolean;
    }>;
    roundsTotal?: number;
    roundsCompleted?: number;
    isComplete?: boolean;
  };
  knockoutProgress?: {
    currentRound: number;
    totalRounds: number;
    roundsCompleted: number;
    bracketSize: number;
    isComplete: boolean;
  };
}

interface HybridTournamentManagerProps {
  tournamentId: string;
  isOrganizer: boolean;
  onUpdate?: () => void;
}

export function HybridTournamentManager({
  tournamentId,
  isOrganizer,
  onUpdate,
}: HybridTournamentManagerProps) {
  const [status, setStatus] = useState<HybridStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/tournaments/${tournamentId}/hybrid-status`
      );
      setStatus(data);
    } catch (err) {
      console.error("Error fetching hybrid status:", err);
      toast.error("Failed to load hybrid tournament status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const handleTransition = async () => {
    if (!window.confirm("Ready to transition to knockout phase? This cannot be undone.")) {
      return;
    }

    setTransitioning(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/transition-to-knockout`
      );

      toast.success(data.message);

      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning: string) => {
          toast.info(warning);
        });
      }

      await fetchStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      console.error("Error transitioning to knockout:", err);
      toast.error(err.response?.data?.error || "Failed to transition to knockout phase");
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.isHybrid) {
    return null;
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "round_robin":
        return "bg-blue-500";
      case "transition":
        return "bg-yellow-500";
      case "knockout":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getQualificationMethodLabel = (method: string) => {
    switch (method) {
      case "top_n_overall":
        return "Top N Overall";
      case "top_n_per_group":
        return "Top N Per Group";
      case "percentage":
        return "Top Percentage";
      default:
        return method;
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              Hybrid Tournament
            </CardTitle>
            <CardDescription>Round-Robin → Knockout Format</CardDescription>
          </div>
          <Badge className={`${getPhaseColor(status.currentPhase)} text-white`}>
            {status.currentPhase.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Phase Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                status.roundRobinComplete ? "bg-green-500" : "bg-blue-500 animate-pulse"
              }`}
            />
            <span className="text-sm font-medium">Round-Robin</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                status.currentPhase === "knockout"
                  ? status.knockoutComplete
                    ? "bg-green-500"
                    : "bg-purple-500 animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium">Knockout</span>
          </div>
        </div>

        {/* Round-Robin Progress */}
        {status.currentPhase === "round_robin" && status.roundRobinProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Round-Robin Progress</h4>
              {status.roundRobinComplete && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            {status.roundRobinProgress.useGroups && status.roundRobinProgress.groups ? (
              <div className="space-y-2">
                {status.roundRobinProgress.groups.map((group) => (
                  <div key={group.groupId} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{group.groupName}</span>
                      <span className="text-xs text-gray-500">
                        {group.roundsCompleted}/{group.roundsTotal} rounds
                      </span>
                    </div>
                    <Progress
                      value={(group.roundsCompleted / group.roundsTotal) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-xs text-gray-500">
                    {status.roundRobinProgress.roundsCompleted}/{status.roundRobinProgress.roundsTotal} rounds
                  </span>
                </div>
                <Progress
                  value={
                    ((status.roundRobinProgress.roundsCompleted || 0) /
                      (status.roundRobinProgress.roundsTotal || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Qualification Info */}
        {status.hybridConfig && (
          <div className="bg-white rounded-lg p-4 border space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-sm">Qualification</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Method</p>
                <p className="font-medium">
                  {getQualificationMethodLabel(status.hybridConfig.qualificationMethod)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Participants</p>
                <p className="font-medium">
                  {status.qualifiedCount > 0
                    ? `${status.qualifiedCount} qualified`
                    : `${status.totalParticipants} total`}
                </p>
              </div>
            </div>
            {status.qualificationSummary && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">
                  {status.qualificationSummary.qualifiedCount} advance,{" "}
                  {status.qualificationSummary.eliminatedCount} eliminated
                  {" "}({status.qualificationSummary.qualificationRate.toFixed(0)}% qualification rate)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Knockout Progress */}
        {status.currentPhase === "knockout" && status.knockoutProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Knockout Progress</h4>
              {status.knockoutComplete && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Round {status.knockoutProgress.currentRound} of {status.knockoutProgress.totalRounds}
                </span>
                <span className="text-xs text-gray-500">
                  {status.knockoutProgress.roundsCompleted} rounds complete
                </span>
              </div>
              <Progress
                value={
                  (status.knockoutProgress.roundsCompleted /
                    status.knockoutProgress.totalRounds) *
                  100
                }
                className="h-2"
              />
              <p className="text-xs text-gray-600">
                Bracket size: {status.knockoutProgress.bracketSize} participants
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isOrganizer && (
          <div className="space-y-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {status.nextAction}
              </AlertDescription>
            </Alert>

            {status.canTransition && status.currentPhase === "round_robin" && (
              <Button
                onClick={handleTransition}
                disabled={transitioning}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {transitioning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Transitioning to Knockout...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Start Knockout Phase
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Info Text for Participants */}
        {!isOrganizer && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              {status.currentPhase === "round_robin" && "Complete your round-robin matches to qualify for knockout!"}
              {status.currentPhase === "knockout" && "Knockout phase in progress. Good luck!"}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
