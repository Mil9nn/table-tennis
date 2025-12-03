import {
  DoublesPlayerKey,
  InitialServerConfig,
  PlayerKey,
  ServerKey,
} from "@/types/match.type";

// Re-export server calculation functions from centralized service
import {
  checkGameWon as checkGameWonUtil,
  isGameInDeuce as isGameInDeuceUtil,
  getNextServer as getNextServerUtil,
  getNextServerForTeamMatch as getNextServerForTeamMatchUtil,
  flipDoublesRotationForNextGame as flipDoublesRotationForNextGameUtil,
  buildDoublesRotation as buildDoublesRotationUtil,
  buildDoublesRotationForTeamMatch as buildDoublesRotationForTeamMatchUtil,
  ServerResult,
} from "@/services/match/serverCalculationService";

// Re-export for backward compatibility
export const checkGameWon = checkGameWonUtil;
export const isGameInDeuce = isGameInDeuceUtil;
export const getNextServer = getNextServerUtil;
export const getNextServerForTeamMatch = getNextServerForTeamMatchUtil;
export const flipDoublesRotationForNextGame = flipDoublesRotationForNextGameUtil;
export const buildDoublesRotation = buildDoublesRotationUtil;
export const buildDoublesRotationForTeamMatch = buildDoublesRotationForTeamMatchUtil;
export type { ServerResult };

// UI-specific helpers (not in service layer)
export const formatScore = (side1: number, side2: number): string =>
  `${side1}-${side2}`;

export const getGameStatus = (side1: number, side2: number): string => {
  const winner = checkGameWon(side1, side2);
  if (winner) {
    return winner === "side1" ? "Side 1 Wins" : "Side 2 Wins";
  }

  if (isGameInDeuce(side1, side2)) {
    const leader = side1 > side2 ? "Side 1" : side2 > side1 ? "Side 2" : null;
    if (leader) {
      return `Deuce - ${leader} Advantage`;
    }
    return "Deuce";
  }

  return "In Progress";
};

export const validateMatchFormat = (
  matchType: string,
  participants: any[]
): boolean => {
  switch (matchType) {
    case "singles":
      return participants.length >= 2;
    case "doubles":
    case "mixed_doubles":
      return participants.length >= 4;
    default:
      return false;
  }
};

export const getPointsNeeded = (
  currentScore: number,
  opponentScore: number
): number => {
  if (currentScore >= 11 && currentScore - opponentScore >= 2) {
    return 0;
  }
  if (opponentScore >= 10) {
    return opponentScore + 2 - currentScore;
  }
  return Math.max(0, 11 - currentScore);
};

// ✅ FIXED: Support both individual (side1/side2) and team (team1/team2) keys
export const getCurrentServerName = (
  server: ServerKey | null,
  participants: any[],
  matchType: string
): string | null => {
  if (!server || !participants) return null;

  if (matchType === "singles") {
    switch (server) {
      case "side1":
        return participants[0]?.fullName || participants[0]?.username || "Player 1";
      case "side2":
        return participants[1]?.fullName || participants[1]?.username || "Player 2";
      case "team1":
        return participants[0]?.fullName || participants[0]?.username || "Team 1 Player";
      case "team2":
        return participants[1]?.fullName || participants[1]?.username || "Team 2 Player";
      default:
        return null;
    }
  }

  // doubles / mixed_doubles
  switch (server) {
    case "side1_main":
      return participants[0]?.fullName || participants[0]?.username || "Player 1A";
    case "side1_partner":
      return participants[1]?.fullName || participants[1]?.username || "Player 1B";
    case "side2_main":
      return participants[2]?.fullName || participants[2]?.username || "Player 2A";
    case "side2_partner":
      return participants[3]?.fullName || participants[3]?.username || "Player 2B";
    case "team1_main":
      return participants[0]?.fullName || participants[0]?.username || "Team 1 Main";
    case "team1_partner":
      return participants[1]?.fullName || participants[1]?.username || "Team 1 Partner";
    case "team2_main":
      return participants[2]?.fullName || participants[2]?.username || "Team 2 Main";
    case "team2_partner":
      return participants[3]?.fullName || participants[3]?.username || "Team 2 Partner";
    default:
      return null;
  }
};

export const checkMatchWonBySets = (
  side1Sets: number,
  side2Sets: number,
  numberOfSets: number
): PlayerKey | null => {
  const setsNeeded = Math.ceil(numberOfSets / 2);
  if (side1Sets >= setsNeeded) return "side1";
  if (side2Sets >= setsNeeded) return "side2";
  return null;
};
