/**
 * Team Match Service
 *
 * Centralized business logic for team match operations.
 * Extracts logic from API routes for better testability and reuse.
 */

import mongoose, { ClientSession } from "mongoose";
import TeamMatch, { ITeamMatch } from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import {
  TeamMatchFormat,
  TeamSubMatchBase,
  TeamMatchSnapshot,
  FORMAT_REQUIREMENTS,
} from "@/shared/match/teamMatchTypes";
import {
  createSinglesSubMatch,
  createDoublesSubMatch,
} from "./subMatchFactory";
import { populateTeamMatch } from "./populationService";
import {
  applyShotsToLoadedMatch,
  deleteLastTeamPointForSide,
  insertTeamPoint,
} from "./matchPointService";
import { isGameWon, isMatchWon, isTeamMatchWon } from "@/shared/match/scoringRules";
import { getNextServerForTeamMatch } from "./serverCalculationService";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";

// ============================================
// TYPES
// ============================================

export interface CreateTeamMatchInput {
  matchFormat: TeamMatchFormat;
  setsPerTie: number;
  team1Id: string;
  team2Id: string;
  city: string;
  venue?: string;
  serverConfig?: any;
  customConfig?: {
    matches: Array<{
      type: "singles" | "doubles";
      team1Players: string[];
      team2Players: string[];
    }>;
  };
  team1Assignments?: Record<string, string>;
  team2Assignments?: Record<string, string>;
}

export interface UpdateScoreInput {
  gameNumber?: number;
  team1Score?: number;
  team2Score?: number;
  action?: "subtract";
  side?: "team1" | "team2";
  shotData?: {
    side: "team1" | "team2";
    player: string;
    stroke: string;
    serveType?: string | null;
    server?: string | null;
    originX?: number;
    originY?: number;
    landingX?: number;
    landingY?: number;
  };
}

export interface TeamMatchResult {
  success: boolean;
  match?: any;
  error?: string;
  status?: number;
}

// ============================================
// SUBMATCH GENERATION
// ============================================

/**
 * Generate submatches for Swaythling Cup (5 singles: A-X, B-Y, C-Z, A-Y, B-X)
 */
function generateFiveSinglesSubmatches(
  team1Assignments: Record<string, string>,
  team2Assignments: Record<string, string>,
  setsPerTie: number
): TeamSubMatchBase[] {
  const submatches: TeamSubMatchBase[] = [];

  const team1PositionMap = new Map<string, string>();
  for (const [playerId, position] of Object.entries(team1Assignments)) {
    if (position) team1PositionMap.set(position as string, playerId);
  }

  const team2PositionMap = new Map<string, string>();
  for (const [playerId, position] of Object.entries(team2Assignments)) {
    if (position) team2PositionMap.set(position as string, playerId);
  }

  const order = [
    ["A", "X"],
    ["B", "Y"],
    ["C", "Z"],
    ["A", "Y"],
    ["B", "X"],
  ];

  order.forEach((pair, index) => {
    const playerTeam1 = team1PositionMap.get(pair[0]);
    const playerTeam2 = team2PositionMap.get(pair[1]);

    if (playerTeam1 && playerTeam2) {
      submatches.push(
        createSinglesSubMatch({
          matchNumber: index + 1,
          playerTeam1,
          playerTeam2,
          numberOfGames: setsPerTie,
        })
      );
    }
  });

  return submatches;
}

/**
 * Generate submatches for Single-Double-Single format
 */
function generateSingleDoubleSingleSubmatches(
  team1Assignments: Record<string, string>,
  team2Assignments: Record<string, string>,
  setsPerTie: number
): TeamSubMatchBase[] {
  const submatches: TeamSubMatchBase[] = [];

  const team1PositionMap = new Map<string, string>();
  for (const [playerId, position] of Object.entries(team1Assignments)) {
    if (position) team1PositionMap.set(position as string, playerId);
  }

  const team2PositionMap = new Map<string, string>();
  for (const [playerId, position] of Object.entries(team2Assignments)) {
    if (position) team2PositionMap.set(position as string, playerId);
  }

  const playerA = team1PositionMap.get("A");
  const playerB = team1PositionMap.get("B");
  const playerX = team2PositionMap.get("X");
  const playerY = team2PositionMap.get("Y");

  if (playerA && playerX) {
    submatches.push(
      createSinglesSubMatch({
        matchNumber: 1,
        playerTeam1: playerA,
        playerTeam2: playerX,
        numberOfGames: setsPerTie,
      })
    );
  }

  if (playerA && playerB && playerX && playerY) {
    submatches.push(
      createDoublesSubMatch({
        matchNumber: 2,
        playerTeam1: [playerA, playerB],
        playerTeam2: [playerX, playerY],
        numberOfGames: setsPerTie,
      })
    );
  }

  if (playerB && playerY) {
    submatches.push(
      createSinglesSubMatch({
        matchNumber: 3,
        playerTeam1: playerB,
        playerTeam2: playerY,
        numberOfGames: setsPerTie,
      })
    );
  }

  return submatches;
}

