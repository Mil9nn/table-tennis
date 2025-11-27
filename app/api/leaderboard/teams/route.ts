import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";

interface TeamLeaderboardEntry {
  rank: number;
  team: {
    _id: string;
    name: string;
    logo?: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    subMatchesWon: number;
    subMatchesLost: number;
    currentStreak: number;
  };
  playerStats: Array<{
    player: {
      _id: string;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
    subMatchesPlayed: number;
    subMatchesWon: number;
    subMatchesLost: number;
    winRate: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get all teams
    const teams = await Team.find({})
      .populate("players.user", "username fullName profileImage")
      .populate("captain", "username fullName profileImage")
      .lean();

    // Get all completed team matches
    const teamMatches = await TeamMatch.find({ status: "completed" })
      .populate("team1.players.user", "username fullName profileImage")
      .populate("team2.players.user", "username fullName profileImage")
      .populate("subMatches.playerTeam1", "username fullName profileImage")
      .populate("subMatches.playerTeam2", "username fullName profileImage")
      .sort({ createdAt: 1 })
      .lean();

    const teamStatsMap = new Map<string, any>();

    // Initialize team stats
    for (const team of teams as any[]) {
      teamStatsMap.set(team.name, {
        team: {
          _id: team._id.toString(),
          name: team.name,
          logo: team.logo,
        },
        stats: {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          subMatchesWon: 0,
          subMatchesLost: 0,
          currentStreak: 0,
        },
        playerStatsMap: new Map<string, any>(),
        matchResults: [] as boolean[],
      });
    }

    // Process team matches
    for (const match of teamMatches as any[]) {
      const team1Name = match.team1?.name;
      const team2Name = match.team2?.name;

      if (!team1Name || !team2Name) continue;

      // Ensure teams exist in map
      if (!teamStatsMap.has(team1Name)) {
        teamStatsMap.set(team1Name, createEmptyTeamStats(team1Name, match.team1));
      }
      if (!teamStatsMap.has(team2Name)) {
        teamStatsMap.set(team2Name, createEmptyTeamStats(team2Name, match.team2));
      }

      const team1Stats = teamStatsMap.get(team1Name);
      const team2Stats = teamStatsMap.get(team2Name);

      const team1MatchesWon = match.finalScore?.team1Matches || 0;
      const team2MatchesWon = match.finalScore?.team2Matches || 0;

      // Update team stats
      team1Stats.stats.totalMatches++;
      team2Stats.stats.totalMatches++;

      team1Stats.stats.subMatchesWon += team1MatchesWon;
      team1Stats.stats.subMatchesLost += team2MatchesWon;
      team2Stats.stats.subMatchesWon += team2MatchesWon;
      team2Stats.stats.subMatchesLost += team1MatchesWon;

      if (team1MatchesWon > team2MatchesWon) {
        team1Stats.stats.wins++;
        team2Stats.stats.losses++;
        team1Stats.matchResults.push(true);
        team2Stats.matchResults.push(false);
      } else if (team2MatchesWon > team1MatchesWon) {
        team2Stats.stats.wins++;
        team1Stats.stats.losses++;
        team1Stats.matchResults.push(false);
        team2Stats.matchResults.push(true);
      } else {
        team1Stats.stats.ties++;
        team2Stats.stats.ties++;
      }

      // Process player stats from submatches
      if (match.subMatches) {
        for (const subMatch of match.subMatches) {
          if (subMatch.status !== "completed") continue;

          const team1Won =
            (subMatch.finalScore?.team1Sets || 0) >
            (subMatch.finalScore?.team2Sets || 0);

          // Team 1 players
          for (const player of subMatch.playerTeam1 || []) {
            if (!player?._id) continue;
            updatePlayerStats(team1Stats.playerStatsMap, player, team1Won);
          }

          // Team 2 players
          for (const player of subMatch.playerTeam2 || []) {
            if (!player?._id) continue;
            updatePlayerStats(team2Stats.playerStatsMap, player, !team1Won);
          }
        }
      }
    }

    // Build leaderboard
    const leaderboard: TeamLeaderboardEntry[] = [];

    for (const [teamName, data] of teamStatsMap.entries()) {
      if (data.stats.totalMatches === 0) continue;

      // Calculate win rate
      data.stats.winRate =
        data.stats.totalMatches > 0
          ? Math.round(
              (data.stats.wins / data.stats.totalMatches) * 100 * 10
            ) / 10
          : 0;

      // Calculate current streak
      const results = data.matchResults;
      let streak = 0;
      for (let i = results.length - 1; i >= 0; i--) {
        if (i === results.length - 1) {
          streak = results[i] ? 1 : -1;
        } else if (
          (streak > 0 && results[i]) ||
          (streak < 0 && !results[i])
        ) {
          streak += streak > 0 ? 1 : -1;
        } else {
          break;
        }
      }
      data.stats.currentStreak = streak;

      // Convert player stats map to array
      const playerStats: TeamLeaderboardEntry["playerStats"] = [];
      for (const [playerId, pStats] of data.playerStatsMap.entries()) {
        const winRate =
          pStats.subMatchesPlayed > 0
            ? Math.round(
                (pStats.subMatchesWon / pStats.subMatchesPlayed) * 100 * 10
              ) / 10
            : 0;

        playerStats.push({
          player: pStats.player,
          subMatchesPlayed: pStats.subMatchesPlayed,
          subMatchesWon: pStats.subMatchesWon,
          subMatchesLost: pStats.subMatchesLost,
          winRate,
        });
      }

      // Sort players by wins
      playerStats.sort((a, b) => b.subMatchesWon - a.subMatchesWon);

      leaderboard.push({
        rank: 0,
        team: data.team,
        stats: data.stats,
        playerStats,
      });
    }

    // Sort by wins, then win rate
    leaderboard.sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      return b.stats.winRate - a.stats.winRate;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, limit),
      total: leaderboard.length,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch team leaderboard" },
      { status: 500 }
    );
  }
}

function createEmptyTeamStats(name: string, teamInfo: any) {
  return {
    team: {
      _id: "",
      name: name,
      logo: undefined,
    },
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      subMatchesWon: 0,
      subMatchesLost: 0,
      currentStreak: 0,
    },
    playerStatsMap: new Map<string, any>(),
    matchResults: [] as boolean[],
  };
}

function updatePlayerStats(
  playerStatsMap: Map<string, any>,
  player: any,
  won: boolean
) {
  const playerId = player._id.toString();

  if (!playerStatsMap.has(playerId)) {
    playerStatsMap.set(playerId, {
      player: {
        _id: playerId,
        username: player.username,
        fullName: player.fullName,
        profileImage: player.profileImage,
      },
      subMatchesPlayed: 0,
      subMatchesWon: 0,
      subMatchesLost: 0,
    });
  }

  const pStats = playerStatsMap.get(playerId);
  pStats.subMatchesPlayed++;
  if (won) {
    pStats.subMatchesWon++;
  } else {
    pStats.subMatchesLost++;
  }
}
