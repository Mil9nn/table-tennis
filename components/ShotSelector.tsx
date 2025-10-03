// components/ShotSelector.tsx
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
import { shotCategories } from "@/constants/constants";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { toast } from "sonner";

const ShotSelector = () => {
  const shotDialogOpen = useMatchStore((state) => state.shotDialogOpen);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const pendingPlayer = useMatchStore((state) => state.pendingPlayer);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);
  const match = useMatchStore((state) => state.match);

  // Get appropriate update function based on match type
  const updateScoreIndividual = useIndividualMatch((state) => state.updateScore);
  const addPointTeam = useTeamMatch((state) => state.addPoint);
  const currentSubMatchIndex = useTeamMatch((state) => state.currentSubMatchIndex);

  const isTeamMatch = match?.matchCategory === "team";
  const currentSubMatch = isTeamMatch && match ? 
    (match as any).subMatches?.[currentSubMatchIndex] : null;

  const handleShotSelect = async (shotValue: string) => {
    try {
      if (!pendingPlayer) return;

      setShotDialogOpen(false);

      const side = pendingPlayer.side;
      const playerId = pendingPlayer.playerId;

      if (isTeamMatch) {
        // Team match scoring
        if (!playerId) {
          toast.error("Player ID is required");
          return;
        }
        
        await addPointTeam({
          side,
          playerId,
          shotData: { stroke: shotValue, outcome: "rally" }
        });
      } else {
        // Individual match scoring
        updateScoreIndividual(side, 1, shotValue, playerId);
      }
      
      setPendingPlayer(null);
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    }
  };

  // Get available players for selection
  const getPlayersForSide = () => {
    if (!pendingPlayer || !match) return [];

    if (isTeamMatch && currentSubMatch) {
      // Team match: get players from current submatch
      const players = pendingPlayer.side === "side1"
        ? currentSubMatch.team1Players
        : currentSubMatch.team2Players;
      
      return players || [];
    } else {
      // Individual match: get from participants
      const participants = match.participants || [];
      if (match.matchType === "singles") {
        return pendingPlayer.side === "side1" ? [participants[0]] : [participants[1]];
      } else {
        // Doubles
        return pendingPlayer.side === "side1"
          ? [participants[0], participants[1]]
          : [participants[2], participants[3]];
      }
    }
  };

  const players = getPlayersForSide();
  const needsPlayerSelection = !pendingPlayer?.playerId && players.length > 1;

  return (
    <Dialog open={shotDialogOpen} onOpenChange={setShotDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {needsPlayerSelection
              ? "Who scored the point?"
              : "Select Shot Type"}
          </DialogTitle>
          <DialogDescription>
            {needsPlayerSelection
              ? "Select the player who scored the point"
              : "Select the type of shot played"}
          </DialogDescription>
        </DialogHeader>

        {!pendingPlayer ? (
          <p className="text-center text-gray-500">No player selected</p>
        ) : needsPlayerSelection ? (
          // Doubles: ask which teammate
          <div className="grid grid-cols-2 gap-3">
            {players.map((p: any) => (
              <button
                key={p?._id}
                onClick={() => {
                  setPendingPlayer({
                    side: pendingPlayer.side,
                    playerId: p?._id,
                  });
                }}
                className="border-2 p-4 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-blue-400 transition"
              >
                {p?.fullName || p?.username || "Unknown"}
              </button>
            ))}
          </div>
        ) : (
          // Show shot types
          <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
              {Object.entries(shotCategories).map(([category, shots]) => (
                <div key={category}>
                  <h3 className="font-medium capitalize mb-2 text-sm text-gray-700">
                    {category.replace(/_/g, " ")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {shots.map((shot) => (
                      <button
                        key={shot.value}
                        onClick={() => handleShotSelect(shot.value)}
                        className="border-2 rounded-xl p-3 text-sm hover:scale-[1.02] active:scale-[0.97] transition ease-in-out hover:bg-blue-50 hover:border-blue-400"
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