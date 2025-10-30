"use client";

import PlayerCard from "./PlayerCard";
import CenterControls from "./CenterControls";
import SetTracker from "@/components/SetTracker";
import MatchInfo from "./MatchInfo";
import {
  checkGameWon,
  getCurrentServerName,
} from "@/components/live-scorer/individual/helpers";
import {
  AddPointPayload,
  MatchStatus,
  IndividualMatch,
  TeamMatch,
  PlayerKey,
} from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { useEffect } from "react";
import { useTeamMatch } from "@/hooks/useTeamMatch";

type ScoreBoardProps = {
  match: IndividualMatch | TeamMatch;
  side1Score: number;
  side2Score: number;
  isMatchActive: boolean;
  currentServer: string | null;
  side1Sets: number;
  side2Sets: number;
  status: MatchStatus;
  onAddPoint: (payload: AddPointPayload) => void;
  onReset: () => void;
  onToggleMatch: () => void;
  onUndo: () => void;

  teamMatchPlayers?: {
    side1: {
      name: string;
      playerId?: string;
      serverKey: string;
      profileImage?: string;
    }[];
    side2: {
      name: string;
      playerId?: string;
      serverKey: string;
      profileImage?: string;
    }[];
  };
};

export default function ScoreBoard(props: ScoreBoardProps) {
  const {
    match,
    side1Score,
    side2Score,
    isMatchActive,
    currentServer,
    side1Sets,
    side2Sets,
    status,
    onAddPoint,
    onReset,
    onToggleMatch,
    onUndo,
    teamMatchPlayers,
  } = props;

  useEffect(() => {
    // Log for debugging
  }, [currentServer, match?.matchCategory]);

  const canUndo = side1Score > 0 || side2Score > 0;

  const gameWinner = checkGameWon(side1Score, side2Score);
  const gameWinnerName =
    gameWinner === "side1"
      ? "Side 1"
      : gameWinner === "side2"
      ? "Side 2"
      : null;
  const isGameWon = gameWinner !== null;

  const isUpdatingScore = useIndividualMatch((s) => s.isUpdatingScore);
  const isUpdatingTeamScore = useTeamMatch((s) => s.isUpdatingTeamScore);
  const isUndoingIndividual = useIndividualMatch((s) => s.isUndoing);
  const isUndoingTeam = useTeamMatch((s) => s.isUndoing);

  const isUndoing =
    match?.matchCategory === "individual" ? isUndoingIndividual : isUndoingTeam;
  const isAnyOperationInProgress =
    isUpdatingScore || isUpdatingTeamScore || isUndoing;

  const buildPlayers = () => {
    if (!match) {
      return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
    }

    // Team Match
    if (match.matchCategory === "team" && teamMatchPlayers) {
      return {
        p1: teamMatchPlayers.side1,
        p2: teamMatchPlayers.side2,
      };
    }

    // Individual match
    if (match.matchCategory === "individual") {
      // Singles
      if (match.matchType === "singles") {
        return {
          p1: [
            {
              name: match.participants?.[0]?.fullName || "Player 1",
              playerId: match.participants?.[0]?._id,
              serverKey: "side1",
              profileImage: match.participants?.[0]?.profileImage,
            },
          ],
          p2: [
            {
              name: match.participants?.[1]?.fullName || "Player 2",
              playerId: match.participants?.[1]?._id,
              serverKey: "side2",
              profileImage: match.participants?.[1]?.profileImage,
            },
          ],
        };
      }

      // Doubles / mixed_doubles
      return {
        p1: [
          {
            name: match.participants?.[0]?.fullName || "Player 1",
            playerId: match.participants?.[0]?._id,
            serverKey: "side1_main",
            profileImage: match.participants?.[0]?.profileImage,
          },
          {
            name: match.participants?.[1]?.fullName || "Partner 1",
            playerId: match.participants?.[1]?._id,
            serverKey: "side1_partner",
            profileImage: match.participants?.[1]?.profileImage,
          },
        ],
        p2: [
          {
            name: match.participants?.[2]?.fullName || "Player 2",
            playerId: match.participants?.[2]?._id,
            serverKey: "side2_main",
            profileImage: match.participants?.[2]?.profileImage,
          },
          {
            name: match.participants?.[3]?.fullName || "Partner 2",
            playerId: match.participants?.[3]?._id,
            serverKey: "side2_partner",
            profileImage: match.participants?.[3]?.profileImage,
          },
        ],
      };
    }

    return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
  };

  const { p1, p2 } = buildPlayers();

  const allParticipants =
    match.matchCategory === "individual"
      ? match.participants || []
      : teamMatchPlayers
      ? [
          ...teamMatchPlayers.side1.map((p) => ({
            _id: p.playerId || "",
            fullName: p.name,
            username: p.name,
          })),
          ...teamMatchPlayers.side2.map((p) => ({
            _id: p.playerId || "",
            fullName: p.name,
            username: p.name,
          })),
        ]
      : [];

  const effectiveMatchType =
    match.matchCategory === "individual"
      ? match.matchType
      : teamMatchPlayers?.side1.length === 1
      ? "singles"
      : "doubles";

  const serverName =
    currentServer &&
    getCurrentServerName(
      currentServer as any,
      allParticipants,
      effectiveMatchType
    );

  const currentGame =
    match.matchCategory === "individual"
      ? match.currentGame
      : (match as TeamMatch).subMatches[
          (match as TeamMatch).currentSubMatch - 1
        ]?.games?.length || 1;

  const totalGames =
    match.matchCategory === "individual"
      ? match.numberOfSets
      : (match as TeamMatch).numberOfSetsPerSubMatch || 3;

  return (
    <div>
      {/* Set Tracker */}
      <SetTracker
        bestOf={totalGames}
        side1Sets={side1Sets}
        side2Sets={side2Sets}
        status={status}
      />

      {/* Match Info */}
      <MatchInfo
        currentGame={currentGame}
        totalGames={totalGames}
        matchStartTime={isMatchActive ? match.createdAt : undefined}
      />

      {/* Score Cards */}
      <div className="grid grid-cols-2">
        <PlayerCard
          players={p1}
          score={side1Score}
          side="side1"
          onAddPoint={onAddPoint}
          setsWon={side1Sets}
          color="emerald"
          disabled={
            isAnyOperationInProgress || status === "completed" || isGameWon
          }
          currentServer={currentServer}
        />

        <PlayerCard
          players={p2}
          score={side2Score}
          side="side2"
          onAddPoint={onAddPoint}
          setsWon={side2Sets}
          color="rose"
          disabled={
            isAnyOperationInProgress || status === "completed" || isGameWon
          }
          currentServer={currentServer}
        />
      </div>

      {/* Center Controls */}
      <div className="flex justify-center mt-4">
        <CenterControls
          isMatchActive={isMatchActive}
          onToggleMatch={onToggleMatch}
          onReset={onReset}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      </div>

      {/* Game Won Message */}
      {isGameWon && status !== "completed" && (
        <div
          className="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 
          rounded-xl border-2 border-green-200 shadow-lg"
        >
          <p className="text-xl font-black text-green-700 mb-1">
            🏆 Game Won by {gameWinnerName}!
          </p>
          <p className="text-sm text-green-600 font-medium">
            Starting next game...
          </p>
        </div>
      )}

      {/* Match Completed Message */}
      {status === "completed" && (
        <div
          className="text-center py-6 bg-gradient-to-r from-amber-50 to-yellow-50 
          rounded-xl border-2 border-amber-200 shadow-lg"
        >
          <p className="text-2xl font-black text-amber-700">Match Completed!</p>
        </div>
      )}
    </div>
  );
}
