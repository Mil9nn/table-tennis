// services/tournament/core/BracketProgressionServiceV2.ts
/**
 * Bracket Progression Service V2 - REFACTORED
 *
 * Uses BracketState model and transactions instead of in-memory bracket objects.
 * This is the new architecture - gradually migrate from bracketProgressionService.ts
 *
 * Key Changes:
 * - Uses BracketState model (automatic change tracking)
 * - Transaction support for atomicity
 * - Repository pattern (decoupled from models)
 * - Race condition protection with retries
 */

import { ClientSession } from "mongoose";
import BracketState, { IBracketState } from "@/models/BracketState";
import { TransactionManager } from "@/services/database/TransactionManager";
import { MatchRepository } from "../repositories/MatchRepository";
import { TournamentRepository } from "../repositories/TournamentRepository";
import { BracketMatch } from "@/types/tournamentDraw";

export interface BracketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class BracketProgressionServiceV2 {
  constructor(
    private txManager: TransactionManager,
    private matchRepo: MatchRepository,
    private tournamentRepo: TournamentRepository
  ) {}

  /**
   * Update bracket after match completion - Main entry point
   * Everything happens in a transaction for atomicity
   */
  async updateBracketAfterMatch(
    tournamentId: string,
    matchId: string,
    winnerId: string
  ): Promise<IBracketState> {
    return this.txManager.executeWithRetry(async (session) => {
      // Load bracket state
      const bracketState = await BracketState.findOne({ tournament: tournamentId }).session(session);

      if (!bracketState) {
        throw new Error('Bracket state not found for tournament');
      }

      // Find the match in bracket
      let foundMatch: BracketMatch | null = null;
      let roundNumber: number | null = null;

      for (const round of bracketState.rounds) {
        const match = round.matches.find(m => m.matchId === matchId);
        if (match) {
          foundMatch = match;
          roundNumber = round.roundNumber;
          break;
        }
      }

      // Check third place match
      if (!foundMatch && bracketState.thirdPlaceMatch?.matchId === matchId) {
        foundMatch = bracketState.thirdPlaceMatch;
        foundMatch.winner = winnerId;
        foundMatch.completed = true;
        await bracketState.save({ session });
        return bracketState;
      }

      if (!foundMatch || roundNumber === null) {
        throw new Error(`Match ${matchId} not found in bracket`);
      }

      // Advance winner to next round
      await this.advanceWinner(bracketState, roundNumber, foundMatch.bracketPosition.matchNumber, winnerId);

      // Auto-populate third place match if needed
      await this.maybePopulateThirdPlaceMatch(bracketState, roundNumber);

      // Create match documents for newly ready matches
      await this.createMatchDocumentsForReadyMatches(bracketState, tournamentId, session);

      // Save bracket state (Mongoose auto-tracks changes, no markModified needed!)
      await bracketState.save({ session });

      return bracketState;
    }, 3, 100); // 3 retries with exponential backoff
  }

