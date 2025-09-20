"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import MatchCompletedCard from "../common/MatchCompletedCard";
import ShotSelector from "@/components/ShotSelector";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";

export default function SinglesScorer({ match }) {
  const {
    player1Score,
    player2Score,
    currentServer,
    isMatchActive,
    currentGame,
    side1Sets,
    side2Sets,
    status,
    subtractPoint,
    resetGame,
    toggleMatch,
    setInitialMatch, // added
  } = useIndividualMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);

  // initialize local store from server match whenever prop changes
  useEffect(() => {
    if (match) setInitialMatch(match);
  }, [match?._id]);

  return (
    <div className="space-y-6">
      {match.status === "completed" ? (
        <MatchCompletedCard match={match} />
      ) : (
        <>
          <ScoreBoard
            match={match}
            player1Score={player1Score}
            player2Score={player2Score}
            isMatchActive={isMatchActive}
            currentServer={currentServer}
            side1Sets={side1Sets}
            side2Sets={side2Sets}
            status={status}
            onAddPoint={({ side, playerId }) => {
              if (!isMatchActive) {
                toast.error("Start the match first");
                return;
              }
              setPendingPlayer({ side, playerId });
              setShotDialogOpen(true);
            }}
            onSubtractPoint={(side) => subtractPoint(side)}
            onReset={resetGame}
            onToggleMatch={toggleMatch}
          />

          <GamesHistory
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
