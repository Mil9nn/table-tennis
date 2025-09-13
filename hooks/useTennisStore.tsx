import { RecentShot } from "@/app/match/play/page";
import { create } from "zustand";

interface Shot {
  shotName: string;
  timestamp: number;
  playerId: string;
  scoreP1: number;
  scoreP2: number;
}

interface Player {
  userId: string;
  username: string;
  displayName: string;
  currentScore: number;
  gamesWon: number;
  serving: boolean;
  shots: Shot[];
}

interface RegisteredUser {
  _id: string;
  username: string;
  displayName: string;
  wins: number;
  losses: number;
  totalMatches: number;
}

interface Game {
  gameNumber: number;
  scores: Record<string, number>; // { userId: score }
  winnerId: string;
  shots: Shot[];
  startTime: number;
  endTime: number;
}

interface Match {
  id: string;
  playerOrder: string[]; // Support 2 or 4 players
  players: Record<
    string,
    { userId: string; username: string; displayName: string }
  >;
  bestOf: number;
  category: "singles" | "doubles";
  games: Game[];
  winnerId: string | null;
  startTime: number;
  endTime: number | null;
}

interface GameState {
  gameState: "setup" | "playing" | "finished";
  currentMatch: Match | null;
  matches: Match[];

  players: Record<string, Player>;
  playerOrder: string[] | null; // Support 2 or 4 players
  bestOf: number;
  category: "singles" | "doubles";

  deuce: boolean;
  gameStartServer: string | null;

  shotPicker: { playerId: string | null; open: boolean };

  // User mgmt - expanded for doubles
  playerUsers: Record<"p1" | "p2" | "p3" | "p4", RegisteredUser | null>;
  userSearching: Record<"p1" | "p2" | "p3" | "p4", boolean>;
  userErrors: Record<"p1" | "p2" | "p3" | "p4", string>;

  savedData: any;

  // Actions
  setGameState: (state: "setup" | "playing" | "finished") => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (userId: string, updater: (prev: Player) => Player) => void;
  removePlayer: (userId: string) => void;
  resetPlayers: () => void;

  setBestOf: (bestOf: number) => void;
  setCategory: (category: "singles" | "doubles") => void;
  setShotPicker: (picker: { playerId: string | null; open: boolean }) => void;

  setPlayerUser: (slot: "p1" | "p2" | "p3" | "p4", user: RegisteredUser | null) => void;
  setUserSearching: (next: Record<"p1" | "p2" | "p3" | "p4", boolean>) => void;
  setUserErrors: (next: Record<"p1" | "p2" | "p3" | "p4", string>) => void;

  setSavedData: (data: any) => void;
  addMatch: (match: Match) => void;

  // Game logic
  startNewMatch: () => void;
  finishCurrentGame: (winnerId: string) => void;
  handleShotSelect: (shotName: string) => void;
  resetToSetup: () => void;
  updateServingLogic: () => void;

  recentShots: RecentShot[];
  setRecentShots: (shots: RecentShot[]) => void;

  searchUser: (username: string, slot: "p1" | "p2" | "p3" | "p4") => Promise<void>;
}

