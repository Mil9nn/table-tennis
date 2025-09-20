"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Play, Pause } from "lucide-react";

export default function CenterControls({
  isMatchActive,
  onToggleMatch,
  onReset,
}) {
  return (
    <section className="text-center space-y-4 col-span-2 md:col-span-1">
      <div className="text-2xl font-bold text-gray-400">VS</div>

      <div className="flex justify-center space-x-2">
        <Button
          variant={isMatchActive ? "destructive" : "default"}
          onClick={onToggleMatch}
        >
          {isMatchActive ? (
            <>
              <Pause className="w-4 h-4 mr-1" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> Start
            </>
          )}
        </Button>

        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>
    </section>
  );
}