  /**
   * Advance winner to next round
   */
  private advanceWinner(
    bracketState: IBracketState,
    roundNumber: number,
    matchNumber: number,
    winnerId: string
  ): void {
    const currentRound = bracketState.rounds.find(r => r.roundNumber === roundNumber);

    if (!currentRound) {
      throw new Error(`Round ${roundNumber} not found`);
    }

    const currentMatch = currentRound.matches.find(
      m => m.bracketPosition.matchNumber === matchNumber
    );

    if (!currentMatch) {
      throw new Error(`Match ${matchNumber} not found in round ${roundNumber}`);
    }

    // Verify winner is a participant
    if (
      winnerId !== currentMatch.participant1?.toString() &&
      winnerId !== currentMatch.participant2?.toString()
    ) {
      throw new Error('Winner is not a participant in this match');
    }

    // Mark match as completed
    currentMatch.winner = winnerId;
    currentMatch.completed = true;

    // If final round, mark bracket as complete
    if (roundNumber === bracketState.rounds.length) {
      bracketState.completed = true;
      return;
    }

    // Find next match
    const nextRoundNumber = roundNumber + 1;
    const nextMatchNumber = currentMatch.bracketPosition.nextMatchNumber;

    if (!nextMatchNumber) {
      throw new Error('No next match number defined');
    }

    const nextRound = bracketState.rounds.find(r => r.roundNumber === nextRoundNumber);
    if (!nextRound) {
      throw new Error(`Next round ${nextRoundNumber} not found`);
    }

    const nextMatch = nextRound.matches.find(
      m => m.bracketPosition.matchNumber === nextMatchNumber
    );

    if (!nextMatch) {
      throw new Error(`Next match ${nextMatchNumber} not found`);
    }

    // Place winner (odd matches → participant1, even → participant2)
    if (matchNumber % 2 === 1) {
      nextMatch.participant1 = winnerId;
    } else {
      nextMatch.participant2 = winnerId;
    }

    // Check if round is complete
    currentRound.completed = currentRound.matches.every(m => m.completed);

    // Advance current round if complete
    if (currentRound.completed) {
      bracketState.currentRound = nextRoundNumber;
    }
  }

  /**
   * Auto-populate third place match if semi-finals completed
   */
  private maybePopulateThirdPlaceMatch(
    bracketState: IBracketState,
    completedRoundNumber: number
  ): void {
    // Only if third place match exists
    if (!bracketState.thirdPlaceMatch) {
      return;
    }

    // Only if we just completed semi-finals
    const semiFinalRoundNumber = bracketState.rounds.length - 1;
    if (completedRoundNumber !== semiFinalRoundNumber) {
      return;
    }

    const semiFinalRound = bracketState.rounds.find(r => r.roundNumber === semiFinalRoundNumber);
    if (!semiFinalRound || !semiFinalRound.completed) {
      return;
    }

    // Collect losers from semi-finals
    const losers: string[] = [];
    for (const match of semiFinalRound.matches) {
      if (match.completed && match.winner) {
        const loser = this.getMatchLoser(match);
        if (loser) {
          losers.push(loser);
        }
      }
    }

    // Populate third place match if we have exactly 2 losers
    if (losers.length === 2) {
      bracketState.thirdPlaceMatch.participant1 = losers[0];
      bracketState.thirdPlaceMatch.participant2 = losers[1];
    }
  }

  /**
   * Create match documents for matches that now have both participants
   */
  private async createMatchDocumentsForReadyMatches(
    bracketState: IBracketState,
    tournamentId: string,
    session: ClientSession
  ): Promise<void> {
    // Get matches needing documents
    const readyMatches = bracketState.getMatchesNeedingDocuments();

    if (readyMatches.length === 0) {
      return;
    }

    // Fetch tournament to determine category and settings
    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Create match documents
    for (const bracketMatch of readyMatches) {
      if (tournament.category === 'individual') {
        const match = await this.matchRepo.createIndividualMatch({
          tournament: tournamentId,
          matchType: (tournament as any).matchType,
          numberOfSets: tournament.rules.setsPerMatch,
          participants: [bracketMatch.participant1!, bracketMatch.participant2!],
          bracketPosition: bracketMatch.bracketPosition,
          roundName: bracketMatch.roundName,
          isThirdPlaceMatch: bracketMatch.isThirdPlaceMatch,
          city: tournament.city,
          venue: tournament.venue
        }, session);

        // Update bracket with matchId
        bracketMatch.matchId = (match._id as any).toString();
      } else {
        // Use createBracketTeamMatch helper which properly fetches team data
        const { createBracketTeamMatch } = await import('./matchGenerationService');
        const match = await createBracketTeamMatch(
          bracketMatch,
          tournament,
          tournament.organizer.toString()
        );

        if (match) {
          bracketMatch.matchId = (match._id as any).toString();
        }
      }
    }
  }

