"use client";

import { Button } from "@/components/ui/button";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { RotateCcw, Play, Pause, Square, Undo2 } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch } from "@/types/match.type";

interface CenterControlsProps {
  isMatchActive: boolean;
  onToggleMatch: () => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export default function CenterControls({
  isMatchActive,
  onToggleMatch,
  onReset,
  onUndo,
  canUndo,
}: CenterControlsProps) {
  const match = useMatchStore((s) => s.match);
  const isIndividual = match && isIndividualMatch(match);

  const isStartingMatch = useIndividualMatch((s) => s.isStartingMatch);
  const individualStatus = useIndividualMatch((s) => s.status);
  const isUpdatingScore = useIndividualMatch((s) => s.isUpdatingScore);
  const isUndoingIndividual = useIndividualMatch((s) => s.isUndoing);
  
  const isStartingSubMatch = useTeamMatch((s) => s.isStartingSubMatch);
  const teamStatus = useTeamMatch((s) => s.status);
  const isUpdatingTeamScore = useTeamMatch((s) => s.isUpdatingTeamScore);
  const isUndoingTeam = useTeamMatch((s) => s.isUndoing);

  const status = isIndividual ? individualStatus : teamStatus;
  const isStarting = isIndividual ? isStartingMatch : isStartingSubMatch;

  const isUpdating = isIndividual ? isUpdatingScore : isUpdatingTeamScore;
  const isUndoing = isIndividual ? isUndoingIndividual : isUndoingTeam;

  const isAnyOperationInProgress = isStarting || isUpdating || isUndoing;

  const handleToggleMatch = () => {
    if (!isMatchActive && match && isIndividual && !match.serverConfig?.firstServer) {
      onToggleMatch();
      return;
    }
    onToggleMatch();
  };

  const getButtonContent = () => {
    if (isStarting) {
      return <span>Processing...</span>;
    }

    if (status === "completed") {
      return (
        <div className="flex items-center gap-2">
          <Square className="w-4 h-4" />
          <span>Match Ended</span>
        </div>
      );
    }

    if (isMatchActive) {
      return (
        <div className="flex items-center gap-2">
          <Pause className="text-orange-400 size-4" />
          <span className="text-orange-400">Pause</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Play className="size-4" />
        <span>Start</span>
      </div>
    );
  };

  return (
    <section className="">
      <div className="flex items-center gap-4">
        <Button 
          onClick={onUndo}
          className="cursor-pointer py-5 text-gray-600"
          variant="outline"
          disabled={!canUndo || status === "completed" || isAnyOperationInProgress}
          title="Undo last point"
        >
          <Undo2 className="size-4" />
          Undo
        </Button>

        <Button 
          onClick={handleToggleMatch} 
          disabled={isAnyOperationInProgress || status === "completed"} 
          className={`cursor-pointer gap-2 text-base py-5 ${isMatchActive ? "bg-orange-100" : ""} ${isAnyOperationInProgress ? "opacity-50" : ""}`}
          variant={isMatchActive ? "destructive" : "default"}
        >
          {getButtonContent()}
        </Button>

        <Button 
          onClick={onReset} 
          className="cursor-pointer py-5 text-gray-600"
          variant="outline"
          disabled={isAnyOperationInProgress}
          title={status === "completed" ? "Restart Match" : "Reset Current Game"}
        >
          <RotateCcw className="size-4" />
          {status === "completed" ? "Restart" : "Reset"}
        </Button>
      </div>

      {status === "completed" && (
        <p className="text-xs text-gray-500 mt-2">
          Match completed. Use Reset to start over.
        </p>
      )}
    </section>
  );
}