/**
 * MongoDB Aggregation Pipeline Builder for Tournament Leaderboard
 * 
 * Builds efficient aggregation pipelines for tournament leaderboard queries
 * by directly querying IndividualMatch documents linked to tournaments.
 */

import mongoose from 'mongoose';

export interface TournamentLeaderboardFilters {
  matchType?: 'singles' | 'doubles' | 'all';
  format?: 'round_robin' | 'knockout' | 'hybrid' | 'all';
  status?: 'completed' | 'in_progress' | 'all';
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  season?: number; // Year (e.g., 2024)
  limit?: number;
  skip?: number;
}

export interface AggregationOptions {
  filters: TournamentLeaderboardFilters;
}

/**
 * Build the complete aggregation pipeline for tournament leaderboard queries
 */
export function buildTournamentLeaderboardPipeline(
  options: AggregationOptions
): mongoose.PipelineStage[] {
  const { filters } = options;
  const pipeline: mongoose.PipelineStage[] = [];

  // Stage 1: Match tournament matches only
  pipeline.push(buildInitialMatchStage(filters));

  // Stage 2: Lookup tournament data
  pipeline.push({
    $lookup: {
      from: 'tournaments',
      localField: 'tournament',
      foreignField: '_id',
      as: 'tournamentData',
      pipeline: [
        {
          $project: {
            _id: 1,
            name: 1,
            format: 1,
            matchType: 1,
            status: 1,
            startDate: 1,
            endDate: 1,
            standings: 1,
          },
        },
      ],
    },
  });

  pipeline.push({
    $unwind: { path: '$tournamentData', preserveNullAndEmptyArrays: false },
  });

  // Stage 3: Filter by tournament criteria
  const tournamentFilterStage = buildTournamentFilterStage(filters);
  if (tournamentFilterStage) {
    pipeline.push(tournamentFilterStage);
  }

  // Stage 4: Add participant index
  pipeline.push({
    $match: {
      participants: {
        $exists: true,
        $ne: null,
        $type: 'array',
        $not: { $size: 0 },
      },
    },
  });

  pipeline.push({
    $addFields: {
      participantsWithIndex: {
        $map: {
          input: { $range: [0, { $size: '$participants' }] },
          as: 'idx',
          in: {
            playerId: { $arrayElemAt: ['$participants', '$$idx'] },
            index: '$$idx',
          },
        },
      },
    },
  });

  // Stage 5: Unwind participants
  pipeline.push({ $unwind: '$participantsWithIndex' });

  // Stage 6: Lookup player data
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'participantsWithIndex.playerId',
      foreignField: '_id',
      as: 'playerData',
      pipeline: [
        {
          $project: {
            _id: 1,
            username: 1,
            fullName: 1,
            profileImage: 1,
          },
        },
      ],
    },
  });

  pipeline.push({
    $unwind: { path: '$playerData', preserveNullAndEmptyArrays: false },
  });

  // Stage 7: Calculate match result and stats for this player
  pipeline.push(buildMatchResultCalculationStage());

  // Stage 8: Group by player + tournament (first aggregation level)
  pipeline.push(buildPlayerTournamentGroupingStage());

  // Stage 9: Group by player (aggregate across all tournaments)
  pipeline.push(buildPlayerGroupingStage());

  // Stage 10: Calculate derived metrics and tournament achievements
  pipeline.push(buildComputedMetricsStage());

  // Stage 11: Sort by ranking system
  pipeline.push(buildRankingSortStage());

  // Stage 12: Pagination and total count
  pipeline.push(buildPaginationStage(filters));

  return pipeline;
}

/**
 * Stage 1: Initial match filtering
 */
function buildInitialMatchStage(
  filters: TournamentLeaderboardFilters
): mongoose.PipelineStage.Match {
  const matchFilter: any = {
    matchCategory: 'individual',
    tournament: { $ne: null }, // Only tournament matches
    status: 'completed',
  };

  // Filter by match type
  if (filters.matchType && filters.matchType !== 'all') {
    matchFilter.matchType = filters.matchType;
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    matchFilter.createdAt = {};
    if (filters.dateFrom) {
      matchFilter.createdAt.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      matchFilter.createdAt.$lte = new Date(filters.dateTo);
    }
  }

  return { $match: matchFilter };
}

/**
 * Stage 3: Filter by tournament criteria
 */
