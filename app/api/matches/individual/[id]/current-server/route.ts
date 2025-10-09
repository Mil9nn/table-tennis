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
    const { currentServer } = await req.json();

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

    // ✅ Only scorer can update
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Update only the current server
    match.currentServer = currentServer;
    await match.save();

    return NextResponse.json({ success: true, currentServer });
  } catch (err) {
    console.error("Failed to update currentServer:", err);
    return NextResponse.json(
      { error: "Failed to update currentServer" },
      { status: 500 }
    );
  }
}
