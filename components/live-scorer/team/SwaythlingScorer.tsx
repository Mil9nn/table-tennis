"use client";

import React, { useEffect, useState } from "react";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { buildTeamOrder } from "./helpers";
import ScoreBoard from "../common/ScoreBoard";
import MatchCompletedCard from "../common/MatchCompletedCard";
import GamesHistory from "../common/GamesHistory";
import SinglesScorer from "../individual/SinglesScorer";
import type { TeamMatch, TeamTie } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export default function SwaythlingScorer({ match }: Props) {
  const {
    matchesWonA,
    matchesWonB,
    isTeamActive,
    setInitialMatch,
    resetTeamMatch,
    toggleTeamMatch,
    addTieResult,
    status,
    ties,
  } = useTeamMatch();

  const [currentTieIndex, setCurrentTieIndex] = useState(0);

  useEffect(() => {
    if (match) setInitialMatch(match);
  }, [match, setInitialMatch]);

  if (!match) return <div>Loading...</div>;

  const order = buildTeamOrder(match.format || "swaythling-5");
  const currentTie: TeamTie | null = ties?.[currentTieIndex] ?? null;

  const handleTieCompleted = (winner: "side1" | "side2") => {
    addTieResult(winner);

    // move to next tie if available
    if (currentTieIndex + 1 < order.length) {
      setCurrentTieIndex(currentTieIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {status === "completed" ? (
        <MatchCompletedCard match={match} />
      ) : (
        <>
          {/* Overall team score */}
          <ScoreBoard
            match={match}
            side1Score={matchesWonA}
            side2Score={matchesWonB}
            isMatchActive={isTeamActive}
            currentServer={null}
            side1Sets={0}
            side2Sets={0}
            status={status}
            onAddPoint={() => {}} // scoring happens inside tie
            onSubtractPoint={() => {}}
            onReset={() => resetTeamMatch(true)}
            onToggleMatch={toggleTeamMatch}
          />

          {/* Current tie scorer */}
          {currentTie && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">
                Current Tie: {currentTie.a} vs {currentTie.b}
              </h3>

              {/* Render an individual scorer for this tie */}
              <SinglesScorer
                match={{
                  ...match,
                  participants: mapTieToParticipants(match, currentTie),
                  matchType: currentTie.type || "singles",
                  status: "in_progress",
                  games: [],
                  side1: match.team1,
                  side2: match.team2,
                }}
                onMatchComplete={handleTieCompleted}
              />
            </div>
          )}

          {/* Show ties history */}
          <GamesHistory
            ties={ties || []}
            matchCategory="team"
            participants={match.participants}
          />
        </>
      )}
    </div>
  );
}

/**
 * Map "A, B, C, X, Y, Z" placeholders into actual participants
 */
function mapTieToParticipants(match: TeamMatch, tie: TeamTie) {
  const map: Record<string, any> = {
    A: match.team1?.players?.[0],
    B: match.team1?.players?.[1],
    C: match.team1?.players?.[2],
    X: match.team2?.players?.[0],
    Y: match.team2?.players?.[1],
    Z: match.team2?.players?.[2],
  };

  // For doubles tie we might use players[0]+[1] etc
  if (tie.type === "doubles") {
    return [map[tie.a], map[tie.b], map[tie.a + "_partner"], map[tie.b + "_partner"]];
  }

  return [map[tie.a], map[tie.b]];
}