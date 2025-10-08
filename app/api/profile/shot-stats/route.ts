import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";

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

    // Fetch all completed matches the player took part in
    const matches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    }).lean();

    // Career counters
    const shotTotals: Record<string, number> = {};
    const errorBreakdown: Record<string, number> = { net: 0, long: 0, serve: 0 };
    let winners = 0;
    let errors = 0;

    matches.forEach((match: any) => {
      match.games?.forEach((game: any) => {
        game.shots?.forEach((shot: any) => {
          if (!shot || !shot.player) return;

          // Only count if the shot belongs to this player
          if (shot.player.toString() !== userId.toString()) return;

          // Outcome
          if (shot.outcome === "winner") {
            winners++;
          } else if (shot.outcome === "error") {
            errors++;
            if (shot.errorType) {
              errorBreakdown[shot.errorType] = (errorBreakdown[shot.errorType] || 0) + 1;
            }
          }

          // Stroke
          if (shot.stroke) {
            shotTotals[shot.stroke] = (shotTotals[shot.stroke] || 0) + 1;
          }
        });
      });
    });

    return NextResponse.json({
      success: true,
      stats: {
        winners,
        errors,
        errorBreakdown,
        detailedShots: shotTotals,
      },
    });
  } catch (error) {
    console.error("Career shot stats error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}