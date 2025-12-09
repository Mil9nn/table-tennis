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

import { ClientSession } from "mongoose";
import { TransactionManager } from "@/services/database/TransactionManager";
import { tournamentRepository } from "../repositories/TournamentRepository";
import { matchRepository } from "../repositories/MatchRepository";
import { ITournament } from "@/models/Tournament";
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
import { createBracketMatch, createBracketTeamMatch } from "./matchGenerationService";
import { KnockoutBracket } from "@/types/tournamentDraw";

export interface MatchGenerationOptions {
  courtsAvailable?: number;
  matchDuration?: number; // in minutes
}

export interface MatchGenerationResult {
  tournament: ITournament;
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
      const participantIds = tournament.participants.map((p: any) => p.toString());
      const seeding = prepareSeeding(tournament, participantIds);

      // Update tournament seeding
      await this.tournamentRepo.updateSeeding(tournamentId, seeding, session);

      // Generate matches based on format
      if (tournament.format === "hybrid") {
        // For hybrid, only generate round-robin phase initially
        const { generateHybridRoundRobinPhase } = await import("./hybridMatchGenerationService");
        await generateHybridRoundRobinPhase(tournament, {
          scorerId: new (await import("mongoose")).Types.ObjectId(scorerId),
          ...options,
        });
      } else if (tournament.format === "round_robin") {
        await this.generateRoundRobinMatches(
          tournament,
          participantIds,
          seeding,
          scorerId,
          options,
          session
        );
      } else if (tournament.format === "knockout") {
        await this.generateKnockoutMatches(
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
      await this.tournamentRepo.markDrawGenerated(tournamentId, scorerId, session);
      await this.tournamentRepo.updateStatus(tournamentId, "upcoming", session);

      // Reload tournament with populated data
      const updatedTournament = await this.tournamentRepo.findByIdPopulated(tournamentId);
      if (!updatedTournament) {
        throw new Error("Failed to reload tournament after generation");
      }

      // Calculate stats
      const stats = this.calculateStats(updatedTournament);

      return {
        tournament: updatedTournament,
        stats,
      };
    });
  }

  /**
   * Generate round-robin matches
   */
  private async generateRoundRobinMatches(
    tournament: ITournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";

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
    } else {
      // Generate single round-robin
      await this.generateSingleRoundRobin(
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
    tournament: ITournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";

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

    const rounds: any[] = [];
    const matchIds: string[] = [];

    for (const round of schedule) {
      for (const pairing of round.matches) {
        if ((tournament as any).category === "team") {
          // TODO: Implement team match creation via repository
          throw new Error("Team match generation via orchestrator not yet implemented");
        } else {
          // Get match participants
          const matchParticipants = isDoubles
            ? this.getDoublesParticipants(pairing, participantIds)
            : [pairing.player1, pairing.player2];

          const match = await this.matchRepo.createIndividualMatch(
            {
              tournament: tournament._id.toString(),
              matchType: tournament.matchType,
              numberOfSets: tournament.rules.setsPerMatch,
              participants: matchParticipants.map((p: any) => p.toString()),
              scorer: scorerId, // Set scorer so organizer can start matches
              city: tournament.city,
              venue: tournament.venue,
            },
            session
          );

          matchIds.push(match._id.toString());
        }
      }

      rounds.push({
        roundNumber: round.roundNumber,
        matches: matchIds.slice(-round.matches.length), // Get matches for this round
        matchModel: "IndividualMatch",
        completed: false,
        scheduledDate: round.scheduledDate,
      });
    }

    // Update tournament with rounds and standings
    await this.tournamentRepo.updateById(
      tournament._id.toString(),
      {
        rounds,
        standings: this.initializeStandings(participantIds),
      } as any,
      session
    );
  }

  /**
   * Generate group matches
   */
  private async generateGroupMatches(
    tournament: ITournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
    // Implementation similar to generateSingleRoundRobin but with groups
    // This is a simplified version - full implementation would handle groups
    throw new Error("Group match generation via orchestrator not yet fully implemented");
  }

  /**
   * Generate knockout matches
   */
  private async generateKnockoutMatches(
    tournament: ITournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
    const allowCustomMatching = (tournament as any).knockoutConfig?.allowCustomMatching === true;

    // Generate bracket structure
    const bracket = generateKnockoutBracket(
      participantIds,
      seeding.map((s) => ({
        participant: s.participant.toString(),
        seedNumber: s.seedNumber,
      })),
      {
        thirdPlaceMatch: (tournament as any).knockoutConfig?.thirdPlaceMatch || false,
        scheduledDate: tournament.startDate,
        skipByeAdvancement: allowCustomMatching,
      }
    );

    // Create or update BracketState
    await createOrUpdateBracketState(tournament._id.toString(), bracket, session);

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
              // TODO: Implement team match creation
              throw new Error("Team bracket match creation not yet implemented");
            } else {
              const match = await this.matchRepo.createIndividualMatch(
                {
                  tournament: tournament._id.toString(),
                  matchType: tournament.matchType,
                  numberOfSets: tournament.rules.setsPerMatch,
                  participants: [bracketMatch.participant1, bracketMatch.participant2],
                  scorer: scorerId, // Set scorer so organizer can start matches
                  bracketPosition: bracketMatch.bracketPosition,
                  roundName: bracketMatch.roundName,
                  city: tournament.city,
                  venue: tournament.venue,
                },
                session
              );

              bracketMatch.matchId = match._id.toString();
            }
          }
        }
      }

      // Update bracket state with match IDs
      await createOrUpdateBracketState(tournament._id.toString(), bracket, session);
    }
  }

  /**
   * Get doubles participants
   */
  private getDoublesParticipants(pairing: any, participantIds: string[]): any[] {
    const team1Idx = participantIds.findIndex((id: any) => id === pairing.player1.toString());
    const team2Idx = participantIds.findIndex((id: any) => id === pairing.player2.toString());

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
  private calculateStats(tournament: ITournament): {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  } {
    if (tournament.format === "knockout") {
      // For knockout, stats come from bracket
      return {
        totalMatches: 0, // TODO: Calculate from bracket
        totalRounds: 0,
        format: "knockout",
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

