import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import BracketState from "@/models/BracketState";
import { getAllMatchIds } from "@/services/tournament/tournamentUpdateService";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
  getMatchModel,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import TournamentGroups from "@/models/TournamentGroups";
import TournamentStandings from "@/models/TournamentStandings";

/**
 * Reset a tournament to draft status (organizer only)
 * Removes all matches and resets standings
 * Only allowed if tournament hasn't started or has no completed matches
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await requireAuth(req);
    const { id } = await context.params;

    const { tournament, isTeamTournament } = await loadTournament(id, userId, {
      requireOrganizer: true,
      skipConnect: true,
    });

    // Check if tournament has any completed matches
    if (tournament.drawGenerated) {
      const allMatchIds = new Set<string>(getAllMatchIds(tournament));

      // Projection-backed group rounds may contain historical match ids even when
      // legacy embedded fields are absent or stale.
      const projectedGroups = await TournamentGroups.findOne({ tournament: id }).lean();
      (projectedGroups?.groups || []).forEach((group: any) => {
        (group?.rounds || []).forEach((round: any) => {
          (round?.matches || []).forEach((matchId: any) => {
            const value = matchId?.toString?.() || "";
            if (value) allMatchIds.add(value);
          });
        });
      });
      const allMatchIdsList = Array.from(allMatchIds);

      if (allMatchIdsList.length > 0) {
        const MatchModel = getMatchModel(
          isTeamTournament ? "team" : "individual"
        ) as any;
        const matches = await MatchModel.find({ _id: { $in: allMatchIdsList } });
        const hasCompletedMatches = matches.some(
          (m: any) => m.status === "completed"
        );

        if (hasCompletedMatches) {
          throw ApiError.badRequest(
            "Cannot reset tournament with completed matches",
            "Tournaments with completed matches cannot be reset. This would invalidate match results and player statistics."
          );
        }

        // Delete all associated match documents
        await MatchModel.deleteMany({ _id: { $in: allMatchIdsList } });
      }
    }

    // Delete bracket state if exists
    await BracketState.deleteOne({ tournament: id });

    // Reset tournament to draft
    tournament.status = "draft";
    tournament.drawGenerated = false;
    tournament.drawGeneratedAt = undefined;
    tournament.drawGeneratedBy = undefined;
    tournament.endDate = undefined;

    // Clear rounds and matches
    tournament.rounds = [];
    if (tournament.groups) {
      tournament.groups.forEach((group: any) => {
        group.rounds = [];
        group.standings = [];
        group.participants = []; // Clear participants from groups
      });
      // Mark groups as modified so Mongoose saves the changes
      (tournament as any).markModified("groups");
    }

    // Clear bracket for knockout/hybrid
    if (tournament.format === "knockout" || tournament.format === "hybrid") {
      tournament.bracket = undefined;
    }

    // Clear standings
    tournament.standings = [];

    // Clear projection docs so subsequent reads rely on clean state.
    await Promise.all([
      TournamentGroups.findOneAndUpdate(
        { tournament: id },
        { $set: { groups: [] } },
        { upsert: true }
      ),
      TournamentStandings.deleteMany({ tournament: id }),
    ]);

    // Reset hybrid phase if applicable
    if (tournament.format === "hybrid") {
      tournament.currentPhase = "round_robin";
      tournament.phaseTransitionDate = undefined;
      tournament.qualifiedParticipants = [];
    }

    await tournament.save();

    // Populate tournament data for response
    await (tournament as any).populate("organizer");
    await (tournament as any).populate("participants");

    return jsonOk({
      message: "Tournament reset successfully. You can now regenerate the draw.",
      tournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}
