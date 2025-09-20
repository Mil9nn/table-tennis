"use client";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import Image from "next/image";
import { shotCategories } from "@/constants/constants";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { toast } from "sonner";

const ShotSelector = () => {
  const shotDialogOpen = useMatchStore((state) => state.shotDialogOpen);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const pendingPlayer = useMatchStore((state) => state.pendingPlayer);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);

  // ✅ use updateScore from individual match hook (not global store)
  const updateScore = useIndividualMatch((state) => state.updateScore);

  const handleShotSelect = async (shotValue: string) => {
    try {
      if (pendingPlayer) {
        // close immediately
        setShotDialogOpen(false);
        
        // store side safely before clearing
        const side = pendingPlayer.side;
        const playerId = pendingPlayer.playerId;

        setPendingPlayer(null);

        // update in background
        updateScore(side, 1, shotValue);
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    }
  };

  return (
    <Dialog open={shotDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Shot Type</DialogTitle>
        </DialogHeader>
        <DialogDescription>Select the type of shot played.</DialogDescription>

        <ScrollArea className="h-96">
          <div className="space-y-4">
            {Object.entries(shotCategories).map(([category, shots]) => (
              <div key={category}>
                <h3 className="font-medium capitalize mb-2">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {shots.map((shot) => (
                    <button
                      key={shot.value}
                      onClick={() => handleShotSelect(shot.value)}
                      className="flex flex-col items-center border-2 rounded-xl hover:scale-[1.02] active:scale-[0.97] transition ease-in-out"
                    >
                      <Image
                        src="/Backhand Block.png"
                        alt={shot.label}
                        width={100}
                        height={100}
                      />
                      {shot.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ShotSelector;
