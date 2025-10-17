"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import ScoreBoard from "../common/ScoreBoard";
import { useMatchStore } from "@/hooks/useMatchStore";
import { TeamMatch, TeamInfo, Participant, IndividualGame, InitialServerConfig } from "@/types/match.type";
import ShotSelector from "@/components/ShotSelector";
import ShotFeed from "../common/ShotFeed";
import GamesHistory from "../common/GamesHistory";
import InitialServerDialog from "@/components/ServerDialog";
import { axiosInstance } from "@/lib/axiosInstance";
import { checkGameWon, getNextServer } from "../individual/helpers";

interface SubMatch {
  subMatchNumber: number;
  type: "singles" | "doubles" | "mixed_doubles";
  team1Players: string[]; // Array of ObjectIds as strings
  team2Players: string[]; // Array of ObjectIds as strings
  games: IndividualGame[];
  currentGame: number;
  finalScore: {
    team1Sets: number;
    team2Sets: number;
  };
  winnerSide?: "team1" | "team2" | null;
  serverConfig?: InitialServerConfig | null;
  completed: boolean;
}

interface PlayerInfo {
  name: string;
  playerId: string;
  symbol: string; // A, B, C, X, Y, Z
}

interface SwaythlingMatchup {
  team1Symbol: string;
  team2Symbol: string;
  label: string;
}

interface SwaythlingFormatScorerProps {
  match: TeamMatch;
}

interface ScoreUpdatePayload {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
  gameWinner: "team1" | "team2" | null;
  currentServer: string | null;
  shotData?: {
    side: "team1" | "team2";
    player: string;
    stroke?: string | null;
    outcome: "winner" | "error" | "let";
    errorType?: "net" | "long" | "serve" | null;
    server?: string | null;
  };
}

