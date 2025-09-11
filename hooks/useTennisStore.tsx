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
  playerOrder: [string, string]; // keep order for UI (p1 left, p2 right)
  players: Record<string, { userId: string; username: string; displayName: string }>;
  bestOf: number;
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
  playerOrder: [string, string] | null; // track order for UI
  bestOf: number;

  deuce: boolean;
  gameStartServer: string | null;

  shotPicker: { playerId: string | null; open: boolean };

  // User mgmt
  playerUsers: Record<"p1" | "p2", RegisteredUser | null>;
  userSearching: { p1: boolean; p2: boolean };
  userErrors: { p1: string; p2: string };

  savedData: any;

  // Actions
  setGameState: (state: "setup" | "playing" | "finished") => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (userId: string, updater: (prev: Player) => Player) => void;
  removePlayer: (userId: string) => void;
  resetPlayers: () => void;

  setBestOf: (bestOf: number) => void;
  setShotPicker: (picker: { playerId: string | null; open: boolean }) => void;

  setPlayerUser: (slot: "p1" | "p2", user: RegisteredUser | null) => void;
  setUserSearching: (next: { p1: boolean; p2: boolean }) => void;
  setUserErrors: (next: { p1: string; p2: string }) => void;

  setSavedData: (data: any) => void;
  addMatch: (match: Match) => void;

  // Game logic
  startNewMatch: () => void;
  finishCurrentGame: (winnerId: string) => void;
  handleShotSelect: (shotName: string) => void;
  resetToSetup: () => void;
  updateServingLogic: () => void;
}

