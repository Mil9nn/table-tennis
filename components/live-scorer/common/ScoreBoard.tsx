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
  TeamMatch,
  sideUnion,
} from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { TriangleAlert } from "lucide-react";
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
  onSubtractPoint: (side: sideUnion) => void;
  onReset: () => void;
  onToggleMatch: () => void;

  teamMatchPlayers?: {
    side1: { name: string; playerId?: string; serverKey: string }[];
    side2: { name: string; playerId?: string; serverKey: string }[];
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

  // ✅ DEBUG: Log currentServer changes
  useEffect(() => {
    console.log("🎯 ScoreBoard - currentServer changed:", {
      currentServer,
      matchCategory: match?.matchCategory,
      teamMatchPlayers,
    });
  }, [currentServer, match?.matchCategory]);

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

  const buildPlayers = () => {
  if (!match) {
    return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
  }

  // Team Match - use the pre-resolved player info from teamMatchPlayers
  if (match.matchCategory === "team" && teamMatchPlayers) {
    console.log("🏆 Team match - using teamMatchPlayers:", teamMatchPlayers);
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
          },
        ],
        p2: [
          {
            name: match.participants?.[1]?.fullName || "Player 2",
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
          name: match.participants?.[0]?.fullName || "Player 1",
          playerId: match.participants?.[0]?._id,
          serverKey: "side1_main",
        },
        {
          name: match.participants?.[1]?.fullName || "Partner 1",
          playerId: match.participants?.[1]?._id,
          serverKey: "side1_partner",
        },
      ],
      p2: [
        {
          name: match.participants?.[2]?.fullName || "Player 2",
          playerId: match.participants?.[2]?._id,
          serverKey: "side2_main",
        },
        {
          name: match.participants?.[3]?.fullName || "Partner 2",
          playerId: match.participants?.[3]?._id,
          serverKey: "side2_partner",
        },
      ],
    };
  }

  // Fallback
  return { p1: [{ name: "Side 1" }], p2: [{ name: "Side 2" }] };
};

  const { p1, p2 } = buildPlayers();

  // Get all participants for server name lookup
  const allParticipants =
    match.matchCategory === "individual"
      ? match.participants || []
      : teamMatchPlayers
      ? [
          ...teamMatchPlayers.side1.map(p => ({
            _id: p.playerId || "",
            fullName: p.name,
            username: p.name,
          })),
          ...teamMatchPlayers.side2.map(p => ({
            _id: p.playerId || "",
            fullName: p.name,
            username: p.name,
          })),
        ]
      : [];

  // ✅ DEBUG: Log server name computation
  console.log("🔍 Computing server name:", {
    currentServer,
    allParticipants: allParticipants.map((p) => p.fullName),
    matchType: match.matchCategory === "individual" ? match.matchType : "singles",
  });

  const serverName =
    currentServer &&
    getCurrentServerName(
      currentServer as any,
      allParticipants,
      match.matchCategory === "individual" ? match.matchType : "singles"
    );

  console.log("📝 Final server name:", serverName);

  return (
    <div className="space-y-2">
      <SetTracker
        bestOf={
          match.matchCategory === "individual"
            ? match.numberOfSets
            : match.numberOfSetsPerSubMatch || 3
        }
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

      <div className="grid grid-cols-2 sm:gap-6 items-center">
        <PlayerCard
          players={p1}
          score={side1Score}
          side="side1"
          onAddPoint={onAddPoint}
          onSubtractPoint={onSubtractPoint}
          setsWon={side1Sets}
          color="emerald"
          disabled={isUpdatingScore || isUpdatingTeamScore || status === "completed" || isGameWon}
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
          disabled={isUpdatingScore || isUpdatingTeamScore || status === "completed" || isGameWon}
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