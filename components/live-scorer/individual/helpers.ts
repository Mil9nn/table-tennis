import {
  DoublesPlayerKey,
  InitialServerConfig,
  PlayerKey,
  ServerKey,
} from "@/types/match.type";

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
  initialConfig?: InitialServerConfig,
  currentGame?: number
): ServerResult => {
  const totalPoints = p1 + p2;
  const isDeuce = p1 >= 10 && p2 >= 10;

  if (isDoubles) {
    let rotation =
      initialConfig?.serverOrder ||
      buildDoublesRotation(
        initialConfig?.firstServer as DoublesPlayerKey,
        initialConfig?.firstReceiver
      );

    if (currentGame && currentGame % 2 === 0) {
      rotation = flipDoublesRotationForNextGame(rotation);
    }
    return getNextServerDoubles(totalPoints, isDeuce, rotation);
  } else {
    const firstServer: PlayerKey =
      (initialConfig?.firstServer as PlayerKey) || "side1";
    return getNextServerSingles(totalPoints, isDeuce, firstServer);
  }
};

const getNextServerSingles = (
  totalPoints: number,
  isDeuce: boolean,
  firstServer: PlayerKey
): ServerResult => {
  if (isDeuce) {
    const serverIndex = totalPoints % 2;
    let servers: PlayerKey[];
    if (firstServer === "side1" || firstServer === "side2") {
      servers =
        firstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
    } else {
      servers =
        firstServer === "team1" ? ["team1", "team2"] : ["team2", "team1"];
    }

    return {
      server: servers[serverIndex],
      isDeuce: true,
      serveCount: 0,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2);
  // ✅ Handle both individual and team match keys
  let servers: PlayerKey[];
  if (firstServer === "side1" || firstServer === "side2") {
    servers = firstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
  } else {
    servers = firstServer === "team1" ? ["team1", "team2"] : ["team2", "team1"];
  }
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
  if (!rotation || rotation.length !== 4) rotation = defaultDoublesOrder;

  const serveCycle = Math.floor(totalPoints / 2);
  const serverIndex = serveCycle % rotation.length;

  return {
    server: rotation[serverIndex],
    isDeuce,
    serveCount: isDeuce ? 0 : totalPoints % 2,
  };
};

export const flipDoublesRotationForNextGame = (
  currentRotation: DoublesPlayerKey[]
): DoublesPlayerKey[] => {
  if (!currentRotation || currentRotation.length !== 4)
    return defaultDoublesOrder;

  const [prevServer, prevReceiver, prevServerPartner, prevReceiverPartner] =
    currentRotation;

  const nextRotation: DoublesPlayerKey[] = [
    prevReceiver,
    prevServerPartner,
    prevReceiverPartner,
    prevServer,
  ];

  return nextRotation;
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

  const partnerOf = (k: DoublesPlayerKey): DoublesPlayerKey =>
    k.endsWith("_main")
      ? k.startsWith("side1")
        ? "side1_partner"
        : "side2_partner"
      : k.startsWith("side1")
      ? "side1_main"
      : "side2_main";

  const fallback = defaultDoublesOrder.slice();

  if (
    !firstServer ||
    !all.includes(firstServer) ||
    !firstReceiver ||
    !all.includes(firstReceiver)
  ) {
    return fallback;
  }

  const serverSide = firstServer.split("_")[0];
  const receiverSide = firstReceiver.split("_")[0];

  if (serverSide === receiverSide) {
    console.error(
      "Server and receiver must be on opposite sides, using fallback"
    );
    return fallback;
  }

  const rotation: DoublesPlayerKey[] = [
    firstServer,
    firstReceiver,
    partnerOf(firstServer),
    partnerOf(firstReceiver),
  ];

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

// ✅ FIXED: Support both individual (side1/side2) and team (team1/team2) keys
export const getCurrentServerName = (
  server: ServerKey | null,
  participants: any[],
  matchType: string
): string | null => {
  if (!server || !participants) return null;

  console.log("🔍 getCurrentServerName called with:", {
    server,
    matchType,
    participants: participants.map((p) => p.fullName || p.username),
  });

  if (matchType === "singles") {
    switch (server) {
      // ✅ Individual match keys
      case "side1":
        return (
          participants[0]?.fullName || participants[0]?.username || "Player 1"
        );
      case "side2":
        return (
          participants[1]?.fullName || participants[1]?.username || "Player 2"
        );

      // ✅ Team match keys (NEW!)
      case "team1":
        return (
          participants[0]?.fullName ||
          participants[0]?.username ||
          "Team 1 Player"
        );
      case "team2":
        return (
          participants[1]?.fullName ||
          participants[1]?.username ||
          "Team 2 Player"
        );

      default:
        console.warn("⚠️ Unknown server key for singles:", server);
        return null;
    }
  }

  // doubles / mixed_doubles
  switch (server) {
    // ✅ Individual match doubles keys
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

    // ✅ Team match doubles keys (NEW!)
    case "team1_main":
      return (
        participants[0]?.fullName || participants[0]?.username || "Team 1 Main"
      );
    case "team1_partner":
      return (
        participants[1]?.fullName ||
        participants[1]?.username ||
        "Team 1 Partner"
      );
    case "team2_main":
      return (
        participants[2]?.fullName || participants[2]?.username || "Team 2 Main"
      );
    case "team2_partner":
      return (
        participants[3]?.fullName ||
        participants[3]?.username ||
        "Team 2 Partner"
      );

    default:
      console.warn("⚠️ Unknown server key for doubles:", server);
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