export const useTennisStore = create<GameState>((set, get) => ({
  gameState: "setup",
  currentMatch: null,
  matches: [],

  players: {},
  playerOrder: null,
  bestOf: 3,

  deuce: false,
  gameStartServer: null,

  shotPicker: { playerId: null, open: false },

  playerUsers: { p1: null, p2: null },
  userSearching: { p1: false, p2: false },
  userErrors: { p1: "", p2: "" },

  savedData: null,

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
  setShotPicker: (picker) => set({ shotPicker: picker }),

  setPlayerUser: (slot, user) =>
    set((state) => ({
      playerUsers: { ...state.playerUsers, [slot]: user },
    })),

  setUserSearching: (next) => set({ userSearching: next }),
  setUserErrors: (next) => set({ userErrors: next }),

  setSavedData: (data) => set({ savedData: data }),
  addMatch: (match) =>
    set((state) => ({ matches: [...state.matches, match] })),

  // Start match
  startNewMatch: () => {
    const { playerUsers, bestOf } = get();
    const p1 = playerUsers.p1;
    const p2 = playerUsers.p2;

    if (!p1 || !p2) {
      alert("Both players must be registered users to start a match.");
      return;
    }
    if (p1._id === p2._id) {
      alert("Players cannot play against themselves!");
      return;
    }

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      playerOrder: [p1._id, p2._id],
      players: {
        [p1._id]: { userId: p1._id, username: p1.username, displayName: p1.displayName },
        [p2._id]: { userId: p2._id, username: p2.username, displayName: p2.displayName },
      },
      bestOf,
      games: [],
      winnerId: null,
      startTime: Date.now(),
      endTime: null,
    };

    set({
      currentMatch: newMatch,
      players: {
        [p1._id]: {
          userId: p1._id,
          username: p1.username,
          displayName: p1.displayName,
          currentScore: 0,
          gamesWon: 0,
          serving: true,
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
      },
      playerOrder: [p1._id, p2._id],
      gameState: "playing",
      gameStartServer: p1._id,
      deuce: false,
    });
  },

  finishCurrentGame: (winnerId) => {
    const { currentMatch, players, bestOf, playerOrder } = get();
    if (!currentMatch || !playerOrder) return;

    const [p1Id, p2Id] = playerOrder;
    const p1 = players[p1Id];
    const p2 = players[p2Id];

    const newGame: Game = {
      gameNumber: currentMatch.games.length + 1,
      scores: { [p1Id]: p1.currentScore, [p2Id]: p2.currentScore },
      winnerId,
      shots: [...p1.shots, ...p2.shots].sort((a, b) => a.timestamp - b.timestamp),
      startTime:
        currentMatch.games.length === 0
          ? currentMatch.startTime
          : Date.now() - 300000,
      endTime: Date.now(),
    };

    const gamesNeededToWin = Math.ceil(bestOf / 2);
    const p1Games = p1.gamesWon + (winnerId === p1Id ? 1 : 0);
    const p2Games = p2.gamesWon + (winnerId === p2Id ? 1 : 0);

    const updatedMatch: Match = {
      ...currentMatch,
      games: [...currentMatch.games, newGame],
    };

    if (p1Games >= gamesNeededToWin || p2Games >= gamesNeededToWin) {
      updatedMatch.winnerId = p1Games >= gamesNeededToWin ? p1Id : p2Id;
      updatedMatch.endTime = Date.now();
      set((state) => ({
        matches: [...state.matches, updatedMatch],
        currentMatch: updatedMatch,
        gameState: "finished",
      }));
      return;
    }

    const nextServer = get().gameStartServer === p1Id ? p2Id : p1Id;

    set({
      gameStartServer: nextServer,
      players: {
        [p1Id]: { ...p1, currentScore: 0, gamesWon: p1Games, serving: nextServer === p1Id, shots: [] },
        [p2Id]: { ...p2, currentScore: 0, gamesWon: p2Games, serving: nextServer === p2Id, shots: [] },
      },
      currentMatch: updatedMatch,
      deuce: false,
    });
  },

  handleShotSelect: (shotName) => {
    const { shotPicker, players, playerOrder } = get();
    if (!shotPicker.playerId || !playerOrder) return;

    const [p1Id, p2Id] = playerOrder;
    const shooter = players[shotPicker.playerId];
    const opponentId = p1Id === shooter.userId ? p2Id : p1Id;
    const opponent = players[opponentId];

    const shotData: Shot = {
      shotName,
      timestamp: Date.now(),
      playerId: shooter.userId,
      scoreP1: shooter.userId === p1Id ? shooter.currentScore + 1 : opponent.currentScore,
      scoreP2: shooter.userId === p2Id ? shooter.currentScore + 1 : opponent.currentScore,
    };

    set((state) => ({
      players: {
        ...state.players,
        [shooter.userId]: {
          ...shooter,
          currentScore: shooter.currentScore + 1,
          shots: [...shooter.shots, shotData],
        },
      },
      shotPicker: { playerId: null, open: false },
    }));
  },

  resetToSetup: () => {
    set({
      gameState: "setup",
      currentMatch: null,
      playerUsers: { p1: null, p2: null },
      userErrors: { p1: "", p2: "" },
      bestOf: 3,
      players: {},
      playerOrder: null,
      deuce: false,
      gameStartServer: null,
    });
  },

  updateServingLogic: () => {
    const { gameState, players, playerOrder, gameStartServer } = get();
    if (gameState !== "playing" || !playerOrder || !gameStartServer) return;

    const [p1Id, p2Id] = playerOrder;
    const p1 = players[p1Id];
    const p2 = players[p2Id];

    const totalPoints = p1.currentScore + p2.currentScore;
    const hasMinScore = Math.max(p1.currentScore, p2.currentScore) >= 11;
    const hasTwoPointLead = Math.abs(p1.currentScore - p2.currentScore) >= 2;

    if (hasMinScore && hasTwoPointLead) {
      const winnerId = p1.currentScore > p2.currentScore ? p1Id : p2Id;
      setTimeout(() => get().finishCurrentGame(winnerId), 100);
      return;
    }

    const isDeuce = p1.currentScore >= 10 && p2.currentScore >= 10;
    set({ deuce: isDeuce });

    if (isDeuce) {
      const shouldP1Serve =
        totalPoints % 2 === 0 ? gameStartServer === p1Id : gameStartServer === p2Id;
      set((state) => ({
        players: {
          ...state.players,
          [p1Id]: { ...state.players[p1Id], serving: shouldP1Serve },
          [p2Id]: { ...state.players[p2Id], serving: !shouldP1Serve },
        },
      }));
    } else {
      const servingPairs = Math.floor(totalPoints / 2);
      const shouldP1Serve =
        servingPairs % 2 === 0 ? gameStartServer === p1Id : gameStartServer === p2Id;
      set((state) => ({
        players: {
          ...state.players,
          [p1Id]: { ...state.players[p1Id], serving: shouldP1Serve },
          [p2Id]: { ...state.players[p2Id], serving: !shouldP1Serve },
        },
      }));
    }
  },
}));