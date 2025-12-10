// services/tournament/repositories/TournamentRepository.ts
import mongoose, { ClientSession } from "mongoose";
import TournamentIndividual, { ITournamentIndividual } from "@/models/TournamentIndividual";
import TournamentTeam, { ITournamentTeam } from "@/models/TournamentTeam";
import BracketState from "@/models/BracketState";

/**
 * Tournament Repository
 *
 * Handles all Tournament-related database operations.
 * Works with both TournamentIndividual and TournamentTeam models.
 *
 * Benefits:
 * - Type-safe tournament operations
 * - Proper ref handling for Individual vs Team
 * - Consistent query patterns
 * - Transaction support
 */

export interface CreateTournamentIndividualDTO {
  name: string;
  format: 'round_robin' | 'knockout' | 'hybrid';
  matchType: 'singles' | 'doubles' | 'mixed_doubles';
  startDate: Date;
  endDate?: Date;
  participants: string[]; // User IDs
  organizer: string; // User ID
  venue: string;
  city: string;
  seedingMethod?: 'manual' | 'ranking' | 'random' | 'none';
  useGroups?: boolean;
  numberOfGroups?: number;
  knockoutConfig?: any;
  hybridConfig?: any;
  rules?: any;
  maxParticipants?: number;
  minParticipants?: number;
}

export interface CreateTournamentTeamDTO {
  name: string;
  format: 'round_robin' | 'knockout' | 'hybrid';
  startDate: Date;
  endDate?: Date;
  participants: string[]; // Team IDs
  organizer: string; // User ID
  venue: string;
  city: string;
  teamConfig: {
    matchFormat: 'five_singles' | 'single_double_single' | 'custom';
    setsPerSubMatch: number;
    customSubMatches?: any[];
  };
  seedingMethod?: 'manual' | 'ranking' | 'random' | 'none';
  useGroups?: boolean;
  numberOfGroups?: number;
  knockoutConfig?: any;
  hybridConfig?: any;
  rules?: any;
  maxParticipants?: number;
  minParticipants?: number;
}

export type Tournament = ITournamentIndividual | ITournamentTeam;

export class TournamentRepository {
  /**
   * Create an individual tournament
   */
  async createIndividual(
    data: CreateTournamentIndividualDTO,
    session?: ClientSession
  ): Promise<ITournamentIndividual> {
    const tournament = await TournamentIndividual.create(
      [{
        category: 'individual',
        ...data
      }],
      { session }
    );
    return tournament[0];
  }

  /**
   * Create a team tournament
   */
  async createTeam(
    data: CreateTournamentTeamDTO,
    session?: ClientSession
  ): Promise<ITournamentTeam> {
    const tournament = await TournamentTeam.create(
      [{
        category: 'team',
        ...data
      }],
      { session }
    );
    return tournament[0];
  }

  /**
   * Find tournament by ID (works for both individual and team)
   */
  async findById(id: string): Promise<Tournament | null> {
    // Try individual first
    let tournament = await TournamentIndividual.findById(id);
    if (tournament) return tournament;

    // Try team
    tournament = await TournamentTeam.findById(id);
    return tournament;
  }

  /**
   * Find individual tournament by ID
   */
  async findIndividualById(id: string): Promise<ITournamentIndividual | null> {
    return TournamentIndividual.findById(id);
  }

  /**
   * Find team tournament by ID
   */
  async findTeamById(id: string): Promise<ITournamentTeam | null> {
    return TournamentTeam.findById(id);
  }

  /**
   * Find tournament by ID with bracket populated
   */
  async findByIdWithBracket(id: string): Promise<Tournament | null> {
    const tournament = await this.findById(id);
    if (!tournament) return null;

    // Populate bracket virtual
    const populated = await (tournament as any).populate('bracket');
    return populated as Tournament;
  }

  /**
   * Find tournament by ID with all relationships populated
   */
  async findByIdPopulated(id: string): Promise<Tournament | null> {
    // Try individual first
    let tournament: Tournament | null = await TournamentIndividual.findById(id)
      .populate('participants', 'username fullName profileImage rank')
      .populate('organizer', 'username fullName profileImage')
      .populate('seeding.participant', 'username fullName profileImage')
      .populate('bracket');

    if (tournament) return tournament;

    // Try team
    tournament = (await TournamentTeam.findById(id)
      .populate({
        path: 'participants',
        select: 'name logo captain players',
        populate: {
          path: 'captain players.user',
          select: 'username fullName profileImage'
        }
      })
      .populate('organizer', 'username fullName profileImage')
      .populate('bracket')) as Tournament | null;

    return tournament;
  }

  /**
   * List tournaments with filters
   */
  async list(options?: {
    status?: string;
    format?: string;
    category?: string;
    city?: string;
    organizer?: string;
    search?: string;
    limit?: number;
    skip?: number;
    sort?: string;
  }): Promise<Tournament[]> {
    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.format) {
      query.format = options.format;
    }

    if (options?.city) {
      query.city = options.city;
    }

    if (options?.organizer) {
      query.organizer = options.organizer;
    }

