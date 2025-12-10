/**
 * GET /api/tournaments/[id]/hybrid-status
 *
 * Gets comprehensive status information for hybrid tournaments
 * - Current phase
 * - Phase completion status
 * - Qualification information
 * - Next actions available
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  getHybridTournamentStatus,
  getPhaseInfo,
  getQualificationSummary,
} from "@/services/tournament";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Ensure models are registered (explicitly reference to ensure they're loaded)
    const TournamentModel = Tournament;
    const UserModel = User;
    const TeamModel = Team;
    
    if (!TournamentModel || !UserModel || !TeamModel) {
      throw new Error("Required models not loaded");
    }

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const params = await context.params;
    const tournamentId = params.id;

    // Find tournament
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Populate participants based on tournament category
    const isTeamTournament = tournament.category === "team";
    if (isTeamTournament) {
      await tournament.populate({
        path: "participants",
        model: Team,
        select: "name logo city captain",
      });
      await tournament.populate({
        path: "qualifiedParticipants",
        model: Team,
        select: "name logo city captain",
      });
    } else {
      await tournament.populate({
        path: "participants",
        model: User,
        select: "username fullName profileImage",
      });
      await tournament.populate({
        path: "qualifiedParticipants",
        model: User,
        select: "username fullName profileImage",
      });
    }

    // If not hybrid, return basic info
    if (tournament.format !== "hybrid") {
      return NextResponse.json(
        {
          isHybrid: false,
          format: tournament.format,
          message: "Tournament is not hybrid format",
        },
        { status: 200 }
      );
    }

    // Get comprehensive hybrid status
    const status = getHybridTournamentStatus(tournament);
    const phaseInfo = getPhaseInfo(tournament);
    const qualificationSummary = getQualificationSummary(tournament);

    // Build response
    const response: any = {
      isHybrid: true,
      format: tournament.format,
      currentPhase: status.currentPhase,
      phaseTransitionDate: tournament.phaseTransitionDate,

      // Phase completion status
      roundRobinComplete: status.roundRobinComplete,
      knockoutComplete: status.knockoutComplete,

      // Qualification info
      qualifiedCount: status.qualifiedCount,
      totalParticipants: status.totalParticipants,

      // Configuration
      hybridConfig: tournament.hybridConfig,

      // Actions
      canTransition: status.canTransition,
      nextAction: status.nextAction,
    };

    // Add qualification summary if available
    if (qualificationSummary) {
      response.qualificationSummary = qualificationSummary;
    }

    // Add qualified participants if available
    if (tournament.qualifiedParticipants && tournament.qualifiedParticipants.length > 0) {
      response.qualifiedParticipants = tournament.qualifiedParticipants;
    }

    // Add round-robin progress
    if (status.currentPhase === "round_robin") {
      if (tournament.useGroups && tournament.groups) {
        // Group-based progress
        const groupProgress = tournament.groups.map((group: any) => ({
          groupId: group.groupId,
          groupName: group.groupName,
          participantCount: group.participants.length,
          roundsTotal: group.rounds.length,
          roundsCompleted: group.rounds.filter((r: any) => r.completed).length,
          isComplete: group.rounds.every((r: any) => r.completed),
        }));

        response.roundRobinProgress = {
          useGroups: true,
          groups: groupProgress,
          allGroupsComplete: groupProgress.every((g: any) => g.isComplete),
        };
      } else {
        // Single group progress
        const roundsTotal = tournament.rounds.length;
        const roundsCompleted = tournament.rounds.filter(
          (r: any) => r.completed
        ).length;

        response.roundRobinProgress = {
          useGroups: false,
          roundsTotal,
          roundsCompleted,
          isComplete: roundsCompleted === roundsTotal,
        };
      }
    }

    // Add knockout progress
    if (status.currentPhase === "knockout" && tournament.bracket) {
      const bracket = tournament.bracket;
      response.knockoutProgress = {
        currentRound: bracket.currentRound,
        totalRounds: bracket.rounds.length,
        roundsCompleted: bracket.rounds.filter((r: any) => r.completed).length,
        bracketSize: bracket.size,
        isComplete: bracket.completed,
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching hybrid status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch hybrid tournament status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
