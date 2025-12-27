/**
 * MongoDB Aggregation Pipeline Builder for Leaderboard Queries
 * 
 * Builds efficient aggregation pipelines for filtering and ranking players
 * based on match performance with support for various filters.
 */

import mongoose from 'mongoose';
import type { LeaderboardFilters } from './filterUtils';
import { getDateRange } from './filterUtils';

export interface AggregationOptions {
  filters: LeaderboardFilters;
  dateRange: ReturnType<typeof getDateRange>;
}

/**
 * Build the complete aggregation pipeline for leaderboard queries
 */
export function buildLeaderboardPipeline(options: AggregationOptions): mongoose.PipelineStage[] {
  const { filters, dateRange } = options;
  const pipeline: mongoose.PipelineStage[] = [];

  // Stage 1: Initial match filtering
  pipeline.push(buildMatchFilterStage(filters, dateRange));

  // Stage 1.5: Lookup tournament data if needed for format/season filtering
  if (filters.matchFormat || filters.tournamentSeason) {
    pipeline.push({
      $lookup: {
        from: 'tournaments',
        localField: 'tournament',
        foreignField: '_id',
        as: 'tournamentData',
        pipeline: [
          {
            $project: {
              format: 1,
              startDate: 1,
            },
          },
        ],
      },
    });
    pipeline.push({
      $unwind: { path: '$tournamentData', preserveNullAndEmptyArrays: true },
    });
  }

  // Stage 2: Filter by tournament format and season if needed
  if ((filters.matchFormat && filters.matchFormat !== 'friendly') || filters.tournamentSeason) {
    const tournamentFilter: any = {};
    if (filters.matchFormat && filters.matchFormat !== 'friendly') {
      if (filters.matchFormat === 'league') {
        tournamentFilter['tournamentData.format'] = 'round_robin';
      } else if (filters.matchFormat === 'knockout') {
        tournamentFilter['tournamentData.format'] = { $in: ['knockout', 'hybrid'] };
      }
    }
    if (filters.tournamentSeason) {
      const yearStart = new Date(filters.tournamentSeason, 0, 1);
      const yearEnd = new Date(filters.tournamentSeason, 11, 31, 23, 59, 59, 999);
      tournamentFilter['tournamentData.startDate'] = {
        $gte: yearStart,
        $lte: yearEnd,
      };
    }
    if (Object.keys(tournamentFilter).length > 0) {
      pipeline.push({ $match: tournamentFilter });
    }
  }

  // Stage 3: Add participant index to identify side (before unwinding)
  // Safety: Filter out matches with null/undefined/empty participants array
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

  // Stage 4: Unwind participants to process each player separately
  pipeline.push({ $unwind: '$participantsWithIndex' });

  // Stage 5: Lookup player data (for filtering by gender, age, etc.)
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
            dateOfBirth: 1,
            gender: 1,
            handedness: 1,
          },
        },
      ],
    },
  });

  // Stage 6: Unwind playerData (should be single element)
  // Safety: Filter out documents where player lookup failed (player doesn't exist)
  pipeline.push({ $unwind: { path: '$playerData', preserveNullAndEmptyArrays: true } });
  
  // Filter out documents where playerData is null/empty (player not found)
  pipeline.push({
    $match: {
      'playerData._id': { $exists: true, $ne: null },
    },
  });

  // Stage 7: Calculate match result for this player
  pipeline.push(buildMatchResultCalculationStage());

  // Stage 8: Calculate age category
  pipeline.push(buildAgeCategoryStage());

  // Stage 9: Group by player to aggregate stats
  pipeline.push(buildGroupingStage());

  // Stage 10: Calculate computed metrics (win rate, streaks, etc.)
  pipeline.push(buildComputedMetricsStage());

  // Stage 11: Apply player-based filters (gender, age category, handedness)
  const playerFilterStage = buildPlayerFilterStage(filters);
  if (playerFilterStage) {
    pipeline.push(playerFilterStage);
  }

  // Stage 12: Apply player type filter (singles_only, doubles_only, both)
  const playerTypeFilterStage = buildPlayerTypeFilterStage(filters);
  if (playerTypeFilterStage) {
    pipeline.push(playerTypeFilterStage);
  }

  // Stage 13: Sort by selected metric
  pipeline.push(buildSortStage(filters));

  // Stage 14: Pagination and total count using $facet
  pipeline.push(buildPaginationStage(filters));

  return pipeline;
}

/**
 * Stage 1: Filter matches by status, type, date range, tournament
 * Safety: Ensure type is always defined before building filter
 */