function buildTournamentFilterStage(
  filters: TournamentLeaderboardFilters
): mongoose.PipelineStage.Match | null {
  const tournamentFilter: any = {};

  // Filter by tournament format
  if (filters.format && filters.format !== 'all') {
    tournamentFilter['tournamentData.format'] = filters.format;
  }

  // Filter by tournament status
  if (filters.status && filters.status !== 'all') {
    tournamentFilter['tournamentData.status'] = filters.status;
  } else {
    // Default: only completed tournaments (unless explicitly including in_progress)
    tournamentFilter['tournamentData.status'] = { $in: ['completed', 'in_progress'] };
  }

  // Filter by season (year)
  if (filters.season) {
    const yearStart = new Date(filters.season, 0, 1);
    const yearEnd = new Date(filters.season, 11, 31, 23, 59, 59, 999);
    tournamentFilter['tournamentData.startDate'] = {
      $gte: yearStart,
      $lte: yearEnd,
    };
  }

  if (Object.keys(tournamentFilter).length === 0) {
    return null;
  }

  return { $match: tournamentFilter };
}

/**
 * Stage 7: Calculate match result, sets, and points for this player
 */
function buildMatchResultCalculationStage(): mongoose.PipelineStage.AddFields {
  return {
    $addFields: {
      // Determine which side this player is on
      playerSide: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          // Singles: index 0 = side1, index 1 = side2
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              'side1',
              'side2',
            ],
          },
          // Doubles: index 0,1 = side1, index 2,3 = side2
          {
            $cond: [
              {
                $or: [
                  { $eq: ['$participantsWithIndex.index', 0] },
                  { $eq: ['$participantsWithIndex.index', 1] },
                ],
              },
              'side1',
              'side2',
            ],
          },
        ],
      },
      // Calculate if player won
      won: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              {
                $gt: [
                  { $ifNull: ['$finalScore.side1Sets', 0] },
                  { $ifNull: ['$finalScore.side2Sets', 0] },
                ],
              },
              {
                $gt: [
                  { $ifNull: ['$finalScore.side2Sets', 0] },
                  { $ifNull: ['$finalScore.side1Sets', 0] },
                ],
              },
            ],
          },
          {
            $cond: [
              {
                $or: [
                  { $eq: ['$participantsWithIndex.index', 0] },
                  { $eq: ['$participantsWithIndex.index', 1] },
                ],
              },
              {
                $gt: [
                  { $ifNull: ['$finalScore.side1Sets', 0] },
                  { $ifNull: ['$finalScore.side2Sets', 0] },
                ],
              },
              {
                $gt: [
                  { $ifNull: ['$finalScore.side2Sets', 0] },
                  { $ifNull: ['$finalScore.side1Sets', 0] },
                ],
              },
            ],
          },
        ],
      },
      // Calculate sets won/lost
      setsWon: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              { $ifNull: ['$finalScore.side1Sets', 0] },
              { $ifNull: ['$finalScore.side2Sets', 0] },
            ],
          },
          {
            $cond: [
              {
                $or: [
                  { $eq: ['$participantsWithIndex.index', 0] },
                  { $eq: ['$participantsWithIndex.index', 1] },
                ],
              },
              { $ifNull: ['$finalScore.side1Sets', 0] },
              { $ifNull: ['$finalScore.side2Sets', 0] },
            ],
          },
        ],
      },
      setsLost: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              { $ifNull: ['$finalScore.side2Sets', 0] },
              { $ifNull: ['$finalScore.side1Sets', 0] },
            ],
          },
          {
            $cond: [
              {
                $or: [
                  { $eq: ['$participantsWithIndex.index', 0] },
                  { $eq: ['$participantsWithIndex.index', 1] },
                ],
              },
              { $ifNull: ['$finalScore.side2Sets', 0] },
              { $ifNull: ['$finalScore.side1Sets', 0] },
            ],
          },
        ],
      },
      // Calculate points scored/conceded from games
      pointsScored: {
        $reduce: {
          input: { $ifNull: ['$games', []] },
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              {
                $cond: [
                  { $eq: ['$matchType', 'singles'] },
                  {
                    $cond: [
                      { $eq: ['$participantsWithIndex.index', 0] },
                      { $ifNull: ['$$this.side1Score', 0] },
                      { $ifNull: ['$$this.side2Score', 0] },
                    ],
                  },
                  {
                    $cond: [
                      {
                        $or: [
                          { $eq: ['$participantsWithIndex.index', 0] },
                          { $eq: ['$participantsWithIndex.index', 1] },
                        ],
                      },
                      { $ifNull: ['$$this.side1Score', 0] },
                      { $ifNull: ['$$this.side2Score', 0] },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      pointsConceded: {
        $reduce: {
          input: { $ifNull: ['$games', []] },
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              {
                $cond: [
                  { $eq: ['$matchType', 'singles'] },
                  {
                    $cond: [
                      { $eq: ['$participantsWithIndex.index', 0] },
                      { $ifNull: ['$$this.side2Score', 0] },
                      { $ifNull: ['$$this.side1Score', 0] },
                    ],
                  },
                  {
                    $cond: [
                      {
                        $or: [
                          { $eq: ['$participantsWithIndex.index', 0] },
                          { $eq: ['$participantsWithIndex.index', 1] },
                        ],
                      },
                      { $ifNull: ['$$this.side2Score', 0] },
                      { $ifNull: ['$$this.side1Score', 0] },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    },
  };
}

/**
 * Stage 8: Group by player + tournament (first level aggregation)
 */
function buildPlayerTournamentGroupingStage(): mongoose.PipelineStage.Group {
  return {
    $group: {
      _id: {
        playerId: '$participantsWithIndex.playerId',
        tournamentId: '$tournament',
      },
      player: { $first: '$playerData' },
      tournament: { $first: '$tournamentData' },
      matchCount: { $sum: 1 },
      wins: {
        $sum: {
          $cond: ['$won', 1, 0],
        },
      },
      losses: {
        $sum: {
          $cond: ['$won', 0, 1],
        },
      },
      setsWon: { $sum: '$setsWon' },
      setsLost: { $sum: '$setsLost' },
      pointsScored: { $sum: '$pointsScored' },
      pointsConceded: { $sum: '$pointsConceded' },
      matchDates: { $push: '$createdAt' },
      // Store tournament finish position from standings if available
      tournamentFinish: {
        $first: {
          $let: {
            vars: {
              playerStanding: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ['$tournamentData.standings', []] },
                      as: 'standing',
                      cond: {
                        $eq: [
                          { $toString: '$$standing.participant' },
                          { $toString: '$participantsWithIndex.playerId' },
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
            },
            in: '$$playerStanding.rank',
          },
        },
      },
      tournamentPoints: {
        $first: {
          $let: {
            vars: {
              playerStanding: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ['$tournamentData.standings', []] },
                      as: 'standing',
                      cond: {
                        $eq: [
                          { $toString: '$$standing.participant' },
                          { $toString: '$participantsWithIndex.playerId' },
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
            },
            in: '$$playerStanding.points',
          },
        },
      },
    },
  };
}

/**
 * Stage 9: Group by player (aggregate across all tournaments)
 */
function buildPlayerGroupingStage(): mongoose.PipelineStage.Group {
  return {
    $group: {
      _id: '$_id.playerId',
      player: { $first: '$player' },
      tournaments: { $push: '$$ROOT' },
      // Aggregate match stats
      tournamentMatches: { $sum: '$matchCount' },
      tournamentMatchWins: { $sum: '$wins' },
      tournamentMatchLosses: { $sum: '$losses' },
      tournamentSetsWon: { $sum: '$setsWon' },
      tournamentSetsLost: { $sum: '$setsLost' },
      tournamentPointsScored: { $sum: '$pointsScored' },
      tournamentPointsConceded: { $sum: '$pointsConceded' },
      // Tournament achievements
      tournamentsPlayed: { $sum: 1 },
      tournamentsWon: {
        $sum: {
          $cond: [
            {
              $and: [
                { $ne: ['$tournamentFinish', null] },
                { $eq: ['$tournamentFinish', 1] },
                { $eq: [{ $ifNull: ['$tournament.status', ''] }, 'completed'] },
              ],
            },
            1,
            0,
          ],
        },
      },
      finalsReached: {
        $sum: {
          $cond: [
            {
              $and: [
                { $ne: ['$tournamentFinish', null] },
                { $lte: ['$tournamentFinish', 2] },
                { $eq: [{ $ifNull: ['$tournament.status', ''] }, 'completed'] },
              ],
            },
            1,
            0,
          ],
        },
      },
      semiFinalsReached: {
        $sum: {
          $cond: [
            {
              $and: [
                { $ne: ['$tournamentFinish', null] },
                { $lte: ['$tournamentFinish', 4] },
                { $eq: [{ $ifNull: ['$tournament.status', ''] }, 'completed'] },
              ],
            },
            1,
            0,
          ],
        },
      },
      quarterFinalsReached: {
        $sum: {
          $cond: [
            {
              $and: [
                { $ne: ['$tournamentFinish', null] },
                { $lte: ['$tournamentFinish', 8] },
                { $eq: [{ $ifNull: ['$tournament.status', ''] }, 'completed'] },
              ],
            },
            1,
            0,
          ],
        },
      },
      // Tournament points (sum from standings)
      totalTournamentPoints: {
        $sum: {
          $cond: [
            { $ne: ['$tournamentPoints', null] },
            '$tournamentPoints',
            0,
          ],
        },
      },
      // Finish positions for average calculation
      finishPositions: {
        $push: {
          $cond: [
            {
              $and: [
                { $ne: ['$tournamentFinish', null] },
                { $eq: [{ $ifNull: ['$tournament.status', ''] }, 'completed'] },
              ],
            },
            '$tournamentFinish',
            '$$REMOVE',
          ],
        },
      },
      // Tournament dates for streak calculation
      tournamentDates: {
        $push: {
          $ifNull: ['$tournament.startDate', '$tournament.createdAt'],
        },
      },
    },
  };
}

/**
 * Stage 10: Calculate derived metrics
 */
function buildComputedMetricsStage(): mongoose.PipelineStage.AddFields {
  return {
    $addFields: {
      // Win rates
      tournamentMatchWinRate: {
        $cond: [
          { $gt: ['$tournamentMatches', 0] },
          {
            $multiply: [
              { $divide: ['$tournamentMatchWins', '$tournamentMatches'] },
              100,
            ],
          },
          0,
        ],
      },
      tournamentSetWinRate: {
        $cond: [
          {
            $gt: [
              { $add: ['$tournamentSetsWon', '$tournamentSetsLost'] },
              0,
            ],
          },
          {
            $multiply: [
              {
                $divide: [
                  '$tournamentSetsWon',
                  { $add: ['$tournamentSetsWon', '$tournamentSetsLost'] },
                ],
              },
              100,
            ],
          },
          0,
        ],
      },
      // Differentials
      tournamentSetDifferential: {
        $subtract: ['$tournamentSetsWon', '$tournamentSetsLost'],
      },
      tournamentPointDifferential: {
        $subtract: ['$tournamentPointsScored', '$tournamentPointsConceded'],
      },
      // Average finish position
      averageFinish: {
        $cond: [
          { $gt: [{ $size: '$finishPositions' }, 0] },
          { $avg: '$finishPositions' },
          null,
        ],
      },
      // Best finish position
      bestFinish: {
        $cond: [
          { $gt: [{ $size: '$finishPositions' }, 0] },
          { $min: '$finishPositions' },
          null,
        ],
      },
      // Average points per match
      avgPointsPerMatch: {
        $cond: [
          { $gt: ['$tournamentMatches', 0] },
          {
            $divide: ['$tournamentPointsScored', '$tournamentMatches'],
          },
          0,
        ],
      },
      // Recent tournaments (last 30 days)
      recentTournaments: {
        $size: {
          $filter: {
            input: '$tournamentDates',
            as: 'date',
            cond: {
              $gte: [
                '$$date',
                {
                  $subtract: [
                    new Date(),
                    30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };
}

/**
 * Stage 11: Sort by ranking system
 */
function buildRankingSortStage(): mongoose.PipelineStage.Sort {
  return {
    $sort: {
      // Primary: Tournament Points (ITTF-style)
      totalTournamentPoints: -1,
      // Secondary: Tournaments Won
      tournamentsWon: -1,
      // Tertiary: Finals Reached
      finalsReached: -1,
      // Quaternary: Tournament Match Win Rate
      tournamentMatchWinRate: -1,
      // Quinary: Average Finish (lower is better, so ascending)
      averageFinish: 1,
      // Senary: Total Tournament Matches
      tournamentMatches: -1,
    },
  };
}

/**
 * Stage 12: Pagination and total count
 */
function buildPaginationStage(
  filters: TournamentLeaderboardFilters
): mongoose.PipelineStage.Facet {
  const limit = filters.limit || 50;
  const skip = filters.skip || 0;

  return {
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            player: {
              _id: { $toString: '$_id' },
              username: '$player.username',
              fullName: '$player.fullName',
              profileImage: '$player.profileImage',
            },
            stats: {
              tournamentsPlayed: '$tournamentsPlayed',
              tournamentsWon: '$tournamentsWon',
              finalsReached: '$finalsReached',
              semiFinalsReached: '$semiFinalsReached',
              quarterFinalsReached: '$quarterFinalsReached',
              averageFinish: { $ifNull: ['$averageFinish', 0] },
              bestFinish: { $ifNull: ['$bestFinish', 0] },
              tournamentMatches: '$tournamentMatches',
              tournamentMatchWins: '$tournamentMatchWins',
              tournamentMatchLosses: '$tournamentMatchLosses',
              tournamentMatchWinRate: { $round: ['$tournamentMatchWinRate', 1] },
              tournamentSetsWon: '$tournamentSetsWon',
              tournamentSetsLost: '$tournamentSetsLost',
              tournamentSetDifferential: '$tournamentSetDifferential',
              tournamentSetWinRate: { $round: ['$tournamentSetWinRate', 1] },
              tournamentPointsScored: '$tournamentPointsScored',
              tournamentPointsConceded: '$tournamentPointsConceded',
              tournamentPointDifferential: '$tournamentPointDifferential',
              avgPointsPerMatch: { $round: ['$avgPointsPerMatch', 1] },
              totalTournamentPoints: '$totalTournamentPoints',
              recentTournaments: '$recentTournaments',
            },
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  };
}