/**
 * Generate submatches for custom format
 */
function generateCustomFormatSubmatches(
  setsPerTie: number,
  customConfig: CreateTeamMatchInput["customConfig"]
): TeamSubMatchBase[] {
  const submatches: TeamSubMatchBase[] = [];

  if (!customConfig?.matches || customConfig.matches.length === 0) {
    throw new Error("Custom format requires match configuration");
  }

  customConfig.matches.forEach((matchConfig, index) => {
    const { type, team1Players, team2Players } = matchConfig;

    if (type === "singles") {
      if (team1Players.length !== 1 || team2Players.length !== 1) {
        throw new Error(
          `Match ${index + 1}: Singles requires exactly 1 player per team`
        );
      }
      submatches.push(
        createSinglesSubMatch({
          matchNumber: index + 1,
          playerTeam1: team1Players[0],
          playerTeam2: team2Players[0],
          numberOfGames: setsPerTie,
        })
      );
    } else if (type === "doubles") {
      if (team1Players.length !== 2 || team2Players.length !== 2) {
        throw new Error(
          `Match ${index + 1}: Doubles requires exactly 2 players per team`
        );
      }
      submatches.push(
        createDoublesSubMatch({
          matchNumber: index + 1,
          playerTeam1: [team1Players[0], team1Players[1]],
          playerTeam2: [team2Players[0], team2Players[1]],
          numberOfGames: setsPerTie,
        })
      );
    }
  });

  return submatches;
}

// ============================================
// SERVICE CLASS
// ============================================

export class TeamMatchService {
  /**
   * Generate submatches based on match format
   */
  generateSubMatches(
    format: TeamMatchFormat,
    team1Assignments: Record<string, string>,
    team2Assignments: Record<string, string>,
    setsPerTie: number,
    customConfig?: CreateTeamMatchInput["customConfig"]
  ): TeamSubMatchBase[] {
    switch (format) {
      case "five_singles":
        return generateFiveSinglesSubmatches(
          team1Assignments,
          team2Assignments,
          setsPerTie
        );
      case "single_double_single":
        return generateSingleDoubleSingleSubmatches(
          team1Assignments,
          team2Assignments,
          setsPerTie
        );
      case "custom":
        return generateCustomFormatSubmatches(setsPerTie, customConfig);
      default:
        throw new Error(`Format "${format}" is not supported`);
    }
  }

  /**
   * Validate team assignments for a given format
   */
  validateAssignments(
    format: TeamMatchFormat,
    team1Assignments: Record<string, string>,
    team2Assignments: Record<string, string>,
    team1Name: string,
    team2Name: string
  ): { valid: boolean; error?: string } {
    const requirements = FORMAT_REQUIREMENTS[format];

    if (requirements.team1.length === 0) {
      return { valid: true };
    }

    const hasTeam1Assignments = Object.keys(team1Assignments).length > 0;
    const hasTeam2Assignments = Object.keys(team2Assignments).length > 0;

    if (!hasTeam1Assignments) {
      return {
        valid: false,
        error: `Team "${team1Name}" has no player position assignments.`,
      };
    }

    if (!hasTeam2Assignments) {
      return {
        valid: false,
        error: `Team "${team2Name}" has no player position assignments.`,
      };
    }

    return { valid: true };
  }

  /**
   * Build team snapshot for storing in match
   */
  buildTeamSnapshot(
    team: any,
    assignments: Record<string, string>
  ): TeamMatchSnapshot {
    return {
      _id: team._id.toString(),
      name: team.name,
      logo: team.logo,
      captain: team.captain?.toString(),
      players: team.players,
      city: team.city,
      assignments,
    };
  }

