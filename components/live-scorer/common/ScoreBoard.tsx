"use client";

import PlayerCard from "./PlayerCard";
import CenterControls from "./CenterControls";
import SetTracker from "@/components/SetTracker";
import {
  checkGameWon,
  getCurrentServerName,
} from "@/components/live-scorer/individual/helpers";
import {
  AddPointPayload,
  MatchStatus,
  IndividualMatch,
} from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { TriangleAlert } from "lucide-react";

type ScoreBoardProps = {
  match: IndividualMatch;
  side1Score: number;
  side2Score: number;
  isMatchActive: boolean;
  currentServer: string | null;
  side1Sets: number;
  side2Sets: number;
  status: MatchStatus;
  onAddPoint: (payload: AddPointPayload) => void;
  onSubtractPoint: (side: "side1" | "side2") => void;
  onReset: () => void;
  onToggleMatch: () => void;

  // For team matches: can be individual player info
  teamMatchPlayers?: {
    side1: { name: string; playerId?: string; serverKey: string };
    side2: { name: string; playerId?: string; serverKey: string };
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
    onSubtractPoint,
    onReset,
    onToggleMatch,
    teamMatchPlayers,
  } = props;

  const getPlayerName = (player: { name?: string; playerId?: string; serverKey: string }) => {
  if (!player.playerId) return player.serverKey; // fallback if player not assigned
  const allPlayers = [...(match.team1.players || []), ...(match.team2.players || [])];
  const realPlayer = allPlayers.find((p) => p._id === player.playerId);
  return realPlayer?.fullName || realPlayer?.username || player.serverKey;
};


  const gameWinner = checkGameWon(side1Score, side2Score);
  const gameWinnerName =
    gameWinner === "side1"
      ? "Side 1"
      : gameWinner === "side2"
      ? "Side 2"
      : null;
  const isGameWon = gameWinner !== null;

  const isUpdatingScore = useIndividualMatch((s) => s.isUpdatingScore);

  const buildPlayers = () => {
    if (!match) {
      return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
    }

    // Individual match
    if (match.matchCategory === "individual") {
      // Singles
      if (match.matchType === "singles") {
        return {
          p1: [
            {
              name:
                match.participants?.[0]?.fullName ??
                match.participants?.[0]?.username ??
                "Player 1",
              playerId: match.participants?.[0]?._id,
              serverKey: "side1",
            },
          ],
          p2: [
            {
              name:
                match.participants?.[1]?.fullName ??
                match.participants?.[1]?.username ??
                "Player 2",
              playerId: match.participants?.[1]?._id,
              serverKey: "side2",
            },
          ],
        };
      }

      // Doubles / mixed_doubles
      return {
        p1: [
          {
            name:
              match.participants?.[0]?.fullName ??
              match.participants?.[0]?.username ??
              "Player 1",
            playerId: match.participants?.[0]?._id,
            serverKey: "side1_main",
          },
          {
            name:
              match.participants?.[1]?.fullName ??
              match.participants?.[1]?.username ??
              "Partner 1",
            playerId: match.participants?.[1]?._id,
            serverKey: "side1_partner",
          },
        ],
        p2: [
          {
            name:
              match.participants?.[2]?.fullName ??
              match.participants?.[2]?.username ??
              "Player 2",
            playerId: match.participants?.[2]?._id,
            serverKey: "side2_main",
          },
          {
            name:
              match.participants?.[3]?.fullName ??
              match.participants?.[3]?.username ??
              "Partner 2",
            playerId: match.participants?.[3]?._id,
            serverKey: "side2_partner",
          },
        ],
      };
    }

    console.log("Team Match Players:", teamMatchPlayers);

    // Team Match
    if (match.matchCategory === "team" && teamMatchPlayers) {
      return {
        p1: [
          {
            ...teamMatchPlayers.side1,
            name: getPlayerName(teamMatchPlayers.side1),
          },
        ],
        p2: [
          {
            ...teamMatchPlayers.side2,
            name: getPlayerName(teamMatchPlayers.side2),
          },
        ],
      };
    }
  };

  const { p1, p2 } = buildPlayers();

  const serverName =
    currentServer &&
    getCurrentServerName(
      currentServer as any,
      match.matchCategory === "individual"
        ? match.participants || []
        : [...match.team1.players, ...match.team2.players],
      match.matchCategory === "individual" ? match.matchType : "singles" // use singles for team since ScoreBoard only uses names
    );

  return (
    <div className="space-y-2">
      <SetTracker
        bestOf={match.numberOfSets}
        side1Sets={side1Sets}
        side2Sets={side2Sets}
        status={status}
      />

      {!isGameWon && (
        <div className="bg-yellow-50 rounded-md p-1 px-2 w-fit mx-auto">
          {serverName ? (
            <p className="text-sm font-medium text-yellow-600">
              <span>Serving: {serverName}</span>
            </p>
          ) : (
            <p className="flex items-center justify-center gap-1 text-sm italic text-yellow-400">
              <TriangleAlert className="size-4 text-yellow-500" />
              <span>No server selected</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:gap-6 gap-2 items-center">
        <PlayerCard
          players={p1}
          score={side1Score}
          side="side1"
          onAddPoint={onAddPoint}
          onSubtractPoint={onSubtractPoint}
          setsWon={side1Sets}
          color="emerald"
          disabled={isUpdatingScore || status === "completed" || isGameWon}
          currentServer={currentServer}
        />

        <PlayerCard
          players={p2}
          score={side2Score}
          side="side2"
          onAddPoint={onAddPoint}
          onSubtractPoint={onSubtractPoint}
          setsWon={side2Sets}
          color="rose"
          disabled={isUpdatingScore || status === "completed" || isGameWon}
          currentServer={currentServer}
        />

        <div className="col-span-2 flex justify-center mt-4">
          <CenterControls
            isMatchActive={isMatchActive}
            onToggleMatch={onToggleMatch}
            onReset={onReset}
          />
        </div>

        {isGameWon && status !== "completed" && (
          <div className="col-span-2 text-center mt-4">
            <span className="text-lg font-bold text-green-600">
              🏆 Game Won by {gameWinnerName}!
            </span>
            <div className="text-sm text-gray-600 mt-1">
              Starting next game...
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="col-span-2 text-center mt-4">
            <span className="text-lg font-bold text-green-600">
              🏆 Match Completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
