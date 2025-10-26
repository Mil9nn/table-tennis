import { NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    // Get all completed individual matches
    const matches = await IndividualMatch.find({ status: "completed" })
      .populate("participants", "username fullName profileImage")
      .lean();

    // Calculate stats for each player
    const playerStatsMap = new Map();

    matches.forEach((match: any) => {
      if (!match.participants || !match.winnerSide) return;

      const side1Players = match.matchType === "singles" 
        ? [match.participants[0]]
        : [match.participants[0], match.participants[1]];
      
      const side2Players = match.matchType === "singles"
        ? [match.participants[1]]
        : [match.participants[2], match.participants[3]];

      const side1Won = match.winnerSide === "side1";

      // Update stats for all participants
      [...side1Players, ...side2Players].forEach((player: any, idx: number) => {
        if (!player?._id) return;

        const playerId = player._id.toString();
        const isWinner = idx < side1Players.length ? side1Won : !side1Won;
        
        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            player: {
              _id: player._id,
              username: player.username,
              fullName: player.fullName,
              profileImage: player.profileImage,
            },
            totalMatches: 0,
            wins: 0,
            losses: 0,
            setsWon: 0,
            setsLost: 0,
            recentMatches: [],
          });
        }

        const stats = playerStatsMap.get(playerId);
        stats.totalMatches++;
        
        if (isWinner) {
          stats.wins++;
          stats.setsWon += match.finalScore.side1Sets || 0;
          stats.setsLost += match.finalScore.side2Sets || 0;
          stats.recentMatches.unshift("W");
        } else {
          stats.losses++;
          stats.setsWon += match.finalScore.side2Sets || 0;
          stats.setsLost += match.finalScore.side1Sets || 0;
          stats.recentMatches.unshift("L");
        }

        // Keep only last 5 matches
        if (stats.recentMatches.length > 5) {
          stats.recentMatches.pop();
        }
      });
    });

    // Convert to array and calculate percentages
    const leaderboard = Array.from(playerStatsMap.values())
      .map((stats: any) => ({
        ...stats,
        winRate: stats.totalMatches > 0 
          ? Math.round((stats.wins / stats.totalMatches) * 100) 
          : 0,
      }))
      .sort((a, b) => {
        // Sort by wins first, then win rate
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      })
      .slice(0, 50); // Top 50 players

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching individual leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}