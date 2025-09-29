export type PlayerKey = "side1" | "side2";

export type DoublesPlayerKey =
  | "side1_main"
  | "side1_partner"
  | "side2_main"
  | "side2_partner";

export type ServerKey = PlayerKey | DoublesPlayerKey;

export type InitialServerConfig = {
  firstServer?: ServerKey | null;
  firstReceiver?: DoublesPlayerKey | null;
  serverOrder?: DoublesPlayerKey[];
};

export const checkGameWon = (
  side1: number,
  side2: number
): PlayerKey | null => {
  if ((side1 >= 11 || side2 >= 11) && Math.abs(side1 - side2) >= 2) {
    return side1 > side2 ? "side1" : "side2";
  }
  return null;
};

type ServerResult = {
  server: ServerKey;
  isDeuce: boolean;
  serveCount: number;
};

export const getNextServer = (
  p1: number,
  p2: number,
  isDoubles: boolean,
  initialConfig?: InitialServerConfig
): ServerResult => {
  const totalPoints = p1 + p2;
  const isDeuce = p1 >= 10 && p2 >= 10;

  if (isDoubles) {
    const rotation =
      initialConfig?.serverOrder ||
      buildDoublesRotation(
        initialConfig?.firstServer as DoublesPlayerKey,
        initialConfig?.firstReceiver
      );
    return getNextServerDoubles(totalPoints, isDeuce, rotation);
  } else {
    const firstServer: PlayerKey =
      (initialConfig?.firstServer as PlayerKey) || "side1"; // only fallback if nothing selected
    return getNextServerSingles(totalPoints, isDeuce, firstServer);
  }
};

const getNextServerSingles = (
  totalPoints: number,
  isDeuce: boolean,
  firstServer: PlayerKey
): ServerResult => {
  if (isDeuce) {
    // In deuce, alternate every point
    const serverIndex = totalPoints % 2;
    const servers = firstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
    return {
      server: servers[serverIndex],
      isDeuce: true,
      serveCount: 0,
    };
  }

  // Normal serving: 2 serves each
  const serveCycle = Math.floor(totalPoints / 2);
  const servers = firstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
  const currentServerIndex = serveCycle % 2;

  return {
    server: servers[currentServerIndex],
    isDeuce: false,
    serveCount: totalPoints % 2,
  };
};

const defaultDoublesOrder: DoublesPlayerKey[] = [
  "side1_main",
  "side2_main",
  "side1_partner",
  "side2_partner",
];

const getNextServerDoubles = (
  totalPoints: number,
  isDeuce: boolean,
  rotation: DoublesPlayerKey[] = defaultDoublesOrder
): ServerResult => {
  // rotation must be length 4 (safe fallback to default if not)
  if (!rotation || rotation.length !== 4) rotation = defaultDoublesOrder;

  if (isDeuce) {
    // alternate every point following the established rotation
    const serverIndex = totalPoints % rotation.length;
    return {
      server: rotation[serverIndex],
      isDeuce,
      serveCount: 0,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2); // each server serves 2 points
  const serverIndex = serveCycle % rotation.length;

  return {
    server: rotation[serverIndex],
    isDeuce,
    serveCount: totalPoints % 2,
  };
};

export const buildDoublesRotation = (
  firstServer?: DoublesPlayerKey | null,
  firstReceiver?: DoublesPlayerKey | null
): DoublesPlayerKey[] => {
  const all: DoublesPlayerKey[] = [
    "side1_main",
    "side1_partner",
    "side2_main",
    "side2_partner",
  ];

  const partnerOf = (k: DoublesPlayerKey): DoublesPlayerKey => {
    if (k.startsWith("side1")) {
      return k.endsWith("_main") ? "side1_partner" : "side1_main";
    }
    return k.endsWith("_main") ? "side2_partner" : "side2_main";
  };

  const fallback = defaultDoublesOrder.slice();

  if (!firstServer || !all.includes(firstServer)) {
    console.warn("Invalid firstServer, using fallback");
    return fallback;
  }

  if (!firstReceiver || !all.includes(firstReceiver)) {
    console.warn("Invalid firstReceiver, using fallback");
    return fallback;
  }

  // Validate server and receiver are on opposite sides
  const serverSide = firstServer.split("_")[0];
  const receiverSide = firstReceiver.split("_")[0];
  
  if (serverSide === receiverSide) {
    console.error("Server and receiver must be on opposite sides");
    return fallback;
  }

  const rotation: DoublesPlayerKey[] = [
    firstServer,
    firstReceiver,
    partnerOf(firstServer),
    partnerOf(firstReceiver),
  ];

  // Validate no duplicates
  const unique = Array.from(new Set(rotation));
  if (unique.length !== 4) {
    console.error("Rotation has duplicates, using fallback");
    return fallback;
  }

  return rotation;
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

export const getCurrentServerName = (
  server: ServerKey | null,
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

  // doubles / mixed_doubles
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
