"use client";

import PlayerCard from "./PlayerCard";
import CenterControls from "./CenterControls";
import SetTracker from "@/components/SetTracker";

export default function ScoreBoard({
  match,
  player1Score,
  player2Score,
  isMatchActive,
  currentServer,
  side1Sets,
  side2Sets,   // ✅ new props from hook
  status,       // ✅ new prop (in_progress | completed)
  onAddPoint,
  onSubtractPoint,
  onReset,
  onToggleMatch,
}) {
  // ✅ Build player arrays based on singles/doubles
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

  // ✅ Resolve serving indicator
  const resolveServerName = () => {
    if (!match) return null;

    if (match.matchType === "singles") {
      return currentServer === "player1"
        ? p1[0].name
        : currentServer === "player2"
        ? p2[0].name
        : null;
    }

    if (match.matchType === "doubles" || match.matchType === "mixed_doubles") {
      switch (currentServer) {
        case "player1_main":
          return p1[0].name;
        case "player1_partner":
          return p1[1].name;
        case "player2_main":
          return p2[0].name;
        case "player2_partner":
          return p2[1].name;
        default:
          return null;
      }
    }

    return null;
  };

  const serverName = resolveServerName();

  return (
    <div className="space-y-6">
      <SetTracker
      bestOf={match.numberOfSets}
      side1Sets={side1Sets}
      side2Sets={side2Sets}
      status={status}
    />

    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
      {/* Left Side */}
      <PlayerCard
        players={p1}
        score={player1Score}
        isServer={
          currentServer === "player1" ||
          currentServer === "player1_main" ||
          currentServer === "player1_partner"
        }
        side="player1"
        onAddPoint={onAddPoint}
        onSubtractPoint={onSubtractPoint}
        setsWon={side1Sets}
        color="emerald"
        disabled={status === "completed"}
      />

      {/* Center Controls */}
      <CenterControls
        isMatchActive={isMatchActive}
        onToggleMatch={onToggleMatch}
        onReset={onReset}
      />

      {/* Right Side */}
      <PlayerCard
        players={p2}
        score={player2Score}
        isServer={
          currentServer === "player2" ||
          currentServer === "player2_main" ||
          currentServer === "player2_partner"
        }
        side="player2"
        onAddPoint={onAddPoint}
        onSubtractPoint={onSubtractPoint}
        setsWon={side2Sets}
        color="rose"
        disabled={status === "completed"}
      />

      {/* ✅ Serving indicator below */}
      {serverName && (
        <div className="col-span-2 md:col-span-3 text-center mt-2">
          <span className="text-sm font-medium text-yellow-600">
            🎾 Serving: {serverName}
          </span>
        </div>
      )}

      {/* ✅ Match finished message (optional) */}
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