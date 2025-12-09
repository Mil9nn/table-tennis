// services/tournament/MatchGenerationOrchestrator.ts
import { TransactionManager } from "../database/TransactionManager";
import { MatchRepository } from "./repositories/MatchRepository";
import { TournamentRepository, Tournament } from "./repositories/TournamentRepository";
import { ITournamentIndividual } from "@/models/TournamentIndividual";
import { ITournamentTeam } from "@/models/TournamentTeam";
import BracketState from "@/models/BracketState";

/**
 * Match Generation Orchestrator
 *
 * Orchestrates the entire match generation process for tournaments.
 * Replaces direct model access with repository pattern.
 *
 * Benefits:
 * - Decoupled from models (uses repositories)
 * - Transaction support for atomicity
 * - Clean, testable architecture
 * - Single responsibility
 */

export interface GenerationResult {
  matchIds: string[];
  stats: {
    totalMatches: number;
    rounds?: number;
    groups?: number;
    format: string;
  };
}

export class MatchGenerationOrchestrator {
  constructor(
    private txManager: TransactionManager,
    private matchRepo: MatchRepository,
    private tournamentRepo: TournamentRepository
  ) {}

  /**
   * Main entry point - Generate matches for any tournament type
   */
  async generateMatches(
    tournamentId: string,
    userId: string
  ): Promise<GenerationResult> {
    return this.txManager.executeInTransaction(async (session) => {
      // Fetch tournament
      const tournament = await this.tournamentRepo.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Validate can generate
      if (tournament.drawGenerated) {
        throw new Error('Draw already generated');
      }

      // Route to appropriate generator based on format
      let result: GenerationResult;

      switch (tournament.format) {
        case 'round_robin':
          result = await this.generateRoundRobinMatches(tournament, session);
          break;

        case 'knockout':
          result = await this.generateKnockoutMatches(tournament, session);
          break;

        case 'hybrid':
          result = await this.generateHybridMatches(tournament, session);
          break;

        default:
          throw new Error(`Unknown tournament format: ${tournament.format}`);
      }

      // Mark draw as generated
      await this.tournamentRepo.markDrawGenerated(tournamentId, userId, session);

      return result;
    });
  }

  /**
   * Generate round-robin matches
   */
  private async generateRoundRobinMatches(
    tournament: Tournament,
    session: any
  ): Promise<GenerationResult> {
    const matchIds: string[] = [];

    if (tournament.category === 'individual') {
      const individualTournament = tournament as ITournamentIndividual;

      // Generate pairings using circle method
      const pairings = this.generateRoundRobinPairings(
        individualTournament.participants.map(p => p.toString())
      );

      // Create matches
      for (let roundIndex = 0; roundIndex < pairings.length; roundIndex++) {
        const roundPairings = pairings[roundIndex];
        const roundMatches: string[] = [];

        for (const pairing of roundPairings) {
          const match = await this.matchRepo.createIndividualMatch({
            tournament: tournament._id.toString(),
            matchType: individualTournament.matchType,
            numberOfSets: tournament.rules.setsPerMatch,
            participants: pairing,
            city: tournament.city,
            venue: tournament.venue
          }, session);

          matchIds.push(match._id.toString());
          roundMatches.push(match._id.toString());
        }

        // Update tournament with round information
        if (!tournament.rounds) {
          tournament.rounds = [];
        }

        tournament.rounds.push({
          roundNumber: roundIndex + 1,
          matches: roundMatches.map(id => id as any),
          completed: false
        });
      }

      // Save tournament with rounds
      await tournament.save({ session });

      return {
        matchIds,
        stats: {
          totalMatches: matchIds.length,
          rounds: pairings.length,
          format: 'round_robin'
        }
      };
    } else {
      // Team tournament
      const teamTournament = tournament as ITournamentTeam;

      const pairings = this.generateRoundRobinPairings(
        teamTournament.participants.map(p => p.toString())
      );

      // Create team matches
      for (let roundIndex = 0; roundIndex < pairings.length; roundIndex++) {
        const roundPairings = pairings[roundIndex];
        const roundMatches: string[] = [];

        for (const pairing of pairings) {
          // Note: Team match creation requires more complex setup
          // This is a simplified version - actual implementation needs team info
          const match = await this.matchRepo.createTeamMatch({
            tournament: tournament._id.toString(),
            matchFormat: teamTournament.teamConfig.matchFormat,
            numberOfSetsPerSubMatch: teamTournament.teamConfig.setsPerSubMatch,
            team1: { /* team1 data */ } as any,
            team2: { /* team2 data */ } as any,
            subMatches: [],
            city: tournament.city,
            venue: tournament.venue
          }, session);

          matchIds.push(match._id.toString());
          roundMatches.push(match._id.toString());
        }

        if (!tournament.rounds) {
          tournament.rounds = [];
        }

        tournament.rounds.push({
          roundNumber: roundIndex + 1,
          matches: roundMatches.map(id => id as any),
          completed: false
        });
      }

      await tournament.save({ session });

      return {
        matchIds,
        stats: {
          totalMatches: matchIds.length,
          rounds: pairings.length,
          format: 'round_robin'
        }
      };
    }
  }

