// app/api/profile/detailed-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .lean();

    const userTeams = await Team.find({
      "players.user": userId,
    })
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage")
      .lean();

    const individualStats = {
      total: individualMatches.length,
      byType: { singles: 0, doubles: 0, mixed_doubles: 0 },
      wins: { singles: 0, doubles: 0, mixed_doubles: 0 },
      losses: { singles: 0, doubles: 0, mixed_doubles: 0 },
    };

    const headToHead: Record<string, { wins: number; losses: number; opponent: any }> = {};
    const recentMatches: any[] = [];
    const monthlyActivity: Record<string, number> = {};
    let currentStreak = 0;
    let streakType: "win" | "loss" | null = null;
    let bestWinStreak = 0;
    let tempWinStreak = 0;

    individualMatches.forEach((match: any) => {
      const isSide1 = match.participants[0]._id.toString() === userId;
      const userSide = isSide1 ? "side1" : "side2";
      const opponentSide = isSide1 ? "side2" : "side1";
      const isWin = match.winnerSide === userSide;
      const matchType = match.matchType;

      individualStats.byType[matchType as keyof typeof individualStats.byType]++;

      if (isWin) {
        individualStats.wins[matchType as keyof typeof individualStats.wins]++;
        tempWinStreak++;
        bestWinStreak = Math.max(bestWinStreak, tempWinStreak);
        
        if (streakType === "win") currentStreak++;
        else { streakType = "win"; currentStreak = 1; }
      } else {
        individualStats.losses[matchType as keyof typeof individualStats.losses]++;
        tempWinStreak = 0;
        
        if (streakType === "loss") currentStreak++;
        else { streakType = "loss"; currentStreak = 1; }
      }

      const opponentIndex = isSide1 ? (matchType === "singles" ? 1 : 2) : 0;
      const opponent = match.participants[opponentIndex];
      const oppId = opponent._id.toString();

      if (!headToHead[oppId]) {
        headToHead[oppId] = { wins: 0, losses: 0, opponent };
      }
      if (isWin) headToHead[oppId].wins++;
      else headToHead[oppId].losses++;

      recentMatches.push({
        _id: match._id,
        type: "individual",
        matchType,
        date: match.createdAt,
        result: isWin ? "win" : "loss",
        opponent: opponent.fullName || opponent.username,
        score: `${match.finalScore?.side1Sets || 0}-${match.finalScore?.side2Sets || 0}`,
      });

      const month = new Date(match.createdAt).toISOString().slice(0, 7);
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });

    const teamStats = {
      total: 0,
      byFormat: { five_singles: 0, single_double_single: 0, custom: 0 },
      wins: 0,
      losses: 0,
      subMatchesPlayed: 0,
      subMatchesWon: 0,
    };

    teamMatches.forEach((match: any) => {
      const isTeam1 = match.team1.players.some((p: any) => p.user._id.toString() === userId);
      const userTeamSide = isTeam1 ? "team1" : "team2";
      const isWin = match.winnerTeam === userTeamSide;

      teamStats.total++;
      teamStats.byFormat[match.matchFormat as keyof typeof teamStats.byFormat]++;
      if (isWin) teamStats.wins++;
      else teamStats.losses++;

      match.subMatches?.forEach((sub: any) => {
        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p.toString());

        if (playerIds.includes(userId.toString())) {
          teamStats.subMatchesPlayed++;
          
          const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
            .map((p: any) => p.toString())
            .includes(userId.toString());
          
          if ((userInTeam1 && sub.winnerSide === "team1") || (!userInTeam1 && sub.winnerSide === "team2")) {
            teamStats.subMatchesWon++;
          }
        }
      });

      recentMatches.push({
        _id: match._id,
        type: "team",
        matchFormat: match.matchFormat,
        date: match.createdAt,
        result: isWin ? "win" : "loss",
        teams: `${match.team1.name} vs ${match.team2.name}`,
        score: `${match.finalScore?.team1Matches || 0}-${match.finalScore?.team2Matches || 0}`,
      });

      const month = new Date(match.createdAt).toISOString().slice(0, 7);
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });

    const shotBreakdown = {
      forehand: 0,
      backhand: 0,
      offensive: 0,
      defensive: 0,
      neutral: 0,
    };

    const detailedShots: Record<string, number> = {};

    const allMatches = [...individualMatches, ...teamMatches];
    allMatches.forEach((match: any) => {
      match.games?.forEach((game: any) => {
        game.shots?.forEach((shot: any) => {
          if (shot.player?.toString() !== userId.toString()) return;

          if (shot.stroke) {
            detailedShots[shot.stroke] = (detailedShots[shot.stroke] || 0) + 1;

            if (shot.stroke?.startsWith("forehand")) shotBreakdown.forehand++;
            if (shot.stroke?.startsWith("backhand")) shotBreakdown.backhand++;

            if (shot.stroke?.includes("smash") || shot.stroke?.includes("loop") || shot.stroke?.includes("topspin")) {
              shotBreakdown.offensive++;
            } else if (shot.stroke?.includes("push") || shot.stroke?.includes("block") || shot.stroke?.includes("chop")) {
              shotBreakdown.defensive++;
            } else {
              shotBreakdown.neutral++;
            }
          }
        });
      });
    });

    recentMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const headToHeadArray = Object.values(headToHead)
      .map((h) => ({
        opponent: h.opponent,
        wins: h.wins,
        losses: h.losses,
        total: h.wins + h.losses,
        winRate: ((h.wins / (h.wins + h.losses)) * 100).toFixed(1),
      }))
      .sort((a, b) => b.total - a.total);

    const monthlyActivityArray = Object.entries(monthlyActivity)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      stats: {
        individual: individualStats,
        team: teamStats,
        overall: {
          totalMatches: individualMatches.length + teamMatches.length,
          totalWins: individualStats.wins.singles + individualStats.wins.doubles + individualStats.wins.mixed_doubles + teamStats.wins,
          totalLosses: individualStats.losses.singles + individualStats.losses.doubles + individualStats.losses.mixed_doubles + teamStats.losses,
          currentStreak: { type: streakType, count: currentStreak },
          bestWinStreak,
        },
        shotAnalysis: {
          ...shotBreakdown,
          detailedShots,
        },
        headToHead: headToHeadArray,
        recentMatches: recentMatches.slice(0, 10),
        monthlyActivity: monthlyActivityArray,
        teams: userTeams.map((t: any) => ({
          _id: t._id,
          name: t.name,
          role: t.captain.toString() === userId.toString() ? "Captain" : "Player",
          playerCount: t.players.length,
        })),
      },
    });
  } catch (error) {
    console.error("Detailed stats error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}