import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";
import { calculateStandings as calculateStandingsLegacy } from "./core/standingsService";
import { StandingsCalculator } from "./core/standings/standingsCalculator";
import {
  updateBracketAfterMatch,
  getMatchesNeedingDocuments,
} from "./core/bracketProgressionService";
import {
  createBracketMatch,
  createBracketTeamMatch,
} from "./core/matchGenerationService";
import { onTournamentCompleted } from "./core/statusTransitionService";

/**
 * Fetch matches by IDs (handles both IndividualMatch and TeamMatch)
 */
export async function fetchMatches(matchIds: any[], lean = false) {
  // Try to fetch as IndividualMatch first
  const individualMatches = await IndividualMatch.find({
    _id: { $in: matchIds },
  });
  const individualMatchIds = individualMatches.map((m) => String(m._id));
  const remainingIds = matchIds.filter(
    (id) => !individualMatchIds.includes(id.toString())
  );

  // Fetch remaining as TeamMatch
  let teamMatches: any[] = [];
  if (remainingIds.length > 0) {
    teamMatches = await TeamMatch.find({ _id: { $in: remainingIds } });
  }

  // Combine results
  const allMatches = [...individualMatches, ...teamMatches];

  // Sort to match original order
  const matchMap = new Map(allMatches.map((m) => [String(m._id), m]));
  return matchIds.map((id) => matchMap.get(id.toString())).filter(Boolean);
}

/**
 * Get all match IDs from tournament structure
 */
export function getAllMatchIds(tournament: any): any[] {
  // Check if tournament uses groups (for round-robin or hybrid round-robin phase)
  const usesGroups =
    tournament.useGroups ||
    (tournament.format === "hybrid" &&
      tournament.hybridConfig?.roundRobinUseGroups);

  if (usesGroups && tournament.groups && tournament.groups.length > 0) {
    return tournament.groups.flatMap((g: any) =>
      g.rounds.flatMap((r: any) => r.matches)
    );
  }

  // For knockout tournaments, get matches from bracket
  if (tournament.format === "knockout" && tournament.bracket) {
    const matchIds: string[] = [];
    tournament.bracket.rounds.forEach((round: any) => {
      round.matches.forEach((match: any) => {
        if (match.matchId) {
          matchIds.push(
            typeof match.matchId === "string"
              ? match.matchId
              : match.matchId.toString()
          );
        }
      });
    });
    if (tournament.bracket.thirdPlaceMatch?.matchId) {
      const thirdPlaceId = tournament.bracket.thirdPlaceMatch.matchId;
      matchIds.push(
        typeof thirdPlaceId === "string"
          ? thirdPlaceId
          : thirdPlaceId.toString()
      );
    }
    return matchIds;
  }

  // For hybrid knockout phase, get BOTH round-robin AND bracket matches
  if (
    tournament.format === "hybrid" &&
    tournament.currentPhase === "knockout"
  ) {
    const matchIds: string[] = [];
    
    // Get round-robin matches (historical)
    if (usesGroups && tournament.groups && tournament.groups.length > 0) {
      const roundRobinIds = tournament.groups.flatMap((g: any) =>
        g.rounds.flatMap((r: any) => r.matches)
      );
      matchIds.push(...roundRobinIds.map((id: any) => id.toString()));
    } else if (tournament.rounds && tournament.rounds.length > 0) {
      const roundRobinIds = tournament.rounds.flatMap((r: any) => r.matches);
      matchIds.push(...roundRobinIds.map((id: any) => id.toString()));
    }
    
    // Get bracket matches (knockout phase)
    if (tournament.bracket) {
      tournament.bracket.rounds.forEach((round: any) => {
        round.matches.forEach((match: any) => {
          if (match.matchId) {
            matchIds.push(
              typeof match.matchId === "string"
                ? match.matchId
                : match.matchId.toString()
            );
          }
        });
      });
      if (tournament.bracket.thirdPlaceMatch?.matchId) {
        const thirdPlaceId = tournament.bracket.thirdPlaceMatch.matchId;
        matchIds.push(
          typeof thirdPlaceId === "string"
            ? thirdPlaceId
            : thirdPlaceId.toString()
        );
      }
    }
    
    return matchIds;
  }

  // Default: round-robin matches
  return tournament.rounds?.flatMap((r: any) => r.matches) || [];
}

