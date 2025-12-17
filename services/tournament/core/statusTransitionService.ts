// services/tournament/core/statusTransitionService.ts

import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";
import BracketState from "@/models/BracketState";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { generateKnockoutStatistics } from "./knockoutStatisticsService";

/**
 * Handle tournament completion and generate statistics
 * This is called when a knockout tournament is marked as completed
 */
export async function onTournamentCompleted(
  tournamentId: string,
  userId?: string
): Promise<void> {
  // Fetch tournament
  const tournament =
    (await TournamentIndividual.findById(tournamentId)) ||
    (await TournamentTeam.findById(tournamentId));

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  if (tournament.format !== "knockout") {
    throw new Error("Tournament is not a knockout format");
  }

  // Verify bracket exists and is completed
  const bracket = await BracketState.findOne({ tournament: tournamentId });
  if (!bracket) {
    throw new Error("Bracket not found for tournament");
  }

  if (!bracket.completed) {
    throw new Error("Bracket is not completed. Cannot finalize tournament.");
  }

  // Generate knockout statistics
  const statistics = await generateKnockoutStatistics(tournamentId);

  // Update tournament with statistics and status
  tournament.knockoutStatistics = statistics as any;
  tournament.status = "completed";
  await tournament.save();

  console.log(`Tournament ${tournamentId} completed and statistics generated.`);
}

/**
 * Check if all knockout matches are completed
 * This checks the actual match documents, not just the BracketState flags
 */
export async function areAllKnockoutMatchesCompleted(tournamentId: string): Promise<boolean> {
  const bracket = await BracketState.findOne({ tournament: tournamentId });
  if (!bracket) {
    return false;
  }

  // If already marked as completed, return true
  if (bracket.completed) {
    return true;
  }

  // Collect all match IDs from the bracket
  const matchIds: string[] = [];
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.matchId) {
        matchIds.push(match.matchId.toString());
      }
    }
  }
  if (bracket.thirdPlaceMatch?.matchId) {
    matchIds.push(bracket.thirdPlaceMatch.matchId.toString());
  }

  // Fetch actual match documents from database
  const individualMatches = await IndividualMatch.find({ _id: { $in: matchIds } }).lean();
  const teamMatches = await TeamMatch.find({ _id: { $in: matchIds } }).lean();
  const allMatches = [...individualMatches, ...teamMatches];

  // Create a map of matchId -> match document
  const matchMap = new Map(allMatches.map((m: any) => [m._id.toString(), m]));

  // Check each match in the bracket and update flags
  let allCompleted = true;
  let bracketStateUpdated = false;

  for (const round of bracket.rounds) {
    let allMatchesInRoundCompleted = true;
    for (const match of round.matches) {
      if (!match.matchId) {
        // No match created yet
        if (match.participant1 && match.participant2) {
          allCompleted = false;
          allMatchesInRoundCompleted = false;
        }
        continue;
      }

      // Get actual match document
      const actualMatch = matchMap.get(match.matchId.toString());
      if (!actualMatch) {
        allCompleted = false;
        allMatchesInRoundCompleted = false;
        continue;
      }

      // Check if actual match is completed
      const isActuallyCompleted = actualMatch.status === "completed";

      // Update bracket state if out of sync
      if (isActuallyCompleted && !match.completed) {
        match.completed = true;
        match.winner = actualMatch.winnerSide === "side1"
          ? match.participant1
          : actualMatch.winnerSide === "side2"
            ? match.participant2
            : actualMatch.winnerTeam === "team1"
              ? match.participant1
              : match.participant2;
        bracketStateUpdated = true;
      }

      if (!isActuallyCompleted) {
        allCompleted = false;
        allMatchesInRoundCompleted = false;
      }
    }

    // Update round completion flag
    if (allMatchesInRoundCompleted && !round.completed) {
      round.completed = true;
      bracketStateUpdated = true;
    } else if (!allMatchesInRoundCompleted && round.completed) {
      round.completed = false;
      bracketStateUpdated = true;
    }
  }

  // Check third place match if it exists
  if (bracket.thirdPlaceMatch?.matchId) {
    const actualMatch = matchMap.get(bracket.thirdPlaceMatch.matchId.toString());

    if (actualMatch) {
      const isActuallyCompleted = actualMatch.status === "completed";

      // Update bracket state if out of sync
      if (isActuallyCompleted && !bracket.thirdPlaceMatch.completed) {
        bracket.thirdPlaceMatch.completed = true;
        bracket.thirdPlaceMatch.winner = actualMatch.winnerSide === "side1"
          ? bracket.thirdPlaceMatch.participant1
          : actualMatch.winnerSide === "side2"
            ? bracket.thirdPlaceMatch.participant2
            : actualMatch.winnerTeam === "team1"
              ? bracket.thirdPlaceMatch.participant1
              : bracket.thirdPlaceMatch.participant2;
        bracketStateUpdated = true;
      }

      if (!isActuallyCompleted) {
        allCompleted = false;
      }
    } else if (bracket.thirdPlaceMatch.participant1 && bracket.thirdPlaceMatch.participant2) {
      allCompleted = false;
    }
  }

  // If all matches are actually completed, update the bracket.completed flag
  if (allCompleted && !bracket.completed) {
    bracket.completed = true;
    bracketStateUpdated = true;
  }

  // Save if we updated anything
  if (bracketStateUpdated) {
    await bracket.save();
  }

  return allCompleted;
}

/**
 * Manually finalize a knockout tournament
 * This can be called from an API endpoint triggered by the organizer
 * Also works for already-completed tournaments to regenerate statistics
 */
export async function finalizeTournament(
  tournamentId: string,
  userId: string
): Promise<void> {
  // Verify user is organizer
  const tournament =
    (await TournamentIndividual.findById(tournamentId)) ||
    (await TournamentTeam.findById(tournamentId));

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  if (tournament.organizer.toString() !== userId) {
    throw new Error("Only the organizer can finalize the tournament");
  }

  // Check if all matches are completed
  const allCompleted = await areAllKnockoutMatchesCompleted(tournamentId);
  if (!allCompleted) {
    throw new Error("Cannot finalize tournament: not all matches are completed");
  }

  // If tournament is already completed, just regenerate statistics
  if (tournament.status === "completed") {
    const statistics = await generateKnockoutStatistics(tournamentId);
    tournament.knockoutStatistics = statistics as any;
    await tournament.save();
  } else {
    // Call the completion handler for new tournaments
    await onTournamentCompleted(tournamentId, userId);
  }
}
