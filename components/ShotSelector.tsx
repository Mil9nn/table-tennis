"use client";

import React, { useState, useEffect } from "react";
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
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import TableCourt from "./TableCourt";
import { Button } from "./ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { formatStrokeName } from "@/lib/utils";

type SelectionStep = "player" | "shot" | "serveType" | "origin" | "landing";

const ShotSelector = () => {
  const shotDialogOpen = useMatchStore((state) => state.shotDialogOpen);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const pendingPlayer = useMatchStore((state) => state.pendingPlayer);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);
  const match = useMatchStore((state) => state.match);

  const [currentStep, setCurrentStep] = useState<SelectionStep>("player");
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const [originPoint, setOriginPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [landingPoint, setLandingPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedServeType, setSelectedServeType] = useState<string | null>(null);

  const updateScoreIndividual = useIndividualMatch(
    (state) => state.updateScore
  );
  const updateScoreTeam = useTeamMatch((state) => state.updateSubMatchScore);

  const getPlayersForSide = () => {
    if (!pendingPlayer || !match) return [];

    if (isIndividualMatch(match)) {
      const participants = match.participants || [];
      if (match.matchType === "singles") {
        return pendingPlayer.side === "side1"
          ? [participants[0]]
          : [participants[1]];
      } else {
        return pendingPlayer.side === "side1"
          ? [participants[0], participants[1]]
          : [participants[2], participants[3]];
      }
    }

    if (isTeamMatch(match)) {
      const currentSubMatch = useTeamMatch.getState().currentSubMatch;
      if (!currentSubMatch) return [];

      const isTeam1 =
        pendingPlayer.side === "team1" || pendingPlayer.side === "side1";
      const players = isTeam1
        ? Array.isArray(currentSubMatch.playerTeam1)
          ? currentSubMatch.playerTeam1
          : [currentSubMatch.playerTeam1]
        : Array.isArray(currentSubMatch.playerTeam2)
        ? currentSubMatch.playerTeam2
        : [currentSubMatch.playerTeam2];

      return players;
    }

    return [];
  };

  const players = getPlayersForSide();
  const needsPlayerSelection = !pendingPlayer?.playerId && players.length > 1;

  // ✅ Auto-advance to shot selection if player is already known
  useEffect(() => {
    if (shotDialogOpen && currentStep === "player") {
      if (!needsPlayerSelection) {
        // Singles or playerId already set - skip to shot selection
        if (players.length === 1 && !pendingPlayer?.playerId) {
          setPendingPlayer({
            side: pendingPlayer?.side || "side1",
            playerId: (players[0] as any)?._id ?? (players[0] as string),
          });
        }
        setCurrentStep("shot");
      }
    }
  }, [
    shotDialogOpen,
    needsPlayerSelection,
    players,
    pendingPlayer,
    currentStep,
  ]);

  // Reset state when dialog closes
  const handleClose = () => {
    setShotDialogOpen(false);
    setCurrentStep("player");
    setSelectedShot(null);
    setSelectedServeType(null);
    setOriginPoint(null);
    setLandingPoint(null);
    setPendingPlayer(null);
  };

  const handleShotSelect = (shotValue: string) => {
    setSelectedShot(shotValue);
    // If it's a serve point, ask for serve type first
    if (shotValue === "serve_point") {
      setCurrentStep("serveType");
      return;
    }
    setCurrentStep("origin");
  };

  const handleOriginSelect = (x: number, y: number) => {
    setOriginPoint({ x, y });
    setCurrentStep("landing");
  };

  const handleLandingSelect = async (x: number, y: number) => {
    setLandingPoint({ x, y });

    if (!pendingPlayer || !match || !selectedShot || !originPoint) return;

    const { side, playerId } = pendingPlayer;

    // Create shot data with location and serveType (if set)
    const shotData: any = {
      originX: originPoint.x,
      originY: originPoint.y,
      landingX: x,
      landingY: y,
    };

    if (selectedShot === "serve_point") {
      shotData.serveType = selectedServeType || null;
    }

    try {
      if (isIndividualMatch(match)) {
        await updateScoreIndividual(side, 1, selectedShot, playerId, shotData);
      } else if (isTeamMatch(match)) {
        const teamSide =
          side === "side1" ? "team1" : side === "side2" ? "team2" : side;
        await updateScoreTeam(
          teamSide as any,
          1,
          selectedShot,
          playerId,
          shotData
        );
      }

      handleClose();
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    }
  };

  const handleBack = () => {
    if (currentStep === "landing") {
      setCurrentStep("origin");
      setLandingPoint(null);
    } else if (currentStep === "origin") {
      // If we came from serveType step, go back there
      if (selectedShot === "serve_point") {
        setCurrentStep("serveType");
      } else {
        setCurrentStep("shot");
      }
      setOriginPoint(null);
    } else if (currentStep === "serveType") {
      setCurrentStep("shot");
      setSelectedServeType(null);
    } else if (currentStep === "shot") {
      if (needsPlayerSelection) {
        setCurrentStep("player");
        setSelectedShot(null);
      }
    }
  };

  const getCourtSides = () => {
    if (!pendingPlayer) return { originSide: null, landingSide: null };

    // side1/team1 plays on left side, side2/team2 plays on right side
    const isLeftSide =
      pendingPlayer.side === "side1" || pendingPlayer.side === "team1";

    return {
      originSide: isLeftSide ? ("left" as const) : ("right" as const),
      landingSide: isLeftSide ? ("right" as const) : ("left" as const),
    };
  };

  return (
    <Dialog open={shotDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(currentStep === "origin" ||
              currentStep === "landing" ||
              (currentStep === "shot" && needsPlayerSelection)) && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              
              <DialogDescription className="text-xs text-gray-600/80">
                {currentStep === "player" && "Select the player who scored"}
                {currentStep === "shot" && "Choose the type of shot played"}
                {currentStep === "origin" &&
                  "Click on the table where the shot originated"}
                {currentStep === "landing" &&
                  "Click on the table where the ball landed"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Player Selection (for doubles) */}
        {currentStep === "player" && needsPlayerSelection && (
          <div className="grid grid-cols-2 gap-3">
            {players.map((p: any) => (
              <button
                key={p?._id}
                onClick={() => {
                  setPendingPlayer({
                    side: pendingPlayer?.side!,
                    playerId: (p as any)?._id ?? (p as string),
                  });
                  setCurrentStep("shot");
                }}
                className="border-2 p-4 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-blue-400 transition"
              >
                {p?.fullName || p?.username || "Unknown"}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Shot Type Selection */}
        {currentStep === "shot" && (
          <ScrollArea className="h-96">
            <div className="space-y-4 p-1 sm:grid sm:grid-cols-2 sm:gap-4">
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
                        className="border-2 rounded-xl p-2 text-sm hover:scale-[1.02] active:scale-[0.97] transition ease-in-out hover:bg-blue-50 hover:border-blue-400"
                      >
                        {formatStrokeName(shot.value)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}

        {/* Step 2.5: Serve Type Selection (only for serve_point) */}
        {currentStep === "serveType" && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Select Serve Type</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedServeType("side_spin");
                  setCurrentStep("origin");
                }}
                className="border-2 rounded-xl p-2 text-sm hover:bg-blue-50 hover:border-blue-400"
              >
                Side-spin Serve
              </button>

              <button
                onClick={() => {
                  setSelectedServeType("top_spin");
                  setCurrentStep("origin");
                }}
                className="border-2 rounded-xl p-2 text-sm hover:bg-blue-50 hover:border-blue-400"
              >
                Top-spin Serve
              </button>

              <button
                onClick={() => {
                  setSelectedServeType("back_spin");
                  setCurrentStep("origin");
                }}
                className="border-2 rounded-xl p-2 text-sm hover:bg-blue-50 hover:border-blue-400"
              >
                Back-spin Serve
              </button>

              <button
                onClick={() => {
                  setSelectedServeType("mix_spin");
                  setCurrentStep("origin");
                }}
                className="border-2 rounded-xl p-2 text-sm hover:bg-blue-50 hover:border-blue-400"
              >
                Mix/Variable-spin Serve
              </button>

              <button
                onClick={() => {
                  setSelectedServeType("no_spin");
                  setCurrentStep("origin");
                }}
                className="border-2 rounded-xl p-2 text-sm hover:bg-blue-50 hover:border-blue-400 col-span-2"
              >
                No-spin Serve
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Origin Point Selection */}
        {currentStep === "origin" && (
          <div className="space-y-4">
            <TableCourt
              onCourtClick={handleOriginSelect}
              selectedPoint={originPoint}
              label="Shot Origin"
              restrictToSide={getCourtSides().originSide}
              mode="origin"
            />
          </div>
        )}

        {/* Step 4: Landing Point Selection */}
        {currentStep === "landing" && (
          <div className="space-y-4">
            <TableCourt
              onCourtClick={handleLandingSelect}
              selectedPoint={landingPoint}
              originPoint={originPoint}
              label="Ball Landing"
              restrictToSide={getCourtSides().landingSide}
              mode="landing"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShotSelector;
