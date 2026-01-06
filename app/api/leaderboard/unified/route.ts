import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";

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

    // Build final leaderboard
    const leaderboard: PlayerLeaderboardStats[] = [];

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
    }

    // Sort by wins first, then win rate
    leaderboard.sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      return b.stats.winRate - a.stats.winRate;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const total = leaderboard.length;
    const paginatedLeaderboard = leaderboard.slice(skip, skip + limit);
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
      currentStreak: 0,
      bestStreak: 0,
    },
    sources: {
      individual: { matches: 0, wins: 0 },
      team: { matches: 0, wins: 0 },
      tournament: { matches: 0, wins: 0 },
    },
    matchDates: [] as Date[],
  };
}

function processIndividualMatch(
  match: any,
  playerStatsMap: Map<string, any>,
  source: "individual" | "tournament"
) {
  const participants = match.participants;
  if (!participants || participants.length < 2) return;

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

    playerData.stats.totalMatches++;
    playerData.stats.setsWon += playerSets;
    playerData.stats.setsLost += opponentSets;

    if (won) {
      playerData.stats.wins++;
      playerData.sources[source].wins++;
    } else {
      playerData.stats.losses++;
    }

    playerData.sources[source].matches++;
    playerData.matchDates.push(new Date(match.createdAt));

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

    if (team1Won) {
      playerData.stats.wins++;
      playerData.sources.team.wins++;
    } else {
      playerData.stats.losses++;
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

    if (!team1Won) {
      playerData.stats.wins++;
      playerData.sources.team.wins++;
    } else {
      playerData.stats.losses++;
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
