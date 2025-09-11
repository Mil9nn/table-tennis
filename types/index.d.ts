import { User } from "next-auth";
import { UseFormResetField } from "react-hook-form";
import { string } from "zod";

interface RegisteredUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  totalMatches: number;
  wins: number;
  losses: number;
}

interface UserRef {
  userId: string;
  username: string;
  displayName: string;
}

interface Shot {
  shotName: string;
  timestamp: number;
  player: UserRef;
  scoreP1: number;
  scoreP2: number;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  winner: UserRef | null;
  shots: Shot[];
  startTime: number;
  endTime: number;
}

interface MatchStats {
  totalPoints: number;
  totalShots: number;
  averageGameDuration: number;
  longestGame: Game | null;
  shotBreakdown: { [shotName: string]: number };
  playerStats: {
    [playerName: string]: {
      totalPoints: number;
      gamesWon: number;
      favoriteShot: string;
      shotCount: { [shotName: string]: number };
    };
  };
}

interface Match {
  id: string;
  player1: UserRef;
  player2: UserRef;
  bestOf: number;
  games: Game[];
  winner: UserRef | null;
  startTime: number;
  endTime: number | null;
  stats: MatchStats | null;
}

interface Player extends UserRef {
  currentScore: number;
  gamesWon: number;
  serving: boolean;
  shots: Shot[];
}
