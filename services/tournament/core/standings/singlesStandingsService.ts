// services/tournament/core/standings/singlesStandingsService.ts

import { MatchResult, StandingData, TournamentRules } from "../../types/tournament.types";
import { IStandingsService } from "./standingsService.interface";
import { SinglesParticipantNormalizer, IParticipantNormalizer } from "./participantNormalizer";
import { sortStandingsWithTiebreakers } from "./standingsSorting";

/**
 * Singles Standings Service
 * 
 * Calculates standings for singles tournaments.
 * Each participant is a single player.
 * 
 * Key characteristics:
 * - 1 participant = 1 player
 * - No team/partner logic
 * - Direct 1:1 mapping between players and standings entries
 */
export class SinglesStandingsService implements IStandingsService {
  private normalizer: SinglesParticipantNormalizer;

  constructor() {
    this.normalizer = new SinglesParticipantNormalizer();
  }

  getNormalizer(): IParticipantNormalizer {
    return this.normalizer;
  }

  calculateStandings(
    participants: string[],
    matches: MatchResult[],
    rules: TournamentRules
  ): StandingData[] {
    // Initialize standings for all participants
    const standingsMap = new Map<string, StandingData>();

    participants.forEach((participantId) => {
      const normalizedId = this.normalizer.normalizeParticipant(participantId);
      standingsMap.set(normalizedId, {
        participant: normalizedId,
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
      // Normalize match participants
      const normalized = this.normalizer.normalizeMatchParticipants(match.participants);
      if (!normalized) {
        console.warn(
          `SinglesStandingsService: Could not normalize match participants:`,
          match.participants
        );
        return;
      }

      const [p1Id, p2Id] = normalized;

      const p1Stats = standingsMap.get(p1Id);
      const p2Stats = standingsMap.get(p2Id);

      if (!p1Stats || !p2Stats) {
        console.warn(
          `SinglesStandingsService: Missing stats for participants: ${p1Id} or ${p2Id}`
        );
        return;
      }

      // Update matches played
      p1Stats.played += 1;
      p2Stats.played += 1;

      // Calculate sets and points
      const p1Sets = match.finalScore.side1Sets;
      const p2Sets = match.finalScore.side2Sets;

      p1Stats.setsWon += p1Sets;
      p1Stats.setsLost += p2Sets;
      p2Stats.setsWon += p2Sets;
      p2Stats.setsLost += p1Sets;

      // Calculate points scored/conceded from games
      let p1Points = 0;
      let p2Points = 0;

      match.games.forEach((game) => {
        p1Points += game.side1Score;
        p2Points += game.side2Score;
      });

      p1Stats.pointsScored += p1Points;
      p1Stats.pointsConceded += p2Points;
      p2Stats.pointsScored += p2Points;
      p2Stats.pointsConceded += p1Points;

      // Update match result (win/loss/draw)
      if (match.winnerSide === "side1") {
        p1Stats.won += 1;
        p2Stats.lost += 1;
        p1Stats.points += rules.pointsForWin;
        p2Stats.points += rules.pointsForLoss;
        p1Stats.form.push("W");
        p2Stats.form.push("L");

        // Head-to-head
        p1Stats.headToHead.set(p2Id, rules.pointsForWin);
        p2Stats.headToHead.set(p1Id, rules.pointsForLoss);
      } else if (match.winnerSide === "side2") {
        p2Stats.won += 1;
        p1Stats.lost += 1;
        p2Stats.points += rules.pointsForWin;
        p1Stats.points += rules.pointsForLoss;
        p2Stats.form.push("W");
        p1Stats.form.push("L");

        // Head-to-head
        p2Stats.headToHead.set(p1Id, rules.pointsForWin);
        p1Stats.headToHead.set(p2Id, rules.pointsForLoss);
      } else {
        // Draw (rare in table tennis but possible)
        p1Stats.drawn += 1;
        p2Stats.drawn += 1;
        p1Stats.points += rules.pointsForDraw || 1;
        p2Stats.points += rules.pointsForDraw || 1;
        p1Stats.form.push("D");
        p2Stats.form.push("D");

        // Head-to-head
        p1Stats.headToHead.set(p2Id, rules.pointsForDraw || 1);
        p2Stats.headToHead.set(p1Id, rules.pointsForDraw || 1);
      }

      // Keep only last 5 form results
      if (p1Stats.form.length > 5) p1Stats.form.shift();
      if (p2Stats.form.length > 5) p2Stats.form.shift();
    });

    // Calculate differences
    standingsMap.forEach((stats) => {
      stats.setsDiff = stats.setsWon - stats.setsLost;
      stats.pointsDiff = stats.pointsScored - stats.pointsConceded;
    });

    // Convert to array and sort
    const standings = Array.from(standingsMap.values());
    return sortStandingsWithTiebreakers(standings);
  }
}

