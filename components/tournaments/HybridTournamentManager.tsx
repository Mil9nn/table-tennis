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
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
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
      case "top_n_per_group":
        return "Top N Per Group";
      default:
        return method;
    }
  };

  return (
    <Card className="rounded-none shadow-none">
      <CardContent className="space-y-4">
        {/* Phase Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                status.roundRobinComplete ? "bg-green-500" : "bg-blue-500 animate-pulse"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wide">Round-Robin</span>
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
            <span className="text-xs font-semibold uppercase tracking-wide">Knockout</span>
          </div>
        </div>

        {/* Round-Robin Progress */}
        {status.currentPhase === "round_robin" && status.roundRobinProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wide">Round-Robin Progress</h4>
              {status.roundRobinComplete && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            {status.roundRobinProgress.useGroups && status.roundRobinProgress.groups ? (
              <div className="bg-white rounded-lg px-2 overflow-hidden">
                {status.roundRobinProgress.groups.map((group) => (
                  <div key={group.groupId} className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{group.groupName}</span>
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
                  <span className="text-xs font-semibold">Overall Progress</span>
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
            {status.qualificationSummary && (
              <div className="">
                <p className="text-xs text-gray-600">
                  {status.qualificationSummary.qualifiedCount} advance and {" "}
                  {status.qualificationSummary.eliminatedCount} eliminated
                </p>
              </div>
            )}
          </div>
        )}

        {/* Knockout Progress */}
        {status.currentPhase === "knockout" && status.knockoutProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wide">Knockout Progress</h4>
              {status.knockoutComplete && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
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
              <AlertDescription className="text-xs font-medium">
                {status.nextAction}
              </AlertDescription>
            </Alert>

            {status.canTransition && status.currentPhase === "round_robin" && (
              <Button
                onClick={handleTransition}
                disabled={transitioning}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {transitioning ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    <span className="text-xs font-medium">Transitioning to Knockout...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="h-3 w-3 mr-2" />
                    <span className="text-xs font-medium">Start Knockout Phase</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
