import IndividualMatch from "@/models/IndividualMatch";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";
import { calculateStandings } from "./core/standingsService";
import {
  updateBracketAfterMatch,
  getMatchesNeedingDocuments,
} from "./core/bracketProgressionService";
import { createBracketMatch } from "./core/matchGenerationService";

/**
 * Fetch matches by IDs
 */
export async function fetchMatches(matchIds: any[], lean = false) {
  const query = IndividualMatch.find({ _id: { $in: matchIds } });
  // Note: We don't populate participants here because calculateStandings expects ObjectIds
  return lean ? query.lean() : query;
}

/**
 * Get all match IDs from tournament structure
 */
export function getAllMatchIds(tournament: any): any[] {
  if (tournament.useGroups) {
    return tournament.groups.flatMap((g: any) =>
      g.rounds.flatMap((r: any) => r.matches)
    );
  }
  return tournament.rounds.flatMap((r: any) => r.matches);
}

/**
 * Check tournament completion status
 */
export function getTournamentStatus(matches: any[]) {
  const allCompleted = matches.every((m: any) => m.status === "completed");
  const anyInProgress = matches.some((m: any) => m.status === "in_progress");

  if (allCompleted) return "completed";
  if (anyInProgress) return "in_progress";
  return null; // no status change
}

/**
 * Update tournament standings and status after a match completes
 */
export async function updateTournamentAfterMatch(match: any) {
  // Always reload tournament to get latest bracket state
  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    console.error("[updateTournamentAfterMatch] Tournament not found for match", match._id);
    return;
  }

  // Ensure match has participants populated (they might be ObjectIds)
  if (!match.participants || match.participants.length === 0) {
    console.error("[updateTournamentAfterMatch] Match has no participants", match._id);
    return;
  }

  console.log(`[updateTournamentAfterMatch] Match ${match._id}, tournament format: ${tournament.format}`);

  // Handle knockout tournaments
  if (tournament.format === "knockout") {
    await updateKnockoutBracket(tournament, match);
    return;
  }

  // Handle round-robin tournaments
  await updateRoundRobinStandings(tournament);
}

/**
 * Update knockout bracket after a match completes
 * Automatically advances winner to next round and creates new match documents
 */
async function updateKnockoutBracket(tournament: any, match: any) {
  if (!tournament.bracket) {
    console.error("[updateKnockoutBracket] Tournament has no bracket");
    return;
  }

  // Get the winner from the match
  if (!match.winnerSide || !match.participants || match.participants.length < 2) {
    console.error("[updateKnockoutBracket] Match missing winner or participants", {
      matchId: match._id,
      winnerSide: match.winnerSide,
      participantCount: match.participants?.length,
    });
    return;
  }

  // Determine winner ID based on winnerSide
  const winnerId = match.winnerSide === "side1"
    ? match.participants[0]._id || match.participants[0]
    : match.participants[1]._id || match.participants[1];

  console.log(`[updateKnockoutBracket] Advancing winner ${winnerId} from match ${match._id}`);

  try {
    // Update bracket structure using progression service
    const updatedBracket = updateBracketAfterMatch(
      tournament.bracket,
      match._id.toString(),
      winnerId.toString()
    );

    tournament.bracket = updatedBracket;
    tournament.markModified('bracket'); // CRITICAL: bracket is Schema.Types.Mixed

    // Auto-create new match documents for newly determined matchups
    const matchesNeedingDocs = getMatchesNeedingDocuments(updatedBracket);

    if (matchesNeedingDocs.length > 0) {
      console.log(`[updateKnockoutBracket] Creating ${matchesNeedingDocs.length} new match documents`);

      for (const bracketMatch of matchesNeedingDocs) {
        try {
          const newMatchDoc = await createBracketMatch(
            bracketMatch,
            tournament,
            match.scorer?.toString() || tournament.organizer.toString()
          );

          if (newMatchDoc) {
            bracketMatch.matchId = newMatchDoc._id.toString();
            console.log(`[updateKnockoutBracket] Created match ${newMatchDoc._id} for round ${bracketMatch.bracketPosition.round}`);
          }
        } catch (matchError: any) {
          console.error("[updateKnockoutBracket] Error creating match document:", matchError);
          // Continue with other matches even if one fails
        }
      }
    }

    // Update tournament status
    if (updatedBracket.completed) {
      tournament.status = "completed";
      console.log(`[updateKnockoutBracket] Tournament ${tournament._id} completed!`);
    } else if (tournament.status === "draft" || tournament.status === "upcoming") {
      tournament.status = "in_progress";
    }

    await tournament.save();
    console.log(`[updateKnockoutBracket] Bracket updated successfully for tournament ${tournament._id}`);
  } catch (error: any) {
    console.error("[updateKnockoutBracket] Error updating bracket:", error);
    throw error;
  }
}