    if (options?.search) {
      query.name = { $regex: options.search, $options: 'i' };
    }

    let sortCriteria: any = { startDate: -1 }; // Default: newest first

    if (options?.sort === 'upcoming') {
      sortCriteria = { startDate: 1 };
    } else if (options?.sort === 'name') {
      sortCriteria = { name: 1 };
    }

    // Query both collections if category not specified
    if (!options?.category || options.category === 'individual') {
      const individualTournaments = await TournamentIndividual.find(query)
        .limit(options?.limit || 100)
        .skip(options?.skip || 0)
        .sort(sortCriteria);

      if (options?.category === 'individual') {
        return individualTournaments;
      }

      // If no category specified, also get team tournaments
      if (!options?.category) {
        const teamTournaments = await TournamentTeam.find(query)
          .limit(options?.limit || 100)
          .skip(options?.skip || 0)
          .sort(sortCriteria);

        // Combine and sort
        return [...individualTournaments, ...teamTournaments].sort((a, b) => {
          if (sortCriteria.startDate === 1) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          return b.startDate.getTime() - a.startDate.getTime();
        });
      }

      return individualTournaments;
    }

    // Category is 'team'
    return TournamentTeam.find(query)
      .limit(options?.limit || 100)
      .skip(options?.skip || 0)
      .sort(sortCriteria);
  }

  /**
   * Find tournament by join code
   */
  async findByJoinCode(joinCode: string): Promise<Tournament | null> {
    // Try individual first
    let tournament = await TournamentIndividual.findOne({ joinCode });
    if (tournament) return tournament;

    // Try team
    tournament = await TournamentTeam.findOne({ joinCode });
    return tournament;
  }

  /**
   * Update tournament by ID
   */
  async updateById(
    id: string,
    updates: Partial<Tournament>,
    session?: ClientSession
  ): Promise<Tournament | null> {
    // Try individual first
    let tournament = await TournamentIndividual.findByIdAndUpdate(
      id,
      updates,
      { new: true, session }
    );

    if (tournament) return tournament;

    // Try team
    tournament = await TournamentTeam.findByIdAndUpdate(
      id,
      updates,
      { new: true, session }
    );

    return tournament;
  }

  /**
   * Delete tournament by ID
   */
  async deleteById(id: string, session?: ClientSession): Promise<boolean> {
    // Try individual first
    let result = await TournamentIndividual.findByIdAndDelete(id, { session });
    if (result) return true;

    // Try team
    result = await TournamentTeam.findByIdAndDelete(id, { session });
    return !!result;
  }

  /**
   * Add participant to tournament
   */
  async addParticipant(
    tournamentId: string,
    participantId: string,
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(
      tournamentId,
      { $addToSet: { participants: participantId } } as any,
      session
    );
  }

  /**
   * Remove participant from tournament
   */
  async removeParticipant(
    tournamentId: string,
    participantId: string,
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(
      tournamentId,
      { $pull: { participants: participantId } } as any,
      session
    );
  }

  /**
   * Update seeding
   */
  async updateSeeding(
    tournamentId: string,
    seeding: any[],
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(tournamentId, { seeding } as any, session);
  }

  /**
   * Update groups
   */
  async updateGroups(
    tournamentId: string,
    groups: any[],
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(tournamentId, { groups } as any, session);
  }

  /**
   * Update standings
   */
  async updateStandings(
    tournamentId: string,
    standings: any[],
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(tournamentId, { standings } as any, session);
  }

  /**
   * Mark draw as generated
   */
  async markDrawGenerated(
    tournamentId: string,
    userId: string,
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(
      tournamentId,
      {
        drawGenerated: true,
        drawGeneratedAt: new Date(),
        drawGeneratedBy: userId,
        status: 'upcoming'
      } as any,
      session
    );
  }

  /**
   * Update tournament status
   */
  async updateStatus(
    tournamentId: string,
    status: 'draft' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled',
    session?: ClientSession
  ): Promise<Tournament | null> {
    return this.updateById(tournamentId, { status } as any, session);
  }

  /**
   * Count tournaments
   */
  async count(filters?: {
    status?: string;
    format?: string;
    category?: string;
  }): Promise<number> {
    const query: any = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.format) query.format = filters.format;

    if (!filters?.category) {
      const individualCount = await TournamentIndividual.countDocuments(query);
      const teamCount = await TournamentTeam.countDocuments(query);
      return individualCount + teamCount;
    }

    if (filters.category === 'individual') {
      return TournamentIndividual.countDocuments(query);
    }

    return TournamentTeam.countDocuments(query);
  }

  /**
   * Check if tournament exists
   */
  async exists(id: string): Promise<boolean> {
    const tournament = await this.findById(id);
    return !!tournament;
  }

  /**
   * Get tournament with bracket state
   */
  async getTournamentWithBracketState(id: string) {
    const tournament = await this.findByIdPopulated(id);
    if (!tournament) return null;

    const bracketState = await BracketState.findOne({ tournament: id });

    return {
      tournament,
      bracketState
    };
  }
}

// Singleton instance for convenience
export const tournamentRepository = new TournamentRepository();
