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
import { loadAndApplyProjectedTournamentData } from "@/lib/api/tournamentProjections";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireAuth(req);
    const { id } = await context.params;

    const { tournament: initialTournament, isTeamTournament } = await loadTournament(id, null, {
      skipConnect: true,
    });

    // Populate participants based on tournament category
    await (initialTournament as any).populate("participants");
    await (initialTournament as any).populate("qualifiedParticipants");

    // If not hybrid, return basic info
    if (initialTournament.format !== "hybrid") {
      return jsonOk({
        isHybrid: false,
        format: initialTournament.format,
        message: "Tournament is not hybrid format",
      });
    }

    // For hybrid tournaments in round-robin phase, ensure round completion flags are up-to-date
    // by triggering a standings update if needed (this will refresh round.completed flags)
    let tournament: any = initialTournament;
    if (initialTournament.format === "hybrid" && initialTournament.currentPhase === "round_robin") {
      const { updateRoundRobinStandings } = await import("@/services/tournament/tournamentUpdateService");
      // Reload tournament fresh to ensure we have latest data
      let freshTournament: any = null;
      if (isTeamTournament) {
        const TournamentTeam = (await import("@/models/TournamentTeam")).default;
        freshTournament = await (TournamentTeam as any).findById(id);
      } else {
        const TournamentIndividual = (await import("@/models/TournamentIndividual")).default;
        freshTournament = await (TournamentIndividual as any).findById(id);
      }
      if (freshTournament) {
        // Update standings and round completion flags
        await updateRoundRobinStandings(freshTournament);
        // Use the fresh tournament for status check
        tournament = freshTournament;
      }
    }

    // Ensure hybrid status is projection-backed and not dependent on legacy embedded fields.
    const tournamentData = tournament.toObject ? tournament.toObject() : tournament;
    await loadAndApplyProjectedTournamentData(id, tournamentData);

    // Get comprehensive hybrid status
    const status = getHybridTournamentStatus(tournamentData as any);
    const qualificationSummary = getQualificationSummary(tournamentData as any);

    // Build response
    const response: Record<string, any> = {
      isHybrid: true,
      format: tournamentData.format,
      currentPhase: status.currentPhase,
      phaseTransitionDate: tournamentData.phaseTransitionDate,

      // Phase completion status
      roundRobinComplete: status.roundRobinComplete,
      knockoutComplete: status.knockoutComplete,

      // Qualification info
      qualifiedCount: status.qualifiedCount,
      totalParticipants: status.totalParticipants,

      // Configuration
      hybridConfig: tournamentData.hybridConfig,

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
      tournamentData.qualifiedParticipants &&
      tournamentData.qualifiedParticipants.length > 0
    ) {
      response.qualifiedParticipants = tournamentData.qualifiedParticipants;
    }

    // Add round-robin progress
    if (status.currentPhase === "round_robin") {
      const usesGroups =
        tournamentData.hybridConfig?.roundRobinUseGroups || tournamentData.useGroups;

      if (usesGroups && tournamentData.groups && tournamentData.groups.length > 0) {
        // Group-based progress
        const groupProgress = tournamentData.groups.map((group: any) => ({
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
        const roundsTotal = tournamentData.rounds?.length || 0;
        const roundsCompleted =
          tournamentData.rounds?.filter((r: any) => r.completed).length || 0;

        response.roundRobinProgress = {
          useGroups: false,
          roundsTotal,
          roundsCompleted,
          isComplete: roundsTotal > 0 && roundsCompleted === roundsTotal,
        };
      }
    }

    // Add knockout progress
    if (status.currentPhase === "knockout" && tournamentData.bracket) {
      const bracket = tournamentData.bracket;
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
