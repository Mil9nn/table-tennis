import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";

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

    // Initialize stats accumulators
    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    let totalServes = 0;
    let pointsWonOnServe = 0;
    const distribution = { individual: 0, team: 0, tournament: 0 };
    const recentMatches: any[] = [];

    // Fetch individual matches
    const individualMatches = await IndividualMatch.find({
      participants: playerId,
      status: "completed",
      matchType: matchType,
    })
      .populate("participants", "username fullName profileImage")
      .populate("tournament", "name")
      .lean();

    // Process individual matches
    individualMatches.forEach((match: any) => {
      const isSide1 = match.participants[0]._id.toString() === playerId;
      const userSide = isSide1 ? "side1" : "side2";
      const opponentSide = isSide1 ? "side2" : "side1";
      const isWin = match.winnerSide === userSide;

      totalMatches++;
      if (isWin) wins++;
      else losses++;

      const userSets = match.finalScore?.[`${userSide}Sets`] || 0;
      const opponentSets = match.finalScore?.[`${opponentSide}Sets`] || 0;
      setsWon += userSets;
      setsLost += opponentSets;

      // Track distribution
      if (match.tournament) {
        distribution.tournament++;
      } else {
        distribution.individual++;
      }

      // Process games for scoring and server stats
      let matchPointsScored = 0;
      let matchPointsConceded = 0;
      let matchServes = 0;
      let matchPointsWonOnServe = 0;

      match.games?.forEach((game: any) => {
        const userScore = userSide === "side1" ? game.side1Score : game.side2Score;
        const opponentScore = userSide === "side1" ? game.side2Score : game.side1Score;

        matchPointsScored += userScore || 0;
        matchPointsConceded += opponentScore || 0;

        // Server stats from shots
        let currentServer: string | null = null;

        game.shots?.forEach((shot: any, shotIndex: number) => {
          if (shot.server) {
            currentServer = shot.server.toString();
          }

          if (shot.player?.toString() === playerId && currentServer === playerId) {
            matchServes++;

            // Check if user won the point on their serve
            const nextShot = game.shots[shotIndex + 1];

            if (!nextShot) {
              if (userScore > opponentScore) {
                matchPointsWonOnServe++;
              }
            } else {
              let pointWon = false;
              for (let i = shotIndex + 1; i < game.shots.length; i++) {
                const futureShot = game.shots[i];
                if (futureShot.server !== currentServer) {
                  if (game.shots[i - 1]?.player?.toString() === playerId) {
                    pointWon = true;
                  }
                  break;
                }
              }
              if (pointWon) {
                matchPointsWonOnServe++;
              }
            }
          }
        });
      });

      totalPointsScored += matchPointsScored;
      totalPointsConceded += matchPointsConceded;
      totalServes += matchServes;
      pointsWonOnServe += matchPointsWonOnServe;

      // Add to recent matches
      const opponentIndex = isSide1 ? 1 : 0;
      const opponent = match.participants[opponentIndex];

      recentMatches.push({
        matchId: match._id.toString(),
        opponent: opponent?.fullName || opponent?.username || "Unknown",
        result: isWin ? "win" : "loss",
        score: `${userSets}-${opponentSets}`,
        pointsScored: matchPointsScored,
        pointsConceded: matchPointsConceded,
        date: match.createdAt,
        source: match.tournament ? "tournament" : "individual",
      });
    });

    // Fetch team matches
    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": playerId },
        { "team2.players.user": playerId },
      ],
    })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .populate("subMatches.playerTeam1 subMatches.playerTeam2", "username fullName profileImage")
      .populate("tournament", "name")
      .lean();

    // Process team submatches
    teamMatches.forEach((teamMatch: any) => {
      teamMatch.subMatches?.forEach((sub: any) => {
        // Only process submatches that match the requested matchType
        if (sub.matchType !== matchType) return;

        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p?._id?.toString() || p?.toString()).filter(Boolean);

        if (!playerIds.includes(playerId.toString())) return;

        const userInTeam1 = (Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1])
          .map((p: any) => p?._id?.toString() || p?.toString())
          .includes(playerId.toString());

        const subWon = (userInTeam1 && sub.winnerSide === "team1") || (!userInTeam1 && sub.winnerSide === "team2");

        totalMatches++;
        if (subWon) wins++;
        else losses++;

        const userSets = sub.finalScore?.[userInTeam1 ? "team1Games" : "team2Games"] || 0;
        const opponentSets = sub.finalScore?.[userInTeam1 ? "team2Games" : "team1Games"] || 0;
        setsWon += userSets;
        setsLost += opponentSets;

        // Track distribution
        if (teamMatch.tournament) {
          distribution.tournament++;
        } else {
          distribution.team++;
        }

        // Process games for points and serve stats
        let matchPointsScored = 0;
        let matchPointsConceded = 0;
        let matchServes = 0;
        let matchPointsWonOnServe = 0;

        sub.games?.forEach((game: any) => {
          const userScore = userInTeam1 ? game.team1Score : game.team2Score;
          const opponentScore = userInTeam1 ? game.team2Score : game.team1Score;

          matchPointsScored += userScore || 0;
          matchPointsConceded += opponentScore || 0;

          // Server stats
          let currentServer: string | null = null;
          game.shots?.forEach((shot: any, shotIndex: number) => {
            if (shot.server) {
              currentServer = shot.server.toString();
            }

            if (shot.player?.toString() === playerId && currentServer === playerId) {
              matchServes++;

              const nextShot = game.shots[shotIndex + 1];
              if (!nextShot && userScore > opponentScore) {
                matchPointsWonOnServe++;
              } else if (nextShot?.server !== currentServer) {
                matchPointsWonOnServe++;
              }
            }
          });
        });

        totalPointsScored += matchPointsScored;
        totalPointsConceded += matchPointsConceded;
        totalServes += matchServes;
        pointsWonOnServe += matchPointsWonOnServe;

        // Add to recent matches
        const isTeam1 = userInTeam1;
        const opponentTeamSide = isTeam1 ? "team2" : "team1";
        const opponentTeamName = teamMatch[opponentTeamSide]?.name || "Unknown Team";

        recentMatches.push({
          matchId: sub._id?.toString() || teamMatch._id.toString(),
          opponent: opponentTeamName,
          result: subWon ? "win" : "loss",
          score: `${userSets}-${opponentSets}`,
          pointsScored: matchPointsScored,
          pointsConceded: matchPointsConceded,
          date: teamMatch.createdAt,
          source: teamMatch.tournament ? "tournament" : "team",
        });
      });
    });

    // Calculate derived stats
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const totalSets = setsWon + setsLost;
    const avgPerSet = totalSets > 0 ? totalPointsScored / totalSets : 0;
    const avgConcededPerSet = totalSets > 0 ? totalPointsConceded / totalSets : 0;
    const serveWinPercentage = totalServes > 0 ? (pointsWonOnServe / totalServes) * 100 : 0;

    // Sort recent matches by date and limit to 10
    recentMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedRecentMatches = recentMatches.slice(0, 10);

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
        recentMatches: limitedRecentMatches,
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
