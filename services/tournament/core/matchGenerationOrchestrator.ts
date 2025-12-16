// services/tournament/core/matchGenerationOrchestrator.ts

/**
 * Match Generation Orchestrator
 *
 * Coordinates match generation across repositories and services.
 * Implements the orchestrator pattern for clean separation of concerns.
 *
 * Responsibilities:
 * - Coordinate between repositories and services
 * - Manage transactions for atomicity
 * - Handle error recovery
 * - Provide unified interface for match generation
 */

import mongoose, { ClientSession } from "mongoose";
import { TransactionManager } from "@/services/database/TransactionManager";
import {
  tournamentRepository,
  Tournament,
} from "../repositories/TournamentRepository";
import { matchRepository } from "../repositories/MatchRepository";
import {
  generateKnockoutBracket,
  createOrUpdateBracketState,
} from "./bracketGenerationService";
import {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
} from "./schedulingService";
import { allocateGroups } from "../utils/groupAllocator";
import { prepareSeeding } from "./matchGenerationService";
import {
  createBracketMatch,
  createBracketTeamMatch,
} from "./matchGenerationService";
import { KnockoutBracket } from "@/types/tournamentDraw";
import Team from "@/models/Team";
import {
  createSinglesSubMatch,
  createDoublesSubMatch,
} from "@/services/match/subMatchFactory";

export interface MatchGenerationOptions {
  courtsAvailable?: number;
  matchDuration?: number; // in minutes
}

export interface MatchGenerationResult {
  tournament: Tournament;
  stats: {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  };
}

export class MatchGenerationOrchestrator {
  constructor(
    private txManager: TransactionManager = new TransactionManager(),
    private tournamentRepo = tournamentRepository,
    private matchRepo = matchRepository
  ) {}

  /**
   * Generate tournament draw - Main orchestrator method
   */
  async generateTournamentDraw(
    tournamentId: string,
    scorerId: string,
    options: MatchGenerationOptions = {}
  ): Promise<MatchGenerationResult> {
    return this.txManager.executeInTransaction(async (session) => {
      // Load tournament
      const tournament = await this.tournamentRepo.findById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      // Prepare seeding
      const participantIds = tournament.participants.map((p: any) =>
        p.toString()
      );
      const seeding = prepareSeeding(tournament, participantIds);

      // Update tournament seeding
      await this.tournamentRepo.updateSeeding(tournamentId, seeding, session);

      // Generate matches based on format and store bracket reference for stats
      let generatedBracket: any = null;
      let roundRobinStats: { totalMatches: number; totalRounds: number } | null = null;

      if (tournament.format === "hybrid") {
        // For hybrid, only generate round-robin phase initially
        const { generateHybridRoundRobinPhase } = await import(
          "./hybridMatchGenerationService"
        );
        await generateHybridRoundRobinPhase(tournament, {
          scorerId: new (await import("mongoose")).Types.ObjectId(scorerId),
          ...options,
          session,
        });
      } else if (tournament.format === "round_robin") {
        roundRobinStats = await this.generateRoundRobinMatches(
          tournament,
          participantIds,
          seeding,
          scorerId,
          options,
          session
        );
      } else if (tournament.format === "knockout") {
        generatedBracket = await this.generateKnockoutMatches(
          tournament,
          participantIds,
          seeding,
          scorerId,
          options,
          session
        );
      } else {
        throw new Error(`Unsupported tournament format: ${tournament.format}`);
      }

      // Mark draw as generated
      await this.tournamentRepo.markDrawGenerated(
        tournamentId,
        scorerId,
        session
      );
      await this.tournamentRepo.updateStatus(tournamentId, "upcoming", session);

      // Calculate stats from the generated bracket/matches
      let stats: { totalMatches: number; totalRounds: number; groups?: number; format: string };
      
      if (roundRobinStats) {
        // Use stats from round-robin generation
        stats = {
          ...roundRobinStats,
          format: tournament.useGroups ? "round_robin_groups" : "round_robin",
          groups: tournament.useGroups ? tournament.numberOfGroups : undefined,
        };
      } else {
        // For knockout/hybrid, use existing calculation
        stats = this.calculateStatsFromGeneration(tournament, generatedBracket);
      }

      return {
        tournament,
        stats,
      };
    });
  }

