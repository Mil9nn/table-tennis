import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const userId = new mongoose.Types.ObjectId(id);

    // Fetch all tournaments where user is a participant
    const tournaments = await Tournament.find({
      participants: userId,
    })
      .populate("organizer", "username fullName")
      .sort({ startDate: -1 })
      .lean();

    // Calculate detailed stats for each tournament
    const tournamentStats = await Promise.all(
      tournaments.map(async (tournament) => {
        // Get all matches for this user in this tournament
        const matches = await IndividualMatch.find({
          tournament: tournament._id,
          participants: userId,
          status: "completed",
        }).lean();

        let wins = 0;
        let losses = 0;
        let setsWon = 0;
        let setsLost = 0;
        let pointsScored = 0;
        let pointsConceded = 0;

        matches.forEach((match: any) => {
          const isSide1 =
            match.participants[0]?.toString() === userId.toString();
          const userSide = isSide1 ? "side1" : "side2";
          const isWin = match.winnerSide === userSide;

          if (isWin) {
            wins++;
          } else {
            losses++;
          }

          setsWon += match.finalScore?.[`${userSide}Sets`] || 0;
          setsLost +=
            match.finalScore?.[isSide1 ? "side2Sets" : "side1Sets"] || 0;

          // Calculate points from games
          match.games?.forEach((game: any) => {
            if (userSide === "side1") {
              pointsScored += game.side1Score || 0;
              pointsConceded += game.side2Score || 0;
            } else {
              pointsScored += game.side2Score || 0;
              pointsConceded += game.side1Score || 0;
            }
          });
        });

    // Get user's position/rank in tournament standings
    let position = null;
    let totalParticipants = tournament.participants.length;

    // Check in round-robin standings
    if (tournament.format === "round_robin" && tournament.standings) {
      const userStanding = tournament.standings.find(
        (s: any) => s.participant.toString() === userId.toString()
      );
      if (userStanding) {
        position = userStanding.rank;
        console.log(`[Tournament Stats] User ${userId} in tournament ${tournament._id}: rank=${userStanding.rank}, tournament.status=${tournament.status}`);
      } else {
        console.log(`[Tournament Stats] User ${userId} NOT FOUND in standings for tournament ${tournament._id}, status=${tournament.status}`);
      }
    }

        // Check in group standings for multi-stage/grouped tournaments
        if (tournament.useGroups && tournament.groups) {
          for (const group of tournament.groups) {
            const userStanding = group.standings?.find(
              (s: any) => s.participant.toString() === userId.toString()
            );
            if (userStanding) {
              position = `Group ${group.groupId} - Rank ${userStanding.rank}`;
              totalParticipants = group.participants.length;
              break;
            }
          }
        }

        return {
          tournament: {
            _id: tournament._id,
            name: tournament.name,
            format: tournament.format,
            category: tournament.category,
            matchType: tournament.matchType,
            status: tournament.status,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            city: tournament.city,
            venue: tournament.venue,
            totalParticipants,
          },
          stats: {
            matchesPlayed: matches.length,
            wins,
            losses,
            winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0,
            setsWon,
            setsLost,
            setsDiff: setsWon - setsLost,
            pointsScored,
            pointsConceded,
            pointsDiff: pointsScored - pointsConceded,
            position,
          },
        };
      })
    );

    // Calculate overall tournament statistics
    const totalTournaments = tournaments.length;
    const completedTournaments = tournaments.filter(
      (t) => t.status === "completed"
    ).length;
    const ongoingTournaments = tournaments.filter(
      (t) => t.status === "in_progress"
    ).length;
    const upcomingTournaments = tournaments.filter(
      (t) => t.status === "upcoming"
    ).length;

    const totalMatches = tournamentStats.reduce(
      (sum, t) => sum + t.stats.matchesPlayed,
      0
    );
    const totalWins = tournamentStats.reduce((sum, t) => sum + t.stats.wins, 0);
    const totalLosses = tournamentStats.reduce(
      (sum, t) => sum + t.stats.losses,
      0
    );

    // Count tournament wins (1st place finishes) - ONLY for completed tournaments
    const tournamentWins = tournamentStats.filter(
      (t) => t.tournament.status === "completed" && t.stats.position === 1
    ).length;

    // Count finals reached (1st and 2nd place finishes) - ONLY for completed tournaments
    const finalsReached = tournamentStats.filter(
      (t) =>
        t.tournament.status === "completed" &&
        typeof t.stats.position === "number" &&
        t.stats.position > 0 &&
        t.stats.position <= 2
    ).length;

    // Count semifinals reached (1st, 2nd, 3rd place finishes) - ONLY for completed tournaments
    const semifinalsReached = tournamentStats.filter(
      (t) =>
        t.tournament.status === "completed" &&
        typeof t.stats.position === "number" &&
        t.stats.position > 0 &&
        t.stats.position <= 3
    ).length;

    console.log(`[Tournament Stats Summary] User ${id}:`, {
      totalTournaments: tournaments.length,
      tournamentWins,
      finalsReached,
      semifinalsReached,
      positionsFound: tournamentStats.map(t => ({ 
        tournamentId: t.tournament._id, 
        position: t.stats.position, 
        status: t.tournament.status 
      }))
    });

    // Count podium finishes (top 3)
    const podiumFinishes = tournamentStats.filter(
      (t) =>
        typeof t.stats.position === "number" &&
        t.stats.position > 0 &&
        t.stats.position <= 3
    ).length;

    // Format by tournament format
    const byFormat = {
      round_robin: tournamentStats.filter(
        (t) => t.tournament.format === "round_robin"
      ).length,
    };

    // Format by category
    const byCategory = {
      individual: tournamentStats.filter(
        (t) => t.tournament.category === "individual"
      ).length,
      team: tournamentStats.filter((t) => t.tournament.category === "team")
        .length,
    };

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalTournaments,
          completedTournaments,
          ongoingTournaments,
          upcomingTournaments,
          tournamentWins,
          finalsReached,
          semifinalsReached,
          podiumFinishes,
          totalMatches,
          totalWins,
          totalLosses,
          winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
        },
        byFormat,
        byCategory,
        tournaments: tournamentStats,
      },
    });
  } catch (error) {
    console.error("Tournament stats error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
