import { NextRequest, NextResponse } from "next/server";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { validateRequest, joinTeamBodySchema } from "@/lib/validations";

const MAX_TEAM_PLAYERS = 20;

/**
 * Join a team using a join code
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, "POST", "/api/teams/join");
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
    const validation = validateRequest(joinTeamBodySchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { joinCode } = validation.data;
    const userId = decoded.userId.toString();

    const team = await Team.findOne({ joinCode });

    if (!team) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    if (!team.allowJoinByCode) {
      return NextResponse.json(
        { error: "This team is not accepting new members via join code" },
        { status: 400 }
      );
    }

    const alreadyMember = team.players.some((p: { user: { _id?: { toString: () => string }; toString: () => string } }) => {
      const playerId = p.user?._id?.toString?.() ?? p.user.toString();
      return playerId === userId;
    });

    if (alreadyMember) {
      return NextResponse.json(
        { error: "You are already on this team" },
        { status: 400 }
      );
    }

    if (team.players.length >= MAX_TEAM_PLAYERS) {
      return NextResponse.json(
        {
          error: "Team is full",
          details: `Maximum ${MAX_TEAM_PLAYERS} players allowed.`,
        },
        { status: 400 }
      );
    }

    team.players.push({
      user: decoded.userId as any,
      role: "player",
      joinedDate: new Date(),
    });

    await team.save();

    await team.populate([
      { path: "captain", select: "username fullName profileImage" },
      { path: "players.user", select: "username fullName profileImage" },
    ]);

    return NextResponse.json({
      message: "Successfully joined team!",
      team: team.toObject(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[teams/join] Error:", err);
    return NextResponse.json(
      {
        error: "Failed to join team",
        ...(process.env.NODE_ENV === "development" && { details: message }),
      },
      { status: 500 }
    );
  }
}
