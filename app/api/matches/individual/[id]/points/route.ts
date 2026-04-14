import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { listIndividualPoints } from "@/services/match/matchPointService";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const gameParam = req.nextUrl.searchParams.get("gameNumber");
    const gameNumber =
      gameParam !== null && gameParam !== "" ? Number(gameParam) : undefined;

    if (gameNumber !== undefined && Number.isNaN(gameNumber)) {
      return NextResponse.json({ error: "Invalid gameNumber" }, { status: 400 });
    }

    const shots = await listIndividualPoints(id, gameNumber);
    return NextResponse.json({ shots, matchId: id, gameNumber: gameNumber ?? null });
  } catch (error) {
    console.error("[matches/individual/[id]/points] Error:", error);
    return NextResponse.json({ error: "Failed to load points" }, { status: 500 });
  }
}
