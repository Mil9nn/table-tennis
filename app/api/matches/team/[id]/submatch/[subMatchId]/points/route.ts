import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";
import { listTeamSubMatchPoints } from "@/services/match/matchPointService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();
    const { id, subMatchId } = await context.params;
    const gameParam = req.nextUrl.searchParams.get("gameNumber");
    const gameNumber =
      gameParam !== null && gameParam !== "" ? Number(gameParam) : undefined;

    if (gameNumber !== undefined && Number.isNaN(gameNumber)) {
      return NextResponse.json({ error: "Invalid gameNumber" }, { status: 400 });
    }

    const match = await TeamMatch.findById(id).select("subMatches");
    if (!match) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    const subMatchIdNum = parseInt(subMatchId, 10);
    const sub = match.subMatches.find(
      (sm: { matchNumber?: number; _id?: { toString: () => string } }) =>
        sm.matchNumber === subMatchIdNum || sm._id?.toString() === subMatchId
    );
    if (!sub?._id) {
      return NextResponse.json({ error: "SubMatch not found" }, { status: 404 });
    }

    const shots = await listTeamSubMatchPoints(id, String(sub._id), gameNumber);
    return NextResponse.json({
      shots,
      matchId: id,
      subMatchId,
      gameNumber: gameNumber ?? null,
    });
  } catch (error) {
    console.error("[matches/team/.../points] Error:", error);
    return NextResponse.json({ error: "Failed to load points" }, { status: 500 });
  }
}
