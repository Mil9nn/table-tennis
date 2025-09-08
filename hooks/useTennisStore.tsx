import { create } from 'zustand';

interface Player {
  userId: string;
  username: string;
  displayName: string;
  currentScore: number;
  gamesWon: number;
  serving: boolean;
  shots: Array<{
    shotName: string;
    timestamp: number;
    player: 1 | 2;
    scoreP1: number;
    scoreP2: number;
  }>;
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
  player1Score: number;
  player2Score: number;
  winner: number;
  shots: Array<{
    shotName: string;
    timestamp: number;
    player: 1 | 2;
    scoreP1: number;
    scoreP2: number;
  }>;
  startTime: number;
  endTime: number;
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

interface GameState {
  // Game state
  gameState: "setup" | "playing" | "finished";
  currentMatch: Match | null;
  matches: Match[];
  
  // Player data
  player1: Player;
  player2: Player;
  
  // Setup state
  bestOf: number;
  
  // Game mechanics
  deuce: boolean;
  gameStartServer: 1 | 2;
  
  // Shot picker
  shotPicker: {
    player: 1 | 2;
    open: boolean;
  };
  
  // User management
  player1Username: string;
  player2Username: string;
  player1User: RegisteredUser | null;
  player2User: RegisteredUser | null;
  userSearching: { p1: boolean; p2: boolean };
  userErrors: { p1: string; p2: string };
  
  // Save data
  savedData: any;
  
  // Actions
  setGameState: (state: "setup" | "playing" | "finished") => void;
  setCurrentMatch: (match: Match | null) => void;
  setPlayer1: (player: Player | ((prev: Player) => Player)) => void;
  setPlayer2: (player: Player | ((prev: Player) => Player)) => void;
  setBestOf: (bestOf: number) => void;
  setDeuce: (deuce: boolean) => void;
  setGameStartServer: (server: 1 | 2) => void;
  setShotPicker: (picker: { player: 1 | 2; open: boolean } | ((prev: { player: 1 | 2; open: boolean }) => { player: 1 | 2; open: boolean })) => void;
  
  // User management actions
  setPlayer1Username: (username: string) => void;
  setPlayer2Username: (username: string) => void;
  setPlayer1User: (user: RegisteredUser | null) => void;
  setPlayer2User: (user: RegisteredUser | null) => void;
  setUserSearching: (searching: { p1: boolean; p2: boolean } | ((prev: { p1: boolean; p2: boolean }) => { p1: boolean; p2: boolean })) => void;
  setUserErrors: (errors: { p1: string; p2: string } | ((prev: { p1: string; p2: string }) => { p1: string; p2: string })) => void;
  
  setSavedData: (data: any) => void;
  addMatch: (match: Match) => void;
  
