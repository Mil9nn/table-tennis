import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await req.json();

    if (!["scheduled", "in_progress", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    match.status = status;
    await match.save();
    await match.populate("participants", "username fullName");

    return NextResponse.json({ match });
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json({ error: "Failed to update match status" }, { status: 500 });
  }
}
