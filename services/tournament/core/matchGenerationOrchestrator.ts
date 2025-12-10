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
import { tournamentRepository, Tournament } from "../repositories/TournamentRepository";
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
import { createBracketMatch, createBracketTeamMatch } from "./matchGenerationService";
import { KnockoutBracket } from "@/types/tournamentDraw";

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
      const participantIds = tournament.participants.map((p: any) => p.toString());
      const seeding = prepareSeeding(tournament, participantIds);

      // Update tournament seeding
      await this.tournamentRepo.updateSeeding(tournamentId, seeding, session);

      // Generate matches based on format and store bracket reference for stats
      let generatedBracket: any = null;

      if (tournament.format === "hybrid") {
        // For hybrid, only generate round-robin phase initially
        const { generateHybridRoundRobinPhase } = await import("./hybridMatchGenerationService");
        await generateHybridRoundRobinPhase(tournament, {
          scorerId: new (await import("mongoose")).Types.ObjectId(scorerId),
          ...options,
          session,
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
      await this.tournamentRepo.markDrawGenerated(tournamentId, scorerId, session);
      await this.tournamentRepo.updateStatus(tournamentId, "upcoming", session);

      // Calculate stats from the generated bracket/matches
      // We need to do this before the transaction completes since bracket virtual won't be populated yet
      const stats = this.calculateStatsFromGeneration(tournament, generatedBracket);
      console.log("[generateTournamentDraw] Stats calculated from generation:", stats);

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
  private calculateStatsFromGeneration(tournament: Tournament, bracket?: any): {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  } {
    if (tournament.format === "knockout" && bracket) {
      // Use the bracket object that was created during generation
      console.log("[calculateStatsFromGeneration] Using generated bracket for stats");
      console.log("[calculateStatsFromGeneration] Bracket rounds:", bracket.rounds?.length || 0);

      let totalMatches = 0;
      if (bracket.rounds && Array.isArray(bracket.rounds)) {
        totalMatches = bracket.rounds.reduce(
          (sum: number, round: any) => {
            const matchCount = round.matches?.length || 0;
            console.log(`[calculateStatsFromGeneration] Round ${round.roundNumber}: ${matchCount} matches`);
            return sum + matchCount;
          },
          0
        );
      }

      // Add third place match if it exists
      if (bracket.thirdPlaceMatch) {
        totalMatches += 1;
      }

      console.log("[calculateStatsFromGeneration] Total matches:", totalMatches);

      return {
        totalMatches,
        totalRounds: bracket.rounds?.length || 0,
        format: "knockout",
      };
    }

    if (tournament.format === "knockout") {
      // Fallback if bracket wasn't provided
      console.warn("[calculateStatsFromGeneration] No bracket provided for knockout tournament");
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
  ): Promise<void> {
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
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<void> {
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
      String(tournament._id),
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
    tournament: Tournament,
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
    tournament: Tournament,
    participantIds: string[],
    seeding: any[],
    scorerId: string,
    options: MatchGenerationOptions,
    session: ClientSession
  ): Promise<KnockoutBracket> {
    const allowCustomMatching = (tournament as any).knockoutConfig?.allowCustomMatching === true;

    console.log(`[generateKnockoutMatches] Custom matching: ${allowCustomMatching}, Participants: ${participantIds.length}`);

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

    console.log(`[generateKnockoutMatches] Bracket created - Size: ${bracket.size}, Rounds: ${bracket.rounds.length}`);
    bracket.rounds.forEach((round, idx) => {
      console.log(`[generateKnockoutMatches] Round ${idx + 1} (${round.roundName}): ${round.matches.length} matches`);
    });

    // Create or update BracketState
    const bracketState = await createOrUpdateBracketState(String(tournament._id), bracket, session);
    console.log(`[generateKnockoutMatches] BracketState saved with ID: ${bracketState._id}`);

    // Also store bracket directly in tournament for easier access
    // Update the tournament object directly and save it
    (tournament as any).bracket = bracket;
    (tournament as any).markModified('bracket');
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
                  participants: [bracketMatch.participant1, bracketMatch.participant2],
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
      await createOrUpdateBracketState(String(tournament._id), bracket, session);
      
      // Update tournament bracket with match IDs
      (tournament as any).bracket = bracket;
      (tournament as any).markModified('bracket');
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
  private calculateStats(tournament: Tournament): {
    totalMatches: number;
    totalRounds: number;
    groups?: number;
    format: string;
  } {
    if (tournament.format === "knockout") {
      // For knockout, stats come from bracket
      const bracket = (tournament as any).bracket;
      console.log("[calculateStats] Bracket exists:", !!bracket);
      console.log("[calculateStats] Bracket rounds:", bracket?.rounds?.length || 0);

      if (!bracket) {
        console.log("[calculateStats] No bracket found, returning 0 matches");
        return {
          totalMatches: 0,
          totalRounds: 0,
          format: "knockout",
        };
      }

      // Count matches from all rounds in the bracket
      let totalMatches = 0;
      if (bracket.rounds && Array.isArray(bracket.rounds)) {
        totalMatches = bracket.rounds.reduce(
          (sum: number, round: any) => {
            const matchCount = round.matches?.length || 0;
            console.log(`[calculateStats] Round ${round.roundNumber}: ${matchCount} matches`);
            return sum + matchCount;
          },
          0
        );
      }

      // Add third place match if it exists
      if (bracket.thirdPlaceMatch) {
        totalMatches += 1;
      }

      console.log("[calculateStats] Total matches calculated:", totalMatches);

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
      if ((tournament as any).hybridConfig?.roundRobinUseGroups && tournament.groups) {
        totalMatches += tournament.groups.reduce(
          (sum: number, g: any) =>
            sum + g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
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

