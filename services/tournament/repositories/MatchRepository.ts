// services/tournament/repositories/MatchRepository.ts
import mongoose, { ClientSession } from "mongoose";
import Match from "@/models/MatchBase";
import IndividualMatch, { IIndividualMatch } from "@/models/IndividualMatch";
import TeamMatch, { ITeamMatch } from "@/models/TeamMatch";

/**
 * Match Repository
 *
 * Handles all Match-related database operations.
 * Decouples business logic from direct model access.
 *
 * Benefits:
 * - Single responsibility for Match data access
 * - Testable (can mock repository)
 * - Consistent query patterns
 * - Transaction support built-in
 */

export interface CreateIndividualMatchDTO {
  tournament?: string;
  matchType: 'singles' | 'doubles' | 'mixed_doubles';
  numberOfSets: number;
  participants: string[];
  scorer?: string;
  groupId?: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
    nextMatchNumber?: number;
  };
  roundName?: string;
  courtNumber?: number;
  isThirdPlaceMatch?: boolean;
  city?: string;
  venue?: string;
  scheduledDate?: Date;
}

export interface CreateTeamMatchDTO {
  tournament?: string;
  matchFormat: 'five_singles' | 'single_double_single' | 'custom';
  numberOfSetsPerSubMatch: number;
  team1: any; // TeamInfo
  team2: any; // TeamInfo
  subMatches: any[];
  groupId?: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
    nextMatchNumber?: number;
  };
  roundName?: string;
  courtNumber?: number;
  isThirdPlaceMatch?: boolean;
  city?: string;
  venue?: string;
  scheduledDate?: Date;
}

export class MatchRepository {
  /**
   * Create an individual match
   */
  async createIndividualMatch(
    data: CreateIndividualMatchDTO,
    session?: ClientSession
  ): Promise<IIndividualMatch> {
    const matchData: any = {
      matchCategory: 'individual',
      ...data
    };
    
    // Convert scorer string to ObjectId if provided
    if (data.scorer) {
      matchData.scorer = new mongoose.Types.ObjectId(data.scorer);
    }
    
    // Convert participants to ObjectIds
    if (data.participants) {
      matchData.participants = data.participants.map((p: string) => new mongoose.Types.ObjectId(p));
    }
    
    // Convert tournament to ObjectId if provided
    if (data.tournament) {
      matchData.tournament = new mongoose.Types.ObjectId(data.tournament);
    }

    const match = await IndividualMatch.create([matchData], { session });
    return match[0];
  }

  /**
   * Create a team match
   */
  async createTeamMatch(
    data: CreateTeamMatchDTO,
    session?: ClientSession
  ): Promise<ITeamMatch> {
    const match = await TeamMatch.create(
      [{
        matchCategory: 'team',
        ...data
      }],
      { session }
    );
    return match[0];
  }

  /**
   * Bulk create individual matches
   */
  async bulkCreateIndividualMatches(
    matches: CreateIndividualMatchDTO[],
    session?: ClientSession
  ): Promise<IIndividualMatch[]> {
    const docs = matches.map(data => ({
      matchCategory: 'individual' as const,
      ...data
    }));

    return IndividualMatch.insertMany(docs, { session });
  }

  /**
   * Bulk create team matches
   */
  async bulkCreateTeamMatches(
    matches: CreateTeamMatchDTO[],
    session?: ClientSession
  ): Promise<ITeamMatch[]> {
    const docs = matches.map(data => ({
      matchCategory: 'team' as const,
      ...data
    }));

    return TeamMatch.insertMany(docs, { session });
  }

  /**
   * Find match by ID (works for both individual and team)
   */
  async findById(id: string): Promise<(IIndividualMatch | ITeamMatch) | null> {
    return Match.findById(id);
  }

  /**
   * Find individual match by ID
   */
  async findIndividualMatchById(id: string): Promise<IIndividualMatch | null> {
    return IndividualMatch.findById(id);
  }

  /**
   * Find team match by ID
   */
  async findTeamMatchById(id: string): Promise<ITeamMatch | null> {
    return TeamMatch.findById(id);
  }

  /**
   * Find all matches for a tournament
   */
  async findByTournament(
    tournamentId: string,
    options?: {
      status?: string;
      groupId?: string;
      round?: number;
    }
  ): Promise<(IIndividualMatch | ITeamMatch)[]> {
    const query: any = { tournament: tournamentId };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.groupId) {
      query.groupId = options.groupId;
    }

    if (options?.round) {
      query['bracketPosition.round'] = options.round;
    }