/**
 * Update standings for Round Robin tournaments
 */
export async function updateRoundRobinStandings(tournament: any) {
  const participantIds = tournament.participants.map((p: any) => p.toString());

  // CASE 1: Tournament with Groups
  if (tournament.useGroups && tournament.groups && tournament.groups.length > 0) {
    for (const group of tournament.groups) {
      // Fetch all matches for this group
      const groupMatchIds = group.rounds.flatMap((r: any) => r.matches);
      const matches = await fetchMatches(groupMatchIds, true);

      // Calculate standings using ITTF rules
      const standingsData = calculateStandings(
        group.participants.map((p: any) => p.toString()),
        matches as any,
        tournament.rules
      );

      // Update group standings
      group.standings = standingsData.map((s) => ({
        participant: s.participant,
        played: s.played,
        won: s.won,
        lost: s.lost,
        drawn: s.drawn,
        setsWon: s.setsWon,
        setsLost: s.setsLost,
        setsDiff: s.setsDiff,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDiff: s.pointsDiff,
        points: s.points,
        rank: s.rank,
        form: s.form,
        headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
      }));
    }

    // Generate overall standings from group winners
    const advancePerGroup = tournament.advancePerGroup || 2;
    const qualifiers: any[] = [];

    tournament.groups.forEach((group: any) => {
      const topN = group.standings.slice(0, advancePerGroup);
      qualifiers.push(...topN.map((q: any) => ({
        ...q,
        headToHead: q.headToHead || {},
      })));
    });

    tournament.standings = qualifiers.map((q: any, idx: number) => ({
      ...q,
      rank: idx + 1,
    }));
  }
  // CASE 2: Single Round Robin (no groups)
  else {
    const roundMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await fetchMatches(roundMatchIds, true);

    const standingsData = calculateStandings(
      participantIds,
      matches as any,
      tournament.rules
    );

    tournament.standings = standingsData.map((s) => ({
      participant: s.participant,
      played: s.played,
      won: s.won,
      lost: s.lost,
      drawn: s.drawn,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      setsDiff: s.setsDiff,
      pointsScored: s.pointsScored,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.pointsDiff,
      points: s.points,
      rank: s.rank,
      form: s.form,
      headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
    }));
  }

  // Update round completion status
  const allMatchIds = getAllMatchIds(tournament);
  const allMatches = await fetchMatches(allMatchIds, true);
  const matchMap = new Map(allMatches.map((m: any) => [m._id.toString(), m]));

  // Update round completion for groups
  if (tournament.useGroups && tournament.groups) {
    for (const group of tournament.groups) {
      for (const round of group.rounds || []) {
        const roundMatches = round.matches.map((m: any) => matchMap.get(m.toString()));
        round.completed = roundMatches.every((m: any) => m && m.status === "completed");
      }
    }
  }

  // Update round completion for single round-robin
  if (tournament.rounds && !tournament.useGroups) {
    for (const round of tournament.rounds) {
      const roundMatches = round.matches.map((m: any) => matchMap.get(m.toString()));
      round.completed = roundMatches.every((m: any) => m && m.status === "completed");
    }
  }

  // Check if all rounds are completed and update tournament status
  const newStatus = getTournamentStatus(allMatches);

  if (newStatus && tournament.status !== newStatus) {
    tournament.status = newStatus;
  }

  await tournament.save();
}
