import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";
import { escapeRegex } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit/middleware";

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, "GET", "/api/teams/search");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json({ success: true, teams: [] });
    }

    // Escape special regex characters to prevent ReDoS attacks
    const safeQuery = escapeRegex(query);

    // Search teams by name (case-insensitive)
    const teams = await Team.find({
      name: { $regex: safeQuery, $options: "i" },
    })
      .select("_id name city logo captain players")
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage")
      .lean()
      .limit(10);
    
    // Convert players to array format for consistency
    const formattedTeams = teams.map((team: any) => ({
      ...team,
      players: team.players || [],
    }));

    return NextResponse.json({ success: true, teams: formattedTeams });
  } catch (error: any) {
    console.error("[teams/search] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to search teams",
        ...(process.env.NODE_ENV === "development" && { details: error.message })
      },
      { status: 500 }
    );
  }
}
