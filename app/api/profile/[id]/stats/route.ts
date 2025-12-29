import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PlayerStats from "@/models/PlayerStats";
import TeamStats from "@/models/TeamStats";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { Match } from "@/types/match.type";
import { User as UserType } from "@/types/user";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Fetch user to verify existence
    const user = await User.findById(id)
      .select("fullName username profileImage")
      .lean<UserType>();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all 3 PlayerStats documents for this user (singles, doubles, mixed)
    const playerStats = await PlayerStats.find({ user: id })
      .populate("user", "fullName username profileImage")
      .lean();

    // Fetch teams this user belongs to
    const teams = await Team.find({ "players.user": id })
      .select("_id name captain players logo")
      .lean();

    // Fetch TeamStats for these teams
    const teamStats = await TeamStats.find({
      team: { $in: teams.map((t) => t._id) },
    })
      .populate("team", "name city")
      .lean();

    // Organize player stats by match type
    const singlesStats = playerStats.find((s) => s.matchType === "singles") || null;
    const doublesStats = playerStats.find((s) => s.matchType === "doubles") || null;
    const mixedStats = playerStats.find((s) => s.matchType === "mixed") || null;

    // Calculate overall individual stats (aggregate across all match types)
    const totalIndividualMatches = playerStats.reduce(
      (sum, s) => sum + s.totalMatches,
      0
    );
    const totalIndividualWins = playerStats.reduce((sum, s) => sum + s.wins, 0);
    const totalIndividualLosses = playerStats.reduce(
      (sum, s) => sum + s.losses,
      0
    );
    const totalSetsWon = playerStats.reduce((sum, s) => sum + s.setsWon, 0);
    const totalSetsLost = playerStats.reduce((sum, s) => sum + s.setsLost, 0);

    // Aggregate shot data across all match types
    const aggregatedShots = {
      forehand: { total: 0 },
      backhand: { total: 0 },
      serve: { total: 0 },
      offensive: 0,
      defensive: 0,
      neutral: 0,
      detailed: {} as Record<string, number>,
    };

    playerStats.forEach((stat) => {
      if (stat.shots) {
        aggregatedShots.forehand.total += stat.shots.forehand?.total || 0;

        aggregatedShots.backhand.total += stat.shots.backhand?.total || 0;

        aggregatedShots.serve.total += stat.shots.serve?.total || 0;

        aggregatedShots.offensive += stat.shots.offensive || 0;
        aggregatedShots.defensive += stat.shots.defensive || 0;
        aggregatedShots.neutral += stat.shots.neutral || 0;

        // Merge detailed shots
        if (stat.shots.detailed) {
          const detailed = stat.shots.detailed instanceof Map
            ? Object.fromEntries(stat.shots.detailed)
            : stat.shots.detailed;

          for (const [stroke, count] of Object.entries(detailed)) {
            aggregatedShots.detailed[stroke] =
              (aggregatedShots.detailed[stroke] || 0) + (count as number);
          }
        }
      }
    });

    // Find the best win streak across all match types
    const bestWinStreak = Math.max(
      singlesStats?.bestWinStreak || 0,
      doublesStats?.bestWinStreak || 0,
      mixedStats?.bestWinStreak || 0
    );

    // Get current streak (use the most recent match type's streak)
    // This is a simplification - ideally we'd track overall streak
    const currentStreak = singlesStats?.currentStreak ||
                          doublesStats?.currentStreak ||
                          mixedStats?.currentStreak ||
                          0;

    // Aggregate head-to-head records
    const headToHeadMap = new Map<string, { wins: number; losses: number; opponentId: string }>();

    playerStats.forEach((stat) => {
      if (stat.headToHead) {
        const h2hEntries = stat.headToHead instanceof Map
          ? Array.from(stat.headToHead.entries())
          : Object.entries(stat.headToHead);

        h2hEntries.forEach(([oppId, record]: [string, any]) => {
          if (!headToHeadMap.has(oppId)) {
            headToHeadMap.set(oppId, { wins: 0, losses: 0, opponentId: oppId });
          }
          const existing = headToHeadMap.get(oppId)!;
          existing.wins += record.wins || 0;
          existing.losses += record.losses || 0;
        });
      }
    });

    // Fetch opponent details for head-to-head
    const opponentIds = Array.from(headToHeadMap.keys());
    const opponents = await User.find({ _id: { $in: opponentIds } })
      .select("fullName username profileImage")
      .lean<UserType[]>();

    const headToHeadArray = Array.from(headToHeadMap.values())
      .map((h2h) => {
        const opponent = opponents.find((o) => o._id.toString() === h2h.opponentId);
        return {
          opponent: {
            _id: h2h.opponentId,
            fullName: opponent?.fullName,
            username: opponent?.username,
            profileImage: opponent?.profileImage,
          },
          wins: h2h.wins,
          losses: h2h.losses,
          total: h2h.wins + h2h.losses,
          winRate: ((h2h.wins / (h2h.wins + h2h.losses)) * 100).toFixed(1),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 opponents

    // Aggregate recent matches from all match types
    const allRecentMatches = playerStats.flatMap((stat) =>
      (stat.recentMatches || []).map((match: Match) => ({
        ...match,
        matchType: stat.matchType,
        type: "individual",
      }))
    );

    // Add team matches
    teamStats.forEach((stat) => {
      (stat.recentMatches || []).forEach((match: Match) => {
        allRecentMatches.push({
          ...match,
          type: "team",
          matchType: "team",
        } as any);
      });
    });

    // Sort by date and take top 10
    allRecentMatches.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recentMatches = allRecentMatches.slice(0, 10);

    // Calculate team stats summary
    const totalTeamMatches = teamStats.reduce((sum, s) => sum + s.totalMatches, 0);
    const totalTeamWins = teamStats.reduce((sum, s) => sum + s.wins, 0);
    const totalTeamLosses = teamStats.reduce((sum, s) => sum + s.losses, 0);
    const totalTeamTies = teamStats.reduce((sum, s) => sum + s.ties, 0);

    // Format team list with user's role
    const userTeams = teams.map((t: any) => {
      // Handle both populated (object) and unpopulated (ID) captain
      const captainId = typeof t.captain === 'object' && t.captain._id 
        ? t.captain._id.toString() 
        : t.captain.toString();
      const isCaptain = captainId === id.toString();
      const teamStat = teamStats.find((ts: any) => ts.team._id.toString() === t._id.toString());

      return {
        _id: t._id,
        name: t.name,
        logo: t.logo,
        role: isCaptain ? "Captain" : "Player",
        playerCount: t.players.length,
        stats: teamStat
          ? {
              totalMatches: teamStat.totalMatches,
              wins: teamStat.wins,
              losses: teamStat.losses,
              ties: teamStat.ties,
              winRate: teamStat.winRate,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        profileImage: user.profileImage,
      },
      stats: {
        individual: {
          singles: singlesStats,
          doubles: doublesStats,
          mixed: mixedStats,
          overall: {
            totalMatches: totalIndividualMatches,
            wins: totalIndividualWins,
            losses: totalIndividualLosses,
            winRate:
              totalIndividualMatches > 0
                ? (totalIndividualWins / totalIndividualMatches) * 100
                : 0,
            setsWon: totalSetsWon,
            setsLost: totalSetsLost,
            setWinRate:
              totalSetsWon + totalSetsLost > 0
                ? (totalSetsWon / (totalSetsWon + totalSetsLost)) * 100
                : 0,
            currentStreak,
            bestWinStreak,
          },
        },
        team: {
          totalMatches: totalTeamMatches,
          wins: totalTeamWins,
          losses: totalTeamLosses,
          ties: totalTeamTies,
          winRate:
            totalTeamMatches > 0 ? (totalTeamWins / totalTeamMatches) * 100 : 0,
        },
        shotAnalysis: aggregatedShots,
        headToHead: headToHeadArray,
        recentMatches: recentMatches,
        teams: userTeams,
      },
    });
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile stats" },
      { status: 500 }
    );
  }
}

