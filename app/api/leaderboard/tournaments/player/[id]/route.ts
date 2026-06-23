import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import type { TournamentHistoryEntry } from "@/app/leaderboard/types";

/**
 * GET /api/leaderboard/tournaments/player/[id]
 * 
 * Fetch detailed tournament history and statistics for a specific player.
 * 
 * Query Parameters:
 * - matchType (optional): 'singles' | 'doubles' | 'all' (default: 'all')
 * - format (optional): 'round_robin' | 'knockout' | 'hybrid' | 'all' (default: 'all')
 * - status (optional): 'completed' | 'in_progress' | 'all' (default: 'all')
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: playerId } = await context.params;
    const { searchParams } = new URL(request.url);

    const matchType = searchParams.get("matchType") || "all";
    const format = searchParams.get("format") || "all";
    const status = searchParams.get("status") || "all";

    // Verify player exists
    const player = (await User.findById(playerId)
      .select("username fullName profileImage")
      .lean()) as {
      _id: any;
      username?: string;
      fullName?: string;
      profileImage?: string;
    } | null;
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Build tournament query
    const tournamentQuery: any = {};
    if (format !== "all") {
      tournamentQuery.format = format;
    }
    if (status !== "all") {
      tournamentQuery.status = status === "in_progress" ? "in_progress" : "completed";
    } else {
      tournamentQuery.status = { $in: ["completed", "in_progress"] };
    }

    // Get all tournaments the player participated in
    const tournaments = await Tournament.find({
      ...tournamentQuery,
      participants: playerId,
    })
      .select("_id name format matchType status startDate endDate standings")
      .lean();

    // Get all tournament matches for this player
    const matchQuery: any = {
      tournament: { $ne: null },
      participants: playerId,
      status: "completed",
    };

    if (matchType !== "all") {
      matchQuery.matchType = matchType;
    }

    const tournamentMatches = await IndividualMatch.find(matchQuery)
      .populate("tournament", "name format matchType status startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    // Group matches by tournament
    const tournamentMap = new Map<string, any>();

    for (const match of tournamentMatches as any[]) {
      if (!match.tournament || !match.tournament._id) continue;

      const tournamentId = match.tournament._id.toString();

      if (!tournamentMap.has(tournamentId)) {
        // Find tournament in tournaments array to get standings
        const tournament = tournaments.find(
          (t: any) => t._id.toString() === tournamentId
        );

        tournamentMap.set(tournamentId, {
          tournament: match.tournament,
          matches: [],
          standing: null,
        });

        // Find player's standing in this tournament
        if (tournament && tournament.standings) {
          const standing = tournament.standings.find(
            (s: any) =>
              s.participant &&
              s.participant.toString() === playerId
          );
          if (standing) {
            tournamentMap.get(tournamentId)!.standing = standing;
          }
        }
      }

      tournamentMap.get(tournamentId)!.matches.push(match);
    }

    // Build tournament history
    const tournamentHistory: TournamentHistoryEntry[] = [];

    for (const [tournamentId, data] of tournamentMap.entries()) {
      const { tournament, matches, standing } = data;

      // Calculate stats from matches
      let matchesWon = 0;
      let matchesLost = 0;
      let setsWon = 0;
      let setsLost = 0;
      let pointsScored = 0;
      let pointsConceded = 0;

      for (const match of matches) {
        const participantIndex = match.participants.findIndex(
          (p: any) => p.toString() === playerId
        );
        const side = participantIndex === 0 ? "side1" : "side2";
        const opponentSide = side === "side1" ? "side2" : "side1";

        const playerSets = match.finalScore?.[`${side}Sets`] || 0;
        const opponentSets = match.finalScore?.[`${opponentSide}Sets`] || 0;

        setsWon += playerSets;
        setsLost += opponentSets;

        if (playerSets > opponentSets) {
          matchesWon++;
        } else {
          matchesLost++;
        }

        // Calculate points from games
        if (match.games && match.games.length > 0) {
          for (const game of match.games) {
            if (side === "side1") {
              pointsScored += game.side1Score || 0;
              pointsConceded += game.side2Score || 0;
            } else {
              pointsScored += game.side2Score || 0;
              pointsConceded += game.side1Score || 0;
            }
          }
        }
      }

      tournamentHistory.push({
        tournamentId: tournament._id.toString(),
        tournamentName: tournament.name,
        format: tournament.format,
        matchType: tournament.matchType,
        status: tournament.status,
        finishPosition: standing?.rank || null,
        matchesPlayed: matches.length,
        matchesWon,
        matchesLost,
        setsWon,
        setsLost,
        pointsScored,
        pointsConceded,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      });
    }

    // Sort by start date (most recent first)
    tournamentHistory.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Calculate overall stats
    const overallStats = {
      tournamentsPlayed: tournamentHistory.length,
      tournamentsWon: tournamentHistory.filter((t) => t.finishPosition === 1)
        .length,
      finalsReached: tournamentHistory.filter(
        (t) => t.finishPosition && t.finishPosition <= 2
      ).length,
      semiFinalsReached: tournamentHistory.filter(
        (t) => t.finishPosition && t.finishPosition <= 4
      ).length,
      quarterFinalsReached: tournamentHistory.filter(
        (t) => t.finishPosition && t.finishPosition <= 8
      ).length,
      totalMatches: tournamentHistory.reduce(
        (sum, t) => sum + t.matchesPlayed,
        0
      ),
      totalWins: tournamentHistory.reduce((sum, t) => sum + t.matchesWon, 0),
      totalLosses: tournamentHistory.reduce(
        (sum, t) => sum + t.matchesLost,
        0
      ),
      totalSetsWon: tournamentHistory.reduce((sum, t) => sum + t.setsWon, 0),
      totalSetsLost: tournamentHistory.reduce(
        (sum, t) => sum + t.setsLost,
        0
      ),
      totalPointsScored: tournamentHistory.reduce(
        (sum, t) => sum + t.pointsScored,
        0
      ),
      totalPointsConceded: tournamentHistory.reduce(
        (sum, t) => sum + t.pointsConceded,
        0
      ),
    };

    return NextResponse.json({
      player: {
        _id: player._id.toString(),
        username: player.username,
        fullName: player.fullName,
        profileImage: player.profileImage,
      },
      overallStats,
      tournamentHistory,
      generatedAt: new Date(),
    });
  } catch (error: any) {
    console.error("Error fetching tournament player details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tournament player details",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

