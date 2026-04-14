import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can swap
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can swap sides" },
        { status: 403 }
      );
    }

    // Validate match status
    if (!["in_progress", "scheduled"].includes(match.status)) {
      return NextResponse.json(
        { error: "Cannot swap: match must be in progress or scheduled" },
        { status: 400 }
      );
    }

    // Validate current game score is 0-0
    const currentGameData = match.games?.find(
      (g: any) => g.gameNumber === match.currentGame
    );

    if (currentGameData) {
      const scores = (currentGameData as any).scoresById;
      const vals =
        scores instanceof Map
          ? [...scores.values()]
          : Object.values(scores || {});
      const totalPoints = vals.reduce((sum: number, v: any) => sum + Number(v || 0), 0);

      if (totalPoints !== 0) {
        return NextResponse.json(
          { error: "Cannot swap: current game score must be 0-0" },
          { status: 400 }
        );
      }
    }

    // ID-based model: "swap" means reverse display order of participants.
    match.participants = [...match.participants].reverse();

    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Swap error:", err);
    return NextResponse.json(
      { error: "Failed to swap sides" },
      { status: 500 }
    );
  }
}