  /**
   * Calculate stats from the generated data (before bracket virtual is populated)
   * This is used inside transactions where the bracket virtual can't be accessed yet
   */
  private calculateStatsFromGeneration(
    tournament: Tournament,
    bracket?: any
  ): {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  } {
    if (tournament.format === "knockout" && bracket) {
      // Use the bracket object that was created during generation

      let totalMatches = 0;
      if (bracket.rounds && Array.isArray(bracket.rounds)) {
        totalMatches = bracket.rounds.reduce((sum: number, round: any) => {
          const matchCount = round.matches?.length || 0;

          return sum + matchCount;
        }, 0);
      }

      // Add third place match if it exists
      if (bracket.thirdPlaceMatch) {
        totalMatches += 1;
      }

      return {
        totalMatches,
        totalRounds: bracket.rounds?.length || 0,
        format: "knockout",
      };
    }

    if (tournament.format === "knockout") {
      // Fallback if bracket wasn't provided
      console.warn(
        "[calculateStatsFromGeneration] No bracket provided for knockout tournament"
      );
      return {
        totalMatches: 0,
        totalRounds: 0,
        format: "knockout",
      };
    }

    // For other formats, use existing logic
    return this.calculateStats(tournament);
  }

  /**
   * Generate round-robin matches
   */
  private async generateRoundRobinMatches(
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<{ totalMatches: number; totalRounds: number }> {
    const isDoubles =
      (tournament as any).matchType === "doubles" ||
      (tournament as any).matchType === "mixed_doubles";

    if (tournament.useGroups && tournament.numberOfGroups) {
      // Generate group matches
      await this.generateGroupMatches(
        tournament,
        participantIds,
        seeding,
        scorerId,
        options,
        session
      );
      return { totalMatches: 0, totalRounds: 0 }; // TODO: return actual stats
    } else {
      // Generate single round-robin
      return await this.generateSingleRoundRobin(
        tournament,
        participantIds,
        seeding,
        scorerId,
        options,
        session
      );
    }
  }

  /**
   * Generate single round-robin matches
   */
  private async generateSingleRoundRobin(
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<{ totalMatches: number; totalRounds: number }> {
    const isTeamCategory = (tournament as any).category === "team";
    const isDoubles =
      (tournament as any).matchType === "doubles" ||
      (tournament as any).matchType === "mixed_doubles";

    const schedule =
      seeding.length > 0
        ? generateSeededRoundRobinSchedule(
            participantIds,
            seeding,
            options.courtsAvailable || 1,
            tournament.startDate,
            options.matchDuration || 60
          )
        : generateRoundRobinSchedule(
            participantIds,
            options.courtsAvailable || 1,
            tournament.startDate,
            options.matchDuration || 60
          );

    // Pre-fetch team data if this is a team tournament
    let teamsMap: Map<string, any> = new Map();
    if (isTeamCategory) {
      const teams = await Team.find({
        _id: { $in: participantIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .populate("players.user", "username fullName profileImage")
        .lean();
      for (const team of teams) {
        teamsMap.set(String(team._id), team);
      }
    }

    const rounds: any[] = [];
    const matchIds: string[] = [];

    // DEBUG: Log about to generate team matches
    console.log("🔵 [ORCHESTRATOR] About to generate team matches for tournament:", {
      tournamentId: tournament._id,
      teamConfig: (tournament as any).teamConfig,
      teamConfig_setsPerSubMatch: (tournament as any).teamConfig?.setsPerSubMatch,
      numberOfRounds: schedule.length,
    });

    for (const round of schedule) {
      const roundMatchIds: string[] = [];

      for (const pairing of round.matches) {
        if (isTeamCategory) {
          // Create team match
          const team1Data = teamsMap.get(pairing.player1.toString());
          const team2Data = teamsMap.get(pairing.player2.toString());

          if (!team1Data || !team2Data) {
            throw new Error(
              `Team data not found for pairing: ${pairing.player1} vs ${pairing.player2}`
            );
          }

          const teamTournament = tournament as any;
          const matchFormat = teamTournament.teamConfig?.matchFormat || "five_singles";
          const rawSetsPerSubMatch = teamTournament.teamConfig?.setsPerSubMatch;
          const setsPerSubMatch = rawSetsPerSubMatch 
            ? Number(rawSetsPerSubMatch)
            : 3;

          // DEBUG: Log pairing details
          console.log("🟢 [ORCHESTRATOR] Generating match for pairing:", {
            pairing,
            teamConfig_setsPerSubMatch: teamTournament.teamConfig?.setsPerSubMatch,
            rawSetsPerSubMatch,
            setsPerSubMatch,
          });
          
          // Validate converted value
          if (!Number.isFinite(setsPerSubMatch) || setsPerSubMatch < 1) {
            throw new Error(`Invalid setsPerSubMatch value: ${rawSetsPerSubMatch}. Must be a positive number.`);
          }

          // Generate subMatches based on format and team assignments
          const subMatches = this.generateSubMatches(
            matchFormat,
            team1Data,
            team2Data,
            setsPerSubMatch
          );

          const match = await this.matchRepo.createTeamMatch(
            {
              tournament: String(tournament._id),
              matchFormat,
              numberOfSetsPerSubMatch: setsPerSubMatch,
              team1: this.buildTeamInfo(team1Data),
              team2: this.buildTeamInfo(team2Data),
              subMatches,
              scorer: scorerId,
              city: tournament.city,
              venue: tournament.venue,
              scheduledDate: round.scheduledDate,
            },
            session
          );

          // DEBUG: Log created match
          console.log("🟡 [ORCHESTRATOR] Match generated:", {
            matchId: match._id,
            numberOfSetsPerSubMatch: match.numberOfSetsPerSubMatch,
          });

          matchIds.push(String(match._id));
          roundMatchIds.push(String(match._id));
        } else {
          // Get match participants
          const matchParticipants = isDoubles
            ? this.getDoublesParticipants(pairing, participantIds)
            : [pairing.player1, pairing.player2];

          const match = await this.matchRepo.createIndividualMatch(
            {
              tournament: String(tournament._id),
              matchType: (tournament as any).matchType,
              numberOfSets: tournament.rules.setsPerMatch,
              participants: matchParticipants.map((p: any) => p.toString()),
              scorer: scorerId, // Set scorer so organizer can start matches
              city: tournament.city,
              venue: tournament.venue,
            },
            session
          );

          matchIds.push(String(match._id));
          roundMatchIds.push(String(match._id));
        }
      }

      rounds.push({
        roundNumber: round.roundNumber,
        matches: roundMatchIds,
        matchModel: isTeamCategory ? "TeamMatch" : "IndividualMatch",
        completed: false,
        scheduledDate: round.scheduledDate,
      });
    }

    // DEBUG: Log all matches after generation
    console.log("🟠 [ORCHESTRATOR] All matches generated:", {
      count: matchIds.length,
      totalRounds: rounds.length,
      isTeamCategory,
    });

    // Update tournament with rounds and standings
    await this.tournamentRepo.updateById(
      String(tournament._id),
      {
        rounds,
        standings: this.initializeStandings(participantIds),
      } as any,
      session
    );

    return {
      totalMatches: matchIds.length,
      totalRounds: rounds.length,
    };
  }

  /**
   * Build team info structure for TeamMatch from team data
   */
  private buildTeamInfo(teamData: any): any {
    return {
      _id: teamData._id,
      name: teamData.name,
      logo: teamData.logo,
      captain: teamData.captain,
      players: teamData.players || [],
      assignments: teamData.assignments || {},
      city: teamData.city,
      stats: {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        gamesWon: 0,
        gamesLost: 0,
      },
    };
  }

  /**
   * Generate subMatches based on match format and team assignments
   * If teams don't have assignments, generates placeholder subMatches with null players
   * 
   * Position mapping follows ITTF convention:
   * - Team 1 (home): uses positions A, B, C
   * - Team 2 (away): uses positions X, Y, Z
   * 
   * Both teams internally assign players to A, B, C positions.
   * When generating matches, team2's positions are auto-mapped: A→X, B→Y, C→Z
   */
  private generateSubMatches(
    matchFormat: string,
    team1Data: any,
    team2Data: any,
    setsPerSubMatch: number
  ): any[] {
    const team1Assignments = team1Data.assignments || {};
    const team2Assignments = team2Data.assignments || {};

    // Build position maps from assignments (playerId -> position mapping needs to be inverted)
    // Team 1: A, B, C positions (home team)
    const team1PositionMap = new Map<string, string>();
    for (const [playerId, position] of Object.entries(team1Assignments)) {
      if (position) {
        team1PositionMap.set(position as string, playerId);
      }
    }

    // Team 2: Map A→X, B→Y, C→Z (away team)
    // Teams internally use A, B, C but for match purposes they become X, Y, Z
    const positionMapping: Record<string, string> = { A: "X", B: "Y", C: "Z" };
    const team2PositionMap = new Map<string, string>();
    for (const [playerId, position] of Object.entries(team2Assignments)) {
      if (position) {
        const mappedPosition = positionMapping[position as string] || (position as string);
        team2PositionMap.set(mappedPosition, playerId);
      }
    }

    const subMatches: any[] = [];

    if (matchFormat === "five_singles") {
      // Swaythling format: A-X, B-Y, C-Z, A-Y, B-X
      const order = [
        ["A", "X"],
        ["B", "Y"],
        ["C", "Z"],
        ["A", "Y"],
        ["B", "X"],
      ];

      order.forEach((pair, index) => {
        const playerTeam1 = team1PositionMap.get(pair[0]) || null;
        const playerTeam2 = team2PositionMap.get(pair[1]) || null;

        // Always create the subMatch structure, even with null players (TBD)
        subMatches.push({
          matchNumber: index + 1,
          matchType: "singles",
          playerTeam1,
          playerTeam2,
          numberOfSets: setsPerSubMatch,
          games: [],
          finalScore: { team1Sets: 0, team2Sets: 0 },
          winnerSide: null,
          status: "scheduled",
          completed: false,
        });
      });
    } else if (matchFormat === "single_double_single") {
      // Single-Double-Single format
      const playerA = team1PositionMap.get("A") || null;
      const playerB = team1PositionMap.get("B") || null;
      const playerX = team2PositionMap.get("X") || null;
      const playerY = team2PositionMap.get("Y") || null;

      // Match 1: A vs X (singles)
      subMatches.push({
        matchNumber: 1,
        matchType: "singles",
        playerTeam1: playerA,
        playerTeam2: playerX,
        numberOfSets: setsPerSubMatch,
        games: [],
        finalScore: { team1Sets: 0, team2Sets: 0 },
        winnerSide: null,
        status: "scheduled",
        completed: false,
      });

      // Match 2: AB vs XY (doubles)
      subMatches.push({
        matchNumber: 2,
        matchType: "doubles",
        playerTeam1: playerA && playerB ? [playerA, playerB] : [],
        playerTeam2: playerX && playerY ? [playerX, playerY] : [],
        numberOfSets: setsPerSubMatch,
        games: [],
        finalScore: { team1Sets: 0, team2Sets: 0 },
        winnerSide: null,
        status: "scheduled",
        completed: false,
      });

      // Match 3: B vs Y (singles)
      subMatches.push({
        matchNumber: 3,
        matchType: "singles",
        playerTeam1: playerB,
        playerTeam2: playerY,
        numberOfSets: setsPerSubMatch,
        games: [],
        finalScore: { team1Sets: 0, team2Sets: 0 },
        winnerSide: null,
        status: "scheduled",
        completed: false,
      });
    }
    // For custom format, subMatches would need custom configuration

    return subMatches;
  }

  /**
   * Generate group matches
   */
  private async generateGroupMatches(
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
    // Implementation similar to generateSingleRoundRobin but with groups
    // This is a simplified version - full implementation would handle groups
    throw new Error(
      "Group match generation via orchestrator not yet fully implemented"
    );
  }

  /**
   * Generate knockout matches
   */
  private async generateKnockoutMatches(
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<KnockoutBracket> {
    const allowCustomMatching =
      (tournament as any).knockoutConfig?.allowCustomMatching === true;

    // Generate bracket structure
    const bracket = generateKnockoutBracket(
      participantIds,
      seeding.map((s) => ({
        participant: s.participant.toString(),
        seedNumber: s.seedNumber,
      })),
      {
        thirdPlaceMatch:
          (tournament as any).knockoutConfig?.thirdPlaceMatch || false,
        scheduledDate: tournament.startDate,
        skipByeAdvancement: allowCustomMatching,
      }
    );

    bracket.rounds.forEach((round, idx) => {});

    // Create or update BracketState
    const bracketState = await createOrUpdateBracketState(
      String(tournament._id),
      bracket,
      session
    );

    // Also store bracket directly in tournament for easier access
    // Update the tournament object directly and save it
    (tournament as any).bracket = bracket;
    (tournament as any).markModified("bracket");
    if (session) {
      await tournament.save({ session });
    } else {
      await tournament.save();
    }

    // Create match documents if not in custom matching mode
    if (!allowCustomMatching) {
      const isTeamCategory = (tournament as any).category === "team";

      for (const round of bracket.rounds) {
        for (const bracketMatch of round.matches) {
          if (
            bracketMatch.participant1 &&
            bracketMatch.participant2 &&
            !bracketMatch.completed
          ) {
            if (isTeamCategory) {
              // Create team match using helper function
              const match = await createBracketTeamMatch(
                bracketMatch,
                tournament,
                scorerId
              );

              if (match) {
                bracketMatch.matchId = String(match._id);
              }
            } else {
              const match = await this.matchRepo.createIndividualMatch(
                {
                  tournament: String(tournament._id),
                  matchType: (tournament as any).matchType,
                  numberOfSets: tournament.rules.setsPerMatch,
                  participants: [
                    bracketMatch.participant1,
                    bracketMatch.participant2,
                  ],
                  scorer: scorerId, // Set scorer so organizer can start matches
                  bracketPosition: bracketMatch.bracketPosition,
                  roundName: bracketMatch.roundName,
                  city: tournament.city,
                  venue: tournament.venue,
                },
                session
              );

              bracketMatch.matchId = String(match._id);
            }
          }
        }
      }

      // Update bracket state with match IDs
      await createOrUpdateBracketState(
        String(tournament._id),
        bracket,
        session
      );

      // Update tournament bracket with match IDs
      (tournament as any).bracket = bracket;
      (tournament as any).markModified("bracket");
      if (session) {
        await tournament.save({ session });
      } else {
        await tournament.save();
      }
    }

    return bracket;
  }

  /**
   * Get doubles participants
   */
  private getDoublesParticipants(
    pairing: any,
    participantIds: string[]
  ): any[] {
    const team1Idx = participantIds.findIndex(
      (id: any) => id === pairing.player1.toString()
    );
    const team2Idx = participantIds.findIndex(
      (id: any) => id === pairing.player2.toString()
    );

    return [
      participantIds[team1Idx],
      participantIds[team1Idx + 1],
      participantIds[team2Idx],
      participantIds[team2Idx + 1],
    ];
  }

  /**
   * Initialize standings
   */
  private initializeStandings(participantIds: string[]) {
    return participantIds.map((pId: string) => ({
      participant: pId,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      pointsScored: 0,
      pointsConceded: 0,
      pointsDiff: 0,
      points: 0,
      rank: 0,
      form: [],
      headToHead: new Map(),
    }));
  }

  /**
   * Calculate tournament statistics
   */
  private calculateStats(tournament: Tournament): {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  } {
    if (tournament.format === "knockout") {
      // For knockout, stats come from bracket
      const bracket = (tournament as any).bracket;

      if (!bracket) {
        return {
          totalMatches: 0,
          totalRounds: 0,
          format: "knockout",
        };
      }

      // Count matches from all rounds in the bracket
      let totalMatches = 0;
      if (bracket.rounds && Array.isArray(bracket.rounds)) {
        totalMatches = bracket.rounds.reduce((sum: number, round: any) => {
          const matchCount = round.matches?.length || 0;

          return sum + matchCount;
        }, 0);
      }

      // Add third place match if it exists
      if (bracket.thirdPlaceMatch) {
        totalMatches += 1;
      }

      return {
        totalMatches,
        totalRounds: bracket.rounds?.length || 0,
        format: "knockout",
      };
    }

    if (tournament.format === "hybrid") {
      // For hybrid tournaments, count matches from both phases
      let totalMatches = 0;
      let totalRounds = 0;

      // Count round-robin phase matches
      if (
        (tournament as any).hybridConfig?.roundRobinUseGroups &&
        tournament.groups
      ) {
        totalMatches += tournament.groups.reduce(
          (sum: number, g: any) =>
            sum +
            g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
          0
        );
        totalRounds += tournament.groups[0]?.rounds.length || 0;
      } else if (tournament.rounds) {
        totalMatches += tournament.rounds.reduce(
          (sum: number, r: any) => sum + r.matches.length,
          0
        );
        totalRounds += tournament.rounds.length;
      }

      // Count knockout phase matches if they exist
      const bracket = (tournament as any).bracket;
      if (bracket?.rounds && Array.isArray(bracket.rounds)) {
        totalMatches += bracket.rounds.reduce(
          (sum: number, round: any) => sum + (round.matches?.length || 0),
          0
        );
        totalRounds += bracket.rounds.length;

        // Add third place match if it exists
        if (bracket.thirdPlaceMatch) {
          totalMatches += 1;
        }
      }

      return {
        totalMatches,
        totalRounds,
        groups: (tournament as any).hybridConfig?.roundRobinNumberOfGroups,
        format: "hybrid",
      };
    }

    if (tournament.useGroups && tournament.groups) {
      const totalMatches = tournament.groups.reduce(
        (sum: number, g: any) =>
          sum + g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
        0
      );
      return {
        totalMatches,
        totalRounds: tournament.groups[0]?.rounds.length || 0,
        groups: tournament.numberOfGroups,
        format: "round_robin_groups",
      };
    }

    const totalMatches = tournament.rounds.reduce(
      (sum: number, r: any) => sum + r.matches.length,
      0
    );
    return {
      totalMatches,
      totalRounds: tournament.rounds.length,
      format: "round_robin",
    };
  }
}

// Singleton instance
export const matchGenerationOrchestrator = new MatchGenerationOrchestrator();
