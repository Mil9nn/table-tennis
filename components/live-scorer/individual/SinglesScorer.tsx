"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import MatchCompletedCard from "../common/MatchCompletedCard";
import ShotSelector from "@/components/ShotSelector";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";
import ShotFeed from "../common/ShotFeed";
import type { AddPointPayload, IndividualMatch, MatchStatus } from "@/types/match.type";

interface SinglesScorerProps {
  match: IndividualMatch;
}

export default function SinglesScorer({ match }: SinglesScorerProps) {
  const {
    side1Score,
    side2Score,
    currentServer,
    isMatchActive,
    currentGame,
    side1Sets,
    side2Sets,
    status,
    subtractPoint,
    resetGame,
    toggleMatch,
    setInitialMatch,
  } = useIndividualMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);

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
  }, [match, setInitialMatch]);

  const handleAddPoint = useCallback(
    ({ side, playerId }: AddPointPayload) => {
      if (status === "completed") {
        toast.error("Match is completed! Reset to continue.");
        return;
      }
      if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }
      setPendingPlayer({ side, playerId });
      setShotDialogOpen(true);
    },
    [status, isMatchActive, setPendingPlayer, setShotDialogOpen]
  );

  const handleSubtractPoint = useCallback(
    (side: "side1" | "side2") => {
      if (status === "completed") {
        toast.error("Match is completed!");
        return;
      }
      subtractPoint(side);
    },
    [status, subtractPoint]
  );

  const handleReset = useCallback(() => {
    const fullReset = status === "completed";
    resetGame(fullReset);
  }, [status, resetGame]);

  if (!match) return <div>Loading match...</div>;

  return (
    <div className="space-y-6">
      {status === "completed" ? (
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
            onAddPoint={handleAddPoint}
            onSubtractPoint={handleSubtractPoint}
            onReset={handleReset}
            onToggleMatch={toggleMatch}
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

          <ShotSelector />
        </>
      )}
    </div>
  );
}