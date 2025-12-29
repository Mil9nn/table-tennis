// services/tournament/core/standings/participantNormalizer.ts

/**
 * Participant Normalization
 * 
 * Abstracts the concept of a "participant" in standings calculations.
 * For singles: participant = player
 * For doubles: participant = team (canonical, order-independent)
 */

export interface IParticipantNormalizer {
  /**
   * Normalize a participant identifier to a canonical form
   * For singles: returns the player ID as-is
   * For doubles: returns a canonical team identifier (order-independent)
   */
  normalizeParticipant(participantId: string | string[]): string;

  /**
   * Normalize match participants to canonical participant IDs
   * Returns [participant1Id, participant2Id] in canonical form
   */
  normalizeMatchParticipants(matchParticipants: string[]): [string, string] | null;

  /**
   * Get all unique participants from a list of participant identifiers
   * For singles: deduplicates player IDs
   * For doubles: deduplicates teams (order-independent)
   */
  getUniqueParticipants(participantIds: (string | string[])[]): string[];

  /**
   * Check if two participant identifiers represent the same participant
   */
  areSameParticipant(id1: string | string[], id2: string | string[]): boolean;
}

/**
 * Singles Participant Normalizer
 * 
 * For singles tournaments, a participant is simply a player ID.
 * No normalization needed beyond string conversion.
 */
export class SinglesParticipantNormalizer implements IParticipantNormalizer {
  normalizeParticipant(participantId: string | string[]): string {
    if (Array.isArray(participantId)) {
      // Singles should only have one participant ID
      if (participantId.length !== 1) {
        throw new Error(
          `SinglesParticipantNormalizer: Expected single participant ID, got array of length ${participantId.length}`
        );
      }
      return participantId[0].toString();
    }
    return participantId.toString();
  }

  normalizeMatchParticipants(matchParticipants: string[]): [string, string] | null {
    if (matchParticipants.length !== 2) {
      console.warn(
        `SinglesParticipantNormalizer: Expected 2 participants, got ${matchParticipants.length}`
      );
      return null;
    }
    return [
      matchParticipants[0].toString(),
      matchParticipants[1].toString(),
    ];
  }

  getUniqueParticipants(participantIds: (string | string[])[]): string[] {
    const unique = new Set<string>();
    participantIds.forEach((id) => {
      const normalized = this.normalizeParticipant(id);
      unique.add(normalized);
    });
    return Array.from(unique);
  }

  areSameParticipant(id1: string | string[], id2: string | string[]): boolean {
    return this.normalizeParticipant(id1) === this.normalizeParticipant(id2);
  }
}

/**
 * Doubles Participant Normalizer
 * 
 * For doubles tournaments, a participant is a team (pair of players).
 * Teams are order-independent: [A, B] = [B, A]
 * 
 * This normalizer ensures canonical team identity by:
 * 1. Using pair IDs when available (from tournament.doublesPairs)
 * 2. Creating canonical keys from player IDs when pair IDs are not available
 */
export class DoublesParticipantNormalizer implements IParticipantNormalizer {
  private playerToPairMap: Map<string, string>;
  private pairToPlayersMap: Map<string, [string, string]>;

