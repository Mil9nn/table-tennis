"use client";

import ScoreBoard from "../common/ScoreBoard";
import GamesHistory from "../common/GamesHistory";
import MatchCompletedCard from "../common/MatchCompletedCard";
import ShotSelector from "@/components/ShotSelector";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useMatchStore } from "@/hooks/useMatchStore";

export default function DoublesScorer({ match }) {
  const {
    player1Score,
    player2Score,
    currentServer,
    isMatchActive,
    currentGame,
    subtractPoint,
    resetGame,
    toggleMatch,
  } = useIndividualMatch();

  return (
    <div className="space-y-6">
      {/* ✅ Match completed banner */}
      {match.status === "completed" && <MatchCompletedCard match={match} />}

      {/* ✅ Scoreboard with doubles support */}
      <ScoreBoard
        match={match}
        player1Score={player1Score}
        player2Score={player2Score}
        isMatchActive={isMatchActive}
        currentServer={currentServer}
        finalScore={match.finalScore}
        onAddPoint={({ side, playerId }) => {
          // ✅ open ShotSelector with correct player + side
          useMatchStore.getState().setPendingPlayer({ side, playerId });
          useMatchStore.getState().setShotDialogOpen(true);
        }}
        onSubtractPoint={(side) => subtractPoint(side)}
        onReset={resetGame}
        onToggleMatch={toggleMatch}
      />

      {/* ✅ Games history */}
      <GamesHistory games={match.games} currentGame={currentGame} />

      {/* ✅ ShotSelector stays mounted */}
      <ShotSelector />
    </div>
  );
}