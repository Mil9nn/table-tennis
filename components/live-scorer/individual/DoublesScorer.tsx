"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import MatchCompletedCard from "../common/MatchCompletedCard";
import ShotSelector from "@/components/ShotSelector";
import TrackingModeToggle from "../common/TrackingModeToggle";
import {
  IndividualMatchState,
  useIndividualMatch,
} from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import ShotFeed from "../common/ShotFeed";
import { IndividualMatch, MatchStatus, PlayerKey } from "@/types/match.type";
import InitialServerDialog from "@/components/ServerDialog";

interface DoublesScorerProps {
  match: IndividualMatch;
}

export default function DoublesScorer({ match }: DoublesScorerProps) {
  const {
    side1Score,
    side2Score,
    currentServer,
    isMatchActive,
    currentGame,
    side1Sets,
    side2Sets,
    subtractPoint,
    resetGame,
    toggleMatch,
    setInitialMatch,
    swapSides,
  } = useIndividualMatch() as IndividualMatchState;

  const status = useIndividualMatch((s) => s.status);

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);
  const shotTrackingMode = useMatchStore((s) => s.shotTrackingMode);
  const user = useAuthStore((s) => s.user);
  const updateScore = useIndividualMatch((s) => s.updateScore);

  const lastMatchId = useRef<string | null>(null);
  const lastMatchStatus = useRef<MatchStatus | null>(null);

  useEffect(() => {
    if (!match) return;

    // If match is completed, initialize immediately to prevent race conditions
    if (match.status === "completed") {
      // Only re-initialize if match ID changed or we haven't initialized this match yet
      if (lastMatchId.current !== match._id) {
        setInitialMatch(match);
        lastMatchId.current = match._id;
        lastMatchStatus.current = match.status;
      }
      return;
    }

    const matchChanged = lastMatchId.current !== match._id;
    const statusChanged = lastMatchStatus.current !== match.status;

    // Only re-initialize when match ID changes or status changes significantly
    // Don't re-initialize on every score update to prevent jitter
    if (
      matchChanged ||
      (statusChanged &&
        ((match.status as MatchStatus) === "completed" ||
          lastMatchStatus.current === "completed"))
    ) {
      setInitialMatch(match);
      lastMatchId.current = match._id;
      lastMatchStatus.current = match.status;
    }
  }, [match?._id, match?.status, setInitialMatch]); // Only depend on ID and status, not entire match object

  // Show server dialog immediately if no server is configured
  useEffect(() => {
    if (!match) return;

    const hasServer = Boolean(match.serverConfig?.firstServer);

    if (!hasServer && match.status !== "completed") {
      setServerDialogOpen(true);
    }
  }, [match, setServerDialogOpen]);

  const handleUndo = useCallback(async () => {
    if (side1Score === 0 && side2Score === 0) {
      toast.error("No points to undo");
      return;
    }

    const games = match.games || [];
    const currentGameData = games.find(
      (g: any) => g.gameNumber === currentGame
    );

    if (!currentGameData) {
      toast.error("No game data found");
      return;
    }

    let lastSide: PlayerKey;

    // If shots exist, use them to determine which side scored last (detailed mode)
    if (currentGameData.shots && currentGameData.shots.length > 0) {
      const lastShot = currentGameData.shots[currentGameData.shots.length - 1];
      lastSide = lastShot.side as PlayerKey;
    } else {
      // No shots available (simple mode) - determine which side to subtract from
      // Subtract from the side with the higher score, or side1 if scores are equal
      if (side1Score > side2Score) {
        lastSide = "side1";
      } else if (side2Score > side1Score) {
        lastSide = "side2";
      } else {
        // Scores are equal - subtract from side1 as fallback
        lastSide = "side1";
      }
    }

    await subtractPoint(lastSide);
  }, [side1Score, side2Score, match, currentGame, subtractPoint]);

  if (!match) return <div>Loading match...</div>;

  // Check completion from both sources to prevent race conditions
  const isCompleted = status === "completed" || match.status === "completed";

  return (
    <div className="space-y-6">
      {isCompleted ? (
        <MatchCompletedCard match={match} />
      ) : (
        <>
          {match && <TrackingModeToggle />}
          <ScoreBoard
            match={match}
            side1Score={side1Score}
            side2Score={side2Score}
            isMatchActive={isMatchActive}
            currentServer={currentServer}
            side1Sets={side1Sets}
            side2Sets={side2Sets}
            status={status}
            onAddPoint={async ({ side }) => {
              // Check both match prop (server data) and hook state
              if (match.status === "completed" || (status as MatchStatus) === "completed") {
                toast.error("Match is completed! Reset to continue.");
                return;
              }

              // Determine effective mode: match override > user preference > default "detailed"
              const effectiveMode =
                shotTrackingMode || user?.shotTrackingMode || "detailed";

              if (effectiveMode === "simple") {
                // Simple mode: directly increment score without shot data
                // For doubles, we don't have playerId here, so it will be handled in updateScore
                await updateScore(side, 1, undefined, undefined);
              } else {
                // Detailed mode: open shot selector dialog
                // ✅ Only pass side — player will be chosen in ShotSelector
                setPendingPlayer({ side });
                setShotDialogOpen(true);
              }
            }}
            onReset={() => {
              // ✅ Force full reset for completed matches
              const fullReset = (status as MatchStatus) === "completed";
              resetGame(fullReset);
            }}
            onToggleMatch={toggleMatch}
            onUndo={handleUndo}
            onSwap={swapSides}
          />

          <GamesHistory
            games={match.games}
            currentGame={currentGame}
            participants={match.participants}
          />

          <ShotFeed
            games={match.games}
            currentGame={currentGame}
            participants={match.participants}
            finalScore={match.finalScore}
            serverConfig={match.serverConfig}
          />

          {!isCompleted && (
            <>
              <ShotSelector />
            </>
          )}

          <InitialServerDialog
            matchType={match.matchType}
            participants={match.participants}
          />
        </>
      )}
    </div>
  );
}
