import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import { sortLeaderboardWithITTF, type HeadToHeadMap, type LeaderboardEntry } from "@/lib/leaderboard/ittfSorting";

interface PlayerLeaderboardStats {
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  rank: number;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
    currentStreak: number;
    bestStreak: number;
  };
  sources: {
    individual: { matches: number; wins: number };
    team: { matches: number; wins: number };
    tournament: { matches: number; wins: number };
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const matchType = searchParams.get("type") || "singles"; // singles, doubles, mixed_doubles
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const playerStatsMap = new Map<string, any>();

    // 1. Get stats from Individual Matches
    const individualMatches = await IndividualMatch.find({
      status: "completed",
      matchType: matchType,
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    for (const match of individualMatches as any[]) {
      processIndividualMatch(match, playerStatsMap, "individual");
    }

    // 2. Get stats from Team Match subMatches (singles from team matches count toward singles leaderboard)
    const teamMatches = await TeamMatch.find({
      status: "completed",
    })
      .populate("team1.players.user", "username fullName profileImage")
      .populate("team2.players.user", "username fullName profileImage")
      .populate("subMatches.playerTeam1", "username fullName profileImage")
      .populate("subMatches.playerTeam2", "username fullName profileImage")
      .lean();

    for (const teamMatch of teamMatches as any[]) {
      if (teamMatch.subMatches) {
        for (const subMatch of teamMatch.subMatches) {
          if (subMatch.status === "completed" && subMatch.matchType === matchType) {
            processTeamSubMatch(subMatch, playerStatsMap);
          }
        }
      }
    }

    // 3. Get stats from Tournament matches (already counted via IndividualMatch if linked)
    // Tournament standings give us additional context but matches are tracked via IndividualMatch
    const tournaments = await Tournament.find({
      status: { $in: ["completed", "in_progress"] },
      matchType: matchType,
      drawGenerated: true,
    })
      .populate("standings.participant", "username fullName profileImage")
      .lean();

    for (const tournament of tournaments as any[]) {
      processTournamentStandings(tournament, playerStatsMap);
    }

    // Build final leaderboard and head-to-head map
    const leaderboard: PlayerLeaderboardStats[] = [];
    const headToHeadMap: HeadToHeadMap = new Map();

    for (const [playerId, data] of playerStatsMap.entries()) {
      if (data.stats.totalMatches === 0) continue;

      const winRate =
        data.stats.totalMatches > 0
          ? (data.stats.wins / data.stats.totalMatches) * 100
          : 0;

      leaderboard.push({
        player: data.player,
        rank: 0,
        stats: {
          ...data.stats,
          winRate: Math.round(winRate * 10) / 10,
        },
        sources: data.sources,
      });

      // Add to head-to-head map
      headToHeadMap.set(playerId, data.headToHead);
    }

    // Convert to format expected by ITTF sorting utility
    const leaderboardEntries: LeaderboardEntry[] = leaderboard.map((entry) => ({
      playerId: entry.player._id,
      wins: entry.stats.wins,
      losses: entry.stats.losses,
      setsWon: entry.stats.setsWon,
      setsLost: entry.stats.setsLost,
      pointsScored: entry.stats.pointsScored,
      pointsConceded: entry.stats.pointsConceded,
      originalEntry: entry, // Keep reference to original entry
    }));

    // Sort using ITTF-compliant rules (skip head-to-head for leaderboards)
    const sortedEntries = sortLeaderboardWithITTF(leaderboardEntries, headToHeadMap, true);

    // Map sorted entries back to leaderboard format
    const sortedLeaderboard = sortedEntries.map((entry) => {
      const original = entry.originalEntry as PlayerLeaderboardStats;
      original.rank = entry.rank || 0;
      return original;
    });

    const total = sortedLeaderboard.length;
    const paginatedLeaderboard = sortedLeaderboard.slice(skip, skip + limit);
    const hasMore = skip + paginatedLeaderboard.length < total;

    return NextResponse.json({
      leaderboard: paginatedLeaderboard,
      pagination: {
        total,
        skip,
        limit,
        hasMore,
      },
      matchType,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error fetching unified leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

function initPlayerStats(player: any) {
  return {
    player: {
      _id: player._id.toString(),
      username: player.username,
      fullName: player.fullName,
      profileImage: player.profileImage,
    },
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      setsWon: 0,
      setsLost: 0,
      pointsScored: 0,
      pointsConceded: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    sources: {
      individual: { matches: 0, wins: 0 },
      team: { matches: 0, wins: 0 },
      tournament: { matches: 0, wins: 0 },
    },
    matchDates: [] as Date[],
    headToHead: new Map<string, number>(), // opponentId -> matchPoints (2 for win, 0 for loss)
  };
}

function processIndividualMatch(
  match: any,
  playerStatsMap: Map<string, any>,
  source: "individual" | "tournament"
) {
  const participants = match.participants;
  if (!participants || participants.length < 2) return;

  // Process each participant
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    if (!participant || !participant._id) continue;

    const playerId = participant._id.toString();

    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, initPlayerStats(participant));
    }

    const playerData = playerStatsMap.get(playerId);

    // Determine if this player won
    const side = i === 0 ? "side1" : "side2";
    const playerSets = match.finalScore?.[`${side}Sets`] || 0;
    const opponentSets =
      match.finalScore?.[side === "side1" ? "side2Sets" : "side1Sets"] || 0;

    const won = playerSets > opponentSets;

    // Calculate points from games
    let pointsScored = 0;
    let pointsConceded = 0;
    
    if (match.games && Array.isArray(match.games)) {
      match.games.forEach((game: any) => {
        if (side === "side1") {
          pointsScored += game.side1Score || 0;
          pointsConceded += game.side2Score || 0;
        } else {
          pointsScored += game.side2Score || 0;
          pointsConceded += game.side1Score || 0;
        }
      });
    }

    playerData.stats.totalMatches++;
    playerData.stats.setsWon += playerSets;
    playerData.stats.setsLost += opponentSets;
    playerData.stats.pointsScored += pointsScored;
    playerData.stats.pointsConceded += pointsConceded;

    if (won) {
      playerData.stats.wins++;
      playerData.sources[source].wins++;
    } else {
      playerData.stats.losses++;
    }

    playerData.sources[source].matches++;
    playerData.matchDates.push(new Date(match.createdAt));

    // Track head-to-head: find opponent and record match points
    const opponentIndex = i === 0 ? 1 : 0;
    const opponent = participants[opponentIndex];
    if (opponent && opponent._id) {
      const opponentId = opponent._id.toString();
      // ITTF: 2 points for win, 0 for loss (no draws in individual matches typically)
      const matchPoints = won ? 2 : 0;
      playerData.headToHead.set(opponentId, matchPoints);
    }

    // Update streak
    updateStreak(playerData, won);
  }
}

function processTeamSubMatch(subMatch: any, playerStatsMap: Map<string, any>) {
  const team1Players = subMatch.playerTeam1 || [];
  const team2Players = subMatch.playerTeam2 || [];

  const team1Games = subMatch.finalScore?.team1Games || 0;
  const team2Games = subMatch.finalScore?.team2Games || 0;
  const team1Won = team1Games > team2Games;

  // Calculate points from games
  let team1PointsScored = 0;
  let team1PointsConceded = 0;
  let team2PointsScored = 0;
  let team2PointsConceded = 0;

  if (subMatch.games && Array.isArray(subMatch.games)) {
    subMatch.games.forEach((game: any) => {
      team1PointsScored += game.team1Score || 0;
      team1PointsConceded += game.team2Score || 0;
      team2PointsScored += game.team2Score || 0;
      team2PointsConceded += game.team1Score || 0;
    });
  }

  // Process team 1 players
  for (const player of team1Players) {
    if (!player || !player._id) continue;
    const playerId = player._id.toString();

    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, initPlayerStats(player));
    }

    const playerData = playerStatsMap.get(playerId);
    playerData.stats.totalMatches++;
    playerData.stats.setsWon += team1Games;
    playerData.stats.setsLost += team2Games;
    playerData.stats.pointsScored += team1PointsScored;
    playerData.stats.pointsConceded += team1PointsConceded;

    if (team1Won) {
      playerData.stats.wins++;
      playerData.sources.team.wins++;
    } else {
      playerData.stats.losses++;
    }

    // Track head-to-head with all opponents in team 2
    const matchPoints = team1Won ? 2 : 0;
    for (const opponent of team2Players) {
      if (opponent && opponent._id) {
        const opponentId = opponent._id.toString();
        playerData.headToHead.set(opponentId, matchPoints);
      }
    }

    playerData.sources.team.matches++;
    updateStreak(playerData, team1Won);
  }

  // Process team 2 players
  for (const player of team2Players) {
    if (!player || !player._id) continue;
    const playerId = player._id.toString();

    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, initPlayerStats(player));
    }

    const playerData = playerStatsMap.get(playerId);
    playerData.stats.totalMatches++;
    playerData.stats.setsWon += team2Games;
    playerData.stats.setsLost += team1Games;
    playerData.stats.pointsScored += team2PointsScored;
    playerData.stats.pointsConceded += team2PointsConceded;

    if (!team1Won) {
      playerData.stats.wins++;
      playerData.sources.team.wins++;
    } else {
      playerData.stats.losses++;
    }

    // Track head-to-head with all opponents in team 1
    const matchPoints = !team1Won ? 2 : 0;
    for (const opponent of team1Players) {
      if (opponent && opponent._id) {
        const opponentId = opponent._id.toString();
        playerData.headToHead.set(opponentId, matchPoints);
      }
    }

    playerData.sources.team.matches++;
    updateStreak(playerData, !team1Won);
  }
}

function processTournamentStandings(
  tournament: any,
  playerStatsMap: Map<string, any>
) {
  // Tournament stats are informational - matches are tracked via IndividualMatch
  // But we can use standings to identify tournament participants
  if (!tournament.standings) return;

  for (const standing of tournament.standings) {
    if (!standing.participant || !standing.participant._id) continue;

    const playerId = standing.participant._id.toString();

    if (!playerStatsMap.has(playerId)) {
      playerStatsMap.set(playerId, initPlayerStats(standing.participant));
    }

    // Tournament matches already counted via IndividualMatch linked to tournament
    // This is just for ensuring we have the player in our map
  }
}

function updateStreak(playerData: any, won: boolean) {
  if (won) {
    if (playerData.stats.currentStreak >= 0) {
      playerData.stats.currentStreak++;
    } else {
      playerData.stats.currentStreak = 1;
    }
    playerData.stats.bestStreak = Math.max(
      playerData.stats.bestStreak,
      playerData.stats.currentStreak
    );
  } else {
    if (playerData.stats.currentStreak <= 0) {
      playerData.stats.currentStreak--;
    } else {
      playerData.stats.currentStreak = -1;
    }
  }
}
