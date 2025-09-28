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

        const side = pendingPlayer.side;
        const playerId = pendingPlayer.playerId;

        updateScore(side, 1, shotValue, playerId);
        setPendingPlayer(null);
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    }
  };

  return (
    <Dialog open={shotDialogOpen} onOpenChange={setShotDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pendingPlayer?.playerId
              ? "Select Shot Type"
              : "Who scored the point?"}
          </DialogTitle>
          <DialogDescription>
            {pendingPlayer?.playerId
              ? "Select the type of shot played"
              : "Select the player who scored the point"}
          </DialogDescription>
        </DialogHeader>

        {!pendingPlayer ? (
          <p>No player selected</p>
        ) : !pendingPlayer.playerId ? (
          // Doubles: ask which teammate
          <div className="grid grid-cols-2 gap-2">
            {(pendingPlayer.side === "side1"
              ? [
                  useMatchStore.getState().match?.participants[0],
                  useMatchStore.getState().match?.participants[1],
                ]
              : [
                  useMatchStore.getState().match?.participants[2],
                  useMatchStore.getState().match?.participants[3],
                ]
            ).map((p) => (
              <button
                key={p?._id}
                onClick={() => {
                  // ✅ set playerId now so we know who scored
                  setPendingPlayer({
                    side: pendingPlayer.side,
                    playerId: p?._id,
                  });
                }}
                className="border p-2 text-sm rounded-xl"
              >
                {p?.fullName || p?.username}
              </button>
            ))}
          </div>
        ) : (
          // Singles OR doubles after teammate chosen → show shot types
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
                        className="border-2 rounded-xl hover:scale-[1.02] active:scale-[0.97] transition ease-in-out"
                      >
                        {shot.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShotSelector;
