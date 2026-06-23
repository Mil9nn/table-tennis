import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";
import { rateLimit } from "@/lib/rate-limit/middleware";

/**
 * Join a tournament using a join code
 */
export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, "POST", "/api/tournaments/join");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get join code from request
    const { joinCode } = await req.json();

    if (!joinCode || joinCode.trim().length === 0) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      );
    }

    // Find tournament by join code
    const tournament = await Tournament.findOne({
      joinCode: joinCode.toUpperCase().trim(),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Invalid join code" },
        { status: 404 }
      );
    }

    // Validate join code
    const joinCodeCheck = TournamentValidators.validateJoinCode(
      tournament,
      joinCode.toUpperCase().trim()
    );
    const error = handleValidationResult(joinCodeCheck);
    if (error) return error;

    // Validate user can join tournament (composite validation)
    const canJoinCheck = TournamentValidators.canJoinTournament(
      tournament,
      decoded.userId
    );
    const joinError = handleValidationResult(canJoinCheck);
    if (joinError) return joinError;

    // Check max participants limit
    if (tournament.maxParticipants) {
      const currentParticipantCount = tournament.participants.length;
      if (currentParticipantCount >= tournament.maxParticipants) {
        return NextResponse.json(
          { 
            error: "Tournament is full",
            details: `Maximum ${tournament.maxParticipants} participants allowed. Currently ${currentParticipantCount} participants.`
          },
          { status: 400 }
        );
      }
    }

    // Check registration deadline if set
    if (tournament.registrationDeadline) {
      const now = new Date();
      if (now > tournament.registrationDeadline) {
        return NextResponse.json(
          { 
            error: "Registration deadline has passed",
            details: `Registration closed on ${tournament.registrationDeadline.toLocaleDateString()}`
          },
          { status: 400 }
        );
      }
    }

    // Add user to participants
    tournament.participants.push(decoded.userId as any);
    await tournament.save();

    // Populate tournament data
    await tournament.populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "organizer", select: "username fullName" },
    ]);

    return NextResponse.json({
      message: "Successfully joined tournament!",
      tournament,
    });
  } catch (err: any) {
    console.error("[tournaments/join] Error:", err);
    return NextResponse.json(
      { 
        error: "Failed to join tournament",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}