  /**
   * Create a new team match
   */
  async createTeamMatch(
    input: CreateTeamMatchInput,
    scorerId: string
  ): Promise<TeamMatchResult> {
    const scorer = await User.findById(scorerId);
    if (!scorer) {
      return { success: false, error: "Invalid scorer", status: 401 };
    }

    const { matchFormat, setsPerTie, team1Id, team2Id, city, venue } = input;

    if (!matchFormat || !setsPerTie || !city || !team1Id || !team2Id) {
      return { success: false, error: "Missing required fields", status: 400 };
    }

    if (team1Id === team2Id) {
      return {
        success: false,
        error: "Team 1 and Team 2 cannot be the same",
        status: 400,
      };
    }

    const team1 = await Team.findById(team1Id)
      .populate("players.user", "username fullName profileImage")
      .lean();

    const team2 = await Team.findById(team2Id)
      .populate("players.user", "username fullName profileImage")
      .lean();

    if (!team1 || !team2) {
      return { success: false, error: "Invalid team IDs", status: 400 };
    }

    const team1Assignments =
      input.team1Assignments || (team1 as any).assignments || {};
    const team2Assignments =
      input.team2Assignments || (team2 as any).assignments || {};

    const validation = this.validateAssignments(
      matchFormat,
      team1Assignments,
      team2Assignments,
      (team1 as any).name,
      (team2 as any).name
    );

    if (!validation.valid) {
      return { success: false, error: validation.error, status: 400 };
    }

    if (input.team1Assignments && Object.keys(input.team1Assignments).length > 0) {
      await Team.findByIdAndUpdate(team1Id, { assignments: input.team1Assignments });
    }
    if (input.team2Assignments && Object.keys(input.team2Assignments).length > 0) {
      await Team.findByIdAndUpdate(team2Id, { assignments: input.team2Assignments });
    }

    let subMatches: TeamSubMatchBase[];
    try {
      subMatches = this.generateSubMatches(
        matchFormat,
        team1Assignments,
        team2Assignments,
        setsPerTie,
        input.customConfig
      );
    } catch (err: any) {
      return { success: false, error: err.message, status: 400 };
    }

    if (subMatches.length === 0) {
      return {
        success: false,
        error: "Could not generate submatches. Ensure all positions are assigned.",
        status: 400,
      };
    }

    const teamMatch = await matchRepository.createTeamMatch({
      matchFormat,
      numberOfGamesPerRubber: setsPerTie,
      team1: this.buildTeamSnapshot(team1, team1Assignments),
      team2: this.buildTeamSnapshot(team2, team2Assignments),
      subMatches,
      scorer: scorerId,
      city,
      venue,
    });

    const populatedMatch = await populateTeamMatch(
      TeamMatch.findById(teamMatch._id)
    ).exec();

    const withShots = populatedMatch
      ? await applyShotsToLoadedMatch(populatedMatch, "team", true)
      : populatedMatch;

    return { success: true, match: withShots };
  }