  // Game logic
  startNewMatch: () => void;
  finishCurrentGame: (winner: number) => void;
  handleShotSelect: (shotName: string) => void;
  resetToSetup: () => void;
  updateServingLogic: () => void;
}

export const useTennisStore = create<GameState>((set, get) => ({
  // Initial state
  gameState: "setup",
  currentMatch: null,
  matches: [],
  
  player1: {
    userId: "",
    username: "",
    displayName: "",
    currentScore: 0,
    gamesWon: 0,
    serving: true,
    shots: [],
  },
  
  player2: {
    userId: "",
    username: "",
    displayName: "",
    currentScore: 0,
    gamesWon: 0,
    serving: false,
    shots: [],
  },
  
  bestOf: 3,
  deuce: false,
  gameStartServer: 1,
  
  shotPicker: { player: 1, open: false },
  
  player1Username: "",
  player2Username: "",
  player1User: null,
  player2User: null,
  userSearching: { p1: false, p2: false },
  userErrors: { p1: "", p2: "" },
  
  savedData: null,
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setPlayer1: (player) => set((state) => ({ 
    player1: typeof player === 'function' ? player(state.player1) : player 
  })),
  setPlayer2: (player) => set((state) => ({ 
    player2: typeof player === 'function' ? player(state.player2) : player 
  })),
  setBestOf: (bestOf) => set({ bestOf }),
  setDeuce: (deuce) => set({ deuce }),
  setGameStartServer: (server) => set({ gameStartServer: server }),
  setShotPicker: (picker) => set((state) => ({
    shotPicker: typeof picker === 'function' ? picker(state.shotPicker) : picker
  })),
  
  // User management
  setPlayer1Username: (username) => set({ player1Username: username }),
  setPlayer2Username: (username) => set({ player2Username: username }),
  setPlayer1User: (user) => set({ player1User: user }),
  setPlayer2User: (user) => set({ player2User: user }),
  setUserSearching: (searching) => set((state) => ({
    userSearching: typeof searching === 'function' ? searching(state.userSearching) : searching
  })),
  setUserErrors: (errors) => set((state) => ({
    userErrors: typeof errors === 'function' ? errors(state.userErrors) : errors
  })),
  
  setSavedData: (data) => set({ savedData: data }),
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
  
  // Game logic
  startNewMatch: () => {
    const { player1User, player2User, bestOf } = get();
    
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

    set({
      currentMatch: newMatch,
      player1: {
        userId: player1User._id,
        username: player1User.username,
        displayName: player1User.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: true,
        shots: [],
      },
      player2: {
        userId: player2User._id,
        username: player2User.username,
        displayName: player2User.displayName,
        currentScore: 0,
        gamesWon: 0,
        serving: false,
        shots: [],
      },
      gameState: "playing",
      gameStartServer: 1,
      deuce: false,
    });
  },
  
  finishCurrentGame: (winner) => {
    const { currentMatch, player1, player2, bestOf } = get();
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

    const gamesNeededToWin = Math.ceil(bestOf / 2);
    const p1Games = winner === 1 ? player1.gamesWon + 1 : player1.gamesWon;
    const p2Games = winner === 2 ? player2.gamesWon + 1 : player2.gamesWon;

    const updatedMatch = {
      ...currentMatch,
      games: [...currentMatch.games, newGame],
    };

    if (p1Games >= gamesNeededToWin) {
      updatedMatch.winner = currentMatch.player1;
      updatedMatch.endTime = Date.now();
      set((state) => ({
        matches: [...state.matches, updatedMatch],
        currentMatch: updatedMatch,
        gameState: "finished",
      }));
      return;
    } else if (p2Games >= gamesNeededToWin) {
      updatedMatch.winner = currentMatch.player2;
      updatedMatch.endTime = Date.now();
      set((state) => ({
        matches: [...state.matches, updatedMatch],
        currentMatch: updatedMatch,
        gameState: "finished",
      }));
      return;
    }

    const nextServer = get().gameStartServer === 1 ? 2 : 1;
    
    set({
      gameStartServer: nextServer,
      player1: {
        ...player1,
        currentScore: 0,
        gamesWon: winner === 1 ? player1.gamesWon + 1 : player1.gamesWon,
        serving: nextServer === 1,
        shots: [],
      },
      player2: {
        ...player2,
        currentScore: 0,
        gamesWon: winner === 2 ? player2.gamesWon + 1 : player2.gamesWon,
        serving: nextServer === 2,
        shots: [],
      },
      currentMatch: updatedMatch,
      deuce: false,
    });
  },
  
  handleShotSelect: (shotName) => {
    const { shotPicker, player1, player2 } = get();
    
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
      set((state) => ({
        player1: {
          ...state.player1,
          currentScore: state.player1.currentScore + 1,
          shots: [...state.player1.shots, shotData],
        },
        shotPicker: { player: 1, open: false },
      }));
    } else {
      set((state) => ({
        player2: {
          ...state.player2,
          currentScore: state.player2.currentScore + 1,
          shots: [...state.player2.shots, shotData],
        },
        shotPicker: { player: 1, open: false },
      }));
    }
  },
  
  resetToSetup: () => {
    set({
      gameState: "setup",
      currentMatch: null,
      player1Username: "",
      player2Username: "",
      player1User: null,
      player2User: null,
      userErrors: { p1: "", p2: "" },
      bestOf: 3,
      player1: {
        userId: "",
        username: "",
        displayName: "",
        currentScore: 0,
        gamesWon: 0,
        serving: true,
        shots: [],
      },
      player2: {
        userId: "",
        username: "",
        displayName: "",
        currentScore: 0,
        gamesWon: 0,
        serving: false,
        shots: [],
      },
      deuce: false,
      gameStartServer: 1,
    });
  },
  
  updateServingLogic: () => {
    const { gameState, player1, player2, gameStartServer } = get();
    if (gameState !== "playing") return;

    const totalPoints = player1.currentScore + player2.currentScore;
    
    // Check for game completion
    const hasMinScore = Math.max(player1.currentScore, player2.currentScore) >= 11;
    const hasTwoPointLead = Math.abs(player1.currentScore - player2.currentScore) >= 2;

    if (hasMinScore && hasTwoPointLead) {
      if (player1.currentScore > player2.currentScore) {
        setTimeout(() => get().finishCurrentGame(1), 100);
        return;
      } else if (player2.currentScore > player1.currentScore) {
        setTimeout(() => get().finishCurrentGame(2), 100);
        return;
      }
    }

    // Handle serving logic
    const isDeuce = player1.currentScore >= 10 && player2.currentScore >= 10;
    set({ deuce: isDeuce });

    if (isDeuce) {
      const shouldPlayer1Serve =
        totalPoints % 2 === 0 ? gameStartServer === 1 : gameStartServer === 2;
      set((state) => ({
        player1: { ...state.player1, serving: shouldPlayer1Serve },
        player2: { ...state.player2, serving: !shouldPlayer1Serve },
      }));
    } else {
      const servingPairs = Math.floor(totalPoints / 2);
      const shouldPlayer1Serve =
        servingPairs % 2 === 0 ? gameStartServer === 1 : gameStartServer === 2;
      set((state) => ({
        player1: { ...state.player1, serving: shouldPlayer1Serve },
        player2: { ...state.player2, serving: !shouldPlayer1Serve },
      }));
    }
  },
}));