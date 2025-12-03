/**
 * Server Calculation Service
 *
 * Centralized server calculation logic that works for both individual and team matches.
 * Eliminates code duplication between components/live-scorer/individual/helpers.ts
 * and app/api/matches/team/[id]/submatch/[subMatchId]/score/route.ts
 */

import {
  DoublesPlayerKey,
  InitialServerConfig,
  PlayerKey,
  ServerKey,
} from "@/types/match.type";

export type ServerResult = {
  server: ServerKey | string;
  isDeuce: boolean;
  serveCount: number;
};

/**
 * Check if a game has been won
 * @returns Winner key ("side1"/"side2"/"team1"/"team2") or null if game continues
 */
export function checkGameWon(
  side1: number,
  side2: number
): PlayerKey | null {
  if ((side1 >= 11 || side2 >= 11) && Math.abs(side1 - side2) >= 2) {
    return side1 > side2 ? "side1" : "side2";
  }
  return null;
}

/**
 * Check if game is in deuce (both players >= 10)
 */
export function isGameInDeuce(side1: number, side2: number): boolean {
  return side1 >= 10 && side2 >= 10;
}

/**
 * Get next server for team matches (uses team1/team2 keys)
 * This is a convenience wrapper around getNextServer that handles key mapping
 */
export function getNextServerForTeamMatch(
  p1: number,
  p2: number,
  isDoubles: boolean,
  initialConfig?: any,
  currentGame?: number
): ServerResult {
  // Map team keys to side keys for computation
  const teamToSideMap: Record<string, string> = {
    'team1': 'side1',
    'team2': 'side2',
    'team1_main': 'side1_main',
    'team1_partner': 'side1_partner',
    'team2_main': 'side2_main',
    'team2_partner': 'side2_partner'
  };

  const sideToTeamMap: Record<string, string> = {
    'side1': 'team1',
    'side2': 'team2',
    'side1_main': 'team1_main',
    'side1_partner': 'team1_partner',
    'side2_main': 'team2_main',
    'side2_partner': 'team2_partner'
  };

  // Convert config to side keys
  const sideConfig = {
    firstServer: initialConfig?.firstServer ? teamToSideMap[initialConfig.firstServer] || initialConfig.firstServer : undefined,
    firstReceiver: initialConfig?.firstReceiver ? teamToSideMap[initialConfig.firstReceiver] || initialConfig.firstReceiver : undefined,
    serverOrder: initialConfig?.serverOrder?.map((key: string) => teamToSideMap[key] || key)
  };

  // Use existing logic with side keys
  const result = getNextServer(p1, p2, isDoubles, sideConfig, currentGame);

  // Convert result back to team keys
  return {
    ...result,
    server: sideToTeamMap[result.server] || result.server
  };
}

/**
 * Main server calculation function for individual matches (uses side1/side2 keys)
 * Also works for team matches if you use getNextServerForTeamMatch wrapper
 */
export function getNextServer(
  p1: number,
  p2: number,
  isDoubles: boolean,
  initialConfig?: InitialServerConfig,
  currentGame?: number
): ServerResult {
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
    return getNextServerSingles(totalPoints, isDeuce, firstServer, currentGame);
  }
}

/**
 * Calculate next server for singles matches
 */
function getNextServerSingles(
  totalPoints: number,
  isDeuce: boolean,
  firstServer: PlayerKey,
  currentGame?: number
): ServerResult {
  // Determine the starting server for this game
  // Game 1 (odd): firstServer starts
  // Game 2 (even): opposite player starts
  // Game 3 (odd): firstServer starts
  // And so on...
  let gameFirstServer = firstServer;
  if (currentGame && currentGame % 2 === 0) {
    // Even game number - switch to opposite server
    if (firstServer === "side1") {
      gameFirstServer = "side2";
    } else if (firstServer === "side2") {
      gameFirstServer = "side1";
    } else if (firstServer === "team1") {
      gameFirstServer = "team2";
    } else if (firstServer === "team2") {
      gameFirstServer = "team1";
    }
  }

  if (isDeuce) {
    const serverIndex = totalPoints % 2;
    let servers: PlayerKey[];
    if (gameFirstServer === "side1" || gameFirstServer === "side2") {
      servers =
        gameFirstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
    } else {
      servers =
        gameFirstServer === "team1" ? ["team1", "team2"] : ["team2", "team1"];
    }

    return {
      server: servers[serverIndex],
      isDeuce: true,
      serveCount: 0,
    };
  }

  const serveCycle = Math.floor(totalPoints / 2);
  // Handle both individual and team match keys
  let servers: PlayerKey[];
  if (gameFirstServer === "side1" || gameFirstServer === "side2") {
    servers = gameFirstServer === "side1" ? ["side1", "side2"] : ["side2", "side1"];
  } else {
    servers = gameFirstServer === "team1" ? ["team1", "team2"] : ["team2", "team1"];
  }
  const currentServerIndex = serveCycle % 2;

  return {
    server: servers[currentServerIndex],
    isDeuce: false,
    serveCount: totalPoints % 2,
  };
}

const defaultDoublesOrder: DoublesPlayerKey[] = [
  "side1_main",
  "side2_main",
  "side1_partner",
  "side2_partner",
];

/**
 * Calculate next server for doubles matches
 */
function getNextServerDoubles(
  totalPoints: number,
  isDeuce: boolean,
  rotation: string[] = []
): ServerResult {
  // Support both side and team key defaults
  const defaultRotation = rotation[0]?.startsWith('team')
    ? ["team1_main", "team2_main", "team1_partner", "team2_partner"]
    : ["side1_main", "side2_main", "side1_partner", "side2_partner"];

  const actualRotation = (rotation && rotation.length === 4) ? rotation : defaultRotation;

  const serveCycle = Math.floor(totalPoints / 2);
  const serverIndex = serveCycle % actualRotation.length;

  return {
    server: actualRotation[serverIndex],
    isDeuce,
    serveCount: isDeuce ? 0 : totalPoints % 2,
  };
}

/**
 * Flip doubles rotation for next game
 * Used when transitioning between games
 */
export function flipDoublesRotationForNextGame(
  currentRotation: DoublesPlayerKey[]
): DoublesPlayerKey[] {
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
}

/**
 * Build doubles rotation for team matches (team1/team2 keys)
 */
export function buildDoublesRotationForTeamMatch(
  firstServer?: string | null,
  firstReceiver?: string | null
): string[] {
  const allTeam: string[] = [
    "team1_main",
    "team1_partner",
    "team2_main",
    "team2_partner",
  ];

  const partnerOf = (k: string): string =>
    k.endsWith("_main")
      ? k.startsWith("team1")
        ? "team1_partner"
        : "team2_partner"
      : k.startsWith("team1")
      ? "team1_main"
      : "team2_main";

  const fallback = allTeam.slice();

  if (
    !firstServer ||
    !allTeam.includes(firstServer) ||
    !firstReceiver ||
    !allTeam.includes(firstReceiver)
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

  const rotation: string[] = [
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
}

/**
 * Build doubles rotation for individual matches (side1/side2 keys)
 */
export function buildDoublesRotation(
  firstServer?: DoublesPlayerKey | null,
  firstReceiver?: DoublesPlayerKey | null
): DoublesPlayerKey[] {
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
}

/**
 * Utility function to calculate next server (backward compatibility)
 * Combines score calculation with server determination
 */
export function calculateNextServer(
  score1: number,
  score2: number,
  isDoubles: boolean,
  serverConfig?: any,
  gameNumber?: number
): ServerResult {
  return getNextServer(score1, score2, isDoubles, serverConfig, gameNumber);
}