/**
 * Get all tournament matches (match documents, not just IDs)
 * Handles round-robin matches, bracket matches, and hybrid tournaments in both phases
 * 
 * @param tournament - Tournament document
 * @param isTeamTournament - Whether this is a team tournament
 * @returns Array of match documents (IndividualMatch or TeamMatch)
 */
export async function getAllTournamentMatches(
  tournament: any,
  isTeamTournament: boolean
): Promise<any[]> {
  const matchIds = getAllMatchIds(tournament);
  if (matchIds.length === 0) {
    return [];
  }
  return await fetchMatches(matchIds, true);
}

/**
 * Check tournament completion status
 */
export function getTournamentStatus(matches: any[]) {
  if (!matches || matches.length === 0) {
    return null; // no matches yet
  }

  const allCompleted = matches.every((m: any) => m && m.status === "completed");
  const anyInProgress = matches.some(
    (m: any) => m && m.status === "in_progress"
  );

  if (allCompleted) return "completed";
  if (anyInProgress) return "in_progress";
  return null; // no status change
}

/**
 * Check if tournament is fully completed (all matches done)
 */
export function isTournamentFullyCompleted(tournament: any): boolean {
  const allMatchIds = getAllMatchIds(tournament);

  if (allMatchIds.length === 0) {
    return false; // no matches generated yet
  }

  // For hybrid tournaments, need to check current phase
  if (tournament.format === "hybrid") {
    const currentPhase = tournament.currentPhase || "round_robin";

    if (currentPhase === "round_robin") {
      // Check if round-robin phase is complete
      // This will be handled in updateRoundRobinStandings
      return false; // Don't mark as complete until transitioned
    } else if (currentPhase === "knockout") {
      // Check if knockout bracket is complete
      if (tournament.bracket && tournament.bracket.completed) {
        return true;
      }
      // Also check all knockout matches are completed
      const knockoutMatchIds: string[] = [];
      if (tournament.bracket) {
        tournament.bracket.rounds.forEach((round: any) => {
          round.matches.forEach((match: any) => {
            if (match.matchId) {
              knockoutMatchIds.push(
                typeof match.matchId === "string"
                  ? match.matchId
                  : match.matchId.toString()
              );
            }
          });
        });
        if (tournament.bracket.thirdPlaceMatch?.matchId) {
          const thirdPlaceId = tournament.bracket.thirdPlaceMatch.matchId;
          knockoutMatchIds.push(
            typeof thirdPlaceId === "string"
              ? thirdPlaceId
              : thirdPlaceId.toString()
          );
        }
      }
      // Will check completion in updateKnockoutBracket
      return false;
    }
    return false;
  }

  // For knockout tournaments, check bracket completion
  if (tournament.format === "knockout" && tournament.bracket) {
    if (tournament.bracket.completed) {
      return true;
    }
    // Also verify all matches are completed
    const allMatches = getAllMatchIds(tournament);
    return (
      allMatches.length > 0 &&
      allMatches.every(() => {
        // This will be properly checked in updateKnockoutBracket
        return tournament.bracket.completed;
      })
    );
  }

  // For round-robin, check if all matches are completed
  // This is already handled in updateRoundRobinStandings
  return false;
}

/**
 * Update tournament standings and status after a match completes
 */
