"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { toast } from "sonner";
import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
import { Button } from "./ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useShotSelectorState } from "@/hooks/useShotSelectorState";
import { StepIndicator } from "./shot-selector/StepIndicator";
import { PlayerSelectionStep } from "./shot-selector/PlayerSelectionStep";
import { ShotSelectionStep } from "./shot-selector/ShotSelectionStep";
import { ServeTypeSelectionStep } from "./shot-selector/ServeTypeSelectionStep";
import { CourtSelectionStep } from "./shot-selector/CourtSelectionStep";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ShotSelector = () => {
  const shotDialogOpen = useMatchStore((state) => state.shotDialogOpen);
  const setShotDialogOpen = useMatchStore((state) => state.setShotDialogOpen);
  const pendingPlayer = useMatchStore((state) => state.pendingPlayer);
  const setPendingPlayer = useMatchStore((state) => state.setPendingPlayer);
  const match = useMatchStore((state) => state.match);

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

  // Memoize normalized players to avoid type issues and unnecessary re-renders
  const normalizedPlayers = useMemo(() => {
    return players
      .filter((p): p is NonNullable<typeof p> => p != null)
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && "_id" in p) {
          return {
            _id: String((p as any)._id),
            fullName: (p as any).fullName,
            username: (p as any).username,
            profileImage: (p as any).profileImage,
          };
        }
        return { _id: String(p), fullName: undefined, username: undefined };
      });
  }, [players]);

  const {
    state,
    actions: {
      setStep,
      selectShot,
      selectServeType,
      setOrigin,
      setLanding,
      goBack,
      reset,
      setSubmitting,
      setError,
      clearError,
    },
  } = useShotSelectorState(needsPlayerSelection);

  const isServe = state.selectedShot === "serve_point";
  const canGoBack = useMemo(() => {
    if (state.currentStep === "landing") return true;
    if (state.currentStep === "origin") return true;
    if (state.currentStep === "serveType") return true;
    if (state.currentStep === "shot" && needsPlayerSelection) return true;
    return false;
  }, [state.currentStep, needsPlayerSelection]);

  // Track previous dialog state to detect when it opens
  const prevDialogOpen = useRef(false);
  const initializedRef = useRef(false);

  // Initialize step when dialog opens (only on open, not on every change)
  useEffect(() => {
    // Only run when dialog transitions from closed to open
    if (shotDialogOpen && !prevDialogOpen.current && !initializedRef.current) {
      initializedRef.current = true;
      reset(); // Reset all state first

      // Capture current values at the moment dialog opens
      // We intentionally don't include these in deps to only initialize once
      const currentNeedsPlayerSelection =
        !pendingPlayer?.playerId && players.length > 1;

      // Set initial step based on whether player selection is needed
      if (!currentNeedsPlayerSelection) {
        setStep("shot");
      } else {
        setStep("player");
      }

      // Auto-select player if only one option
      if (
        !currentNeedsPlayerSelection &&
        players.length === 1 &&
        !pendingPlayer?.playerId
      ) {
        const player = players[0];
        if (player != null) {
          let playerId: string;
          if (typeof player === "string") {
            playerId = player;
          } else if (player && typeof player === "object" && "_id" in player) {
            playerId = String((player as any)._id);
          } else {
            playerId = String(player);
          }
          setPendingPlayer({
            side: pendingPlayer?.side || "side1",
            playerId,
          });
        }
      }
    }

    // Reset initialization flag when dialog closes
    if (!shotDialogOpen && prevDialogOpen.current) {
      initializedRef.current = false;
    }

    prevDialogOpen.current = shotDialogOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotDialogOpen, reset, setStep, setPendingPlayer]); // Only stable functions in deps to prevent infinite loops

  // Reset state when dialog closes
  const handleClose = () => {
    if (state.isSubmitting) return; // Prevent closing during submission

    setShotDialogOpen(false);
    reset();
    setPendingPlayer(null);
  };

  const handlePlayerSelect = (playerId: string) => {
    if (!pendingPlayer) return;
    setPendingPlayer({
      side: pendingPlayer.side,
      playerId,
    });
    setStep("shot");
  };

  const handleLandingSelect = async (x: number, y: number) => {
    if (!pendingPlayer || !match || !state.selectedShot || !state.originPoint) {
      setError("Missing required information");
      return;
    }

    setLanding({ x, y });
    setSubmitting(true);
    clearError();

    const { side, playerId } = pendingPlayer;

    // Create shot data with location and serveType (if set)
    const shotData: any = {
      originX: state.originPoint.x,
      originY: state.originPoint.y,
      landingX: x,
      landingY: y,
    };

    if (state.selectedShot === "serve_point") {
      shotData.serveType = state.selectedServeType || null;
    }

    try {
      if (isIndividualMatch(match)) {
        await updateScoreIndividual(
          side,
          1,
          state.selectedShot,
          playerId,
          shotData
        );
      } else if (isTeamMatch(match)) {
        const teamSide =
          side === "side1" ? "team1" : side === "side2" ? "team2" : side;
        await updateScoreTeam(
          teamSide as any,
          1,
          state.selectedShot,
          playerId,
          shotData
        );
      }

      handleClose();
    } catch (error) {
      console.error("Error updating score:", error);
      setError("Failed to record shot. Please try again.");
      toast.error("Failed to update score");
    } finally {
      setSubmitting(false);
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

  const courtSides = getCourtSides();

  return (
    <Dialog open={shotDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] max-w-[98vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle asChild>
          <VisuallyHidden>Shot Selector</VisuallyHidden>
        </DialogTitle>

        {/* Header with Progress */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 mb-4">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                disabled={state.isSubmitting}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogDescription className="text-sm font-medium text-gray-700 text-left">
                {state.currentStep === "player" &&
                  "Select the player who scored"}
                {state.currentStep === "shot" &&
                  "Choose the type of shot played"}
                {state.currentStep === "serveType" && "Select the serve type"}
                {state.currentStep === "origin" &&
                  "Click where the shot originated."}
                {state.currentStep === "landing" &&
                  "Click where the ball landed"}
              </DialogDescription>
            </div>
          </div>

          <StepIndicator
            currentStep={state.currentStep}
            needsPlayerSelection={needsPlayerSelection}
            isServe={isServe}
          />
        </DialogHeader>

        {/* Error Message */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{state.error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto h-auto p-1"
            >
              <span className="sr-only">Dismiss</span>×
            </Button>
          </motion.div>
        )}

        {/* Content Area */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {state.currentStep === "player" && needsPlayerSelection && (
              <motion.div
                key="player"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PlayerSelectionStep
                  players={normalizedPlayers}
                  selectedPlayerId={pendingPlayer?.playerId || null}
                  onSelect={handlePlayerSelect}
                />
              </motion.div>
            )}

            {state.currentStep === "shot" && (
              <motion.div
                key="shot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ShotSelectionStep
                  selectedShot={state.selectedShot}
                  onSelect={selectShot}
                />
              </motion.div>
            )}

            {state.currentStep === "serveType" && (
              <motion.div
                key="serveType"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ServeTypeSelectionStep
                  selectedServeType={state.selectedServeType}
                  onSelect={selectServeType}
                />
              </motion.div>
            )}

            {state.currentStep === "origin" && (
              <motion.div
                key="origin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CourtSelectionStep
                  mode="origin"
                  selectedPoint={state.originPoint}
                  onSelect={(x, y) => setOrigin({ x, y })}
                  restrictToSide={courtSides.originSide}
                  disabled={state.isSubmitting}
                />
              </motion.div>
            )}

            {state.currentStep === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CourtSelectionStep
                  mode="landing"
                  selectedPoint={state.landingPoint}
                  originPoint={state.originPoint}
                  onSelect={handleLandingSelect}
                  restrictToSide={courtSides.landingSide}
                  disabled={state.isSubmitting}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {state.isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-xs font-medium text-gray-600">
                  Saving…
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShotSelector;