function buildMatchFilterStage(
  filters: LeaderboardFilters,
  dateRange: ReturnType<typeof getDateRange>
): mongoose.PipelineStage.Match {
  const matchFilter: any = {
    matchCategory: 'individual',
    status: 'completed',
  };

  // Handle match type filter - optional, supports 'all' option
  if (filters.type && filters.type !== 'all') {
    // Specific match type selected
    if (!['singles', 'doubles', 'mixed_doubles'].includes(filters.type)) {
      throw new Error(`Invalid match type filter: ${filters.type}`);
    }
    matchFilter.matchType = filters.type;
  } else {
    // 'all' or not specified - include all individual match types
    matchFilter.matchType = { $in: ['singles', 'doubles', 'mixed_doubles'] };
  }

  // Handle competition format filter
  // If matchFormat is 'friendly', include only non-tournament matches
  // If matchFormat is 'league' or 'knockout', we need tournament to exist (filtered in Stage 2)
  // If no matchFormat filter, include all matches (both tournament and friendly)
  if (filters.matchFormat === 'friendly') {
    matchFilter.tournament = null;
  } else if (filters.matchFormat && (filters.matchFormat === 'league' || filters.matchFormat === 'knockout')) {
    // For league/knockout, we need tournament to exist (filtered in Stage 2)
    matchFilter.tournament = { $ne: null };
  }
  // If matchFormat is not set or is 'all', don't filter by tournament (include both)

  // Date range filter
  if (dateRange) {
    matchFilter.createdAt = {
      $gte: dateRange.from,
      $lte: dateRange.to,
    };
  }

  // Tournament-specific filter
  if (filters.tournamentId) {
    matchFilter.tournament = new mongoose.Types.ObjectId(filters.tournamentId);
  }

  return { $match: matchFilter };
}

/**
 * Stage 6: Calculate match result, points, and sets for this player
 * Safety: Handle singles vs doubles participant mapping correctly
 * - Singles: participants[0] = side1, participants[1] = side2
 * - Doubles: participants[0,1] = side1, participants[2,3] = side2
 */
function buildMatchResultCalculationStage(): mongoose.PipelineStage.AddFields {
  return {
    $addFields: {
      // Determine which side this player is on
      // For singles: index 0 = side1, index 1 = side2
      // For doubles: index 0,1 = side1, index 2,3 = side2
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
          // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
      // Calculate if player won (side1 wins if side1Sets > side2Sets)
      won: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          // Singles: index 0 = side1, index 1 = side2
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
          // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
      // Calculate points scored
      // Safety: Handle null/undefined games array - use $ifNull to default to empty array
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
                  // Singles: index 0 = side1, index 1 = side2
                  {
                    $cond: [
                      { $eq: ['$participantsWithIndex.index', 0] },
                      { $ifNull: ['$$this.side1Score', 0] },
                      { $ifNull: ['$$this.side2Score', 0] },
                    ],
                  },
                  // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
      // Calculate points conceded
      // Safety: Handle null/undefined games array - use $ifNull to default to empty array
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
                  // Singles: index 0 = side1, index 1 = side2
                  {
                    $cond: [
                      { $eq: ['$participantsWithIndex.index', 0] },
                      { $ifNull: ['$$this.side2Score', 0] },
                      { $ifNull: ['$$this.side1Score', 0] },
                    ],
                  },
                  // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
      // Calculate sets won
      setsWon: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          // Singles: index 0 = side1, index 1 = side2
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              { $ifNull: ['$finalScore.side1Sets', 0] },
              { $ifNull: ['$finalScore.side2Sets', 0] },
            ],
          },
          // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
      // Calculate sets lost
      setsLost: {
        $cond: [
          { $eq: ['$matchType', 'singles'] },
          // Singles: index 0 = side1, index 1 = side2
          {
            $cond: [
              { $eq: ['$participantsWithIndex.index', 0] },
              { $ifNull: ['$finalScore.side2Sets', 0] },
              { $ifNull: ['$finalScore.side1Sets', 0] },
            ],
          },
          // Doubles/Mixed: index 0,1 = side1, index 2,3 = side2
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
    },
  };
}

/**
 * Stage 6: Calculate age category from dateOfBirth
 * Safety: Handle null/undefined dateOfBirth gracefully
 */