export async function updateTournamentAfterMatch(match: any) {
  // Always reload tournament to get latest bracket state
  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    console.error(
      "[updateTournamentAfterMatch] Tournament not found for match",
      match._id
    );
    return;
  }

  const isTeamMatch = match.matchCategory === "team";

  // For individual matches, validate participants
  if (!isTeamMatch) {
    // Ensure match has participants (they might be ObjectIds or populated objects)
    if (!match.participants || match.participants.length === 0) {
      console.error(
        "[updateTournamentAfterMatch] Match has no participants",
        match._id
      );
      return;
    }

    // Normalize participants to ObjectIds if needed
    const participantIds = match.participants.map((p: any) => {
      if (typeof p === "string") return p;
      if (p?._id) return p._id.toString();
      return p.toString();
    });

    // Ensure we have valid participant IDs
    if (participantIds.length < 2 || participantIds.some((id: any) => !id)) {
      console.error("[updateTournamentAfterMatch] Invalid participant IDs", {
        matchId: match._id,
        participantIds,
      });
      return;
    }
  } else {
    // For team matches, validate team1 and team2 exist
    if (!match.team1 || !match.team2) {
      console.error(
        "[updateTournamentAfterMatch] Team match missing team1 or team2",
        match._id
      );
      return;
    }
  }

  // Handle knockout tournaments
  if (tournament.format === "knockout") {
    await updateKnockoutBracket(tournament, match);
    return;
  }

  // Handle hybrid tournaments - route based on current phase
  if (tournament.format === "hybrid") {
    const currentPhase = tournament.currentPhase || "round_robin";

    if (currentPhase === "knockout") {
      // Hybrid tournament in knockout phase
      await updateKnockoutBracket(tournament, match);
      return;
    } else {
      // Hybrid tournament in round-robin phase
      await updateRoundRobinStandings(tournament);
      return;
    }
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

  // Check if this is a team match
  const isTeamMatch = match.matchCategory === "team";

  // Get the winner from the match
  let winnerId: string;

  if (isTeamMatch) {
    // For team matches, winner is determined by winnerTeam field
    if (!match.winnerTeam) {
      console.error("[updateKnockoutBracket] Team match missing winnerTeam", {
        matchId: match._id,
        winnerTeam: match.winnerTeam,
      });
      return;
    }

    // Find the bracket match to get participant IDs (team IDs)
    let bracketMatch: any = null;
    for (const round of tournament.bracket.rounds || []) {
      const found = round.matches.find(
        (m: any) => m.matchId?.toString() === match._id.toString()
      );
      if (found) {
        bracketMatch = found;
        break;
      }
    }

    if (
      !bracketMatch ||
      !bracketMatch.participant1 ||
      !bracketMatch.participant2
    ) {
      console.error(
        "[updateKnockoutBracket] Could not find bracket match for team match",
        {
          matchId: match._id,
        }
      );
      return;
    }

    // Use the participant ID (team ID) from the bracket based on winnerTeam
    winnerId =
      match.winnerTeam === "team1"
        ? bracketMatch.participant1.toString()
        : bracketMatch.participant2.toString();
  } else {
    // For individual matches, use winnerSide
    if (
      !match.winnerSide ||
      !match.participants ||
      match.participants.length < 2
    ) {
      console.error(
        "[updateKnockoutBracket] Match missing winner or participants",
        {
          matchId: match._id,
          winnerSide: match.winnerSide,
          participantCount: match.participants?.length,
        }
      );
      return;
    }

    // Determine winner ID based on winnerSide
    // Handle both ObjectId and populated object formats
    const getParticipantId = (participant: any): string => {
      if (typeof participant === "string") return participant;
      if (participant?._id) return participant._id.toString();
      return participant.toString();
    };

    // For doubles, winnerSide still indicates which side won
    // But we need to use the first player of the winning side as the identifier
    if (match.participants.length === 4) {
      // Doubles match - use first player of winning side
      winnerId =
        match.winnerSide === "side1"
          ? getParticipantId(match.participants[0])
          : getParticipantId(match.participants[2]);
    } else {
      // Singles match
      winnerId =
        match.winnerSide === "side1"
          ? getParticipantId(match.participants[0])
          : getParticipantId(match.participants[1]);
    }
  }

  // Race condition protection: Retry logic with version checking
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Reload tournament to get latest bracket state (prevents race conditions)
      const freshTournament = await Tournament.findById(tournament._id);
      if (!freshTournament) {
        console.error(
          "[updateKnockoutBracket] Tournament not found during update"
        );
        return;
      }

      // Check if this match was already processed
      let matchAlreadyProcessed = false;
      for (const round of freshTournament.bracket?.rounds || []) {
        for (const bracketMatch of round.matches || []) {
          if (
            bracketMatch.matchId?.toString() === match._id.toString() &&
            bracketMatch.completed
          ) {
            matchAlreadyProcessed = true;
            break;
          }
        }
        if (matchAlreadyProcessed) break;
      }

      if (matchAlreadyProcessed) {
        return;
      }

      // Update bracket structure using progression service
      const updatedBracket = updateBracketAfterMatch(
        freshTournament.bracket,
        match._id.toString(),
        winnerId.toString()
      );

      freshTournament.bracket = updatedBracket;
      freshTournament.markModified("bracket"); // CRITICAL: bracket is Schema.Types.Mixed

      // Auto-create new match documents for newly determined matchups
      const matchesNeedingDocs = getMatchesNeedingDocuments(updatedBracket);

      if (matchesNeedingDocs.length > 0) {
        for (const bracketMatch of matchesNeedingDocs) {
          try {
            const isTeamCategory = (freshTournament as any).category === "team";
            const newMatchDoc = isTeamCategory
              ? await createBracketTeamMatch(
                  bracketMatch,
                  freshTournament,
                  match.scorer?.toString() ||
                    freshTournament.organizer.toString()
                )
              : await createBracketMatch(
                  bracketMatch,
                  freshTournament,
                  match.scorer?.toString() ||
                    freshTournament.organizer.toString()
                );

            if (newMatchDoc) {
              bracketMatch.matchId = newMatchDoc._id.toString();
            }
          } catch (matchError: any) {
            console.error(
              "[updateKnockoutBracket] Error creating match document:",
              matchError
            );
            // Continue with other matches even if one fails
          }
        }
      }

      // Verify all matches are actually completed before marking tournament as complete
      const allBracketMatchIds: string[] = [];
      updatedBracket.rounds.forEach((round: any) => {
        round.matches.forEach((match: any) => {
          if (match.matchId) {
            allBracketMatchIds.push(
              typeof match.matchId === "string"
                ? match.matchId
                : match.matchId.toString()
            );
          }
        });
      });
      if (updatedBracket.thirdPlaceMatch?.matchId) {
        const thirdPlaceId = updatedBracket.thirdPlaceMatch.matchId;
        if (thirdPlaceId) {
          allBracketMatchIds.push(
            typeof thirdPlaceId === "string"
              ? thirdPlaceId
              : String(thirdPlaceId)
          );
        }
      }

      // Fetch all bracket matches to verify completion
      const allBracketMatches = await fetchMatches(allBracketMatchIds, true);
      const allBracketMatchesCompleted =
        allBracketMatchIds.length > 0 &&
        allBracketMatches.every((m: any) => m && m.status === "completed");

      // Update tournament status
      const wasJustCompleted = 
        updatedBracket.completed && 
        allBracketMatchesCompleted && 
        freshTournament.status !== "completed";
        
      if (updatedBracket.completed && allBracketMatchesCompleted) {
        freshTournament.status = "completed";
        freshTournament.endDate = freshTournament.endDate || new Date();
      } else if (
        freshTournament.status === "draft" ||
        freshTournament.status === "upcoming"
      ) {
        freshTournament.status = "in_progress";
        if (!freshTournament.startDate) {
          freshTournament.startDate = new Date();
        }
      }

      // Save with optimistic locking protection
      await freshTournament.save();

      // Sync bracket state to BracketState model (required before generating statistics)
      try {
        const BracketState = (await import("@/models/BracketState")).default;
        const bracketState = await BracketState.findOne({ tournament: tournament._id });

        if (bracketState) {
          bracketState.rounds = updatedBracket.rounds;
          bracketState.currentRound = updatedBracket.currentRound;
          bracketState.completed = updatedBracket.completed;
          bracketState.thirdPlaceMatch = updatedBracket.thirdPlaceMatch;
          await bracketState.save();
        }
      } catch (bracketStateErr) {
        console.error(
          "[updateKnockoutBracket] Warning: Failed to sync BracketState:",
          bracketStateErr
        );
        // Continue - Tournament.bracket is the source of truth
      }

      // Automatically generate statistics if tournament was just completed
      // and statistics don't exist yet
      if (wasJustCompleted && !freshTournament.knockoutStatistics) {
        try {
          // Get the match scorer's user ID, or fall back to organizer
          const userId = match.scorer?.toString() || freshTournament.organizer.toString();
          await onTournamentCompleted(freshTournament._id.toString(), userId);
          console.log(
            `[updateKnockoutBracket] ✅ Automatically generated statistics for tournament ${freshTournament._id}`
          );
        } catch (statsError: any) {
          // Log error but don't fail the tournament completion
          console.error(
            `[updateKnockoutBracket] ⚠️ Failed to auto-generate statistics:`,
            statsError.message || statsError
          );
          // Tournament is still marked as completed, statistics can be generated manually later
        }
      }

      return; // Success, exit retry loop
    } catch (error: any) {
      retryCount++;

      // Check if error is due to version conflict (Mongoose version key)
      if (error.name === "VersionError" || error.code === 11000) {
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
          continue;
        }
      }

      console.error("[updateKnockoutBracket] Error updating bracket:", error);
      throw error;
    }
  }
}

