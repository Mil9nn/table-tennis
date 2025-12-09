// services/tournament/TournamentQueryService.ts
import mongoose from "mongoose";
import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";

/**
 * Tournament Query Service
 *
 * Optimized queries using aggregation pipelines.
 * Fixes N+1 query problems by fetching all related data in single queries.
 *
 * Benefits:
 * - Single database query for complex data
 * - No N+1 problems
 * - Better performance
 * - Consistent data structure
 */

export interface TournamentDTO {
  _id: string;
  name: string;
  format: string;
  category: string;
  status: string;
  startDate: Date;
  participants: any[];
  organizer: any;
  bracket?: any;
  matches?: any[];
  standings?: any[];
  groups?: any[];
  [key: string]: any;
}

export class TournamentQueryService {
  /**
   * Get tournament with all details in a single query
   * Uses aggregation to avoid N+1 problems
   */
  async getTournamentWithDetails(id: string): Promise<TournamentDTO | null> {
    // Try individual tournament first
    let result = await this.getIndividualTournamentWithDetails(id);
    if (result) return result;

    // Try team tournament
    return this.getTeamTournamentWithDetails(id);
  }

  /**
   * Get individual tournament with full details
   */
  private async getIndividualTournamentWithDetails(id: string): Promise<TournamentDTO | null> {
    const results = await TournamentIndividual.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Lookup participants (Users)
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantDocs',
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                profileImage: 1,
                rank: 1
              }
            }
          ]
        }
      },

      // Lookup organizer
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizerDoc',
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                profileImage: 1
              }
            }
          ]
        }
      },

      // Lookup matches
      {
        $lookup: {
          from: 'matches',
          localField: '_id',
          foreignField: 'tournament',
          as: 'matches',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'participants',
                foreignField: '_id',
                as: 'participantDetails',
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      profileImage: 1
                    }
                  }
                ]
              }
            }
          ]
        }
      },

      // Lookup bracket state
      {
        $lookup: {
          from: 'bracketstates',
          localField: '_id',
          foreignField: 'tournament',
          as: 'bracketState'
        }
      },

      // Transform results
      {
        $project: {
          _id: 1,
          name: 1,
          format: 1,
          category: 1,
          matchType: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          city: 1,
          venue: 1,
          drawGenerated: 1,
          drawGeneratedAt: 1,
          useGroups: 1,
          numberOfGroups: 1,
          groups: 1,
          rounds: 1,
          standings: 1,
          seeding: 1,
          seedingMethod: 1,
          rules: 1,
          knockoutConfig: 1,
          hybridConfig: 1,
          currentPhase: 1,
          qualifiedParticipants: 1,
          joinCode: 1,
          allowJoinByCode: 1,
          registrationDeadline: 1,
          maxParticipants: 1,
          minParticipants: 1,
          createdAt: 1,
          updatedAt: 1,
          participants: '$participantDocs',
          organizer: { $arrayElemAt: ['$organizerDoc', 0] },
          bracket: { $arrayElemAt: ['$bracketState', 0] },
          matches: 1
        }
      }
    ]);

    return results[0] || null;
  }

  /**
   * Get team tournament with full details
   */
  private async getTeamTournamentWithDetails(id: string): Promise<TournamentDTO | null> {
    const results = await TournamentTeam.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Lookup participants (Teams)
      {
        $lookup: {
          from: 'teams',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantDocs',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'captain',
                foreignField: '_id',
                as: 'captainDoc'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'players.user',
                foreignField: '_id',
                as: 'playerDocs'
              }
            },
            {
              $project: {
                name: 1,
                logo: 1,
                city: 1,
                captain: { $arrayElemAt: ['$captainDoc', 0] },
                players: '$playerDocs'
              }
            }
          ]
        }
      },

      // Lookup organizer
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizerDoc',
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                profileImage: 1
              }
            }
          ]
        }
      },

      // Lookup matches
      {
        $lookup: {
          from: 'matches',
          localField: '_id',
          foreignField: 'tournament',
          as: 'matches'
        }
      },

      // Lookup bracket state
      {
        $lookup: {
          from: 'bracketstates',
          localField: '_id',
          foreignField: 'tournament',
          as: 'bracketState'
        }
      },

      // Transform results
      {
        $project: {
          _id: 1,
          name: 1,
          format: 1,
          category: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          city: 1,
          venue: 1,
          drawGenerated: 1,
          drawGeneratedAt: 1,
          useGroups: 1,
          numberOfGroups: 1,
          groups: 1,
          rounds: 1,
          standings: 1,
          seeding: 1,
          seedingMethod: 1,
          rules: 1,
          knockoutConfig: 1,
          hybridConfig: 1,
          teamConfig: 1,
          currentPhase: 1,
          qualifiedParticipants: 1,
          joinCode: 1,
          allowJoinByCode: 1,
          registrationDeadline: 1,
          maxParticipants: 1,
          minParticipants: 1,
          createdAt: 1,
          updatedAt: 1,
          participants: '$participantDocs',
          organizer: { $arrayElemAt: ['$organizerDoc', 0] },
          bracket: { $arrayElemAt: ['$bracketState', 0] },
          matches: 1
        }
      }
    ]);

    return results[0] || null;
  }

  /**
   * List tournaments with filters - optimized query
   */
  async listTournaments(options: {
    status?: string;
    format?: string;
    category?: string;
    city?: string;
    search?: string;
    limit?: number;
    skip?: number;
    sort?: string;
  }): Promise<TournamentDTO[]> {
    const matchStage: any = {};

    if (options.status) {
      matchStage.status = options.status;
    }

    if (options.format) {
      matchStage.format = options.format;
    }

    if (options.city) {
      matchStage.city = options.city;
    }

    if (options.search) {
      matchStage.name = { $regex: options.search, $options: 'i' };
    }

    let sortStage: any = { startDate: -1 };

    if (options.sort === 'upcoming') {
      sortStage = { startDate: 1 };
    } else if (options.sort === 'name') {
      sortStage = { name: 1 };
    }

    // Determine which collection(s) to query
    const collections = [];

    if (!options.category || options.category === 'individual') {
      collections.push({
        model: TournamentIndividual,
        participantCollection: 'users'
      });
    }

    if (!options.category || options.category === 'team') {
      collections.push({
        model: TournamentTeam,
        participantCollection: 'teams'
      });
    }

    const allResults: TournamentDTO[] = [];

    for (const { model, participantCollection } of collections) {
      const results = await model.aggregate([
        { $match: matchStage },

        // Lookup participant count
        {
          $lookup: {
            from: participantCollection,
            localField: 'participants',
            foreignField: '_id',
            as: 'participantDocs'
          }
        },

        // Lookup organizer
        {
          $lookup: {
            from: 'users',
            localField: 'organizer',
            foreignField: '_id',
            as: 'organizerDoc',
            pipeline: [
              {
                $project: {
                  username: 1,
                  fullName: 1
                }
              }
            ]
          }
        },

        // Project needed fields
        {
          $project: {
            _id: 1,
            name: 1,
            format: 1,
            category: 1,
            status: 1,
            startDate: 1,
            city: 1,
            venue: 1,
            drawGenerated: 1,
            participantCount: { $size: '$participantDocs' },
            maxParticipants: 1,
            organizer: { $arrayElemAt: ['$organizerDoc', 0] },
            createdAt: 1
          }
        },

        { $sort: sortStage },
        { $skip: options.skip || 0 },
        { $limit: options.limit || 50 }
      ]);

      allResults.push(...results);
    }

    // If querying multiple collections, need to re-sort combined results
    if (collections.length > 1) {
      allResults.sort((a, b) => {
        if (sortStage.startDate === 1) {
          return a.startDate.getTime() - b.startDate.getTime();
        } else if (sortStage.startDate === -1) {
          return b.startDate.getTime() - a.startDate.getTime();
        } else if (sortStage.name) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
    }

    return allResults.slice(0, options.limit || 50);
  }

  /**
   * Get tournament statistics
   */
  async getTournamentStats(id: string) {
    const tournament = await this.getTournamentWithDetails(id);
    if (!tournament) return null;

    const totalMatches = tournament.matches?.length || 0;
    const completedMatches = tournament.matches?.filter(m => m.status === 'completed').length || 0;
    const inProgressMatches = tournament.matches?.filter(m => m.status === 'in_progress').length || 0;

    return {
      participantCount: tournament.participants.length,
      totalMatches,
      completedMatches,
      inProgressMatches,
      pendingMatches: totalMatches - completedMatches - inProgressMatches,
      completionPercentage: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
    };
  }

  /**
   * Search tournaments by name
   */
  async searchTournaments(searchTerm: string, limit: number = 10): Promise<TournamentDTO[]> {
    return this.listTournaments({
      search: searchTerm,
      limit,
      sort: 'name'
    });
  }
}

// Singleton instance for convenience
export const tournamentQueryService = new TournamentQueryService();