  /**
   * Update submatch score
   */
  async updateSubMatchScore(
    matchId: string,
    subMatchId: string,
    input: UpdateScoreInput,
    onMatchComplete?: (match: ITeamMatch) => Promise<void>,
    userId?: string,
    session?: ClientSession | null
  ): Promise<TeamMatchResult> {
    let mq = TeamMatch.findById(matchId);
    if (session) mq = mq.session(session);
    const match = await mq;
    if (!match) {
      return { success: false, error: "Match not found", status: 404 };
    }

    const subMatchIdNum = parseInt(subMatchId);
    const subMatch = match.subMatches.find(
      (sm: any) =>
        sm.matchNumber === subMatchIdNum || sm._id?.toString() === subMatchId
    );

    if (!subMatch) {
      return { success: false, error: "SubMatch not found", status: 404 };
    }

    const gameNumber = input.gameNumber || subMatch.games.length + 1;
    let currentGame = subMatch.games.find(
      (g: any) => g.gameNumber === gameNumber
    );

    if (!currentGame) {
      subMatch.games.push({
        gameNumber,
        team1Score: 0,
        team2Score: 0,
        winnerSide: null,
        completed: false,
      });
      currentGame = subMatch.games[subMatch.games.length - 1];
    }

    const isDoubles = (subMatch as any).matchType === "doubles";
    const serverConfig = (subMatch as any).serverConfig || {};

    const subMatchDocId = subMatch._id as mongoose.Types.ObjectId;
    let didCompleteEntireTeamMatch = false;

    if (input.action === "subtract" && input.side) {
      if (input.side === "team1" && currentGame.team1Score > 0) {
        currentGame.team1Score -= 1;
      }
      if (input.side === "team2" && currentGame.team2Score > 0) {
        currentGame.team2Score -= 1;
      }

      await deleteLastTeamPointForSide(
        match._id,
        subMatchDocId,
        gameNumber,
        input.side,
        session ?? null
      );

      const serverResult = getNextServerForTeamMatch(
        currentGame.team1Score,
        currentGame.team2Score,
        isDoubles,
        serverConfig,
        gameNumber
      );
      (subMatch as any).currentServer = serverResult.server;
    } else if (
      typeof input.team1Score === "number" &&
      typeof input.team2Score === "number"
    ) {
      // Determine shot tracking mode: match override > user preference > default "detailed"
      let shotTrackingMode: "detailed" | "simple" = "detailed";
      if (match.shotTrackingMode) {
        shotTrackingMode = match.shotTrackingMode;
      } else if (userId) {
        // Fetch user preference if match doesn't have override
        const user = await User.findById(userId).select("shotTrackingMode");
        if (user?.shotTrackingMode) {
          shotTrackingMode = user.shotTrackingMode;
        }
      }

      const scoreIncreased =
        input.team1Score > currentGame.team1Score ||
        input.team2Score > currentGame.team2Score;

      // Only require shot data if in detailed mode
      if (scoreIncreased && shotTrackingMode === "detailed" && (!input.shotData || !input.shotData.player)) {
        return {
          success: false,
          error: "Shot data is required when incrementing score",
          status: 400,
        };
      }

      currentGame.team1Score = input.team1Score;
      currentGame.team2Score = input.team2Score;

      const serverResult = getNextServerForTeamMatch(
        input.team1Score,
        input.team2Score,
        isDoubles,
        serverConfig,
        gameNumber
      );
      (subMatch as any).currentServer = serverResult.server;
    }

    // Add shot data if provided (before checking game completion)
    if (input.shotData?.player) {
      await insertTeamPoint({
        matchId: match._id,
        teamSubMatchId: subMatchDocId,
        gameNumber,
        shot: {
          side: input.shotData.side,
          player: input.shotData.player,
          stroke: input.shotData.stroke || null,
          serveType: input.shotData.serveType || null,
          server: input.shotData.server || null,
          originX: input.shotData.originX,
          originY: input.shotData.originY,
          landingX: input.shotData.landingX,
          landingY: input.shotData.landingY,
          timestamp: new Date(),
        },
        session: session ?? null,
      });
    }

    const gameWon = isGameWon(currentGame.team1Score, currentGame.team2Score);

    if (gameWon && !currentGame.winnerSide) {
      currentGame.winnerSide =
        currentGame.team1Score > currentGame.team2Score ? "team1" : "team2";
      currentGame.completed = true;

      if (!subMatch.finalScore) {
        subMatch.finalScore = { team1Games: 0, team2Games: 0 };
      }

      if (currentGame.winnerSide === "team1") {
        subMatch.finalScore.team1Games += 1;
      } else {
        subMatch.finalScore.team2Games += 1;
      }

      const subMatchWon = isMatchWon(
        subMatch.finalScore.team1Games,
        subMatch.finalScore.team2Games,
        subMatch.numberOfGames || 5
      );

      if (subMatchWon) {
        const gamesNeeded = Math.ceil((subMatch.numberOfGames || 5) / 2);
        subMatch.winnerSide =
          subMatch.finalScore.team1Games >= gamesNeeded ? "team1" : "team2";
        subMatch.status = "completed";
        subMatch.completed = true;

        if (subMatch.winnerSide === "team1") {
          match.finalScore.team1Matches = Number(match.finalScore.team1Matches || 0) + 1;
        } else {
          match.finalScore.team2Matches = Number(match.finalScore.team2Matches || 0) + 1;
        }

        const totalSubMatches = match.numberOfSubMatches || match.subMatches.length;
        const teamMatchWon = isTeamMatchWon(
          Number(match.finalScore.team1Matches || 0),
          Number(match.finalScore.team2Matches || 0),
          totalSubMatches
        );

        if (teamMatchWon) {
          const matchesNeeded = Math.ceil(totalSubMatches / 2);
          match.status = "completed";
          match.winnerTeam =
            Number(match.finalScore.team1Matches || 0) >= matchesNeeded ? "team1" : "team2";
          match.matchDuration = Date.now() - (match.startedAt?.getTime() || match.createdAt?.getTime() || Date.now());
          didCompleteEntireTeamMatch = true;
        } else {
          const nextSubIndex = match.subMatches.findIndex(
            (sm: any) => !sm.completed
          );
          match.currentSubMatch =
            nextSubIndex !== -1 ? nextSubIndex + 1 : match.currentSubMatch;
        }
      } else {
        const serverResult = getNextServerForTeamMatch(
          0,
          0,
          isDoubles,
          serverConfig,
          gameNumber + 1
        );
        (subMatch as any).currentServer = serverResult.server;
      }
    }

    match.markModified("subMatches");
    await match.save(session ? { session } : {});

    const updatedDoc = await populateTeamMatch(
      TeamMatch.findById(match._id)
    ).exec();

    const updatedMatch = updatedDoc
      ? await applyShotsToLoadedMatch(updatedDoc, "team", true)
      : updatedDoc;

    if (onMatchComplete && didCompleteEntireTeamMatch) {
      await onMatchComplete(match);
    }

    return { success: true, match: updatedMatch };
  }
}

export const teamMatchService = new TeamMatchService();
