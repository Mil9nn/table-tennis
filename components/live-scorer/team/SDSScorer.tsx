"use client";

import React, { useEffect } from "react";
import { useTeamMatch } from "@/hooks/useTeamMatch";
import { buildSDSOrder } from "./helpers";
import ScoreBoard from "../common/ScoreBoard";
import MatchCompletedCard from "../common/MatchCompletedCard";
import type { TeamMatch } from "@/types/match.type";

interface Props {
  match: TeamMatch;
}

export default function SDSScorer({ match }: Props) {
  const {
    matchesWonA,
    matchesWonB,
    isTeamActive,
    setInitialMatch,
    resetTeamMatch,
    toggleTeamMatch,
    addTieResult,
    status,
  } = useTeamMatch();

  useEffect(() => {
    if (match) setInitialMatch(match);
  }, [match, setInitialMatch]);

  if (!match) return <div>Loading...</div>;

  const order = buildSDSOrder();

  return (
    <div className="space-y-6">
      {status === "completed" ? (
        <MatchCompletedCard match={match} />
      ) : (
        <>
          <ScoreBoard
            match={match}
            side1Score={matchesWonA}
            side2Score={matchesWonB}
            isMatchActive={isTeamActive}
            currentServer={null}
            side1Sets={0}
            side2Sets={0}
            status={status}
            onAddPoint={({ side }) => addTieResult(side)}
            onSubtractPoint={() => {}}
            onReset={() => resetTeamMatch(true)}
            onToggleMatch={toggleTeamMatch}
          />

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold">SDS Order</h3>
            <ol className="list-decimal ml-5 mt-2">
              {order.map((t, i) => (
                <li key={i}>
                  {t.type === "doubles" ? "Doubles" : `${t.a} vs ${t.b}`}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

