"use client";

import { Button } from "@/components/ui/button";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { RotateCcw, Play, Pause } from "lucide-react";
import Link from "next/link";

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
        <Button onClick={onToggleMatch} disabled={isStartingMatch} className="cursor-pointer w-full gap-2 text-base py-6" asChild>
            {
              isStartingMatch ? (
                <span>Processing...</span>
              ) : isMatchActive ? (
                <div>
                  <Pause className="text-red-400 w-6 h-6" />
                  <span className="text-red-400">Pause Match</span>
                </div>
              ) : (
                <div>
                  <Play className="w-6 h-6" />
                  Start Match
                </div>
              )
            }
        </Button>

        {/* Reset Button */}
        <Button onClick={onReset} className="cursor-pointr text-gray-200 py-6">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </section>
  );
}
