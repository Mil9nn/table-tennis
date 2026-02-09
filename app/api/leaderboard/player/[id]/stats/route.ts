import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Ensure Tournament model is registered
    Tournament;

    const { id: playerId } = await context.params;
    const { searchParams } = new URL(request.url);
    const matchType = searchParams.get("type");

    // Validate matchType
    if (!matchType || !["singles", "doubles", "mixed_doubles"].includes(matchType)) {
      return NextResponse.json(
        { error: "Invalid or missing match type. Must be singles, doubles, or mixed_doubles" },
        { status: 400 }
      );
    }

    // Verify player exists
    const player = await User.findById(playerId).select("username fullName profileImage").lean();
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Use MongoDB aggregation to calculate points - same approach as main leaderboard
    // This ensures consistency and handles edge cases (empty games, missing scores, etc.)
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    
    const individualAggregationPipeline: mongoose.PipelineStage[] = [
      // Stage 1: Filter matches for this player
      {
        $match: {
          participants: playerObjectId,
          status: "completed",
          matchType: matchType,
          matchCategory: "individual",
        },
      },
      // Stage 2: Add participant index
      {
        $addFields: {
          participantsWithIndex: {
            $map: {
              input: { $range: [0, { $size: "$participants" }] },
              as: "idx",
              in: {
                playerId: { $arrayElemAt: ["$participants", "$$idx"] },
                index: "$$idx",
              },
            },
          },
        },
      },
      // Stage 3: Unwind participants
      { $unwind: "$participantsWithIndex" },
      // Stage 4: Filter to this player only
      {
        $match: {
          "participantsWithIndex.playerId": playerObjectId,
        },
      },
      // Stage 5: Calculate points using same logic as main leaderboard
      {
        $addFields: {
          userSide: {
            $cond: [
              { $eq: ["$matchType", "singles"] },
              {
                $cond: [
                  { $eq: ["$participantsWithIndex.index", 0] },
                  "side1",
                  "side2",
                ],
              },
              {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$participantsWithIndex.index", 0] },
                      { $eq: ["$participantsWithIndex.index", 1] },
                    ],
                  },
                  "side1",
                  "side2",
                ],
              },
            ],
          },
          // Calculate points scored - same as aggregation builder
          pointsScored: {
            $reduce: {
              input: { $ifNull: ["$games", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $eq: ["$matchType", "singles"] },
                      {
                        $cond: [
                          { $eq: ["$participantsWithIndex.index", 0] },
                          { $ifNull: ["$$this.side1Score", 0] },
                          { $ifNull: ["$$this.side2Score", 0] },
                        ],
                      },
                      {
                        $cond: [
                          {
                            $or: [
                              { $eq: ["$participantsWithIndex.index", 0] },
                              { $eq: ["$participantsWithIndex.index", 1] },
                            ],
                          },
                          { $ifNull: ["$$this.side1Score", 0] },
                          { $ifNull: ["$$this.side2Score", 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          // Calculate points conceded
          pointsConceded: {
            $reduce: {
              input: { $ifNull: ["$games", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $eq: ["$matchType", "singles"] },
                      {
                        $cond: [
                          { $eq: ["$participantsWithIndex.index", 0] },
                          { $ifNull: ["$$this.side2Score", 0] },
                          { $ifNull: ["$$this.side1Score", 0] },
                        ],
                      },
                      {
                        $cond: [
                          {
                            $or: [
                              { $eq: ["$participantsWithIndex.index", 0] },
                              { $eq: ["$participantsWithIndex.index", 1] },
                            ],
                          },
                          { $ifNull: ["$$this.side2Score", 0] },
                          { $ifNull: ["$$this.side1Score", 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          // Calculate sets
          setsWon: {
            $cond: [
              { $eq: ["$matchType", "singles"] },
              {
                $cond: [
                  { $eq: ["$participantsWithIndex.index", 0] },
                  { $ifNull: ["$finalScore.side1Sets", 0] },
                  { $ifNull: ["$finalScore.side2Sets", 0] },
                ],
              },
              {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$participantsWithIndex.index", 0] },
                      { $eq: ["$participantsWithIndex.index", 1] },
                    ],
                  },
                  { $ifNull: ["$finalScore.side1Sets", 0] },
                  { $ifNull: ["$finalScore.side2Sets", 0] },
                ],
              },
            ],
          },
          setsLost: {
            $cond: [
              { $eq: ["$matchType", "singles"] },
              {
                $cond: [
                  { $eq: ["$participantsWithIndex.index", 0] },
                  { $ifNull: ["$finalScore.side2Sets", 0] },
                  { $ifNull: ["$finalScore.side1Sets", 0] },
                ],
              },
              {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$participantsWithIndex.index", 0] },
                      { $eq: ["$participantsWithIndex.index", 1] },
                    ],
                  },
                  { $ifNull: ["$finalScore.side2Sets", 0] },
                  { $ifNull: ["$finalScore.side1Sets", 0] },
                ],
              },
            ],
          },
          // Determine if won
          won: {
            $cond: [
              { $eq: ["$matchType", "singles"] },
              {
                $cond: [
                  { $eq: ["$participantsWithIndex.index", 0] },
                  { $eq: ["$winnerSide", "side1"] },
                  { $eq: ["$winnerSide", "side2"] },
                ],
              },
              {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$participantsWithIndex.index", 0] },
                      { $eq: ["$participantsWithIndex.index", 1] },
                    ],
                  },
                  { $eq: ["$winnerSide", "side1"] },
                  { $eq: ["$winnerSide", "side2"] },
                ],
              },
            ],
          },
        },
      },
      // Stage 6: Group to aggregate stats
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          wins: { $sum: { $cond: ["$won", 1, 0] } },
          losses: { $sum: { $cond: ["$won", 0, 1] } },
          totalPointsScored: { $sum: "$pointsScored" },
          totalPointsConceded: { $sum: "$pointsConceded" },
          setsWon: { $sum: "$setsWon" },
          setsLost: { $sum: "$setsLost" },
          matches: {
            $push: {
              matchId: { $toString: "$_id" },
              tournament: "$tournament",
              finalScore: "$finalScore",
              winnerSide: "$winnerSide",
              createdAt: "$createdAt",
              pointsScored: "$pointsScored",
              pointsConceded: "$pointsConceded",
            },
          },
        },
      },
    ];

    const individualAggResult = await IndividualMatch.aggregate(individualAggregationPipeline).allowDiskUse(true);
    const individualStats = individualAggResult[0] || {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPointsScored: 0,
      totalPointsConceded: 0,
      setsWon: 0,
      setsLost: 0,
      matches: [],
    };


    const distribution = { individual: 0, team: 0, tournament: 0 };


    // Use aggregated stats
    let totalMatches = individualStats.totalMatches;
    let wins = individualStats.wins;
    let losses = individualStats.losses;
    let setsWon = individualStats.setsWon;
    let setsLost = individualStats.setsLost;
    let totalPointsScored = individualStats.totalPointsScored;
    let totalPointsConceded = individualStats.totalPointsConceded;
    let totalServes = 0;
    let pointsWonOnServe = 0;

    // Still need to calculate serve stats from individual matches (requires games with shots)
    const individualMatchesForServes = await IndividualMatch.find({
      participants: playerId,
      status: "completed",
      matchType: matchType,
    })
      .select("participants games")
      .lean();

    individualMatchesForServes.forEach((match: any) => {
      if (match.games && Array.isArray(match.games)) {
        match.games.forEach((game: any) => {
          if (!game || !game.shots) return;

          // Use the same logic as computeServeStats in lib/match-stats-utils.tsx
          // For each shot: if shot.server === playerId, it's a serve
          // If shot.player === shot.server === playerId, the player won the point on their serve
          game.shots.forEach((shot: any) => {
            if (!shot.server) return;

            // Extract server ID
            let serverId: string | null = null;
            if (typeof shot.server === "string") {
              serverId = shot.server;
            } else if (shot.server?._id) {
              serverId = shot.server._id.toString();
            } else if (shot.server) {
              serverId = shot.server.toString();
            }

            // Extract player ID (point winner)
            let pointWinnerId: string | null = null;
            if (typeof shot.player === "string") {
              pointWinnerId = shot.player;
            } else if (shot.player?._id) {
              pointWinnerId = shot.player._id.toString();
            } else if (shot.player) {
              pointWinnerId = shot.player.toString();
            }

            if (!serverId || !pointWinnerId) return;

            // Count serves by this player
            if (serverId === playerId) {
              totalServes++;

              // Check if the player won the point on their serve
              if (pointWinnerId === serverId) {
                pointsWonOnServe++;
              }
            }
          });
        });
      }
    });

    // Process team matches using aggregation for points calculation
    const teamAggregationPipeline: mongoose.PipelineStage[] = [
      // Stage 1: Filter team matches where player participated
      {
        $match: {
          status: "completed",
          $or: [
            { "team1.players.user": playerObjectId },
            { "team2.players.user": playerObjectId },
          ],
        },
      },
      // Stage 2: Unwind subMatches
      { $unwind: "$subMatches" },
      // Stage 3: Filter submatches by matchType
      {
        $match: {
          "subMatches.matchType": matchType,
        },
      },
      // Stage 4: Check if player is in this submatch
      {
        $addFields: {
          playerInSubmatch: {
            $or: [
              {
                $in: [
                  playerObjectId,
                  {
                    $map: {
                      input: {
                        $cond: [
                          { $isArray: "$subMatches.playerTeam1" },
                          "$subMatches.playerTeam1",
                          ["$subMatches.playerTeam1"],
                        ],
                      },
                      as: "p",
                      in: { $ifNull: ["$$p", null] },
                    },
                  },
                ],
              },
              {
                $in: [
                  playerObjectId,
                  {
                    $map: {
                      input: {
                        $cond: [
                          { $isArray: "$subMatches.playerTeam2" },
                          "$subMatches.playerTeam2",
                          ["$subMatches.playerTeam2"],
                        ],
                      },
                      as: "p",
                      in: { $ifNull: ["$$p", null] },
                    },
                  },
                ],
              },
            ],
          },
          userInTeam1: {
            $in: [
              playerObjectId,
              {
                $map: {
                  input: {
                    $cond: [
                      { $isArray: "$subMatches.playerTeam1" },
                      "$subMatches.playerTeam1",
                      ["$subMatches.playerTeam1"],
                    ],
                  },
                  as: "p",
                  in: { $ifNull: ["$$p", null] },
                },
              },
            ],
          },
        },
      },
      // Stage 5: Filter to only submatches where player participated
      {
        $match: {
          playerInSubmatch: true,
        },
      },
      // Stage 6: Calculate points using same logic as main leaderboard
      {
        $addFields: {
          // Calculate points scored
          pointsScored: {
            $reduce: {
              input: { $ifNull: ["$subMatches.games", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      "$userInTeam1",
                      { $ifNull: ["$$this.team1Score", 0] },
                      { $ifNull: ["$$this.team2Score", 0] },
                    ],
                  },
                ],
              },
            },
          },
          // Calculate points conceded
          pointsConceded: {
            $reduce: {
              input: { $ifNull: ["$subMatches.games", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      "$userInTeam1",
                      { $ifNull: ["$$this.team2Score", 0] },
                      { $ifNull: ["$$this.team1Score", 0] },
                    ],
                  },
                ],
              },
            },
          },
          // Calculate sets
          setsWon: {
            $cond: [
              "$userInTeam1",
              { $ifNull: ["$subMatches.finalScore.team1Games", 0] },
              { $ifNull: ["$subMatches.finalScore.team2Games", 0] },
            ],
          },
          setsLost: {
            $cond: [
              "$userInTeam1",
              { $ifNull: ["$subMatches.finalScore.team2Games", 0] },
              { $ifNull: ["$subMatches.finalScore.team1Games", 0] },
            ],
          },
          // Determine if won
          won: {
            $cond: [
              "$userInTeam1",
              { $eq: ["$subMatches.winnerSide", "team1"] },
              { $eq: ["$subMatches.winnerSide", "team2"] },
            ],
          },
        },
      },
      // Stage 7: Group to aggregate stats
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          wins: { $sum: { $cond: ["$won", 1, 0] } },
          losses: { $sum: { $cond: ["$won", 0, 1] } },
          totalPointsScored: { $sum: "$pointsScored" },
          totalPointsConceded: { $sum: "$pointsConceded" },
          setsWon: { $sum: "$setsWon" },
          setsLost: { $sum: "$setsLost" },
          matches: {
            $push: {
              matchId: { $toString: "$_id" },
              submatchId: { $toString: "$subMatches._id" },
              tournament: "$tournament",
              finalScore: "$subMatches.finalScore",
              winnerSide: "$subMatches.winnerSide",
              createdAt: "$createdAt",
              pointsScored: "$pointsScored",
              pointsConceded: "$pointsConceded",
              team1Name: "$team1.name",
              team2Name: "$team2.name",
              userInTeam1: "$userInTeam1",
            },
          },
        },
      },
    ];

    const teamAggResult = await TeamMatch.aggregate(teamAggregationPipeline).allowDiskUse(true);
    const teamStats = teamAggResult[0] || {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPointsScored: 0,
      totalPointsConceded: 0,
      setsWon: 0,
      setsLost: 0,
      matches: [],
    };

    // Add team stats to totals
    totalMatches += teamStats.totalMatches;
    wins += teamStats.wins;
    losses += teamStats.losses;
    setsWon += teamStats.setsWon;
    setsLost += teamStats.setsLost;
    totalPointsScored += teamStats.totalPointsScored;
    totalPointsConceded += teamStats.totalPointsConceded;



    // Calculate serve stats from team matches (requires games with shots)
    const teamMatchesForServes = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": playerId },
        { "team2.players.user": playerId },
      ],
    })
      .select("subMatches")
      .lean();

    teamMatchesForServes.forEach((teamMatch: any) => {
      teamMatch.subMatches?.forEach((sub: any) => {
        if (sub.matchType !== matchType) return;

        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p?._id?.toString() || p?.toString()).filter(Boolean);

        if (!playerIds.includes(playerId.toString())) return;

        const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
          .map((p: any) => p?._id?.toString() || p?.toString())
          .includes(playerId.toString());

        if (sub.games && Array.isArray(sub.games)) {
          sub.games.forEach((game: any) => {
            if (!game || !game.shots) return;

            // Use the same logic as computeServeStats in lib/match-stats-utils.tsx
            // For each shot: if shot.server === playerId, it's a serve
            // If shot.player === shot.server === playerId, the player won the point on their serve
            game.shots.forEach((shot: any) => {
              if (!shot.server) return;

              // Extract server ID
              let serverId: string | null = null;
              if (typeof shot.server === "string") {
                serverId = shot.server;
              } else if (shot.server?._id) {
                serverId = shot.server._id.toString();
              } else if (shot.server) {
                serverId = shot.server.toString();
              }

              // Extract player ID (point winner)
              let pointWinnerId: string | null = null;
              if (typeof shot.player === "string") {
                pointWinnerId = shot.player;
              } else if (shot.player?._id) {
                pointWinnerId = shot.player._id.toString();
              } else if (shot.player) {
                pointWinnerId = shot.player.toString();
              }

              if (!serverId || !pointWinnerId) return;

              // Count serves by this player
              if (serverId === playerId) {
                totalServes++;

                // Check if the player won the point on their serve
                if (pointWinnerId === serverId) {
                  pointsWonOnServe++;
                }
              }
            });
          });
        }
      });
    });

    // Calculate derived stats
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const totalSets = setsWon + setsLost;
    const avgPerSet = totalSets > 0 ? totalPointsScored / totalSets : 0;
    const avgConcededPerSet = totalSets > 0 ? totalPointsConceded / totalSets : 0;
    const serveWinPercentage = totalServes > 0 ? (pointsWonOnServe / totalServes) * 100 : 0;


    return NextResponse.json({
      success: true,
      playerId,
      matchType,
      stats: {
        totalMatches,
        wins,
        losses,
        winRate: Math.round(winRate * 10) / 10,
        setsWon,
        setsLost,
        points: {
          totalScored: totalPointsScored,
          totalConceded: totalPointsConceded,
          differential: totalPointsScored - totalPointsConceded,
          avgPerSet: Math.round(avgPerSet * 10) / 10,
          avgConcededPerSet: Math.round(avgConcededPerSet * 10) / 10,
        },
        serve: {
          totalServes,
          pointsWonOnServe,
          serveWinPercentage: Math.round(serveWinPercentage * 10) / 10,
        },
        distribution,
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch player statistics" },
      { status: 500 }
    );
  }
}
