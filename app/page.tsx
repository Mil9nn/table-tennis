"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { AlertCircle, Check, User, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGameStore } from "@/hooks/useGameStore";

interface RegisteredUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  totalMatches: number;
  wins: number;
  losses: number;
}

interface Player {
  userId: string;
  username: string;
  displayName: string;
  currentScore: number;
  gamesWon: number;
  serving: boolean;
  shots: {
    shotName: string;
    timestamp: number;
    player: number;
    scoreP1: number;
    scoreP2: number;
  }[];
}

interface Match {
  id: string;
  player1: {
    userId: string;
    username: string;
    displayName: string;
  };
  player2: {
    userId: string;
    username: string;
    displayName: string;
  };
  bestOf: number;
  games: Game[];
  winner: {
    userId: string;
    username: string;
    displayName: string;
  } | null;
  startTime: number;
  endTime: number | null;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  winner: number;
  shots: {
    shotName: string;
    timestamp: number;
    player: number;
    scoreP1: number;
    scoreP2: number;
  }[];
  startTime: number;
  endTime: number;
}

export default function EnhancedPingPongScorer() {
  const [gameState, setGameState] = useState<"setup" | "playing" | "finished">(
    "setup"
  );
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const savedData = useGameStore((state) => state.savedData);
  const setSavedData = useGameStore((state) => state.setSavedData);

  // User management
  const [player1Username, setPlayer1Username] = useState("");
  const [player2Username, setPlayer2Username] = useState("");
  const [player1User, setPlayer1User] = useState<RegisteredUser | null>(null);
  const [player2User, setPlayer2User] = useState<RegisteredUser | null>(null);
  const [userSearching, setUserSearching] = useState({ p1: false, p2: false });
  const [userErrors, setUserErrors] = useState({ p1: "", p2: "" });

  // Setup state
  const [bestOf, setBestOf] = useState(3);

  // Game state
  const [player1, setPlayer1] = useState<Player>({
    userId: "",
    username: "",
    displayName: "",
    currentScore: 0,
    gamesWon: 0,
    serving: true,
    shots: [],
  });

  const [player2, setPlayer2] = useState<Player>({
    userId: "",
    username: "",
    displayName: "",
    currentScore: 0,
    gamesWon: 0,
    serving: false,
    shots: [],
  });

  const [deuce, setDeuce] = useState(false);
  const [gameStartServer, setGameStartServer] = useState(1);
  const [shotPicker, setShotPicker] = useState<{
    player: 1 | 2;
    open: boolean;
  }>({ player: 1, open: false });

  const tableTennisShots = [
    "Forehand Drive",
    "Backhand Drive",
    "Forehand Push",
    "Backhand Push",
    "Forehand Smash",
    "Backhand Smash",
    "Forehand Loop",
    "Backhand Loop",
    "Chop",
    "Block",
    "Lob",
    "Serve (Topspin)",
    "Serve (Backspin)",
    "Serve (Sidespin)",
    "Flick",
    "Drop Shot",
  ];

  // Simple user search by exact username
  const searchUser = async (username: string, playerNum: 1 | 2) => {
    if (!username.trim()) {
      if (playerNum === 1) {
        setPlayer1User(null);
        setUserErrors((prev) => ({ ...prev, p1: "" }));
      } else {
        setPlayer2User(null);
        setUserErrors((prev) => ({ ...prev, p2: "" }));
      }
      return;
    }

    setUserSearching((prev) => ({
      ...prev,
      [playerNum === 1 ? "p1" : "p2"]: true,
    }));

    try {
      const response = await fetch(
        `/api/users/search?username=${encodeURIComponent(username.trim())}`
      );
      const data = await response.json();

      if (data.success && data.user) {
        if (playerNum === 1) {
          setPlayer1User(data.user);
          setUserErrors((prev) => ({ ...prev, p1: "" }));
        } else {
          setPlayer2User(data.user);
          setUserErrors((prev) => ({ ...prev, p2: "" }));
        }
      } else {
        if (playerNum === 1) {
          setPlayer1User(null);
          setUserErrors((prev) => ({
            ...prev,
            p1: "User not found. Please check username or ask them to register.",
          }));
        } else {
          setPlayer2User(null);
          setUserErrors((prev) => ({
            ...prev,
            p2: "User not found. Please check username or ask them to register.",
          }));
        }
      }
    } catch (error) {
      console.error("Error searching user:", error);
      const errorMsg = "Error searching for user. Please try again.";
      if (playerNum === 1) {
        setPlayer1User(null);
        setUserErrors((prev) => ({ ...prev, p1: errorMsg }));
      } else {
        setPlayer2User(null);
        setUserErrors((prev) => ({ ...prev, p2: errorMsg }));
      }
    } finally {
      setUserSearching((prev) => ({
        ...prev,
        [playerNum === 1 ? "p1" : "p2"]: false,
      }));
    }
  };

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (player1Username) {
        searchUser(player1Username, 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player1Username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (player2Username) {
        searchUser(player2Username, 2);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player2Username]);

  const startNewMatch = () => {
    if (!player1User || !player2User) {
      alert("Both players must be registered users to start a match.");
      return;
    }

    if (player1User._id === player2User._id) {
      alert("Players cannot play against themselves!");
      return;
    }

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      player1: {
        userId: player1User._id,
        username: player1User.username,
        displayName: player1User.displayName,
      },
      player2: {
        userId: player2User._id,
        username: player2User.username,
        displayName: player2User.displayName,
      },
      bestOf,
      games: [],
      winner: null,
      startTime: Date.now(),
      endTime: null,
    };

    setCurrentMatch(newMatch);
    setPlayer1({
      userId: player1User._id,
      username: player1User.username,
      displayName: player1User.displayName,
      currentScore: 0,
      gamesWon: 0,
      serving: true,
      shots: [],
    });
    setPlayer2({
      userId: player2User._id,
      username: player2User.username,
      displayName: player2User.displayName,
      currentScore: 0,
      gamesWon: 0,
      serving: false,
      shots: [],
    });
    setGameState("playing");
    setGameStartServer(1);
    setDeuce(false);
  };

  const finishCurrentGame = (winner: number) => {
    if (!currentMatch) return;

    const newGame: Game = {
      gameNumber: currentMatch.games.length + 1,
      player1Score: player1.currentScore,
      player2Score: player2.currentScore,
      winner,
      shots: [...player1.shots, ...player2.shots].sort(
        (a, b) => a.timestamp - b.timestamp
      ),
      startTime:
        currentMatch.games.length === 0
          ? currentMatch.startTime
          : Date.now() - 300000,
      endTime: Date.now(),
    };

    // Calculate current games won
    const gamesNeededToWin = Math.ceil(bestOf / 2);
    const p1Games = winner === 1 ? player1.gamesWon + 1 : player1.gamesWon;
    const p2Games = winner === 2 ? player2.gamesWon + 1 : player2.gamesWon;

    // Update match with new game
    const updatedMatch = {
      ...currentMatch,
      games: [...currentMatch.games, newGame],
    };

    // Check if match is won
    if (p1Games >= gamesNeededToWin) {
      updatedMatch.winner = currentMatch.player1;
      updatedMatch.endTime = Date.now();
      setMatches((prev) => [...prev, updatedMatch]);
      setCurrentMatch(updatedMatch);
      setGameState("finished");
      return; // Exit early
    } else if (p2Games >= gamesNeededToWin) {
      updatedMatch.winner = currentMatch.player2;
      updatedMatch.endTime = Date.now();
      setMatches((prev) => [...prev, updatedMatch]);
      setCurrentMatch(updatedMatch);
      setGameState("finished");
      return; // Exit early
    }

    // Continue to next game
    const nextServer = gameStartServer === 1 ? 2 : 1;
    setGameStartServer(nextServer);

    setPlayer1((prev) => ({
      ...prev,
      currentScore: 0,
      gamesWon: winner === 1 ? prev.gamesWon + 1 : prev.gamesWon,
      serving: nextServer === 1,
      shots: [],
    }));

    setPlayer2((prev) => ({
      ...prev,
      currentScore: 0,
      gamesWon: winner === 2 ? prev.gamesWon + 1 : prev.gamesWon,
      serving: nextServer === 2,
      shots: [],
    }));

    setCurrentMatch(updatedMatch);
    setDeuce(false);
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const totalPoints = player1.currentScore + player2.currentScore;

    // Check for game completion - ensure both conditions are met
    const hasMinScore =
      Math.max(player1.currentScore, player2.currentScore) >= 11;
    const hasTwoPointLead =
      Math.abs(player1.currentScore - player2.currentScore) >= 2;

    if (hasMinScore && hasTwoPointLead) {
      if (player1.currentScore > player2.currentScore) {
        setTimeout(() => finishCurrentGame(1), 100);
        return;
      } else if (player2.currentScore > player1.currentScore) {
        setTimeout(() => finishCurrentGame(2), 100);
        return;
      }
    }

    // Handle serving logic
    const isDeuce = player1.currentScore >= 10 && player2.currentScore >= 10;
    setDeuce(isDeuce);

    if (isDeuce) {
      const shouldPlayer1Serve =
        totalPoints % 2 === 0 ? gameStartServer === 1 : gameStartServer === 2;
      setPlayer1((prev) => ({ ...prev, serving: shouldPlayer1Serve }));
      setPlayer2((prev) => ({ ...prev, serving: !shouldPlayer1Serve }));
    } else {
      const servingPairs = Math.floor(totalPoints / 2);
      const shouldPlayer1Serve =
        servingPairs % 2 === 0 ? gameStartServer === 1 : gameStartServer === 2;
      setPlayer1((prev) => ({ ...prev, serving: shouldPlayer1Serve }));
      setPlayer2((prev) => ({ ...prev, serving: !shouldPlayer1Serve }));
    }
  }, [
    player1.currentScore,
    player2.currentScore,
    gameStartServer,
    gameState,
    bestOf,
  ]);

  const handleShotSelect = (shotName: string) => {
    const shotData = {
      shotName,
      timestamp: Date.now(),
      player: shotPicker.player,
      scoreP1:
        shotPicker.player === 1
          ? player1.currentScore + 1
          : player1.currentScore,
      scoreP2:
        shotPicker.player === 2
          ? player2.currentScore + 1
          : player2.currentScore,
    };

    if (shotPicker.player === 1) {
      setPlayer1((prev) => ({
        ...prev,
        currentScore: prev.currentScore + 1,
        shots: [...prev.shots, shotData],
      }));
    } else {
      setPlayer2((prev) => ({
        ...prev,
        currentScore: prev.currentScore + 1,
        shots: [...prev.shots, shotData],
      }));
    }
    setShotPicker({ player: 1, open: false });
  };

  const resetToSetup = () => {
    setGameState("setup");
    setCurrentMatch(null);
    setPlayer1Username("");
    setPlayer2Username("");
    setPlayer1User(null);
    setPlayer2User(null);
    setUserErrors({ p1: "", p2: "" });
    setBestOf(3);
    setPlayer1({
      userId: "",
      username: "",
      displayName: "",
      currentScore: 0,
      gamesWon: 0,
      serving: true,
      shots: [],
    });
    setPlayer2({
      userId: "",
      username: "",
      displayName: "",
      currentScore: 0,
      gamesWon: 0,
      serving: false,
      shots: [],
    });
    setDeuce(false);
    setGameStartServer(1);
  };

  const saveMatch = async () => {
    if (!currentMatch || !currentMatch.winner) {
      alert("❌ No completed match to save");
      return;
    }

    try {
      const res = await fetch("/api/match/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMatch),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setSavedData(data);

      if (data.success) {
        // Calculate final score for display
        const p1Games = currentMatch.games.filter((g) => g.winner === 1).length;
        const p2Games = currentMatch.games.filter((g) => g.winner === 2).length;

        alert(
          `✅ Match saved! ${currentMatch.winner.displayName} wins ${Math.max(
            p1Games,
            p2Games
          )}-${Math.min(p1Games, p2Games)}`
        );
        resetToSetup();
      } else {
        alert("❌ Failed to save match: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save match error:", error);
      alert("❌ Error saving match: " + error.message);
    }
  };

  // Setup Screen
  if (gameState === "setup") {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Table Tennis Scorer
        </h1>

        <div className="space-y-6">
          {/* Player 1 */}
          <div>
            <Label htmlFor="player1">Player 1 Username</Label>
            <div className="relative">
              <Input
                id="player1"
                placeholder="Enter username"
                value={player1Username}
                onChange={(e) => setPlayer1Username(e.target.value)}
                className={
                  userErrors.p1
                    ? "border-red-300"
                    : player1User
                    ? "border-green-300"
                    : ""
                }
              />
              <div className="absolute right-3 top-3">
                {userSearching.p1 && (
                  <Search className="w-4 h-4 animate-spin" />
                )}
                {!userSearching.p1 && player1User && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!userSearching.p1 && userErrors.p1 && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {player1User && (
              <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium">{player1User.displayName}</div>
                  <div className="text-gray-600">
                    {player1User.wins}W-{player1User.losses}L (
                    {player1User.totalMatches} matches)
                  </div>
                </div>
              </div>
            )}
            {userErrors.p1 && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {userErrors.p1}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Player 2 */}
          <div>
            <Label htmlFor="player2">Player 2 Username</Label>
            <div className="relative">
              <Input
                id="player2"
                placeholder="Enter username"
                value={player2Username}
                onChange={(e) => setPlayer2Username(e.target.value)}
                className={
                  userErrors.p2
                    ? "border-red-300"
                    : player2User
                    ? "border-green-300"
                    : ""
                }
              />
              <div className="absolute right-3 top-3">
                {userSearching.p2 && (
                  <Search className="w-4 h-4 animate-spin" />
                )}
                {!userSearching.p2 && player2User && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!userSearching.p2 && userErrors.p2 && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {player2User && (
              <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium">{player2User.displayName}</div>
                  <div className="text-gray-600">
                    {player2User.wins}W-{player2User.losses}L (
                    {player2User.totalMatches} matches)
                  </div>
                </div>
              </div>
            )}
            {userErrors.p2 && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {userErrors.p2}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="bestof">Match Format</Label>
            <Select
              value={bestOf.toString()}
              onValueChange={(value) => setBestOf(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Best of 3</SelectItem>
                <SelectItem value="5">Best of 5</SelectItem>
                <SelectItem value="7">Best of 7</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={startNewMatch}
            className="w-full"
            size="lg"
            disabled={!player1User || !player2User}
          >
            Start Match
          </Button>

          {(!player1User || !player2User) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Both players must be registered users to start a match. If a
                player doesn't exist, they need to register first.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // Game Screen
  if (gameState === "playing") {
    const gamesNeededToWin = Math.ceil(bestOf / 2);

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Dialog
          open={shotPicker.open}
          onOpenChange={(open) => setShotPicker((prev) => ({ ...prev, open }))}
        >
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Select Shot</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {tableTennisShots.map((shot) => (
                <Button
                  key={shot}
                  variant="outline"
                  onClick={() => handleShotSelect(shot)}
                >
                  {shot}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {player1.displayName} vs {player2.displayName}
          </h1>
          <p className="text-gray-600">
            Best of {bestOf} • Game {(currentMatch?.games.length || 0) + 1}
          </p>
          <p className="text-sm text-gray-500">
            First to {gamesNeededToWin} games wins
          </p>
        </div>

        {deuce && (
          <div className="text-center mb-4">
            <p className="text-red-500 text-xl font-bold">DEUCE!</p>
            <p className="text-sm text-gray-600">
              First to lead by 2 points wins
            </p>
          </div>
        )}

        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="bg-blue-100 p-6 min-w-48 w-[45%] rounded-lg">
            <h2 className="text-xl font-semibold mb-2">
              {player1.displayName}
            </h2>
            <p className="text-sm text-gray-600 mb-2">@{player1.username}</p>
            <div className="mb-2 h-8">
              {player1.serving && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  SERVING
                </span>
              )}
            </div>
            <div className="text-4xl font-bold mb-2 text-blue-600">
              {player1.currentScore}
            </div>
            <p className="mb-4 text-gray-600">
              Games: {player1.gamesWon}/{gamesNeededToWin}
            </p>
            <Button
              onClick={() => setShotPicker({ player: 1, open: true })}
              className="w-full"
            >
              +1 Point
            </Button>
          </div>

          <div className="text-2xl font-bold text-gray-400">VS</div>

          <div className="bg-red-100 p-6 min-w-48 w-[45%] rounded-lg">
            <h2 className="text-xl font-semibold mb-2">
              {player2.displayName}
            </h2>
            <p className="text-sm text-gray-600 mb-2">@{player2.username}</p>
            <div className="mb-2 h-8">
              {player2.serving && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  SERVING
                </span>
              )}
            </div>
            <div className="text-4xl font-bold mb-2 text-red-600">
              {player2.currentScore}
            </div>
            <p className="mb-4 text-gray-600">
              Games: {player2.gamesWon}/{gamesNeededToWin}
            </p>
            <Button
              onClick={() => setShotPicker({ player: 2, open: true })}
              className="w-full"
            >
              +1 Point
            </Button>
          </div>
        </div>

        {currentMatch && currentMatch.games.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Games Completed</h3>
            <div className="flex gap-2 flex-wrap">
              {currentMatch.games.map((game, idx) => (
                <div key={idx} className="border rounded p-2 text-sm">
                  Game {game.gameNumber}: {game.player1Score}-
                  {game.player2Score}
                  {game.winner === 1 && (
                    <span className="text-blue-600 ml-2">✓</span>
                  )}
                  {game.winner === 2 && (
                    <span className="text-red-600 ml-2">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Button onClick={resetToSetup} variant="outline">
            End Match
          </Button>
        </div>
      </div>
    );
  }

  // Match Finished Screen
  if (gameState === "finished" && currentMatch && currentMatch.winner) {
    const p1Games = currentMatch.games.filter((g) => g.winner === 1).length;
    const p2Games = currentMatch.games.filter((g) => g.winner === 2).length;
    const winnerGames =
      currentMatch.winner.userId === currentMatch.player1.userId
        ? p1Games
        : p2Games;
    const loserGames = currentMatch.games.length - winnerGames;

    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Match Complete!</h1>
      <div className="bg-green-100 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-2">
          🏆 {currentMatch.winner.displayName} Wins!
        </h2>
        <p className="text-lg mb-4">
          {currentMatch.player1.displayName} vs {currentMatch.player2.displayName}
        </p>
        <div className="text-gray-600">
          <p>Games Won: {winnerGames} - {loserGames}</p>
          <p>Total Games: {currentMatch.games.length}</p>
        </div>
      </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Game-by-Game Results</h3>
          <div className="space-y-2">
            {currentMatch.games.map((game, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border rounded p-3"
              >
                <span>Game {game.gameNumber}</span>
                <span className="font-mono">
                  {game.player1Score} - {game.player2Score}
                </span>
                <span className="font-semibold">
                  {game.winner === 1
                    ? currentMatch.player1.displayName
                    : currentMatch.player2.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={saveMatch} size="lg">
            Save Match
          </Button>
          <Button onClick={resetToSetup} variant="outline" size="lg">
            New Match
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
