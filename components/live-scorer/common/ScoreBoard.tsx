"use client";

import PlayerCard from "./PlayerCard";
import CenterControls from "./CenterControls";
import SetTracker from "@/components/SetTracker";
import {
  checkGameWon,
  getCurrentServerName,
} from "@/components/live-scorer/individual/helpers";
import { AddPointPayload, MatchStatus } from "@/types/match.type";

interface ScoreBoardProps {
  match: any;
  side1Score: number;
  side2Score: number;
  isMatchActive: boolean;
  currentServer: string | null; // serverKey from helpers
  side1Sets: number;
  side2Sets: number;
  status: MatchStatus;
  onAddPoint: (payload: AddPointPayload) => void;
  onSubtractPoint: (side: "side1" | "side2") => void;
  onReset: () => void;
  onToggleMatch: () => void;
}

export default function ScoreBoard({
  match,
  side1Score,
  side2Score,
  isMatchActive,
  currentServer,
  side1Sets,
  side2Sets,
  status,
  onAddPoint,
  onSubtractPoint,
  onReset,
  onToggleMatch,
}: ScoreBoardProps) {
  const gameWinner = checkGameWon(side1Score, side2Score);
  const gameWinnerName =
    gameWinner === "side1"
      ? "Side 1"
      : gameWinner === "side2"
      ? "Side 2"
      : null;

  const isGameWon = gameWinner !== null;

  const buildPlayers = () => {
    if (!match) {
      return {
        p1: [{ name: "Player 1" }],
        p2: [{ name: "Player 2" }],
      };
    }

    if (match.matchType === "singles") {
      return {
        p1: [
          {
            name:
              match.participants?.[0]?.fullName ??
              match.participants?.[0]?.username ??
              match.participants?.[0] ??
              "Player 1",
            playerId: match.participants?.[0]?._id ?? match.participants?.[0],
          },
        ],
        p2: [
          {
            name:
              match.participants?.[1]?.fullName ??
              match.participants?.[1]?.username ??
              match.participants?.[1] ??
              "Player 2",
            playerId: match.participants?.[1]?._id ?? match.participants?.[1],
          },
        ],
      };
    }

    // doubles / mixed_doubles
    return {
      p1: [
        {
          name:
            match.participants?.[0]?.fullName ??
            match.participants?.[0]?.username ??
            match.participants?.[0] ??
            "Player 1",
          playerId: match.participants?.[0]?._id ?? match.participants?.[0],
        },
        {
          name:
            match.participants?.[1]?.fullName ??
            match.participants?.[1]?.username ??
            match.participants?.[1] ??
            "Partner 1",
          playerId: match.participants?.[1]?._id ?? match.participants?.[1],
        },
      ],
      p2: [
        {
          name:
            match.participants?.[2]?.fullName ??
            match.participants?.[2]?.username ??
            match.participants?.[2] ??
            "Player 2",
          playerId: match.participants?.[2]?._id ?? match.participants?.[2],
        },
        {
          name:
            match.participants?.[3]?.fullName ??
            match.participants?.[3]?.username ??
            match.participants?.[3] ??
            "Partner 2",
          playerId: match.participants?.[3]?._id ?? match.participants?.[3],
        },
      ],
    };
  };

  const { p1, p2 } = buildPlayers();

  const serverName = getCurrentServerName(
    currentServer as any,
    match?.participants || [],
    match?.matchType || "singles"
  );

  return (
    <div className="space-y-2">
      {/* Set tracker */}
      <SetTracker
        bestOf={match.numberOfSets}
        side1Sets={side1Sets}
        side2Sets={side2Sets}
        status={status}
      />

      {/* Serving indicator */}
      {!isGameWon && (
        <div className="text-center">
          {serverName ? (
            <p className="text-sm font-medium text-yellow-600">
              <span>Serving: {serverName}</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-gray-500">
              ⚠️ Waiting for server selection
            </p>
          )}
        </div>
      )}

      {/* Players + Controls */}
      <div className="grid grid-cols-2 sm:gap-6 gap-2 items-center">
        {/* Left */}
        <PlayerCard
          players={p1}
          score={side1Score}
          side="side1"
          onAddPoint={onAddPoint}
          onSubtractPoint={onSubtractPoint}
          setsWon={side1Sets}
          color="emerald"
          disabled={status === "completed" || isGameWon}
          isServer={
            currentServer === "side1" ||
            currentServer === "side1_main" ||
            currentServer === "side1_partner"
          }
        />

        {/* Right */}
        <PlayerCard
          players={p2}
          score={side2Score}
          side="side2"
          onAddPoint={onAddPoint}
          onSubtractPoint={onSubtractPoint}
          setsWon={side2Sets}
          color="rose"
          disabled={status === "completed" || isGameWon}
          isServer={
            currentServer === "side2" ||
            currentServer === "side2_main" ||
            currentServer === "side2_partner"
          }
        />

        {/* Center controls */}
        <div className="col-span-2 flex justify-center mt-4">
          <CenterControls
            isMatchActive={isMatchActive}
            onToggleMatch={onToggleMatch}
            onReset={onReset}
          />
        </div>

        {/* Game won */}
        {isGameWon && status !== "completed" && (
          <div className="col-span-2 md:col-span-3 text-center mt-4">
            <span className="text-lg font-bold text-green-600">
              🏆 Game Won by {gameWinnerName}!
            </span>
            <div className="text-sm text-gray-600 mt-1">
              Starting next game...
            </div>
          </div>
        )}

        {/* Match finished */}
        {status === "completed" && (
          <div className="col-span-2 md:col-span-3 text-center mt-4">
            <span className="text-lg font-bold text-green-600">
              🏆 Match Completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}