  /**
   * Generate knockout bracket matches
   */
  private async generateKnockoutMatches(
    tournament: Tournament,
    session: any
  ): Promise<GenerationResult> {
    // Import bracket generation service
    const { generateKnockoutBracket } = await import('./core/bracketGenerationService');

    // Get seeded participants
    const participants = tournament.participants.map(p => p.toString());
    const seeding = tournament.seeding || [];

    // Generate bracket structure
    const bracket = generateKnockoutBracket(participants, seeding, {
      thirdPlaceMatch: tournament.knockoutConfig?.thirdPlaceMatch || false,
      allowCustomMatching: tournament.knockoutConfig?.allowCustomMatching || false
    });

    // Create BracketState document
    const bracketState = await BracketState.create([{
      tournament: tournament._id,
      size: bracket.size,
      rounds: bracket.rounds,
      currentRound: 1,
      completed: false,
      thirdPlaceMatch: bracket.thirdPlaceMatch
    }], { session });

    // Create match documents for Round 1 (matches with known participants)
    const matchIds: string[] = [];
    const round1 = bracket.rounds[0];

    if (tournament.category === 'individual') {
      const individualTournament = tournament as ITournamentIndividual;

      for (const bracketMatch of round1.matches) {
        // Only create match if both participants are known (not BYE)
        if (bracketMatch.participant1 && bracketMatch.participant2) {
          const match = await this.matchRepo.createIndividualMatch({
            tournament: tournament._id.toString(),
            matchType: individualTournament.matchType,
            numberOfSets: tournament.rules.setsPerMatch,
            participants: [bracketMatch.participant1, bracketMatch.participant2],
            bracketPosition: bracketMatch.bracketPosition,
            roundName: bracketMatch.roundName,
            isThirdPlaceMatch: bracketMatch.isThirdPlaceMatch,
            city: tournament.city,
            venue: tournament.venue
          }, session);

          matchIds.push(match._id.toString());

          // Update bracket with matchId
          bracketMatch.matchId = match._id.toString();
        }
      }
    } else {
      const teamTournament = tournament as ITournamentTeam;

      for (const bracketMatch of round1.matches) {
        if (bracketMatch.participant1 && bracketMatch.participant2) {
          const match = await this.matchRepo.createTeamMatch({
            tournament: tournament._id.toString(),
            matchFormat: teamTournament.teamConfig.matchFormat,
            numberOfSetsPerSubMatch: teamTournament.teamConfig.setsPerSubMatch,
            team1: { /* team1 data */ } as any,
            team2: { /* team2 data */ } as any,
            subMatches: [],
            bracketPosition: bracketMatch.bracketPosition,
            roundName: bracketMatch.roundName,
            isThirdPlaceMatch: bracketMatch.isThirdPlaceMatch,
            city: tournament.city,
            venue: tournament.venue
          }, session);

          matchIds.push(match._id.toString());
          bracketMatch.matchId = match._id.toString();
        }
      }
    }

    // Save bracket state with updated matchIds
    await bracketState[0].save({ session });

    return {
      matchIds,
      stats: {
        totalMatches: matchIds.length,
        rounds: bracket.rounds.length,
        format: 'knockout'
      }
    };
  }

  /**
   * Generate hybrid tournament matches (round-robin phase only)
   */
  private async generateHybridMatches(
    tournament: Tournament,
    session: any
  ): Promise<GenerationResult> {
    // For hybrid, initially generate only round-robin matches
    // Knockout matches are generated after qualification

    // Set current phase
    tournament.currentPhase = 'round_robin';
    await tournament.save({ session });

    // Generate round-robin matches
    return this.generateRoundRobinMatches(tournament, session);
  }

  /**
   * Helper: Generate round-robin pairings using circle method
   */
  private generateRoundRobinPairings(participants: string[]): string[][] [] {
    const n = participants.length;

    if (n < 2) {
      return [];
    }

    // If odd number, add a "bye"
    const hasbye = n % 2 !== 0;
    const players = [...participants];
    if (hasBye) {
      players.push('BYE');
    }

    const totalPlayers = players.length;
    const rounds: string[][][] = [];

    // Circle method
    for (let round = 0; round < totalPlayers - 1; round++) {
      const roundPairings: string[][] = [];

      for (let match = 0; match < totalPlayers / 2; match++) {
        const home = (round + match) % (totalPlayers - 1);
        let away = (totalPlayers - 1 - match + round) % (totalPlayers - 1);

        if (match === 0) {
          away = totalPlayers - 1;
        }

        // Skip if either player is BYE
        if (players[home] !== 'BYE' && players[away] !== 'BYE') {
          roundPairings.push([players[home], players[away]]);
        }
      }

      if (roundPairings.length > 0) {
        rounds.push(roundPairings);
      }
    }

    return rounds;
  }
}

// Factory function to create orchestrator with dependencies
export function createMatchGenerationOrchestrator(): MatchGenerationOrchestrator {
  const txManager = new TransactionManager();
  const matchRepo = new MatchRepository();
  const tournamentRepo = new TournamentRepository();

  return new MatchGenerationOrchestrator(txManager, matchRepo, tournamentRepo);
}