/**
 * Update standings for Round Robin tournaments
 */
export async function updateRoundRobinStandings(tournament: any) {
  const tournamentId = tournament._id?.toString() || "unknown";
  console.log(`\n🔵 [STANDINGS DEBUG] Starting standings update for tournament ${tournamentId}`);
  console.log(`🔵 [STANDINGS DEBUG] Tournament name: ${tournament.name}`);
  console.log(`🔵 [STANDINGS DEBUG] Format: ${tournament.format}, MatchType: ${tournament.matchType}`);
  
  // Determine match type
  const matchType = tournament.matchType || "singles";
  const isDoubles = matchType === "doubles";
  
  console.log(`🔵 [STANDINGS DEBUG] isDoubles: ${isDoubles}`);
  
  // Create standings calculator with appropriate service
  const doublesPairs = isDoubles && tournament.doublesPairs 
    ? tournament.doublesPairs 
    : undefined;
  
  console.log(`🔵 [STANDINGS DEBUG] doublesPairs count: ${doublesPairs?.length || 0}`);
  if (doublesPairs && doublesPairs.length > 0) {
    console.log(`🔵 [STANDINGS DEBUG] doublesPairs details:`, doublesPairs.map((p: any) => ({
      pairId: p._id?.toString(),
      player1: p.player1?.toString(),
      player2: p.player2?.toString()
    })));
  }
  
  const calculator = StandingsCalculator.create(matchType, doublesPairs);
  const normalizer = calculator.getNormalizer();

  // Get participant IDs and normalize them
  // For singles: participant IDs are player IDs
  // For doubles: participant IDs should be pair IDs (or will be normalized)
  let participantIds: string[];
  
  if (isDoubles && doublesPairs && doublesPairs.length > 0) {
    // For doubles with pairs, use pair IDs
    participantIds = doublesPairs.map((pair: any) => 
      pair._id?.toString() || pair._id?.toString() || pair.toString()
    );
    console.log(`🔵 [STANDINGS DEBUG] Initial participantIds (from pairs):`, participantIds);
  } else {
    // For singles or doubles without pairs, use player IDs
    participantIds = tournament.participants.map((p: any) => p.toString());
    console.log(`🔵 [STANDINGS DEBUG] Initial participantIds (from participants):`, participantIds);
  }

  // Normalize all participant IDs using the normalizer
  // This ensures canonical form (especially important for doubles teams)
  // CRITICAL: For doubles, normalize each ID first (player IDs → pair IDs), then deduplicate
  if (isDoubles) {
    const beforeNormalize = [...participantIds];
    participantIds = participantIds.map((id: string) => {
      const normalized = normalizer.normalizeParticipant(id);
      console.log(`🔵 [STANDINGS DEBUG] Normalized ${id} → ${normalized}`);
      return normalized;
    });
    console.log(`🔵 [STANDINGS DEBUG] After individual normalization:`, participantIds);
    console.log(`🔵 [STANDINGS DEBUG] Before normalization:`, beforeNormalize);
  }
  participantIds = normalizer.getUniqueParticipants(participantIds);
  console.log(`🔵 [STANDINGS DEBUG] Final unique participantIds:`, participantIds);
  console.log(`🔵 [STANDINGS DEBUG] Participant count: ${participantIds.length}`);

  // Determine if tournament uses groups
  // Check both regular useGroups and hybrid config
  const usesGroups =
    tournament.useGroups ||
    (tournament.format === "hybrid" &&
      tournament.hybridConfig?.roundRobinUseGroups);

  // CRITICAL: Groups should not be used for pure round-robin format
  // This is a safeguard in case of existing invalid data
  if (tournament.format === "round_robin" && tournament.useGroups) {
    console.warn(
      `[updateRoundRobinStandings] Tournament ${tournament._id} has invalid configuration: round_robin format with groups. This should not happen. Treating as single round-robin.`
    );
    // Fall through to single round-robin logic below
  }

  // CASE 1: Tournament with Groups (only valid for hybrid format)
  if (
    usesGroups &&
    tournament.groups &&
    tournament.groups.length > 0 &&
    tournament.format !== "round_robin"
  ) {
    for (const group of tournament.groups) {
      // Fetch all matches for this group
      const groupMatchIds = group.rounds.flatMap((r: any) => r.matches);
      const matches = await fetchMatches(groupMatchIds, true);

      // Convert team matches to MatchResult format if needed
      const convertedMatches = await convertMatchesToStandingsFormat(
        matches,
        tournament,
        normalizer
      );

      // Filter out null matches (conversion failures)
      const validMatches = convertedMatches.filter((m: any) => m !== null);

      // Get group participants and normalize them
      // CRITICAL: For doubles, group.participants might be player IDs, not pair IDs
      // We need to normalize them to ensure we get canonical team IDs
      let groupParticipantIds = group.participants.map((p: any) => p.toString());
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Raw participants:`, groupParticipantIds);
      
      // For doubles tournaments, normalize each participant ID (might be a player ID that needs to map to a pair)
      if (isDoubles) {
        const beforeNormalize = [...groupParticipantIds];
        groupParticipantIds = groupParticipantIds.map((id: string) => {
          const normalized = normalizer.normalizeParticipant(id);
          console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Normalized ${id} → ${normalized}`);
          return normalized;
        });
        console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Before normalization:`, beforeNormalize);
        console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - After normalization:`, groupParticipantIds);
      }
      
      // Get unique participants (deduplicate after normalization)
      const normalizedGroupParticipants = normalizer.getUniqueParticipants(groupParticipantIds);
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Final unique participants:`, normalizedGroupParticipants);
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Participant count: ${normalizedGroupParticipants.length}`);

      // Calculate standings using the new architecture
      // The service handles deduplication internally
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Calculating standings with ${validMatches.length} matches`);
      const standingsData = calculator.calculateStandings(
        normalizedGroupParticipants,
        validMatches,
        tournament.rules
      );
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Standings calculated: ${standingsData.length} entries`);
      console.log(`🔵 [STANDINGS DEBUG] Group ${group.groupId || group._id} - Standings details:`, standingsData.map((s: any) => ({
        participant: s.participant,
        rank: s.rank,
        played: s.played,
        points: s.points
      })));

      // Convert standings to tournament format
      // The new service already ensures no duplicates, but we still need to convert format
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
      
      // CRITICAL: Mark group standings as modified so Mongoose saves the changes
      tournament.markModified("groups");
    }

    // Generate overall standings from group winners
    // For hybrid tournaments, use qualifyingPerGroup from hybridConfig
    // For regular round-robin, use advancePerGroup
    const advancePerGroup =
      tournament.format === "hybrid"
        ? tournament.hybridConfig?.qualifyingPerGroup ||
          tournament.advancePerGroup ||
          2
        : tournament.advancePerGroup || 2;

    const qualifiers: any[] = [];

    tournament.groups.forEach((group: any) => {
      const topN = group.standings.slice(0, advancePerGroup);
      qualifiers.push(
        ...topN.map((q: any) => ({
          ...q,
          headToHead: q.headToHead || {},
        }))
      );
    });

    // CRITICAL: Deduplicate qualifiers by participant ID before creating overall standings
    // This prevents the same participant from appearing multiple times if they somehow
    // qualified from multiple groups (shouldn't happen, but safety check)
    const qualifiersMap = new Map<string, any>();
    qualifiers.forEach((q: any) => {
      // Normalize participant ID to string
      const participantId = typeof q.participant === 'string' 
        ? q.participant 
        : (q.participant?._id ? q.participant._id.toString() : q.participant.toString());
      
      if (participantId && !qualifiersMap.has(participantId)) {
        qualifiersMap.set(participantId, q);
      }
    });

    tournament.standings = Array.from(qualifiersMap.values()).map((q: any, idx: number) => ({
      ...q,
      rank: idx + 1,
    }));
    
    // CRITICAL: Mark standings as modified so Mongoose saves the changes
    tournament.markModified("standings");
  }
  // CASE 2: Single Round Robin (no groups)
  else {
    const roundMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await fetchMatches(roundMatchIds, true);

    // Convert team matches to MatchResult format if needed
    const convertedMatches = await convertMatchesToStandingsFormat(
      matches,
      tournament,
      normalizer
    );

    // Filter out null matches (conversion failures)
    const validMatches = convertedMatches.filter((m: any) => m !== null);

    // Calculate standings using the new architecture
    // The service handles deduplication internally
    console.log(`🔵 [STANDINGS DEBUG] Single round-robin - Calculating standings with ${validMatches.length} matches`);
    console.log(`🔵 [STANDINGS DEBUG] Single round-robin - Participants:`, participantIds);
    const standingsData = calculator.calculateStandings(
      participantIds,
      validMatches,
      tournament.rules
    );
    console.log(`🔵 [STANDINGS DEBUG] Single round-robin - Standings calculated: ${standingsData.length} entries`);
    console.log(`🔵 [STANDINGS DEBUG] Single round-robin - Standings details:`, standingsData.map((s: any) => ({
      participant: s.participant,
      rank: s.rank,
      played: s.played,
      points: s.points
    })));

    // Convert standings to tournament format
    // The new service already ensures no duplicates
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
    
    // CRITICAL: Mark standings as modified so Mongoose saves the changes
    tournament.markModified("standings");
  }

  // Update round completion status
  const allMatchIds = getAllMatchIds(tournament);
  const allMatches = await fetchMatches(allMatchIds, true);
  const matchMap = new Map(allMatches.map((m: any) => [String(m._id), m]));

  // Update round completion for groups
  if (usesGroups && tournament.groups) {
    for (const group of tournament.groups) {
      for (const round of group.rounds || []) {
        const roundMatches = round.matches.map((m: any) =>
          matchMap.get(m.toString())
        );
        round.completed = roundMatches.every(
          (m: any) => m && m.status === "completed"
        );
      }
    }
  }

  // Update round completion for single round-robin
  if (tournament.rounds && !usesGroups) {
    for (const round of tournament.rounds) {
      const roundMatches = round.matches.map((m: any) =>
        matchMap.get(m.toString())
      );
      round.completed = roundMatches.every(
        (m: any) => m && m.status === "completed"
      );
    }
  }

  // Check if all rounds are completed and update tournament status
  const newStatus = getTournamentStatus(allMatches);

  if (newStatus) {
    if (newStatus === "completed" && tournament.status !== "completed") {
      // Tournament is fully completed
      tournament.status = "completed";
      tournament.endDate = tournament.endDate || new Date();

      // For hybrid tournaments still in round-robin phase, don't mark as completed
      // They need to transition to knockout first
      if (
        tournament.format === "hybrid" &&
        tournament.currentPhase === "round_robin"
      ) {
        // Don't mark as completed - still need knockout phase
        // Status should remain "in_progress" until knockout is complete
        tournament.status = "in_progress";
      } else {
      }
    } else if (
      newStatus === "in_progress" &&
      tournament.status !== "in_progress"
    ) {
      tournament.status = "in_progress";
      if (!tournament.startDate) {
        tournament.startDate = new Date();
      }
    }
  }

  await tournament.save();
}

