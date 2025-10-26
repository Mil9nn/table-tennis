import { NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    // Get all completed team matches
    const matches = await TeamMatch.find({ status: "completed" }).lean();

    // Calculate stats for each team
    const teamStatsMap = new Map();

    matches.forEach((match: any) => {
      if (!match.winnerTeam) return;

      [match.team1, match.team2].forEach((team: any, idx: number) => {
        const teamName = team.name;
        const isWinner = (idx === 0 && match.winnerTeam === "team1") || 
                        (idx === 1 && match.winnerTeam === "team2");

        if (!teamStatsMap.has(teamName)) {
          teamStatsMap.set(teamName, {
            teamName,
            city: team.city,
            totalMatches: 0,
            wins: 0,
            losses: 0,
            tiesWon: 0,
            tiesLost: 0,
            recentMatches: [],
          });
        }

        const stats = teamStatsMap.get(teamName);
        stats.totalMatches++;

        if (isWinner) {
          stats.wins++;
          stats.tiesWon += idx === 0 ? match.finalScore.team1Matches : match.finalScore.team2Matches;
          stats.tiesLost += idx === 0 ? match.finalScore.team2Matches : match.finalScore.team1Matches;
          stats.recentMatches.unshift("W");
        } else {
          stats.losses++;
          stats.tiesWon += idx === 0 ? match.finalScore.team1Matches : match.finalScore.team2Matches;
          stats.tiesLost += idx === 0 ? match.finalScore.team2Matches : match.finalScore.team1Matches;
          stats.recentMatches.unshift("L");
        }

        // Keep only last 5 matches
        if (stats.recentMatches.length > 5) {
          stats.recentMatches.pop();
        }
      });
    });

    // Convert to array and calculate percentages
    const leaderboard = Array.from(teamStatsMap.values())
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
      .slice(0, 50); // Top 50 teams

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}