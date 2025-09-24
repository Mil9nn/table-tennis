"use client";

import { Button } from "@/components/ui/button";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { RotateCcw, Play, Pause, Loader2 } from "lucide-react";

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
  const isStartingMatch = useIndividualMatch((s) => s.isStartingMatch);

  return (
    <section className="text-center space-y-4 col-span-2 md:col-span-1">
      <div className="flex justify-center space-x-2">
        {/* Play <-> Pause Toggle */}
        <Button
          variant={isMatchActive ? "destructive" : "default"}
          onClick={onToggleMatch}
          disabled={isStartingMatch} // optional, prevents double clicks
        >
          {isStartingMatch ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isMatchActive ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </Button>

        {/* Reset Button */}
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>
    </section>
  );
}