export const useTennisStore = create<GameState>((set, get) => ({
  gameState: "setup",
  currentMatch: null,
  matches: [],

  players: {},
  playerOrder: null,
  bestOf: 3,
  category: "singles",

  deuce: false,
  gameStartServer: null,

  shotPicker: { playerId: null, open: false },

  playerUsers: { p1: null, p2: null, p3: null, p4: null },
  userSearching: { p1: false, p2: false, p3: false, p4: false },
  userErrors: { p1: "", p2: "", p3: "", p4: "" },

  savedData: null,

  recentShots: [],
  setRecentShots: (shots) => set({ recentShots: shots }),

  // Actions
  setGameState: (state) => set({ gameState: state }),

  addPlayer: (player) =>
    set((state) => ({
      players: { ...state.players, [player.userId]: player },
    })),

  updatePlayer: (userId, updater) =>
    set((state) => ({
      players: { ...state.players, [userId]: updater(state.players[userId]) },
    })),

  removePlayer: (userId) =>
    set((state) => {
      const newPlayers = { ...state.players };
      delete newPlayers[userId];
      return { players: newPlayers };
    }),

  resetPlayers: () => set({ players: {}, playerOrder: null }),

  setBestOf: (bestOf) => set({ bestOf }),
  setCategory: (category) => set({ category }),
  setShotPicker: (picker) => set({ shotPicker: picker }),

  setPlayerUser: (slot, user) =>
    set((state) => ({
      playerUsers: { ...state.playerUsers, [slot]: user },
    })),

  setUserSearching: (next) => set({ userSearching: next }),
  setUserErrors: (next) => set({ userErrors: next }),

  setSavedData: (data) => set({ savedData: data }),
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),

  // Start match - updated for doubles
  startNewMatch: () => {
    const { playerUsers, bestOf, category } = get();
    const p1 = playerUsers.p1;
    const p2 = playerUsers.p2;
    const p3 = playerUsers.p3;
    const p4 = playerUsers.p4;

    if (!p1 || !p2) {
      alert("Both players must be registered users to start a match.");
      return;
    }

    if (category === "doubles" && (!p3 || !p4)) {
      alert("All four players must be registered users for doubles match.");
      return;
    }

    // Check for duplicate players
    const playerIds = [p1._id, p2._id];
    if (category === "doubles") {
      playerIds.push(p3!._id, p4!._id);
    }
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      alert("All players must be different!");
      return;
    }

    const matchPlayers: Record<string, { userId: string; username: string; displayName: string }> = {
      [p1._id]: {
        userId: p1._id,
        username: p1.username,
        displayName: p1.displayName,
      },
      [p2._id]: {
        userId: p2._id,
        username: p2.username,
        displayName: p2.displayName,
      },
    };

    const gamePlayers: Record<string, Player> = {
      [p1._id]: {
        userId: p1._id,
        username: p1.username,
        displayName: p1.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: true, // P1 starts serving
        shots: [],
      },
      [p2._id]: {
        userId: p2._id,
        username: p2.username,
        displayName: p2.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: false,
        shots: [],
      },
    };

    let orderArray: string[] = [p1._id, p2._id];

    if (category === "doubles") {
      matchPlayers[p3!._id] = {
        userId: p3!._id,
        username: p3!.username,
        displayName: p3!.displayName,
      };
      matchPlayers[p4!._id] = {
        userId: p4!._id,
        username: p4!.username,
        displayName: p4!.displayName,
      };

      gamePlayers[p3!._id] = {
        userId: p3!._id,
        username: p3!.username,
        displayName: p3!.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: false,
        shots: [],
      };
      gamePlayers[p4!._id] = {
        userId: p4!._id,
        username: p4!.username,
        displayName: p4!.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: false,
        shots: [],
      };

      orderArray = [p1._id, p2._id, p3!._id, p4!._id];
    }

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      playerOrder: orderArray,
      players: matchPlayers,
      bestOf,
      category,
      games: [],
      winnerId: null,
      startTime: Date.now(),
      endTime: null,
    };

    set({
      currentMatch: newMatch,
      players: gamePlayers,
      playerOrder: orderArray,
      gameState: "playing",
      gameStartServer: p1._id,
      deuce: false,
    });
  },

  finishCurrentGame: (winnerId) => {
    const { currentMatch, players, bestOf, playerOrder } = get();
    if (!currentMatch || !playerOrder) return;

    // For doubles, winnerId should be the team representative (p1 or p2)
    // Team 1: p1 + p3, Team 2: p2 + p4
    const team1Ids = playerOrder.length === 4 ? [playerOrder[0], playerOrder[2]] : [playerOrder[0]];
    const team2Ids = playerOrder.length === 4 ? [playerOrder[1], playerOrder[3]] : [playerOrder[1]];

    // Build scores for all players
    const gameScores: Record<string, number> = {};
    playerOrder.forEach(playerId => {
      gameScores[playerId] = players[playerId].currentScore;
    });

    const newGame: Game = {
      gameNumber: currentMatch.games.length + 1,
      scores: gameScores,
      winnerId,
      shots: Object.values(players).flatMap(p => p.shots).sort(
        (a, b) => a.timestamp - b.timestamp
      ),
      startTime:
        currentMatch.games.length === 0
          ? currentMatch.startTime
          : Date.now() - 300000,
      endTime: Date.now(),
    };

    const gamesNeededToWin = Math.ceil(bestOf / 2);
    
    // Count games won by each team
    const team1Games = currentMatch.games.filter(g => 
      team1Ids.includes(g.winnerId)
    ).length + (team1Ids.includes(winnerId) ? 1 : 0);
    
    const team2Games = currentMatch.games.filter(g => 
      team2Ids.includes(g.winnerId)
    ).length + (team2Ids.includes(winnerId) ? 1 : 0);

    const updatedMatch: Match = {
      ...currentMatch,
      games: [...currentMatch.games, newGame],
    };

    if (team1Games >= gamesNeededToWin || team2Games >= gamesNeededToWin) {
      updatedMatch.winnerId = team1Games >= gamesNeededToWin ? playerOrder[0] : playerOrder[1];
      updatedMatch.endTime = Date.now();
      set((state) => ({
        matches: [...state.matches, updatedMatch],
        currentMatch: updatedMatch,
        gameState: "finished",
      }));
      return;
    }

    // Update games won for team representatives
    const updatedPlayers = { ...players };
    
    // Reset all scores and shots
    playerOrder.forEach(playerId => {
      updatedPlayers[playerId] = {
        ...updatedPlayers[playerId],
        currentScore: 0,
        shots: [],
        serving: false,
      };
    });

    // Update games won for team representatives
    if (team1Ids.includes(winnerId)) {
      updatedPlayers[playerOrder[0]].gamesWon = team1Games;
      if (playerOrder.length === 4) {
        updatedPlayers[playerOrder[2]].gamesWon = team1Games;
      }
    } else {
      updatedPlayers[playerOrder[1]].gamesWon = team2Games;
      if (playerOrder.length === 4) {
        updatedPlayers[playerOrder[3]].gamesWon = team2Games;
      }
    }

    // Set next server (alternates between team representatives)
    const nextServer = get().gameStartServer === playerOrder[0] ? playerOrder[1] : playerOrder[0];
    updatedPlayers[nextServer].serving = true;

    set({
      gameStartServer: nextServer,
      players: updatedPlayers,
      currentMatch: updatedMatch,
      deuce: false,
    });
  },

  handleShotSelect: (shotName) => {
    const { shotPicker, players, playerOrder } = get();
    if (!shotPicker.playerId || !playerOrder) return;

    const shooter = players[shotPicker.playerId];
    if (!shooter) return;

    // Determine team scores based on match type
    const isDoubles = playerOrder.length === 4;
    let team1Score = 0;
    let team2Score = 0;

    if (isDoubles) {
      // Team 1: p1 + p3, Team 2: p2 + p4
      const team1Ids = [playerOrder[0], playerOrder[2]];
      const team2Ids = [playerOrder[1], playerOrder[3]];
      
      if (team1Ids.includes(shooter.userId)) {
        team1Score = Math.max(players[playerOrder[0]].currentScore, players[playerOrder[2]].currentScore) + 1;
        team2Score = Math.max(players[playerOrder[1]].currentScore, players[playerOrder[3]].currentScore);
      } else {
        team1Score = Math.max(players[playerOrder[0]].currentScore, players[playerOrder[2]].currentScore);
        team2Score = Math.max(players[playerOrder[1]].currentScore, players[playerOrder[3]].currentScore) + 1;
      }
    } else {
      team1Score = shooter.userId === playerOrder[0] ? shooter.currentScore + 1 : players[playerOrder[0]].currentScore;
      team2Score = shooter.userId === playerOrder[1] ? shooter.currentScore + 1 : players[playerOrder[1]].currentScore;
    }

    const shotData: Shot = {
      shotName,
      timestamp: Date.now(),
      playerId: shooter.userId,
      scoreP1: team1Score,
      scoreP2: team2Score,
    };

    // Update the team representatives' scores
    const updatedPlayers = { ...players };
    
    if (isDoubles) {
      const team1Ids = [playerOrder[0], playerOrder[2]];
      const team2Ids = [playerOrder[1], playerOrder[3]];
      
      if (team1Ids.includes(shooter.userId)) {
        // Update both team 1 players' scores
        updatedPlayers[playerOrder[0]] = {
          ...updatedPlayers[playerOrder[0]],
          currentScore: team1Score,
        };
        updatedPlayers[playerOrder[2]] = {
          ...updatedPlayers[playerOrder[2]],
          currentScore: team1Score,
        };
      } else {
        // Update both team 2 players' scores
        updatedPlayers[playerOrder[1]] = {
          ...updatedPlayers[playerOrder[1]],
          currentScore: team2Score,
        };
        updatedPlayers[playerOrder[3]] = {
          ...updatedPlayers[playerOrder[3]],
          currentScore: team2Score,
        };
      }
    } else {
      updatedPlayers[shooter.userId] = {
        ...updatedPlayers[shooter.userId],
        currentScore: shooter.currentScore + 1,
      };
    }

    // Add shot to the shooter's shot history
    updatedPlayers[shooter.userId] = {
      ...updatedPlayers[shooter.userId],
      shots: [...updatedPlayers[shooter.userId].shots, shotData],
    };

    set({
      players: updatedPlayers,
      shotPicker: { playerId: null, open: false },
    });
  },

  resetToSetup: () => {
    set({
      gameState: "setup",
      currentMatch: null,
      playerUsers: { p1: null, p2: null, p3: null, p4: null },
      userErrors: { p1: "", p2: "", p3: "", p4: "" },
      userSearching: { p1: false, p2: false, p3: false, p4: false },
      bestOf: 3,
      category: "singles",
      players: {},
      playerOrder: null,
      deuce: false,
      gameStartServer: null,
    });
  },

  updateServingLogic: () => {
    const { gameState, players, playerOrder, gameStartServer, category } = get();
    if (gameState !== "playing" || !playerOrder || !gameStartServer) return;

    const isDoubles = category === "doubles";
    
    // Get team scores
    let team1Score = 0;
    let team2Score = 0;
    
    if (isDoubles) {
      team1Score = Math.max(players[playerOrder[0]].currentScore, players[playerOrder[2]].currentScore);
      team2Score = Math.max(players[playerOrder[1]].currentScore, players[playerOrder[3]].currentScore);
    } else {
      team1Score = players[playerOrder[0]].currentScore;
      team2Score = players[playerOrder[1]].currentScore;
    }

    const totalPoints = team1Score + team2Score;
    const hasMinScore = Math.max(team1Score, team2Score) >= 11;
    const hasTwoPointLead = Math.abs(team1Score - team2Score) >= 2;

    if (hasMinScore && hasTwoPointLead) {
      const winnerId = team1Score > team2Score ? playerOrder[0] : playerOrder[1];
      setTimeout(() => get().finishCurrentGame(winnerId), 100);
      return;
    }

    const isDeuce = team1Score >= 10 && team2Score >= 10;
    set({ deuce: isDeuce });

    // Serving logic
    const updatedPlayers = { ...players };
    
    // Reset all serving flags
    playerOrder.forEach(playerId => {
      updatedPlayers[playerId] = { ...updatedPlayers[playerId], serving: false };
    });

    if (isDeuce) {
      // In deuce, alternate serve every point
      const shouldTeam1Serve = totalPoints % 2 === 0
        ? gameStartServer === playerOrder[0]
        : gameStartServer === playerOrder[1];
      
      if (isDoubles) {
        // In doubles deuce, alternate within team every 2 points
        const servingTeamMember = Math.floor(totalPoints / 2) % 2;
        if (shouldTeam1Serve) {
          const serverId = servingTeamMember === 0 ? playerOrder[0] : playerOrder[2];
          updatedPlayers[serverId].serving = true;
        } else {
          const serverId = servingTeamMember === 0 ? playerOrder[1] : playerOrder[3];
          updatedPlayers[serverId].serving = true;
        }
      } else {
        const serverId = shouldTeam1Serve ? playerOrder[0] : playerOrder[1];
        updatedPlayers[serverId].serving = true;
      }
    } else {
      // Normal serving (every 2 points)
      const servingPairs = Math.floor(totalPoints / 2);
      const shouldTeam1Serve = servingPairs % 2 === 0
        ? gameStartServer === playerOrder[0]
        : gameStartServer === playerOrder[1];
      
      if (isDoubles) {
        // In doubles, alternate within team
        const servingTeamMember = Math.floor(servingPairs / 2) % 2;
        if (shouldTeam1Serve) {
          const serverId = servingTeamMember === 0 ? playerOrder[0] : playerOrder[2];
          updatedPlayers[serverId].serving = true;
        } else {
          const serverId = servingTeamMember === 0 ? playerOrder[1] : playerOrder[3];
          updatedPlayers[serverId].serving = true;
        }
      } else {
        const serverId = shouldTeam1Serve ? playerOrder[0] : playerOrder[1];
        updatedPlayers[serverId].serving = true;
      }
    }

    set({ players: updatedPlayers });
  },

  searchUser: async (username: string, slot: "p1" | "p2" | "p3" | "p4") => {
    const {
      userErrors,
      userSearching,
      setPlayerUser,
      setUserErrors,
      setUserSearching,
    } = get();

    if (!username.trim()) {
      setPlayerUser(slot, null);
      setUserErrors({ ...userErrors, [slot]: "" });
      return;
    }

    setUserSearching({ ...userSearching, [slot]: true });

    try {
      const res = await fetch(
        `/api/users/search?username=${encodeURIComponent(username.trim())}`
      );
      const data = await res.json();

      if (data.success && data.user) {
        const registeredUser = {
          _id: data.user._id,
          username: data.user.username,
          displayName:
            data.user.displayName || data.user.fullName || data.user.username,
          wins: data.user.wins || 0,
          losses: data.user.losses || 0,
          totalMatches: data.user.totalMatches || 0,
        };

        setPlayerUser(slot, registeredUser);
        setUserErrors({ ...userErrors, [slot]: "" });
      } else {
        setPlayerUser(slot, null);
        setUserErrors({
          ...userErrors,
          [slot]: "User not found. Please enter a valid username.",
        });
      }
    } catch (err) {
      console.error("User search error:", err);
      setPlayerUser(slot, null);
      setUserErrors({
        ...userErrors,
        [slot]: "Error searching for user. Please try again.",
      });
    } finally {
      const currentState = get();
      setUserSearching({ ...currentState.userSearching, [slot]: false });
    }
  },

}));