export type PlayerKey = "side1" | "side2";

export type DoublesPlayerKey =
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner";

export const checkGameWon = (side1: number, side2: number): PlayerKey | null => {
  if ((side1 >= 11 || side2 >= 11) && Math.abs(side1 - side2) >= 2) {
    return side1 > side2 ? "side1" : "side2";
  }
  return null;
};

type ServerResult = {
  server:
    | PlayerKey
    | "side1_main"
    | "side1_partner"
    | "side2_main"
    | "side2_partner";
  isDeuce: boolean;
  serveCount: number;
};

export const getNextServer = (
  p1: number,
  p2: number,
  isDoubles: boolean,
  serverOrder?: DoublesPlayerKey[]
): ServerResult => {
  const totalPoints = p1 + p2;
  const isDeuce = p1 >= 10 && p2 >= 10;

  if (isDoubles) {
    return getNextServerDoubles(totalPoints, isDeuce, serverOrder);
  } else {
    return getNextServerSingles(totalPoints, isDeuce);
  }
};

const getNextServerSingles = (
  totalPoints: number,
  isDeuce: boolean
): ServerResult => {
  if (isDeuce) {
    return {
      server: totalPoints % 2 === 0 ? "side1" : "side2",
      isDeuce,
      serveCount: totalPoints % 2,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2);
  return {
    server: serveCycle % 2 === 0 ? "side1" : "side2",
    isDeuce,
    serveCount: totalPoints % 2,
  };
};

const getNextServerDoubles = (
  totalPoints: number,
  isDeuce: boolean,
  serverOrder?: DoublesPlayerKey[]
): ServerResult => {
  const defaultOrder: DoublesPlayerKey[] = [
    "side1_main",
    "side2_main",
    "side1_partner",
    "side2_partner",
  ];
  const rotation = serverOrder || defaultOrder;

  if (isDeuce) {
    const serverIndex = totalPoints % rotation.length;
    return {
      server: rotation[serverIndex],
      isDeuce,
      serveCount: 0,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2);
  const serverIndex = serveCycle % rotation.length;

  return {
    server: rotation[serverIndex],
    isDeuce,
    serveCount: totalPoints % 2,
  };
};

export const checkSetWon = (
  side1Games: number,
  side2Games: number
): PlayerKey | null => {
  if (side1Games > side2Games) return "side1";
  if (side2Games > side1Games) return "side2";
  return null;
};

export const checkMatchWon = (
  side1Sets: number,
  side2Sets: number,
  bestOf: number
): PlayerKey | null => {
  const targetSets = Math.floor(bestOf / 2) + 1;
  if (side1Sets >= targetSets) return "side1";
  if (side2Sets >= targetSets) return "side2";
  return null;
};

export const getCurrentServerName = (
  server: ServerResult["server"],
  participants: any[],
  matchType: string
): string | null => {
  if (!server || !participants) return null;

  if (matchType === "singles") {
    switch (server) {
      case "side1":
        return (
          participants[0]?.fullName || participants[0]?.username || "Player 1"
        );
      case "side2":
        return (
          participants[1]?.fullName || participants[1]?.username || "Player 2"
        );
      default:
        return null;
    }
  }

  switch (server) {
    case "side1_main":
      return (
        participants[0]?.fullName || participants[0]?.username || "Player 1A"
      );
    case "side1_partner":
      return (
        participants[1]?.fullName || participants[1]?.username || "Player 1B"
      );
    case "side2_main":
      return (
        participants[2]?.fullName || participants[2]?.username || "Player 2A"
      );
    case "side2_partner":
      return (
        participants[3]?.fullName || participants[3]?.username || "Player 2B"
      );
    default:
      return null;
  }
};

export const formatScore = (side1: number, side2: number): string =>
  `${side1}-${side2}`;

export const isGameInDeuce = (side1: number, side2: number): boolean =>
  side1 >= 10 && side2 >= 10;

export const getGameStatus = (side1: number, side2: number): string => {
  const winner = checkGameWon(side1, side2);
  if (winner) {
    return winner === "side1" ? "Side 1 Wins" : "Side 2 Wins";
  }

  if (isGameInDeuce(side1, side2)) {
    const leader =
      side1 > side2 ? "Side 1" : side2 > side1 ? "Side 2" : null;
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