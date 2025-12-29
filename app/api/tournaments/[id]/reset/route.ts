import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import BracketState from "@/models/BracketState";
import { getAllMatchIds } from "@/services/tournament/tournamentUpdateService";
import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
  getMatchModel,
} from "@/lib/api";

/**
 * Reset a tournament to draft status (organizer only)
 * Removes all matches and resets standings
 * Only allowed if tournament hasn't started or has no completed matches
 */
export const POST = withDBAndErrorHandling(async (req, context) => {
  const { userId } = await requireAuth(req);
  const { id } = await context.params;

  const { tournament, isTeamTournament } = await loadTournament(id, userId, {
    requireOrganizer: true,
    skipConnect: true,
  });

  // Check if tournament has any completed matches
  if (tournament.drawGenerated) {
    const allMatchIds = getAllMatchIds(tournament);

    if (allMatchIds.length > 0) {
      const MatchModel = getMatchModel(
        isTeamTournament ? "team" : "individual"
      ) as any;
      const matches = await MatchModel.find({ _id: { $in: allMatchIds } });
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
      await MatchModel.deleteMany({ _id: { $in: allMatchIds } });
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
    });
  }

  // Clear bracket for knockout/hybrid
  if (tournament.format === "knockout" || tournament.format === "hybrid") {
    tournament.bracket = undefined;
  }

  // Clear standings
  tournament.standings = [];

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
});
