import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import { User } from "@/models/User";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; opponentId: string }> }
) {
  try {
    await connectDB();
    const { id, opponentId } = await context.params;

    // Verify both users exist
    const user = await User.findById(id).select("_id");
    const opponent = await User.findById(opponentId).select("_id");

    if (!user || !opponent) {
      return NextResponse.json(
        { error: "User or opponent not found" },
        { status: 404 }
      );
    }

    // Fetch all completed individual matches where both players participated
    const matches = await IndividualMatch.find({
      participants: { $all: [id, opponentId] },
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .populate("tournament", "name format")
      .sort({ createdAt: -1 })
      .lean();

    // Process matches to determine result from the profile user's perspective
    const processedMatches = matches.map((match: any) => {
      // Find current user's position in participants array
      const userIndex = match.participants.findIndex((p: any) => p._id.toString() === id);
      const opponentIndex = match.participants.findIndex((p: any) => p._id.toString() === opponentId);
      
      // Determine if current user won
      const isWin = match.winnerId?.toString() === id;

      // Get scores using the correct finalScore structure
      let userScore = 0;
      let opponentScore = 0;
      
      if (match.finalScore?.setsByTeam && Array.isArray(match.finalScore.setsByTeam)) {
        userScore = match.finalScore.setsByTeam[userIndex] || 0;
        opponentScore = match.finalScore.setsByTeam[opponentIndex] || 0;
      } else if (match.finalScore?.setsById) {
        userScore = match.finalScore.setsById.get(id.toString()) || 0;
        opponentScore = match.finalScore.setsById.get(opponentId) || 0;
      }

      return {
        _id: match._id,
        matchId: match._id,
        date: match.createdAt,
        matchType: match.matchType,
        result: isWin ? "win" : "loss",
        score: `${userScore}-${opponentScore}`,
        tournament: match.tournament
          ? {
              name: match.tournament.name,
              format: match.tournament.format,
            }
          : null,
      };
    });

    // Calculate summary stats
    const wins = processedMatches.filter((m) => m.result === "win").length;
    const losses = processedMatches.filter((m) => m.result === "loss").length;
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      matches: processedMatches,
      summary: {
        wins,
        losses,
        total,
        winRate: parseFloat(winRate),
      },
    });
  } catch (error: any) {
    console.error("Error fetching head-to-head matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 }
    );
  }
}

