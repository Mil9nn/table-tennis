"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import MatchCompletedCard from "../common/MatchCompletedCard";
import ShotSelector from "@/components/ShotSelector";
import {
  IndividualMatchState,
  useIndividualMatch,
} from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
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
  } = useIndividualMatch() as IndividualMatchState;

  const status = useIndividualMatch((s) => s.status);

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);

  const lastMatchId = useRef<string | null>(null);
  const lastMatchStatus = useRef<MatchStatus | null>(null);

  useEffect(() => {
    if (!match) return;

    const matchChanged = lastMatchId.current !== match._id;
    const statusChanged = lastMatchStatus.current !== match.status;

    if (
      matchChanged ||
      (statusChanged &&
        (match.status === "completed" ||
          lastMatchStatus.current === "completed"))
    ) {
      setInitialMatch(match);
      lastMatchId.current = match._id;
      lastMatchStatus.current = match.status;
    }
  }, [match._id, match.status, setInitialMatch]);

  useEffect(() => {
    if (!match) return;

    const hasServer = Boolean(match.serverConfig?.firstServer);
    const isStarting =
      match.status === "in_progress" && lastMatchStatus.current === "scheduled";

    if (isStarting && !hasServer) {
      setServerDialogOpen(true);
    }
  }, [match?.status, match?.serverConfig?.firstServer, setServerDialogOpen]);

  const handleUndo = useCallback(async () => {
    if (side1Score === 0 && side2Score === 0) {
      toast.error("No points to undo");
      return;
    }

    // Determine which side scored last based on total score
    const totalPoints = side1Score + side2Score;
    const games = match.games || [];
    const currentGameData = games.find(
      (g: any) => g.gameNumber === currentGame
    );

    if (
      !currentGameData ||
      !currentGameData.shots ||
      currentGameData.shots.length === 0
    ) {
      toast.error("No shots to undo");
      return;
    }

    // Get the last shot to determine which side scored
    const lastShot = currentGameData.shots[currentGameData.shots.length - 1];
    const lastSide = lastShot.side as PlayerKey;

    await subtractPoint(lastSide);
  }, [side1Score, side2Score, match, currentGame, subtractPoint]);

  if (!match) return <div>Loading match...</div>;

  return (
    <div className="space-y-6">
      {status == "completed" ? (
        <MatchCompletedCard match={match} />
      ) : (
        <>
          <ScoreBoard
            match={match}
            side1Score={side1Score}
            side2Score={side2Score}
            isMatchActive={isMatchActive}
            currentServer={currentServer}
            side1Sets={side1Sets}
            side2Sets={side2Sets}
            status={status}
            onAddPoint={({ side }) => {
              if ((status as MatchStatus) === "completed") {
                toast.error("Match is completed! Reset to continue.");
                return;
              }

              if (!isMatchActive) {
                toast.error("Start the match first");
                return;
              }

              // ✅ Only pass side — player will be chosen in ShotSelector
              setPendingPlayer({ side });
              setShotDialogOpen(true);
            }}
            onReset={() => {
              // ✅ Force full reset for completed matches
              const fullReset = (status as MatchStatus) === "completed";
              resetGame(fullReset);
            }}
            onToggleMatch={toggleMatch}
            onUndo={handleUndo}
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
          />

          {(status as MatchStatus) !== "completed" && (
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