/**
 * Convert matches (IndividualMatch or TeamMatch) to MatchResult format for standings calculation
 * @param normalizer - Participant normalizer for converting match participants to canonical form
 */
async function convertMatchesToStandingsFormat(
  matches: any[],
  tournament: any,
  normalizer: any
): Promise<any[]> {
  return Promise.all(
    matches.map(async (match) => {
      // If it's already in the right format (IndividualMatch), return as-is
      if (match.matchCategory === "individual") {
        let participants = match.participants.map((p: any) =>
          typeof p === "string" ? p : p._id ? p._id.toString() : p.toString()
        );

        // Normalize match participants using the normalizer
        // This handles both singles (2 participants) and doubles (2 or 4 participants)
        console.log(`🔵 [STANDINGS DEBUG] Match ${match._id} - Raw participants:`, participants);
        const normalized = normalizer.normalizeMatchParticipants(participants);
        if (normalized) {
          console.log(`🔵 [STANDINGS DEBUG] Match ${match._id} - Normalized participants:`, normalized);
          participants = normalized;
        } else {
          console.warn(
            `🔵 [STANDINGS DEBUG] Match ${match._id} - Could not normalize match participants. ` +
            `Participants: [${participants.join(", ")}]`
          );
        }

        return {
          _id: match._id.toString(),
          participants,
          winnerSide: match.winnerSide,
          finalScore: {
            side1Sets: match.finalScore?.side1Sets || 0,
            side2Sets: match.finalScore?.side2Sets || 0,
          },
          games: match.games || [],
          status: match.status,
        };
      }

      // If it's a team match, convert to MatchResult format
      if (match.matchCategory === "team") {
        // For team matches, we need to get team IDs
        // Try to get from bracket first (for knockout matches), then from match structure
        let team1Id: string = "";
        let team2Id: string = "";

        // For knockout matches, get team IDs from bracket
        if (tournament.bracket && match.bracketPosition) {
          const round = tournament.bracket.rounds?.find(
            (r: any) => r.roundNumber === match.bracketPosition.round
          );
          if (round) {
            const bracketMatch = round.matches?.find(
              (m: any) => m.matchId?.toString() === match._id.toString()
            );
            if (bracketMatch) {
              team1Id = bracketMatch.participant1?.toString() || "";
              team2Id = bracketMatch.participant2?.toString() || "";
            }
          }
        }

        // If not found in bracket, try to get from match participants or team structure
        // For round-robin, we need to match team names to team IDs from tournament participants
        if (!team1Id || !team2Id) {
          const team1Name = match.team1?.name;
          const team2Name = match.team2?.name;

          // For team tournaments, participants should be team IDs (ObjectIds)
          // We need to fetch Team documents to match names to IDs
          if (
            team1Name &&
            team2Name &&
            tournament.participants &&
            tournament.participants.length > 0
          ) {
            try {
              const { default: Team } = await import("@/models/Team");
              // Fetch all teams that are tournament participants
              const participantTeams = await Team.find({
                _id: { $in: tournament.participants },
              }).lean();

              // Match team names to IDs
              const team1Doc = participantTeams.find(
                (t: any) => t.name === team1Name
              );
              const team2Doc = participantTeams.find(
                (t: any) => t.name === team2Name
              );

              if (team1Doc && team1Doc._id) team1Id = String(team1Doc._id);
              if (team2Doc && team2Doc._id) team2Id = String(team2Doc._id);
            } catch (error) {
              console.warn(
                `[convertMatchesToStandingsFormat] Error fetching teams for match ${match._id}:`,
                error
              );
              // Fallback to team names if lookup fails
              team1Id = team1Name || "";
              team2Id = team2Name || "";
            }
          } else {
            // Fallback to team names if we can't do the lookup
            team1Id = team1Name || "";
            team2Id = team2Name || "";
          }
        }

        if (!team1Id || !team2Id) {
          console.warn(
            `[convertMatchesToStandingsFormat] Could not determine team IDs for team match ${match._id}`
          );
          // Skip this match if we can't determine team IDs
          return null;
        }

        // Convert team match result to individual match format
        // team1Matches/team2Matches represent "sets" won (submatches won)
        const team1Sets = match.finalScore?.team1Matches || 0;
        const team2Sets = match.finalScore?.team2Matches || 0;

        // Calculate points from all submatches
        const games: Array<{ side1Score: number; side2Score: number }> = [];
        if (match.subMatches && Array.isArray(match.subMatches)) {
          match.subMatches.forEach((subMatch: any) => {
            if (subMatch.games && Array.isArray(subMatch.games)) {
              subMatch.games.forEach((game: any) => {
                // Team matches use team1Score/team2Score, convert to side1Score/side2Score
                games.push({
                  side1Score: game.team1Score || 0,
                  side2Score: game.team2Score || 0,
                });
              });
            }
          });
        }

        // Determine winnerSide from winnerTeam
        let winnerSide: "side1" | "side2" | null = null;
        if (match.winnerTeam === "team1") {
          winnerSide = "side1";
        } else if (match.winnerTeam === "team2") {
          winnerSide = "side2";
        }

        return {
          _id: match._id.toString(),
          participants: [team1Id, team2Id],
          winnerSide,
          finalScore: {
            side1Sets: team1Sets,
            side2Sets: team2Sets,
          },
          games,
          status: match.status,
        };
      }

      // Unknown match type, return as-is (might cause issues but at least won't crash)
      return match;
    })
  ).then((results) => results.filter((m) => m !== null)); // Filter out null matches
}
