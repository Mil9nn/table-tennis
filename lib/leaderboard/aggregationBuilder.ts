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

  // Stage 2: Filter by tournament season if needed
  // Note: We no longer filter by tournament format here since 'tournament' includes all formats
  // Format-specific filtering was removed - 'tournament' means any tournament match
  if (filters.tournamentSeason) {
    const tournamentFilter: any = {};
    const yearStart = new Date(filters.tournamentSeason, 0, 1);
    const yearEnd = new Date(filters.tournamentSeason, 11, 31, 23, 59, 59, 999);
    tournamentFilter['tournamentData.startDate'] = {
      $gte: yearStart,
      $lte: yearEnd,
    };
    if (Object.keys(tournamentFilter).length > 0) {
      pipeline.push({ $match: tournamentFilter });
    }
  }

  // Stage 3: Add participant index to identify side (before unwinding)
  // Safety: Filter out matches with null/undefined/empty participants array
  pipeline.push({
    $match: {
      $expr: {
        $gt: [{ $size: { $ifNull: ['$participants', []] } }, 0],
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

  // Stage 8: Group by player to aggregate stats
  pipeline.push(buildGroupingStage());

  // Stage 10: Calculate computed metrics (win rate, streaks, etc.)
  pipeline.push(buildComputedMetricsStage());

  // Stage 11: Apply player-based filters (gender, handedness)
  const playerFilterStage = buildPlayerFilterStage(filters);
  if (playerFilterStage) {
    pipeline.push(playerFilterStage);
  }

  // Stage 12: Sort by selected metric
  pipeline.push(buildSortStage());

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
    if (!['singles', 'doubles'].includes(filters.type)) {
      throw new Error(`Invalid match type filter: ${filters.type}`);
    }
    matchFilter.matchType = filters.type;
    // Singles leaderboard should only include true 1v1 docs.
    if (filters.type === 'singles') {
      matchFilter['participants.1'] = { $exists: true };
      matchFilter['participants.2'] = { $exists: false };
    }
  } else {
    // 'all' or not specified - include all individual match types
    matchFilter.matchType = { $in: ['singles', 'doubles'] };
  }

  // Handle competition format filter
  // If matchFormat is 'friendly', include only non-tournament matches
  // If matchFormat is 'tournament', include all tournament matches (any format)
  // If no matchFormat filter, include all matches (both tournament and friendly)
  if (filters.matchFormat === 'friendly') {
    matchFilter.tournament = null;
  } else if (filters.matchFormat === 'tournament') {
    // For tournament, include any match with a tournament reference (all tournament formats)
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
 * Stage 6: Calculate match result, points, and sets for this player.
 *
 * Prioritizes the new team-indexed fields (`teams`, `winnerTeamIndex`,
 * `finalScore.setsByTeam`, `games[].scoresByTeam`) with fallbacks to
 * legacy ID-based and side-based fields for un-migrated documents.
 */
function buildMatchResultCalculationStage(): mongoose.PipelineStage.AddFields {
  return {
    $addFields: {
      participantCount: { $size: { $ifNull: ['$participants', []] } },
      hasTeams: {
        $and: [
          { $isArray: '$teams' },
          { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
        ],
      },

      // --- Determine this player's team index (0 or 1) ---
      playerTeamIndex: {
        $cond: [
          // New model: search teams[].players
          {
            $and: [
              { $isArray: '$teams' },
              { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
            ],
          },
          {
            $cond: [
              {
                $in: [
                  '$participantsWithIndex.playerId',
                  { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                ],
              },
              0,
              1,
            ],
          },
          // Legacy fallback: positional
          {
            $cond: [
              { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
              '$participantsWithIndex.index',
              {
                $cond: [
                  { $lte: ['$participantsWithIndex.index', 1] },
                  0,
                  1,
                ],
              },
            ],
          },
        ],
      },

      // --- Determine winner ---
      won: {
        $let: {
          vars: {
            hasTeamsArr: {
              $and: [
                { $isArray: '$teams' },
                { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
              ],
            },
            pTeamIdx: {
              $cond: [
                {
                  $and: [
                    { $isArray: '$teams' },
                    { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                  ],
                },
                {
                  $cond: [
                    {
                      $in: [
                        '$participantsWithIndex.playerId',
                        { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                      ],
                    },
                    0,
                    1,
                  ],
                },
                null,
              ],
            },
          },
          in: {
            $cond: [
              // Priority 1: winnerTeamIndex (new model)
              { $ne: [{ $ifNull: ['$winnerTeamIndex', null] }, null] },
              { $eq: ['$$pTeamIdx', '$winnerTeamIndex'] },
              {
                $let: {
                  vars: {
                    canonicalWinnerId: {
                      $ifNull: ['$winnerId', { $ifNull: ['$winnerPlayerId', '$winner'] }],
                    },
                    playerOnSide1: {
                      $cond: [
                        { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                        { $eq: ['$participantsWithIndex.index', 0] },
                        { $lte: ['$participantsWithIndex.index', 1] },
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      // Priority 2: winnerId membership check
                      { $ne: ['$$canonicalWinnerId', null] },
                      {
                        $let: {
                          vars: {
                            winnerStr: { $toString: '$$canonicalWinnerId' },
                            side1Ids: {
                              $cond: [
                                { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                                [{ $toString: { $arrayElemAt: ['$participants', 0] } }],
                                [
                                  { $toString: { $arrayElemAt: ['$participants', 0] } },
                                  { $toString: { $ifNull: [{ $arrayElemAt: ['$participants', 1] }, ''] } },
                                ],
                              ],
                            },
                          },
                          in: {
                            $cond: [
                              '$$playerOnSide1',
                              { $in: ['$$winnerStr', '$$side1Ids'] },
                              { $not: [{ $in: ['$$winnerStr', '$$side1Ids'] }] },
                            ],
                          },
                        },
                      },
                      // Priority 3: legacy winnerSide
                      {
                        $cond: [
                          { $eq: ['$winnerSide', 'side1'] },
                          '$$playerOnSide1',
                          {
                            $cond: [
                              { $eq: ['$winnerSide', 'side2'] },
                              { $not: ['$$playerOnSide1'] },
                              false,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },

      // --- Points scored (team-indexed first, legacy fallback) ---
      pointsScored: {
        $reduce: {
          input: { $ifNull: ['$games', []] },
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              {
                $let: {
                  vars: {
                    gTeam: { $ifNull: ['$$this.scoresByTeam', null] },
                    pIdx: {
                      $cond: [
                        {
                          $and: [
                            { $isArray: '$teams' },
                            { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                          ],
                        },
                        {
                          $cond: [
                            {
                              $in: [
                                '$participantsWithIndex.playerId',
                                { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                              ],
                            },
                            0,
                            1,
                          ],
                        },
                        {
                          $cond: [
                            { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                            '$participantsWithIndex.index',
                            { $cond: [{ $lte: ['$participantsWithIndex.index', 1] }, 0, 1] },
                          ],
                        },
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      { $ne: ['$$gTeam', null] },
                      { $ifNull: [{ $arrayElemAt: ['$$gTeam', '$$pIdx'] }, 0] },
                      {
                        $cond: [
                          { $eq: ['$$pIdx', 0] },
                          { $ifNull: ['$$this.side1Score', 0] },
                          { $ifNull: ['$$this.side2Score', 0] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },

      // --- Points conceded ---
      pointsConceded: {
        $reduce: {
          input: { $ifNull: ['$games', []] },
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              {
                $let: {
                  vars: {
                    gTeam: { $ifNull: ['$$this.scoresByTeam', null] },
                    pIdx: {
                      $cond: [
                        {
                          $and: [
                            { $isArray: '$teams' },
                            { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                          ],
                        },
                        {
                          $cond: [
                            {
                              $in: [
                                '$participantsWithIndex.playerId',
                                { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                              ],
                            },
                            0,
                            1,
                          ],
                        },
                        {
                          $cond: [
                            { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                            '$participantsWithIndex.index',
                            { $cond: [{ $lte: ['$participantsWithIndex.index', 1] }, 0, 1] },
                          ],
                        },
                      ],
                    },
                    oppIdx: {
                      $cond: [
                        {
                          $and: [
                            { $isArray: '$teams' },
                            { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                          ],
                        },
                        {
                          $cond: [
                            {
                              $in: [
                                '$participantsWithIndex.playerId',
                                { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                              ],
                            },
                            1,
                            0,
                          ],
                        },
                        {
                          $cond: [
                            { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                            { $cond: [{ $eq: ['$participantsWithIndex.index', 0] }, 1, 0] },
                            { $cond: [{ $lte: ['$participantsWithIndex.index', 1] }, 1, 0] },
                          ],
                        },
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      { $ne: ['$$gTeam', null] },
                      { $ifNull: [{ $arrayElemAt: ['$$gTeam', '$$oppIdx'] }, 0] },
                      {
                        $cond: [
                          { $eq: ['$$pIdx', 0] },
                          { $ifNull: ['$$this.side2Score', 0] },
                          { $ifNull: ['$$this.side1Score', 0] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },

      // --- Sets won (team-indexed first, then setsById, then legacy) ---
      setsWon: {
        $let: {
          vars: {
            teamSets: { $ifNull: ['$finalScore.setsByTeam', null] },
            pTeamIdx: {
              $cond: [
                {
                  $and: [
                    { $isArray: '$teams' },
                    { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                  ],
                },
                {
                  $cond: [
                    {
                      $in: [
                        '$participantsWithIndex.playerId',
                        { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                      ],
                    },
                    0,
                    1,
                  ],
                },
                null,
              ],
            },
          },
          in: {
            $cond: [
              { $and: [{ $ne: ['$$teamSets', null] }, { $ne: ['$$pTeamIdx', null] }] },
              { $ifNull: [{ $arrayElemAt: ['$$teamSets', '$$pTeamIdx'] }, 0] },
              {
                $let: {
                  vars: {
                    byIdVal: {
                      $getField: {
                        field: { $toString: '$participantsWithIndex.playerId' },
                        input: { $ifNull: ['$finalScore.setsById', {}] },
                      },
                    },
                    playerOnSide1: {
                      $cond: [
                        { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                        { $eq: ['$participantsWithIndex.index', 0] },
                        { $lte: ['$participantsWithIndex.index', 1] },
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      { $ne: ['$$byIdVal', null] },
                      { $ifNull: ['$$byIdVal', 0] },
                      {
                        $cond: [
                          '$$playerOnSide1',
                          { $ifNull: ['$finalScore.side1Sets', 0] },
                          { $ifNull: ['$finalScore.side2Sets', 0] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },

      // --- Sets lost ---
      setsLost: {
        $let: {
          vars: {
            teamSets: { $ifNull: ['$finalScore.setsByTeam', null] },
            oppTeamIdx: {
              $cond: [
                {
                  $and: [
                    { $isArray: '$teams' },
                    { $eq: [{ $size: { $ifNull: ['$teams', []] } }, 2] },
                  ],
                },
                {
                  $cond: [
                    {
                      $in: [
                        '$participantsWithIndex.playerId',
                        { $ifNull: [{ $arrayElemAt: ['$teams.players', 0] }, []] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
                null,
              ],
            },
          },
          in: {
            $cond: [
              { $and: [{ $ne: ['$$teamSets', null] }, { $ne: ['$$oppTeamIdx', null] }] },
              { $ifNull: [{ $arrayElemAt: ['$$teamSets', '$$oppTeamIdx'] }, 0] },
              {
                $let: {
                  vars: {
                    playerOnSide1: {
                      $cond: [
                        { $eq: [{ $size: { $ifNull: ['$participants', []] } }, 2] },
                        { $eq: ['$participantsWithIndex.index', 0] },
                        { $lte: ['$participantsWithIndex.index', 1] },
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      '$$playerOnSide1',
                      { $ifNull: ['$finalScore.side2Sets', 0] },
                      { $ifNull: ['$finalScore.side1Sets', 0] },
                    ],
                  },
                },
              },
            ],
          },
        },
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
      // Match points (ITTF: 2 for win, 0 for loss, 1 for draw if applicable)
      // Note: Draws are rare in table tennis, but we calculate match points for ITTF compliance
      matchPoints: {
        $add: [
          { $multiply: ['$wins', 2] },
          { $multiply: [{ $ifNull: ['$draws', 0] }, 1] },
        ],
      },
      // Match differential (wins - losses) for table tennis ranking
      matchDifferential: {
        $subtract: ['$wins', '$losses'],
      },
      // Set differential (setsWon - setsLost) for table tennis ranking
      setDifferential: {
        $subtract: ['$setsWon', '$setsLost'],
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
    matchFilter['player.gender'] = filters.gender;
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
 * Stage 12: Sort by table tennis standard ranking
 */
function buildSortStage(): mongoose.PipelineStage.Sort {
  // Initial sort by match points (ITTF primary criterion)
  // Full ITTF sorting with head-to-head will be applied in post-processing
  // This initial sort helps with performance and ensures match points are primary
  return {
    $sort: {
      matchPoints: -1,
      wins: -1,
      matchDifferential: -1,
      setDifferential: -1,
      winRate: -1,
      matchesPlayed: -1,
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