    return Match.find(query).sort({ createdAt: 1 });
  }

  /**
   * Find matches by group
   */
  async findByGroup(
    tournamentId: string,
    groupId: string
  ): Promise<(IIndividualMatch | ITeamMatch)[]> {
    return Match.find({
      tournament: tournamentId,
      groupId
    }).sort({ createdAt: 1 });
  }

  /**
   * Find matches by bracket round
   */
  async findByBracketRound(
    tournamentId: string,
    round: number
  ): Promise<(IIndividualMatch | ITeamMatch)[]> {
    return Match.find({
      tournament: tournamentId,
      'bracketPosition.round': round
    }).sort({ 'bracketPosition.matchNumber': 1 });
  }

  /**
   * Find completed matches for tournament
   */
  async findCompletedMatches(tournamentId: string): Promise<(IIndividualMatch | ITeamMatch)[]> {
    return Match.find({
      tournament: tournamentId,
      status: 'completed'
    }).sort({ createdAt: 1 });
  }

  /**
   * Find pending matches (scheduled or in_progress)
   */
  async findPendingMatches(tournamentId: string): Promise<(IIndividualMatch | ITeamMatch)[]> {
    return Match.find({
      tournament: tournamentId,
      status: { $in: ['scheduled', 'in_progress'] }
    }).sort({ createdAt: 1 });
  }

  /**
   * Update match by ID
   */
  async updateById(
    id: string,
    updates: Partial<IIndividualMatch | ITeamMatch>,
    session?: ClientSession
  ): Promise<(IIndividualMatch | ITeamMatch) | null> {
    return Match.findByIdAndUpdate(
      id,
      updates,
      { new: true, session }
    );
  }

  /**
   * Delete match by ID
   */
  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    const result = await Match.findByIdAndDelete(id, { session });
    return !!result;
  }

  /**
   * Delete all matches for a tournament
   */
  async deleteByTournament(
    tournamentId: string,
    session?: ClientSession
  ): Promise<number> {
    const result = await Match.deleteMany(
      { tournament: tournamentId },
      { session }
    );
    return result.deletedCount || 0;
  }

  /**
   * Count matches for tournament
   */
  async countByTournament(
    tournamentId: string,
    options?: {
      status?: string;
      groupId?: string;
    }
  ): Promise<number> {
    const query: any = { tournament: tournamentId };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.groupId) {
      query.groupId = options.groupId;
    }

    return Match.countDocuments(query);
  }

  /**
   * Check if all matches in tournament are completed
   */
  async areAllMatchesCompleted(tournamentId: string): Promise<boolean> {
    const totalMatches = await this.countByTournament(tournamentId);
    const completedMatches = await this.countByTournament(tournamentId, { status: 'completed' });

    return totalMatches > 0 && totalMatches === completedMatches;
  }

  /**
   * Check if all matches in a group are completed
   */
  async areGroupMatchesCompleted(tournamentId: string, groupId: string): Promise<boolean> {
    const totalMatches = await this.countByTournament(tournamentId, { groupId });
    const completedMatches = await this.countByTournament(tournamentId, {
      groupId,
      status: 'completed'
    });

    return totalMatches > 0 && totalMatches === completedMatches;
  }

  /**
   * Check if all matches in a bracket round are completed
   */
  async isRoundCompleted(tournamentId: string, round: number): Promise<boolean> {
    const matches = await this.findByBracketRound(tournamentId, round);
    return matches.length > 0 && matches.every(m => m.status === 'completed');
  }

  /**
   * Find match by bracket position
   */
  async findByBracketPosition(
    tournamentId: string,
    round: number,
    matchNumber: number
  ): Promise<(IIndividualMatch | ITeamMatch) | null> {
    return Match.findOne({
      tournament: tournamentId,
      'bracketPosition.round': round,
      'bracketPosition.matchNumber': matchNumber
    });
  }

  /**
   * Populate match with participant details
   */
  async findByIdWithParticipants(id: string): Promise<(IIndividualMatch | ITeamMatch) | null> {
    const match = await Match.findById(id);

    if (!match) return null;

    if (match.matchCategory === 'individual') {
      return IndividualMatch.findById(id).populate('participants', 'username fullName profileImage');
    } else {
      return TeamMatch.findById(id)
        .populate('team1.players.user', 'username fullName profileImage')
        .populate('team2.players.user', 'username fullName profileImage');
    }
  }

  /**
   * Find casual matches (not tournament matches)
   */
  async findCasualMatches(options?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<(IIndividualMatch | ITeamMatch)[]> {
    const query: any = { tournament: null };

    if (options?.status) {
      query.status = options.status;
    }

    let queryBuilder = Match.find(query).sort({ createdAt: -1 });

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    if (options?.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }

    return queryBuilder;
  }
}

// Singleton instance for convenience
export const matchRepository = new MatchRepository();
