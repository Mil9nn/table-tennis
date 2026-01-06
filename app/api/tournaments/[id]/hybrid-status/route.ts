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
import Team from "@/models/Team";
import { User } from "@/models/User";
import {
  getHybridTournamentStatus,
  getQualificationSummary,
} from "@/services/tournament";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireAuth(req);
    const { id } = await context.params;

    const { tournament, isTeamTournament } = await loadTournament(id, null, {
      skipConnect: true,
    });

    // Populate participants based on tournament category
    await (tournament as any).populate("participants");
    await (tournament as any).populate("qualifiedParticipants");

    // If not hybrid, return basic info
    if (tournament.format !== "hybrid") {
      return jsonOk({
        isHybrid: false,
        format: tournament.format,
        message: "Tournament is not hybrid format",
      });
    }

    // Get comprehensive hybrid status
    const status = getHybridTournamentStatus(tournament as any);
    const qualificationSummary = getQualificationSummary(tournament as any);

    // Build response
    const response: Record<string, any> = {
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
    if (
      tournament.qualifiedParticipants &&
      tournament.qualifiedParticipants.length > 0
    ) {
      response.qualifiedParticipants = tournament.qualifiedParticipants;
    }

    // Add round-robin progress
    if (status.currentPhase === "round_robin") {
      const usesGroups =
        tournament.hybridConfig?.roundRobinUseGroups || tournament.useGroups;

      if (usesGroups && tournament.groups && tournament.groups.length > 0) {
        // Group-based progress
        const groupProgress = tournament.groups.map((group: any) => ({
          groupId: group.groupId,
          groupName: group.groupName,
          participantCount: group.participants?.length || 0,
          roundsTotal: group.rounds?.length || 0,
          roundsCompleted:
            group.rounds?.filter((r: any) => r.completed).length || 0,
          isComplete:
            group.rounds?.length > 0 &&
            group.rounds.every((r: any) => r.completed),
        }));

        response.roundRobinProgress = {
          useGroups: true,
          groups: groupProgress,
          allGroupsComplete: groupProgress.every((g: any) => g.isComplete),
        };
      } else {
        // Single group progress (no groups, flat round-robin)
        const roundsTotal = tournament.rounds?.length || 0;
        const roundsCompleted =
          tournament.rounds?.filter((r: any) => r.completed).length || 0;

        response.roundRobinProgress = {
          useGroups: false,
          roundsTotal,
          roundsCompleted,
          isComplete: roundsTotal > 0 && roundsCompleted === roundsTotal,
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

    return jsonOk(response);
  } catch (error) {
    return jsonError(error);
  }
}