export default function SwaythlingFormatScorer({
  match,
}: SwaythlingFormatScorerProps) {
  // Local state for current submatch scoring
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentServer, setCurrentServer] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState(1);
  const [team1Sets, setTeam1Sets] = useState(0);
  const [team2Sets, setTeam2Sets] = useState(0);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const setPendingPlayer = useMatchStore((s) => s.setPendingPlayer);
  const setShotDialogOpen = useMatchStore((s) => s.setShotDialogOpen);
  const setServerDialogOpen = useMatchStore((s) => s.setServerDialogOpen);

  const lastMatchId = useRef<string | null>(null);
  const lastSubMatchIndex = useRef<number>(-1);

  // Swaythling order: A vs X, B vs Y, C vs Z, A vs Y, B vs X
  const swaythlingOrder: SwaythlingMatchup[] = [
    { team1Symbol: "A", team2Symbol: "X", label: "A vs X" },
    { team1Symbol: "B", team2Symbol: "Y", label: "B vs Y" },
    { team1Symbol: "C", team2Symbol: "Z", label: "C vs Z" },
    { team1Symbol: "A", team2Symbol: "Y", label: "A vs Y" },
    { team1Symbol: "B", team2Symbol: "X", label: "B vs X" },
  ];

  // ============================================
  // HELPER: Find Player by Symbol
  // ============================================
  const findPlayerBySymbol = useCallback(
    (team: TeamInfo, symbol: string): PlayerInfo | null => {
      console.log("\n🔍 === Finding Player ===");
      console.log("Team:", team?.name);
      console.log("Looking for symbol:", symbol);

      if (!team?.players || !team.assignments) {
        console.error("❌ Team missing players or assignments");
        return null;
      }

      console.log("Assignments:", team.assignments);

      // Find playerId that has this symbol assigned
      const playerId = Object.keys(team.assignments).find(
        (id) => team.assignments![id] === symbol
      );

      if (!playerId) {
        console.error(`❌ No assignment found for symbol ${symbol}`);
        return null;
      }

      console.log("✅ Found playerId:", playerId);

      // Find player object
      const playerEntry = team.players.find((p) => {
        const userId =
          typeof p.user === "string" ? p.user : p.user?._id?.toString();
        return userId === playerId;
      });

      if (!playerEntry) {
        console.error(`❌ Player object not found for playerId ${playerId}`);
        return null;
      }

      const user =
        typeof playerEntry.user === "string"
          ? { _id: playerEntry.user, username: symbol }
          : playerEntry.user;

      const result: PlayerInfo = {
        name: user.fullName || user.username || symbol,
        playerId: user._id.toString(),
        symbol,
      };

      console.log("✅ Returning:", result);
      console.log("=== End Finding Player ===\n");

      return result;
    },
    []
  );

  // ============================================
  // CURRENT SUBMATCH
  // ============================================
  const currentSubMatchIndex = (match.currentSubMatch || 1) - 1;
  const currentSubMatch = match.subMatches?.[currentSubMatchIndex] as
    | SubMatch
    | undefined;

  // ============================================
  // INITIALIZE STATE FROM SUBMATCH
  // ============================================
  useEffect(() => {
    if (!match || !currentSubMatch) return;

    const matchChanged = lastMatchId.current !== match._id;
    const subMatchChanged = lastSubMatchIndex.current !== currentSubMatchIndex;

    if (matchChanged || subMatchChanged) {
      console.log("\n🎮 === Initializing State ===");
      console.log("SubMatch:", currentSubMatch);

      const currentGameNum = currentSubMatch.currentGame || 1;
      const currentGameObj = currentSubMatch.games?.find(
        (g) => g.gameNumber === currentGameNum && !g.completed
      );

      console.log("Current game:", currentGameObj);

      setTeam1Score(currentGameObj?.team1Score || 0);
      setTeam2Score(currentGameObj?.team2Score || 0);
      setCurrentGame(currentGameNum);
      setTeam1Sets(currentSubMatch.finalScore?.team1Sets || 0);
      setTeam2Sets(currentSubMatch.finalScore?.team2Sets || 0);
      
      // Get server from serverConfig if available
      const server = currentSubMatch.serverConfig?.firstServer || null;
      setCurrentServer(server);
      
      setIsMatchActive(
        match.status === "in_progress" && !currentSubMatch.completed
      );

      lastMatchId.current = match._id;
      lastSubMatchIndex.current = currentSubMatchIndex;

      console.log("State initialized:", {
        team1Score: currentGameObj?.team1Score || 0,
        team2Score: currentGameObj?.team2Score || 0,
        currentGame: currentGameNum,
        team1Sets: currentSubMatch.finalScore?.team1Sets || 0,
        team2Sets: currentSubMatch.finalScore?.team2Sets || 0,
        server,
      });
      console.log("=== End Initialization ===\n");
    }
  }, [match, currentSubMatch, currentSubMatchIndex]);

  // ============================================
  // ADD POINT HANDLER
  // ============================================
  const handleAddPoint = useCallback(
    async ({
      side,
      playerId,
    }: {
      side: "team1" | "team2";
      playerId: string;
    }) => {
      if (currentSubMatch?.completed) {
        toast.error("This submatch is completed!");
        return;
      }
      if (!isMatchActive) {
        toast.error("Start the match first");
        return;
      }

      const newTeam1 = side === "team1" ? team1Score + 1 : team1Score;
      const newTeam2 = side === "team2" ? team2Score + 1 : team2Score;

      const gameWinner = checkGameWon(newTeam1, newTeam2);

      // Get shot data from store
      const pendingShot = useMatchStore.getState().pendingShot;
      const shotType = pendingShot?.shotType;

      const requestBody: ScoreUpdatePayload = {
        gameNumber: currentGame,
        team1Score: newTeam1,
        team2Score: newTeam2,
        gameWinner: gameWinner as "team1" | "team2" | null,
        currentServer,
      };

      // Add shot data if available
      if (shotType && playerId) {
        const isError = shotType?.endsWith("_error");
        requestBody.shotData = {
          side,
          player: playerId,
          stroke: isError ? null : shotType,
          outcome: isError ? "error" : "winner",
          errorType:
            shotType === "net_error"
              ? "net"
              : shotType === "long_error"
              ? "long"
              : shotType === "serve_error"
              ? "serve"
              : null,
          server: currentServer === playerId ? playerId : null,
        };
      }

      console.log("\n📤 Sending score update:", requestBody);

      setIsUpdating(true);
      try {
        const { data } = await axiosInstance.post(
          `/matches/team/${match._id}/submatch/${
            currentSubMatchIndex + 1
          }/score`,
          requestBody
        );

        console.log("✅ Score updated:", data);

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);

          const updatedSubMatch = data.match.subMatches[
            currentSubMatchIndex
          ] as SubMatch;

          if (gameWinner) {
            // Game won
            setTeam1Sets(updatedSubMatch.finalScore.team1Sets);
            setTeam2Sets(updatedSubMatch.finalScore.team2Sets);

            if (updatedSubMatch.completed) {
              toast.success(
                `🎉 Submatch ${currentSubMatchIndex + 1} completed!`
              );
              setIsMatchActive(false);
            } else {
              const nextGameNum = currentGame + 1;
              setCurrentGame(nextGameNum);
              setTeam1Score(0);
              setTeam2Score(0);

              // Switch server for new game
              const nextServer =
                currentServer === "team1" ? "team2" : "team1";
              setCurrentServer(nextServer);

              toast.success(
                `Game ${currentGame} won! Starting Game ${nextGameNum}`
              );
            }
          } else {
            // Point scored
            setTeam1Score(newTeam1);
            setTeam2Score(newTeam2);

            // Calculate next server (every 2 points)
            const totalPoints = newTeam1 + newTeam2;
            const isExpedite = updatedSubMatch.games.find(
              (g) => g.gameNumber === currentGame
            )?.expedite;

            const servesPerPlayer = isExpedite ? 1 : 2;

            if (totalPoints % servesPerPlayer === 0) {
              const nextServer =
                currentServer === "team1" ? "team2" : "team1";
              setCurrentServer(nextServer);
            }
          }
        }
      } catch (err: any) {
        console.error("❌ Error updating score:", err);
        toast.error(err.response?.data?.message || "Failed to update score");
      } finally {
        setIsUpdating(false);
      }
    },
    [
      team1Score,
      team2Score,
      currentGame,
      isMatchActive,
      currentSubMatch,
      match._id,
      currentSubMatchIndex,
      currentServer,
    ]
  );

  // ============================================
  // SUBTRACT POINT HANDLER
  // ============================================
  const handleSubtractPoint = useCallback(
    async (side: "team1" | "team2") => {
      if (currentSubMatch?.completed) {
        toast.error("This submatch is completed!");
        return;
      }

      try {
        const { data } = await axiosInstance.post(
          `/matches/team/${match._id}/submatch/${
            currentSubMatchIndex + 1
          }/score`,
          {
            action: "subtract",
            side,
            gameNumber: currentGame,
          }
        );

        if (data?.match) {
          useMatchStore.getState().setMatch(data.match);

          const updatedSubMatch = data.match.subMatches[
            currentSubMatchIndex
          ] as SubMatch;
          const game = updatedSubMatch.games?.find(
            (g) => g.gameNumber === currentGame
          );

          if (game) {
            setTeam1Score(game.team1Score);
            setTeam2Score(game.team2Score);
          }
        }
      } catch (err) {
        console.error("❌ Error subtracting point:", err);
        toast.error("Failed to subtract point");
      }
    },
    [currentSubMatch, match._id, currentSubMatchIndex, currentGame]
  );

  // ============================================
  // RESET HANDLER
  // ============================================
  const handleReset = useCallback(async () => {
    setTeam1Score(0);
    setTeam2Score(0);
    toast.success("Game reset");
  }, []);

  // ============================================
  // TOGGLE MATCH HANDLER
  // ============================================
  const handleToggleMatch = useCallback(async () => {
    const nextStatus = isMatchActive ? "scheduled" : "in_progress";

    try {
      await axiosInstance.post(`/matches/team/${match._id}/status`, {
        status: nextStatus,
      });

      setIsMatchActive(!isMatchActive);
      toast.success(isMatchActive ? "Match paused" : "Match started!");

      // Show server dialog if starting and no server selected
      if (!isMatchActive && !currentServer) {
        setTimeout(() => setServerDialogOpen(true), 500);
      }
    } catch (err) {
      console.error("❌ Failed to toggle match:", err);
      toast.error("Failed to update match status");
    }
  }, [isMatchActive, currentServer, match._id, setServerDialogOpen]);

  // ============================================
  // NEXT SUBMATCH HANDLER
  // ============================================
  const handleNextSubMatch = useCallback(() => {
    if (currentSubMatchIndex < swaythlingOrder.length - 1) {
      window.location.reload();
    } else {
      toast.success("🏆 All submatches completed!");
    }
  }, [currentSubMatchIndex, swaythlingOrder.length]);

  // ============================================
  // VALIDATION CHECKS
  // ============================================
  const isTeam1Populated =
    match.team1 && typeof match.team1 === "object" && "name" in match.team1;
  const isTeam2Populated =
    match.team2 && typeof match.team2 === "object" && "name" in match.team2;

  if (!isTeam1Populated || !isTeam2Populated) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">
          ⚠️ Team data not loaded properly
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please refresh the page. If the issue persists, the match data may be
          corrupted.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // ============================================
  // GET CURRENT PLAYERS
  // ============================================
  const currentMatchup = swaythlingOrder[currentSubMatchIndex];

  console.log("\n🎮 === Current Matchup ===");
  console.log("Matchup:", currentMatchup);
  console.log("=== End Matchup ===\n");

  const team1Player = findPlayerBySymbol(
    match.team1,
    currentMatchup.team1Symbol
  );
  const team2Player = findPlayerBySymbol(
    match.team2,
    currentMatchup.team2Symbol
  );

  // Calculate team wins
  const team1Wins = match.finalScore?.team1Matches || 0;
  const team2Wins = match.finalScore?.team2Matches || 0;

  if (!team1Player || !team2Player) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-medium text-lg">
          ⚠️ Players not properly assigned for {currentMatchup.label}
        </p>
        <div className="text-sm text-left max-w-md mx-auto space-y-2 bg-gray-50 p-4 rounded-lg">
          <p className="font-medium">Debug Info:</p>
          <p>
            Looking for: {currentMatchup.team1Symbol} (Team 1) vs{" "}
            {currentMatchup.team2Symbol} (Team 2)
          </p>
          <p>
            Team 1 ({match.team1.name}) assignments:{" "}
            {JSON.stringify(match.team1.assignments)}
          </p>
          <p>
            Team 2 ({match.team2.name}) assignments:{" "}
            {JSON.stringify(match.team2.assignments)}
          </p>
          <p className="text-red-600">
            Missing: {!team1Player ? currentMatchup.team1Symbol : ""}{" "}
            {!team2Player ? currentMatchup.team2Symbol : ""}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please go to Teams page and assign players A, B, C for{" "}
          {match.team1.name} and X, Y, Z for {match.team2.name}
        </p>
        <a
          href="/teams"
          className="inline-block px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          Go to Teams Page
        </a>
      </div>
    );
  }

  const isSubMatchCompleted = currentSubMatch?.completed || false;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Submatch Progress Header */}
      <div className="bg-card border p-4 px-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="flex flex-col gap-2 text-lg font-semibold text-foreground">
              <span>Swaythling Format</span>
              <span>
                Match {currentSubMatchIndex + 1} / {swaythlingOrder.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1 bg-gray-200 p-1 rounded-full px-3">
              {team1Player.name} vs {team2Player.name} - Best of{" "}
              {match.numberOfSetsPerSubMatch || 3}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              <span className="text-blue-600">
                {match.team1.name}: {team1Wins}
              </span>
              <span className="mx-2">-</span>
              <span className="text-red-600">
                {match.team2.name}: {team2Wins}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isSubMatchCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
          <p className="text-lg font-semibold text-green-700">
            ✅ {team1Player.name} vs {team2Player.name} completed!
          </p>
          <p className="text-sm text-muted-foreground">
            Winner:{" "}
            {currentSubMatch.winnerSide === "team1"
              ? team1Player.name
              : team2Player.name}
          </p>
          {currentSubMatchIndex < swaythlingOrder.length - 1 && (
            <button
              onClick={handleNextSubMatch}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition font-medium"
            >
              Next Match: {swaythlingOrder[currentSubMatchIndex + 1].label}
            </button>
          )}
        </div>
      ) : (
        <>
          <ScoreBoard
            match={match as any}
            side1Score={team1Score}
            side2Score={team2Score}
            isMatchActive={isMatchActive}
            currentServer={currentServer}
            side1Sets={team1Sets}
            side2Sets={team2Sets}
            status={match.status}
            onAddPoint={({ side }) => {
              if (!isMatchActive) {
                toast.error("Start the match first");
                return;
              }
              const playerId =
                side === "side1" ? team1Player.playerId : team2Player.playerId;
              setPendingPlayer({ side, playerId });
              setShotDialogOpen(true);
            }}
            onSubtractPoint={(side) => handleSubtractPoint(side as "team1" | "team2")}
            onReset={handleReset}
            onToggleMatch={handleToggleMatch}
            teamMatchPlayers={{
              side1: team1Player,
              side2: team2Player,
            }}
          />

          <GamesHistory
            games={currentSubMatch?.games || []}
            currentGame={currentGame}
            participants={[
              {
                _id: team1Player.playerId,
                fullName: team1Player.name,
                username: team1Player.name,
              },
              {
                _id: team2Player.playerId,
                fullName: team2Player.name,
                username: team2Player.name,
              },
            ]}
          />

          <ShotFeed
            games={currentSubMatch?.games || []}
            currentGame={currentGame}
            participants={[
              {
                _id: team1Player.playerId,
                fullName: team1Player.name,
                username: team1Player.name,
              },
              {
                _id: team2Player.playerId,
                fullName: team2Player.name,
                username: team2Player.name,
              },
            ]}
          />

          <ShotSelector
            onShotSelect={(shotType) => {
              const pending = useMatchStore.getState().pendingPlayer;
              if (pending) {
                handleAddPoint({
                  side: pending.side as "team1" | "team2",
                  playerId: pending.playerId,
                });
              }
            }}
          />

          <InitialServerDialog
            matchType="singles"
            participants={[
              {
                _id: team1Player.playerId,
                fullName: team1Player.name,
                username: team1Player.name,
              },
              {
                _id: team2Player.playerId,
                fullName: team2Player.name,
                username: team2Player.name,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}