  /**
   * Get loser of a match
   */
  private getMatchLoser(match: BracketMatch): string | null {
    if (!match.completed || !match.winner) {
      return null;
    }

    if (match.winner === match.participant1) {
      return match.participant2;
    }

    return match.participant1;
  }

  /**
   * Get pending matches (both participants known, not completed)
   */
  async getPendingMatches(tournamentId: string): Promise<BracketMatch[]> {
    const bracketState = await BracketState.findOne({ tournament: tournamentId });

    if (!bracketState) {
      return [];
    }

    return bracketState.pendingMatches;
  }

  /**
   * Get bracket winner
   */
  async getBracketWinner(tournamentId: string): Promise<string | null> {
    const bracketState = await BracketState.findOne({ tournament: tournamentId });

    if (!bracketState) {
      return null;
    }

    return bracketState.bracketWinner;
  }

  /**
   * Validate bracket integrity
   */
  async validateBracket(tournamentId: string): Promise<BracketValidationResult> {
    const bracketState = await BracketState.findOne({ tournament: tournamentId });

    if (!bracketState) {
      return {
        isValid: false,
        errors: ['Bracket state not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check each round
    for (const round of bracketState.rounds) {
      for (const match of round.matches) {
        // Completed matches must have a winner
        if (match.completed && !match.winner) {
          errors.push(`Match in round ${round.roundNumber} is completed but has no winner`);
        }

        // Matches with both participants should have a matchId
        if (match.participant1 && match.participant2 && !match.matchId) {
          warnings.push(`Match in round ${round.roundNumber} has participants but no match document`);
        }
      }
    }

    // Check third place match
    if (bracketState.thirdPlaceMatch) {
      if (bracketState.thirdPlaceMatch.completed && !bracketState.thirdPlaceMatch.winner) {
        errors.push('Third place match is completed but has no winner');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Repair bracket - attempt to fix common issues
   */
  async repairBracket(tournamentId: string): Promise<IBracketState> {
    return this.txManager.executeInTransaction(async (session) => {
      const bracketState = await BracketState.findOne({ tournament: tournamentId }).session(session);

      if (!bracketState) {
        throw new Error('Bracket state not found');
      }

      // Find and process completed matches that haven't advanced winners
      for (let roundIndex = 0; roundIndex < bracketState.rounds.length - 1; roundIndex++) {
        const round = bracketState.rounds[roundIndex];

        for (const match of round.matches) {
          if (match.completed && match.winner && match.bracketPosition.nextMatchNumber) {
            const nextRound = bracketState.rounds[roundIndex + 1];
            const nextMatch = nextRound.matches.find(
              m => m.bracketPosition.matchNumber === match.bracketPosition.nextMatchNumber
            );

            if (nextMatch) {
              // Check if winner is already advanced
              const winnerInNextMatch =
                nextMatch.participant1 === match.winner ||
                nextMatch.participant2 === match.winner;

              // If not advanced, advance now
              if (!winnerInNextMatch) {
                if (match.bracketPosition.matchNumber % 2 === 1) {
                  nextMatch.participant1 = match.winner;
                } else {
                  nextMatch.participant2 = match.winner;
                }
              }
            }
          }
        }
      }

      await bracketState.save({ session });
      return bracketState;
    });
  }

  /**
   * Get current round matches
   */
  async getCurrentRoundMatches(tournamentId: string): Promise<BracketMatch[]> {
    const bracketState = await BracketState.findOne({ tournament: tournamentId });

    if (!bracketState) {
      return [];
    }

    const currentRound = bracketState.rounds.find(
      r => r.roundNumber === bracketState.currentRound
    );

    return currentRound?.matches || [];
  }
}

// Factory function
export function createBracketProgressionServiceV2(): BracketProgressionServiceV2 {
  const txManager = new TransactionManager();
  const matchRepo = new MatchRepository();
  const tournamentRepo = new TournamentRepository();
  return new BracketProgressionServiceV2(txManager, matchRepo, tournamentRepo);
}

// Singleton for convenience
export const bracketProgressionServiceV2 = createBracketProgressionServiceV2();