function buildAgeCategoryStage(): mongoose.PipelineStage.AddFields {
  const now = new Date();
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;

  return {
    $addFields: {
      ageCategory: {
        $cond: [
          {
            $and: [
              { $ne: ['$playerData.dateOfBirth', null] },
              { $ne: ['$playerData.dateOfBirth', undefined] },
            ],
          },
          {
            $switch: {
              branches: [
                {
                  case: {
                    $lt: [
                      {
                        $divide: [
                          { $subtract: [now, '$playerData.dateOfBirth'] },
                          msPerYear,
                        ],
                      },
                      13,
                    ],
                  },
                  then: 'U13',
                },
                {
                  case: {
                    $lt: [
                      {
                        $divide: [
                          { $subtract: [now, '$playerData.dateOfBirth'] },
                          msPerYear,
                        ],
                      },
                      15,
                    ],
                  },
                  then: 'U15',
                },
                {
                  case: {
                    $lt: [
                      {
                        $divide: [
                          { $subtract: [now, '$playerData.dateOfBirth'] },
                          msPerYear,
                        ],
                      },
                      18,
                    ],
                  },
                  then: 'U18',
                },
                {
                  case: {
                    $gte: [
                      {
                        $divide: [
                          { $subtract: [now, '$playerData.dateOfBirth'] },
                          msPerYear,
                        ],
                      },
                      40,
                    ],
                  },
                  then: '40+',
                },
              ],
              default: 'Open',
            },
          },
          'Open', // Default to 'Open' if dateOfBirth is missing
        ],
      },
    },
  };
}

/**
 * Stage 8: Group by player to aggregate statistics
 */
function buildGroupingStage(): mongoose.PipelineStage.Group {
  return {
    $group: {
      _id: '$participantsWithIndex.playerId',
      player: { $first: '$playerData' },
      matchesPlayed: { $sum: 1 },
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
      totalPointsScored: { $sum: '$pointsScored' },
      totalPointsConceded: { $sum: '$pointsConceded' },
      setsWon: { $sum: '$setsWon' },
      setsLost: { $sum: '$setsLost' },
      matchDates: { $push: '$createdAt' },
      matchResults: {
        $push: {
          $cond: ['$won', 1, -1],
        },
      },
      // Store match types for player type filtering
      matchTypes: { $push: '$matchType' },
    },
  };
}

/**
 * Stage 8: Calculate computed metrics (win rate, streaks, etc.)
 */