  constructor(doublesPairs?: Array<{ _id: string | any; player1: string | any; player2: string | any }>) {
    this.playerToPairMap = new Map();
    this.pairToPlayersMap = new Map();

    if (doublesPairs && doublesPairs.length > 0) {
      // Build maps from doublesPairs
      doublesPairs.forEach((pair) => {
        const pairId = pair._id?.toString() || pair._id;
        const player1Id = pair.player1?.toString() || pair.player1;
        const player2Id = pair.player2?.toString() || pair.player2;

        if (pairId && player1Id && player2Id) {
          // Map both players to the same pair ID
          this.playerToPairMap.set(player1Id, pairId);
          this.playerToPairMap.set(player2Id, pairId);
          
          // Store canonical player order (sorted for consistency)
          const canonicalPlayers: [string, string] = 
            player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id];
          this.pairToPlayersMap.set(pairId, canonicalPlayers);
        }
      });
    }
  }

  /**
   * Create a canonical team key from two player IDs
   * Order-independent: [A, B] and [B, A] produce the same key
   */
  private createCanonicalTeamKey(player1Id: string, player2Id: string): string {
    // Sort IDs to ensure order-independence
    const sorted = [player1Id, player2Id].sort();
    return `team:${sorted[0]}:${sorted[1]}`;
  }

  /**
   * Get pair ID from player IDs (if available)
   */
  private getPairIdFromPlayers(player1Id: string, player2Id: string): string | null {
    // Try to find pair ID from either player
    const pairId1 = this.playerToPairMap.get(player1Id);
    const pairId2 = this.playerToPairMap.get(player2Id);

    // Both players should map to the same pair ID
    if (pairId1 && pairId2 && pairId1 === pairId2) {
      return pairId1;
    }

    // If only one player maps, use that (might be a partial match)
    if (pairId1) return pairId1;
    if (pairId2) return pairId2;

    return null;
  }

  normalizeParticipant(participantId: string | string[]): string {
    if (Array.isArray(participantId)) {
      // This is a team represented as [player1, player2]
      if (participantId.length !== 2) {
        throw new Error(
          `DoublesParticipantNormalizer: Expected 2 player IDs for a team, got ${participantId.length}`
        );
      }
      const player1Id = participantId[0].toString();
      const player2Id = participantId[1].toString();

      // Try to get pair ID first
      const pairId = this.getPairIdFromPlayers(player1Id, player2Id);
      if (pairId) {
        console.log(`🟣 [NORMALIZER] normalizeParticipant([${player1Id}, ${player2Id}]) → pairId: ${pairId}`);
        return pairId;
      }

      // Fallback: create canonical team key
      const canonicalKey = this.createCanonicalTeamKey(player1Id, player2Id);
      console.log(`🟣 [NORMALIZER] normalizeParticipant([${player1Id}, ${player2Id}]) → canonicalKey: ${canonicalKey}`);
      return canonicalKey;
    }

    // Single ID - could be a pair ID or a player ID
    const idStr = participantId.toString();

    // Check if it's already a pair ID
    if (this.pairToPlayersMap.has(idStr)) {
      console.log(`🟣 [NORMALIZER] normalizeParticipant(${idStr}) → pairId (already): ${idStr}`);
      return idStr;
    }

    // Check if it's a player ID that maps to a pair
    const pairId = this.playerToPairMap.get(idStr);
    if (pairId) {
      console.log(`🟣 [NORMALIZER] normalizeParticipant(${idStr}) → pairId (mapped): ${pairId}`);
      return pairId;
    }

    // Unknown ID - return as-is (might be a legacy format)
    console.log(`🟣 [NORMALIZER] normalizeParticipant(${idStr}) → unknown (returning as-is): ${idStr}`);
    return idStr;
  }

  normalizeMatchParticipants(matchParticipants: string[]): [string, string] | null {
    console.log(`🟣 [NORMALIZER] normalizeMatchParticipants called with:`, matchParticipants);
    
    if (matchParticipants.length === 2) {
      // Already normalized to pair IDs
      const team1 = this.normalizeParticipant(matchParticipants[0]);
      const team2 = this.normalizeParticipant(matchParticipants[1]);
      console.log(`🟣 [NORMALIZER] 2 participants: ${matchParticipants[0]} → ${team1}, ${matchParticipants[1]} → ${team2}`);
      return [team1, team2];
    }

    if (matchParticipants.length === 4) {
      // Legacy format: [player1, player2, player3, player4]
      // Team 1: participants[0] and participants[1]
      // Team 2: participants[2] and participants[3]
      const team1Id = this.normalizeParticipant([
        matchParticipants[0].toString(),
        matchParticipants[1].toString(),
      ]);
      const team2Id = this.normalizeParticipant([
        matchParticipants[2].toString(),
        matchParticipants[3].toString(),
      ]);
      console.log(`🟣 [NORMALIZER] 4 participants: [${matchParticipants[0]}, ${matchParticipants[1]}] → ${team1Id}, [${matchParticipants[2]}, ${matchParticipants[3]}] → ${team2Id}`);
      return [team1Id, team2Id];
    }

    console.warn(
      `🟣 [NORMALIZER] Expected 2 or 4 participants, got ${matchParticipants.length}`
    );
    return null;
  }

  getUniqueParticipants(participantIds: (string | string[])[]): string[] {
    const unique = new Set<string>();
    participantIds.forEach((id) => {
      const normalized = this.normalizeParticipant(id);
      unique.add(normalized);
    });
    return Array.from(unique);
  }

  areSameParticipant(id1: string | string[], id2: string | string[]): boolean {
    return this.normalizeParticipant(id1) === this.normalizeParticipant(id2);
  }
}

