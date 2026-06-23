import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit/middleware";
import {
  validateRequest,
  toggleTeamJoinCodeSchema,
} from "@/lib/validations";
import { generateUniqueTeamJoinCode } from "@/services/tournament/utils/codeGenerator";

/**
 * Toggle join-by-code for a team (captain only). Generates a code when enabling.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rateLimitResponse = await rateLimit(
    req,
    "POST",
    `/api/teams/${id}/toggle-join-code`
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateRequest(toggleTeamJoinCodeSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { enable } = validation.data;

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const captainId = team.captain._id?.toString() || team.captain.toString();
    if (captainId !== decoded.userId.toString()) {
      return NextResponse.json(
        { message: "Forbidden: Only the team captain can change invite settings" },
        { status: 403 }
      );
    }

    if (enable) {
      if (!team.joinCode) {
        team.joinCode = await generateUniqueTeamJoinCode();
      }
      team.allowJoinByCode = true;
    } else {
      team.allowJoinByCode = false;
    }

    await team.save();

    return NextResponse.json({
      message: enable
        ? "Team invite link enabled"
        : "Team invite link disabled",
      joinCode: team.joinCode,
      allowJoinByCode: team.allowJoinByCode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[teams/toggle-join-code] Error:", err);
    return NextResponse.json(
      {
        message: "Failed to update invite settings",
        ...(process.env.NODE_ENV === "development" && { details: message }),
      },
      { status: 500 }
    );
  }
}
