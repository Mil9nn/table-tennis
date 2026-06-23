// app/api/tournaments/[id]/finalize/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { finalizeTournament } from "@/services/tournament/core/statusTransitionService";

/**
 * POST /api/tournaments/[id]/finalize
 * Finalize a knockout tournament and generate statistics
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id: tournamentId } = await context.params;

    // Connect to database
    await connectDB();

    // Finalize tournament (this validates organizer permissions)
    await finalizeTournament(tournamentId, decoded.userId);

    return NextResponse.json({
      message: "Tournament finalized and statistics generated successfully",
    });
  } catch (error: any) {
    console.error("Error finalizing tournament:", error);
    return NextResponse.json(
      { error: error.message || "Failed to finalize tournament" },
      { status: 400 }
    );
  }
}
