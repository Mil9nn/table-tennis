"use client";

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
    subtractPoint,
    resetGame,
    toggleMatch,
  } = useIndividualMatch();

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);

  const p1Name = match.participants?.[0] ?? "Player 1";
  const p2Name = match.participants?.[1] ?? "Player 2";

  return (
    <div className="space-y-6">
      {/* ✅ Match completed banner */}
      {match.status === "completed" && <MatchCompletedCard match={match} />}

      {/* ✅ Pass match into ScoreBoard so serving indicator works */}
      <ScoreBoard
        match={match} // <-- important
        p1={{ name: p1Name }}
        p2={{ name: p2Name }}
        player1Score={player1Score}
        player2Score={player2Score}
        isMatchActive={isMatchActive}
        currentServer={currentServer}
        finalScore={match.finalScore}
        onAddPoint={(side) => {
          setPendingPlayer(side);
          setShotDialogOpen(true);
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