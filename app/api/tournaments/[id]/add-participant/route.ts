import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  TournamentValidators,
  handleValidationResult,
} from "@/services/tournament/validators/tournamentValidators";

/**
 * Add a participant to a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const isTeamTournament = tournament.category === "team";

    // Validate organizer permissions
    const organizerCheck = TournamentValidators.validateIsOrganizer(
      tournament,
      decoded.userId
    );
    const error = handleValidationResult(organizerCheck);
    if (error) return error;

    // Get participant ID from request
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if participant exists based on tournament category
    if (isTeamTournament) {
      const team = await Team.findById(participantId);
      if (!team) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }
    } else {
      const participant = await User.findById(participantId);
      if (!participant) {
        return NextResponse.json(
          { error: "Participant not found" },
          { status: 404 }
        );
      }
    }

    // Validate draw not generated
    const drawCheck = TournamentValidators.validateDrawNotGenerated(tournament);
    const drawError = handleValidationResult(drawCheck);
    if (drawError) return drawError;

    // Validate participant not already in tournament
    const notInTournamentCheck =
      TournamentValidators.validateParticipantNotInTournament(
        tournament,
        participantId
      );
    const notInError = handleValidationResult(notInTournamentCheck);
    if (notInError) return notInError;

    // Validate capacity
    const capacityCheck = TournamentValidators.validateCapacity(tournament);
    const capacityError = handleValidationResult(capacityCheck);
    if (capacityError) return capacityError;

    // Add participant to tournament
    tournament.participants.push(participantId as any);
    await tournament.save();

    // Populate tournament data based on category
    if (isTeamTournament) {
      await tournament.populate([
        { 
          path: "participants", 
          model: Team,
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        },
        { path: "organizer", select: "username fullName profileImage" },
        { path: "seeding.participant", model: Team, select: "name logo city captain" },
      ]);
    } else {
      await tournament.populate([
        { path: "participants", select: "username fullName profileImage" },
        { path: "organizer", select: "username fullName profileImage" },
        { path: "seeding.participant", select: "username fullName profileImage" },
      ]);
    }

    return NextResponse.json({
      message: isTeamTournament ? "Team added successfully!" : "Participant added successfully!",
      tournament,
    });
  } catch (err: any) {
    console.error("Error adding participant:", err);
    return NextResponse.json(
      { error: "Failed to add participant", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * Remove a participant from a tournament (organizer only)
 * Supports both individual (User) and team (Team) tournaments
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const isTeamTournament = tournament.category === "team";

    // Validate organizer permissions
    const organizerCheck = TournamentValidators.validateIsOrganizer(
      tournament,
      decoded.userId
    );
    const error = handleValidationResult(organizerCheck);
    if (error) return error;

    // Get participant ID from request
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Prevent removal if draw has been generated
    if (tournament.drawGenerated) {
      return NextResponse.json(
        { 
          error: "Cannot remove participant after draw generation",
          details: "Participants cannot be removed once the tournament draw has been generated. This would invalidate existing matches and standings."
        },
        { status: 400 }
      );
    }

    // Prevent removal if tournament has started (status is not draft/upcoming)
    if (tournament.status !== "draft" && tournament.status !== "upcoming") {
      return NextResponse.json(
        { 
          error: "Cannot remove participant",
          details: "Participants cannot be removed once the tournament has started."
        },
        { status: 400 }
      );
    }

    // Validate participant is in tournament
    const inTournamentCheck = TournamentValidators.validateParticipantInTournament(
      tournament,
      participantId
    );
    const inError = handleValidationResult(inTournamentCheck);
    if (inError) return inError;

    // Check if removing this participant would violate minimum participants requirement
    if (tournament.minParticipants) {
      const newParticipantCount = tournament.participants.length - 1;
      if (newParticipantCount < tournament.minParticipants) {
        return NextResponse.json(
          { 
            error: "Cannot remove participant",
            details: `Removing this participant would leave ${newParticipantCount} participants, but minimum ${tournament.minParticipants} participants are required.`
          },
          { status: 400 }
        );
      }
    }

    // Remove participant
    tournament.participants = tournament.participants.filter(
      (p: any) => p.toString() !== participantId
    );

    // Also remove from seeding if present
    tournament.seeding = tournament.seeding.filter(
      (s: any) => s.participant.toString() !== participantId
    );

    await tournament.save();

    // Populate tournament data based on category
    if (isTeamTournament) {
      await tournament.populate([
        { 
          path: "participants", 
          model: Team,
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        },
        { path: "organizer", select: "username fullName profileImage" },
        { path: "seeding.participant", model: Team, select: "name logo city captain" },
      ]);
    } else {
      await tournament.populate([
        { path: "participants", select: "username fullName profileImage" },
        { path: "organizer", select: "username fullName profileImage" },
        { path: "seeding.participant", select: "username fullName profileImage" },
      ]);
    }

    return NextResponse.json({
      message: isTeamTournament ? "Team removed successfully!" : "Participant removed successfully!",
      tournament,
    });
  } catch (err: any) {
    console.error("Error removing participant:", err);
    return NextResponse.json(
      { error: "Failed to remove participant", details: err.message },
      { status: 500 }
    );
  }
}