function buildComputedMetricsStage(): mongoose.PipelineStage.AddFields {
  return {
    $addFields: {
      // Win rate percentage
      winRate: {
        $cond: [
          { $gt: ['$matchesPlayed', 0] },
          {
            $multiply: [
              { $divide: ['$wins', '$matchesPlayed'] },
              100,
            ],
          },
          0,
        ],
      },
      // Point difference
      pointDifference: {
        $subtract: ['$totalPointsScored', '$totalPointsConceded'],
      },
      // Average points per match
      avgPointsPerMatch: {
        $cond: [
          { $gt: ['$matchesPlayed', 0] },
          {
            $divide: ['$totalPointsScored', '$matchesPlayed'],
          },
          0,
        ],
      },
      // Current streak (from most recent matches)
      // Count consecutive same results from the end, multiply by result value (1=win, -1=loss)
      currentStreak: {
        $cond: [
          { $eq: [{ $size: '$matchResults' }, 0] },
          0,
          {
            $let: {
              vars: {
                reversed: { $reverseArray: '$matchResults' },
              },
              in: {
                $let: {
                  vars: {
                    firstResult: { $arrayElemAt: ['$$reversed', 0] },
                  },
                  in: {
                    $let: {
                      vars: {
                        streakCount: {
                          $reduce: {
                            input: '$$reversed',
                            initialValue: { count: 0, continue: true },
                            in: {
                              $cond: [
                                {
                                  $and: [
                                    { $eq: ['$$value.continue', true] },
                                    { $eq: ['$$this', '$$firstResult'] },
                                  ],
                                },
                                {
                                  count: { $add: ['$$value.count', 1] },
                                  continue: true,
                                },
                                {
                                  count: '$$value.count',
                                  continue: false,
                                },
                              ],
                            },
                          },
                        },
                      },
                      in: {
                        $multiply: ['$$streakCount.count', '$$firstResult'],
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      // Longest win streak
      longestStreak: {
        $let: {
          vars: {
            results: '$matchResults',
          },
          in: {
            $let: {
              vars: {
                maxStreak: {
                  $reduce: {
                    input: {
                      $range: [0, { $size: '$$results' }],
                    },
                    initialValue: { current: 0, max: 0 },
                    in: {
                      $let: {
                        vars: {
                          result: {
                            $arrayElemAt: ['$$results', '$$this'],
                          },
                        },
                        in: {
                          $let: {
                            vars: {
                              isWin: { $gt: ['$$result', 0] },
                            },
                            in: {
                              $cond: [
                                '$$isWin',
                                {
                                  current: {
                                    $add: [
                                      '$$value.current',
                                      1,
                                    ],
                                  },
                                  max: {
                                    $max: [
                                      {
                                        $add: [
                                          '$$value.current',
                                          1,
                                        ],
                                      },
                                      '$$value.max',
                                    ],
                                  },
                                },
                                {
                                  current: 0,
                                  max: '$$value.max',
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              in: '$$maxStreak.max',
            },
          },
        },
      },
    },
  };
}

/**
 * Stage 9: Filter by player attributes (gender, age category, handedness)
 */
function buildPlayerFilterStage(
  filters: LeaderboardFilters
): mongoose.PipelineStage.Match | null {
  const matchFilter: any = {};

  // Gender filter
  if (filters.gender) {
    if (filters.gender === 'mixed') {
      // For mixed, we need to check if it's a mixed_doubles match
      // This is handled at match level, so we don't filter here
      // Instead, we'll need to check match type in the grouping stage
    } else {
      matchFilter['player.gender'] = filters.gender;
    }
  }

  // Age category filter
  if (filters.ageCategory) {
    matchFilter.ageCategory = filters.ageCategory;
  }

  // Handedness filter
  if (filters.handedness) {
    matchFilter['player.handedness'] = filters.handedness;
  }

  // Return null if no filters to apply
  if (Object.keys(matchFilter).length === 0) {
    return null;
  }

  return { $match: matchFilter };
}

/**
 * Stage 12: Filter by player type (singles_only, doubles_only, both)
 * 
 * This filters players based on the types of matches they've played.
 * - singles_only: Player has ONLY played singles matches
 * - doubles_only: Player has ONLY played doubles/mixed_doubles matches
 * - both: No filter (player can have any mix)
 */
function buildPlayerTypeFilterStage(
  filters: LeaderboardFilters
): mongoose.PipelineStage.AddFields | mongoose.PipelineStage.Match | null {
  if (!filters.playerType || filters.playerType === 'both') {
    return null;
  }

  // We need to check if ALL matches are of the specified type
  // Use $setIsSubset to check if matchTypes array contains only the allowed types
  if (filters.playerType === 'singles_only') {
    // Check that matchTypes array contains only 'singles'
    return {
      $match: {
        $expr: {
          $eq: [
            {
              $size: {
                $filter: {
                  input: '$matchTypes',
                  as: 'type',
                  cond: { $ne: ['$$type', 'singles'] },
                },
              },
            },
            0,
          ],
        },
      },
    };
  } else if (filters.playerType === 'doubles_only') {
    // Check that matchTypes array contains only 'doubles' or 'mixed_doubles'
    return {
      $match: {
        $expr: {
          $eq: [
            {
              $size: {
                $filter: {
                  input: '$matchTypes',
                  as: 'type',
                  cond: {
                    $not: {
                      $in: ['$$type', ['doubles', 'mixed_doubles']],
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
    };
  }

  return null;
}

/**
 * Stage 11: Sort by selected metric
 */
function buildSortStage(filters: LeaderboardFilters): mongoose.PipelineStage.Sort {
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  let sortField = 'winRate'; // Default

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'winRate':
        sortField = 'winRate';
        break;
      case 'wins':
        sortField = 'wins';
        break;
      case 'pointDifference':
        sortField = 'pointDifference';
        break;
      case 'winStreak':
        sortField = 'currentStreak';
        break;
      case 'matchesPlayed':
        sortField = 'matchesPlayed';
        break;
    }
  }

  return {
    $sort: {
      [sortField]: sortOrder,
      matchesPlayed: -1, // Tie-breaker: more matches = higher rank
    },
  };
}

/**
 * Stage 12: Pagination and total count using $facet
 */
function buildPaginationStage(filters: LeaderboardFilters): mongoose.PipelineStage.Facet {
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
            // rank is calculated in API route, not included in projection
            stats: {
              totalMatches: '$matchesPlayed',
              wins: '$wins',
              losses: '$losses',
              winRate: { $round: ['$winRate', 1] },
              setsWon: '$setsWon',
              setsLost: '$setsLost',
              currentStreak: '$currentStreak',
              bestStreak: '$longestStreak',
              pointDifference: '$pointDifference',
              totalPointsScored: '$totalPointsScored',
              totalPointsConceded: '$totalPointsConceded',
              avgPointsPerMatch: { $round: ['$avgPointsPerMatch', 1] },
            },
          },
        },
      ],
      total: [{ $count: 'count' }],
    },
  };
}

