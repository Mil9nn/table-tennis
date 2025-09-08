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