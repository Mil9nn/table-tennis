// services/tournament/core/standings/doublesStandingsService.ts

import { MatchResult, StandingData, TournamentRules } from "../../types/tournament.types";
import { IStandingsService } from "./standingsService.interface";
import { DoublesParticipantNormalizer, IParticipantNormalizer } from "./participantNormalizer";
import { sortStandingsWithTiebreakers } from "./standingsSorting";

/**
 * Doubles Standings Service
 * 
 * Calculates standings for doubles tournaments.
 * Each participant is a team (pair of players).
 * 
 * Key characteristics:
 * - 1 participant = 1 team (pair)
 * - Teams are canonical and order-independent: [A, B] = [B, A]
 * - No partner syncing needed - teams are treated as single entities
 * - Ensures exactly 1 row per unique team
 */
export class DoublesStandingsService implements IStandingsService {
  private normalizer: DoublesParticipantNormalizer;

  constructor(doublesPairs?: Array<{ _id: string | any; player1: string | any; player2: string | any }>) {
    this.normalizer = new DoublesParticipantNormalizer(doublesPairs);
  }

  getNormalizer(): IParticipantNormalizer {
    return this.normalizer;
  }

  calculateStandings(
    participants: string[],
    matches: MatchResult[],
    rules: TournamentRules
  ): StandingData[] {
    console.log(`\n🟢 [DOUBLES STANDINGS] Starting calculation`);
    console.log(`🟢 [DOUBLES STANDINGS] Input participants:`, participants);
    console.log(`🟢 [DOUBLES STANDINGS] Input matches count:`, matches.length);
    
    // CRITICAL: Normalize all participants to ensure canonical team IDs
    // This ensures order-independence: [A, B] and [B, A] become the same team
    const normalizedParticipants = participants.map((p) => {
      const normalized = this.normalizer.normalizeParticipant(p);
      console.log(`🟢 [DOUBLES STANDINGS] Normalized participant: ${p} → ${normalized}`);
      return normalized;
    });
    console.log(`🟢 [DOUBLES STANDINGS] After normalization:`, normalizedParticipants);

    // Get unique participants (deduplicate)
    const uniqueParticipants = this.normalizer.getUniqueParticipants(normalizedParticipants);
    console.log(`🟢 [DOUBLES STANDINGS] Unique participants:`, uniqueParticipants);
    console.log(`🟢 [DOUBLES STANDINGS] Unique count: ${uniqueParticipants.length} (was ${normalizedParticipants.length})`);

    // Initialize standings for all unique participants
    const standingsMap = new Map<string, StandingData>();

    uniqueParticipants.forEach((participantId) => {
      standingsMap.set(participantId, {
        participant: participantId,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        setsWon: 0,
        setsLost: 0,
        setsDiff: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDiff: 0,
        points: 0,
        rank: 0,
        form: [],
        headToHead: new Map(),
      });
    });

    // Process all completed matches
    const completedMatches = matches.filter((m) => m.status === "completed");

    completedMatches.forEach((match) => {
      console.log(`🟢 [DOUBLES STANDINGS] Processing match ${match._id}`);
      console.log(`🟢 [DOUBLES STANDINGS] Match raw participants:`, match.participants);
      
      // Normalize match participants to canonical team IDs
      const normalized = this.normalizer.normalizeMatchParticipants(match.participants);
      if (!normalized) {
        console.warn(
          `DoublesStandingsService: Could not normalize match participants:`,
          match.participants
        );
        return;
      }

      const [team1Id, team2Id] = normalized;
      console.log(`🟢 [DOUBLES STANDINGS] Match normalized teams: ${team1Id} vs ${team2Id}`);

      // CRITICAL: Ensure we're using canonical team IDs
      // This prevents duplicate entries from order variations
      const team1Stats = standingsMap.get(team1Id);
      const team2Stats = standingsMap.get(team2Id);

      if (!team1Stats || !team2Stats) {
        console.warn(
          `🟢 [DOUBLES STANDINGS] Missing stats for teams: ${team1Id} or ${team2Id}`
        );
        console.warn(`🟢 [DOUBLES STANDINGS] Available teams in map:`, Array.from(standingsMap.keys()));
        return;
      }
      
      console.log(`🟢 [DOUBLES STANDINGS] Found stats for both teams. Updating...`);

      // Update matches played
      team1Stats.played += 1;
      team2Stats.played += 1;

      // Calculate sets and points
      const team1Sets = match.finalScore.side1Sets;
      const team2Sets = match.finalScore.side2Sets;

      team1Stats.setsWon += team1Sets;
      team1Stats.setsLost += team2Sets;
      team2Stats.setsWon += team2Sets;
      team2Stats.setsLost += team1Sets;

      // Calculate points scored/conceded from games
      let team1Points = 0;
      let team2Points = 0;

      match.games.forEach((game) => {
        team1Points += game.side1Score;
        team2Points += game.side2Score;
      });

      team1Stats.pointsScored += team1Points;
      team1Stats.pointsConceded += team2Points;
      team2Stats.pointsScored += team2Points;
      team2Stats.pointsConceded += team1Points;

      // Update match result (win/loss/draw)
      if (match.winnerSide === "side1") {
        team1Stats.won += 1;
        team2Stats.lost += 1;
        team1Stats.points += rules.pointsForWin;
        team2Stats.points += rules.pointsForLoss;
        team1Stats.form.push("W");
        team2Stats.form.push("L");

        // Head-to-head
        team1Stats.headToHead.set(team2Id, rules.pointsForWin);
        team2Stats.headToHead.set(team1Id, rules.pointsForLoss);
      } else if (match.winnerSide === "side2") {
        team2Stats.won += 1;
        team1Stats.lost += 1;
        team2Stats.points += rules.pointsForWin;
        team1Stats.points += rules.pointsForLoss;
        team2Stats.form.push("W");
        team1Stats.form.push("L");

        // Head-to-head
        team2Stats.headToHead.set(team1Id, rules.pointsForWin);
        team1Stats.headToHead.set(team2Id, rules.pointsForLoss);
      } else {
        // Draw (rare in table tennis but possible)
        team1Stats.drawn += 1;
        team2Stats.drawn += 1;
        team1Stats.points += rules.pointsForDraw || 1;
        team2Stats.points += rules.pointsForDraw || 1;
        team1Stats.form.push("D");
        team2Stats.form.push("D");

        // Head-to-head
        team1Stats.headToHead.set(team2Id, rules.pointsForDraw || 1);
        team2Stats.headToHead.set(team1Id, rules.pointsForDraw || 1);
      }

      // Keep only last 5 form results
      if (team1Stats.form.length > 5) team1Stats.form.shift();
      if (team2Stats.form.length > 5) team2Stats.form.shift();
    });

    // Calculate differences
    standingsMap.forEach((stats) => {
      stats.setsDiff = stats.setsWon - stats.setsLost;
      stats.pointsDiff = stats.pointsScored - stats.pointsConceded;
    });

    // Convert to array
    let standings = Array.from(standingsMap.values());
    console.log(`🟢 [DOUBLES STANDINGS] Before final deduplication: ${standings.length} entries`);
    console.log(`🟢 [DOUBLES STANDINGS] Standings participants:`, standings.map(s => s.participant));
    
    // CRITICAL: Final safety check - ensure no duplicate participants
    // This should not be necessary if normalization worked correctly, but it's a safety net
    const finalStandingsMap = new Map<string, StandingData>();
    standings.forEach((standing) => {
      const participantId = standing.participant.toString();
      if (!finalStandingsMap.has(participantId)) {
        finalStandingsMap.set(participantId, standing);
      } else {
        // If duplicate found, merge stats (shouldn't happen, but safety check)
        const existing = finalStandingsMap.get(participantId)!;
        console.warn(
          `🟢 [DOUBLES STANDINGS] ⚠️ DUPLICATE PARTICIPANT FOUND: ${participantId}`
        );
        console.warn(`🟢 [DOUBLES STANDINGS] Existing: rank=${existing.rank}, played=${existing.played}, points=${existing.points}`);
        console.warn(`🟢 [DOUBLES STANDINGS] Duplicate: rank=${standing.rank}, played=${standing.played}, points=${standing.points}`);
        // Merge stats (take the one with more matches played, or better stats)
        if (standing.played > existing.played || 
            (standing.played === existing.played && standing.points > existing.points)) {
          console.warn(`🟢 [DOUBLES STANDINGS] Keeping duplicate (better stats)`);
          finalStandingsMap.set(participantId, standing);
        } else {
          console.warn(`🟢 [DOUBLES STANDINGS] Keeping existing (better stats)`);
        }
      }
    });
    
    standings = Array.from(finalStandingsMap.values());
    console.log(`🟢 [DOUBLES STANDINGS] After final deduplication: ${standings.length} entries`);
    
    // Sort and assign ranks
    const sortedStandings = sortStandingsWithTiebreakers(standings);
    console.log(`🟢 [DOUBLES STANDINGS] Final standings with ranks:`, sortedStandings.map(s => ({
      participant: s.participant,
      rank: s.rank,
      points: s.points
    })));
    console.log(`🟢 [DOUBLES STANDINGS] Rank sequence:`, sortedStandings.map(s => s.rank));
    
    return sortedStandings;
  }
}

