"use client";

import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import { useMatchStore } from "@/hooks/useMatchStore";
import { TeamMatch, MatchStatus } from "@/types/match.type";
import ShotSelector from "@/components/ShotSelector";
import ShotFeed from "../common/ShotFeed";
import GamesHistory from "../common/GamesHistory";
import InitialServerDialog from "@/components/ServerDialog";

interface SwaythlingFormatScorerProps {
  match: TeamMatch;
}

export default function SwaythlingFormatScorer({
  match,
}: SwaythlingFormatScorerProps) {
  const [currentSubMatchIndex, setCurrentSubMatchIndex] = useState(0);
  const [team1Wins, setTeam1Wins] = useState(0);
  const [team2Wins, setTeam2Wins] = useState(0);
  const [isSubMatchOver, setIsSubMatchOver] = useState(false);

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);

  const lastMatchId = useRef<string | null>(null);
  const lastMatchStatus = useRef<MatchStatus | null>(null);

  // --- Swaythling order: A vs X, B vs Y, C vs Z, A vs Y, B vs X ---
  const swaythlingOrder = [
    { side1: "A", side2: "X" },
    { side1: "B", side2: "Y" },
    { side1: "C", side2: "Z" },
    { side1: "A", side2: "Y" },
    { side1: "B", side2: "X" },
  ];

  // --- Map symbols to players directly from team arrays ---
  const getPlayerBySymbol = (symbol: string) => {
    const team1Map: Record<string, (typeof match.team1.players)[0] | null> = {};
    const team2Map: Record<string, (typeof match.team2.players)[0] | null> = {};

    ["A", "B", "C"].forEach((s, idx) => {
      team1Map[s] = match.team1.players[idx] || null;
    });
    ["X", "Y", "Z"].forEach((s, idx) => {
      team2Map[s] = match.team2.players[idx] || null;
    });

    const team1Player = team1Map[symbol];
    const team2Player = team2Map[symbol];

    console.log("Team1Player:", team1Player);
    console.log("Team2Player:", team2Player);

    return {
      side1: team1Player
        ? {
            name:
              team1Player.fullName ||
              team1Player.username ||
              `Player ${symbol}`,
            playerId: team1Player._id,
            serverKey: symbol,
          }
        : { name: symbol, serverKey: symbol },
      side2: team2Player
        ? {
            name:
              team2Player.fullName ||
              team2Player.username ||
              `Player ${symbol}`,
            playerId: team2Player._id,
            serverKey: symbol,
          }
        : { name: symbol, serverKey: symbol },
    };
  };

  // --- Handle sub-match progression ---
  const handleSubMatchComplete = useCallback((winner: "side1" | "side2") => {
    if (winner === "side1") setTeam1Wins((w) => w + 1);
    else setTeam2Wins((w) => w + 1);
    setIsSubMatchOver(true);
  }, []);

  const handleNextSubMatch = () => {
    const next = currentSubMatchIndex + 1;
    if (next >= swaythlingOrder.length) {
      const winner =
        team1Wins > team2Wins
          ? match.team1.name
          : team2Wins > team1Wins
          ? match.team2.name
          : "Draw";

      toast.success(`🏆 ${winner} wins the tie!`);
      return;
    }
    setCurrentSubMatchIndex(next);
    setIsSubMatchOver(false);
  };

  // --- Handle adding points ---
  const handleAddPoint = useCallback(
    ({ side, playerId }: { side: "side1" | "side2"; playerId?: string }) => {
      setPendingPlayer({ side, playerId });
      setShotDialogOpen(true);
    },
    [setPendingPlayer, setShotDialogOpen]
  );

  // --- Handle subtracting points ---
  const handleSubtractPoint = useCallback((side: "side1" | "side2") => {
    // Your subtract logic here
  }, []);

  // --- Current sub-match players ---
  const subMatch = swaythlingOrder[currentSubMatchIndex];

  console.log("=== DEBUG TEAM 1 ===");
console.log("Assignments:", match.team1.assignments);
console.log("Players:", match.team1.players.map((p: any) => ({
  id: p._id?.toString(),
  name: p.fullName || p.username,
  serverKey: p.serverKey,
})));

console.log("=== DEBUG TEAM 2 ===");
console.log("Assignments:", match.team2.assignments);
console.log("Players:", match.team2.players.map((p: any) => ({
  id: p._id?.toString(),
  name: p.fullName || p.username,
  serverKey: p.serverKey,
})));


  const findPlayerBySymbol = (team: any, symbol: string) => {
  if (!team?.assignments) return null;

  // find playerId by symbol
  const playerId = Object.keys(team.assignments).find(
    (id) => team.assignments[id] === symbol
  );

  if (!playerId) return null;

  // match the player.user._id
  return team.players.find((p: any) => p.user?._id === playerId) || null;
};



  const side1Player = findPlayerBySymbol(match.team1, subMatch.side1);
  const side2Player = findPlayerBySymbol(match.team2, subMatch.side2);

  console.log("side1Player:", side1Player);
  console.log("side2Player:", side2Player);

  const side1PlayerInfo = side1Player
  ? {
      name: side1Player.user?.fullName || side1Player.user?.username || subMatch.side1,
      playerId: side1Player.user?._id,
      serverKey: subMatch.side1,
    }
  : { name: subMatch.side1, serverKey: subMatch.side1 };

const side2PlayerInfo = side2Player
  ? {
      name: side2Player.user?.fullName || side2Player.user?.username || subMatch.side2,
      playerId: side2Player.user?._id,
      serverKey: subMatch.side2,
    }
  : { name: subMatch.side2, serverKey: subMatch.side2 };


    console.log("Side1 Player Info:", side1PlayerInfo);
    console.log("Side2 Player Info:", side2PlayerInfo);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Swaythling Cup: Match {currentSubMatchIndex + 1} /{" "}
          {swaythlingOrder.length}
        </h2>
        <div className="text-sm text-muted-foreground">
          {match.team1.name} Wins: {team1Wins} | {match.team2.name} Wins:{" "}
          {team2Wins}
        </div>
      </div>

      <ScoreBoard
        match={match as any} // adapt as needed
        side1Score={0}
        side2Score={0}
        isMatchActive={true}
        currentServer={null}
        side1Sets={0}
        side2Sets={0}
        status="scheduled"
        onAddPoint={handleAddPoint}
        onSubtractPoint={handleSubtractPoint}
        onReset={() => {}}
        onToggleMatch={() => {}}
        teamMatchPlayers={{ side1: side1PlayerInfo, side2: side2PlayerInfo }}
      />

      <ShotFeed games={[]} currentGame={1} participants={[]} />
      <GamesHistory games={[]} currentGame={1} participants={[]} />
      <ShotSelector />
      <InitialServerDialog matchType="team" participants={[]} />

      {isSubMatchOver && (
        <div className="text-center mt-6 space-y-2">
          <p className="font-semibold text-green-600">
            ✅ {subMatch.side1} vs {subMatch.side2} completed!
          </p>
          <button
            onClick={handleNextSubMatch}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition"
          >
            Next Match ({subMatch.side1} vs {subMatch.side2})
          </button>
        </div>
      )}
    </div>
  );
}
