"use client";

import { Button } from "@/components/ui/button";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { RotateCcw, Play, Pause, Square } from "lucide-react";
import { useMatchStore } from "@/hooks/useMatchStore";
import { isIndividualMatch } from "@/types/match.type";

interface CenterControlsProps {
  isMatchActive: boolean;
  onToggleMatch: () => void;
  onReset: () => void;
}

export default function CenterControls({
  isMatchActive,
  onToggleMatch,
  onReset,
}: CenterControlsProps) {
  const match = useMatchStore((s) => s.match);
  const isIndividual = match && isIndividualMatch(match);

  const isStartingMatch = useIndividualMatch((s) => s.isStartingMatch);
  const individualStatus = useIndividualMatch((s) => s.status);
  
  const isStartingSubMatch = useTeamMatch((s) => s.isStartingSubMatch);
  const teamStatus = useTeamMatch((s) => s.status);

  const status = isIndividual ? individualStatus : teamStatus;
  const isStarting = isIndividual ? isStartingMatch : isStartingSubMatch;

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
          <Pause className="text-orange-400 w-4 h-4" />
          <span className="text-orange-400">Pause Match</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Play className="size-5" />
        <span>Start Match</span>
      </div>
    );
  };

  return (
    <section className="text-center space-y-4 col-span-2 md:col-span-1">
      <div className="flex max-xxs:flex-col gap-2 justify-center space-x-2">
        <Button 
          onClick={handleToggleMatch} 
          disabled={isStarting || status === "completed"} 
          className={`cursor-pointer w-full gap-2 text-base py-6 ${isMatchActive ? "bg-orange-100" : ""}`}
          variant={isMatchActive ? "destructive" : "default"}
        >
          {getButtonContent()}
        </Button>

        <Button 
          onClick={onReset} 
          className="cursor-pointer py-6 text-gray-600"
          variant="outline"
          title={status === "completed" ? "Restart Match" : "Reset Current Game"}
        >
          <RotateCcw className="w-4 h-4" />
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