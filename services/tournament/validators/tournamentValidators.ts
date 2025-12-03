// services/tournament/validators/tournamentValidators.ts
import { ITournament } from "@/models/Tournament";

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Centralized tournament validation rules
 * All business rule validations should go through these functions
 */
export class TournamentValidators {
  /**
   * Validate if draw has been generated (blocks participant changes)
   */
  static validateDrawNotGenerated(tournament: ITournament): ValidationResult {
    if (tournament.drawGenerated) {
      return {
        isValid: false,
        error: "Cannot modify participants - tournament draw has already been generated",
        statusCode: 403,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate tournament capacity
   */
  static validateCapacity(tournament: ITournament): ValidationResult {
    if (
      tournament.maxParticipants &&
      tournament.participants.length >= tournament.maxParticipants
    ) {
      return {
        isValid: false,
        error: "Tournament is full",
        statusCode: 403,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate registration deadline
   */
  static validateRegistrationDeadline(tournament: ITournament): ValidationResult {
    if (tournament.registrationDeadline) {
      const now = new Date();
      const deadline = new Date(tournament.registrationDeadline);
      if (now > deadline) {
        return {
          isValid: false,
          error: "Registration deadline has passed",
          statusCode: 403,
        };
      }
    }
    return { isValid: true };
  }

  /**
   * Validate minimum participants for draw generation
   */
  static validateMinimumParticipants(tournament: ITournament): ValidationResult {
    const minParticipants = tournament.minParticipants || 2;
    if (tournament.participants.length < minParticipants) {
      return {
        isValid: false,
        error: `Tournament requires at least ${minParticipants} participants`,
        statusCode: 400,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate doubles tournament requirements (even number of participants)
   */
  static validateDoublesParticipants(tournament: ITournament): ValidationResult {
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";

    if (isDoubles && tournament.participants.length % 2 !== 0) {
      return {
        isValid: false,
        error: "Doubles tournaments require an even number of participants",
        statusCode: 400,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate group configuration
   */
  static validateGroupConfiguration(
    tournament: ITournament,
    numberOfGroups?: number
  ): ValidationResult {
    if (!tournament.useGroups) {
      return { isValid: true };
    }

    const groupCount = numberOfGroups || tournament.numberOfGroups || 2;
    const participantCount = tournament.participants.length;

    // Need at least 2 participants per group
    if (participantCount < groupCount * 2) {
      return {
        isValid: false,
        error: `Need at least ${groupCount * 2} participants for ${groupCount} groups (minimum 2 per group)`,
        statusCode: 400,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate participant is in tournament
   */
  static validateParticipantInTournament(
    tournament: ITournament,
    participantId: string
  ): ValidationResult {
    const isParticipant = tournament.participants.some(
      (p: any) => p.toString() === participantId
    );

    if (!isParticipant) {
      return {
        isValid: false,
        error: "Participant not found in tournament",
        statusCode: 404,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate participant NOT already in tournament (for adding)
   */
  static validateParticipantNotInTournament(
    tournament: ITournament,
    participantId: string
  ): ValidationResult {
    const isAlreadyParticipant = tournament.participants.some(
      (p: any) => p.toString() === participantId
    );

    if (isAlreadyParticipant) {
      return {
        isValid: false,
        error: "User is already a participant in this tournament",
        statusCode: 400,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate organizer permissions
   */
  static validateIsOrganizer(
    tournament: ITournament,
    userId: string
  ): ValidationResult {
    if (tournament.organizer.toString() !== userId) {
      return {
        isValid: false,
        error: "Only the tournament organizer can perform this action",
        statusCode: 403,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate tournament uses groups
   */
  static validateUsesGroups(tournament: ITournament): ValidationResult {
    if (!tournament.useGroups) {
      return {
        isValid: false,
        error: "Tournament does not use groups",
        statusCode: 400,
      };
    }
    return { isValid: true };
  }

  /**
   * Validate join code
   */
  static validateJoinCode(
    tournament: ITournament,
    providedCode: string
  ): ValidationResult {
    if (!tournament.allowJoinByCode) {
      return {
        isValid: false,
        error: "This tournament does not allow joining by code",
        statusCode: 403,
      };
    }

    if (tournament.joinCode !== providedCode) {
      return {
        isValid: false,
        error: "Invalid join code",
        statusCode: 403,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate matches haven't been played (for group modifications)
   */
  static async validateNoMatchesPlayed(
    matchIds: any[]
  ): Promise<ValidationResult> {
    // Import here to avoid circular dependencies
    const IndividualMatch = (await import("@/models/IndividualMatch")).default;

    const matches = await IndividualMatch.find({
      _id: { $in: matchIds },
    });

    const hasPlayedMatches = matches.some(
      (m: any) => m.status === "in_progress" || m.status === "completed"
    );

    if (hasPlayedMatches) {
      return {
        isValid: false,
        error:
          "Cannot modify groups after matches have been played. This would reset all match results and standings.",
        statusCode: 400,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate tournament status for specific operations
   */
  static validateTournamentStatus(
    tournament: ITournament,
    allowedStatuses: ITournament["status"][]
  ): ValidationResult {
    if (!allowedStatuses.includes(tournament.status)) {
      return {
        isValid: false,
        error: `Tournament status must be one of: ${allowedStatuses.join(", ")}`,
        statusCode: 400,
      };
    }
    return { isValid: true };
  }

  /**
   * Composite validation: Can participant join tournament?
   * Combines multiple validation checks
   */
  static canJoinTournament(
    tournament: ITournament,
    userId: string
  ): ValidationResult {
    // Check draw not generated
    let result = this.validateDrawNotGenerated(tournament);
    if (!result.isValid) return result;

    // Check not already participant
    result = this.validateParticipantNotInTournament(tournament, userId);
    if (!result.isValid) return result;

    // Check capacity
    result = this.validateCapacity(tournament);
    if (!result.isValid) return result;

    // Check registration deadline
    result = this.validateRegistrationDeadline(tournament);
    if (!result.isValid) return result;

    return { isValid: true };
  }

  /**
   * Composite validation: Can generate tournament draw?
   */
  static canGenerateDraw(tournament: ITournament): ValidationResult {
    // Check minimum participants
    let result = this.validateMinimumParticipants(tournament);
    if (!result.isValid) return result;

    // Check doubles requirements
    result = this.validateDoublesParticipants(tournament);
    if (!result.isValid) return result;

    // Check group configuration
    result = this.validateGroupConfiguration(tournament);
    if (!result.isValid) return result;

    return { isValid: true };
  }
}

/**
 * Helper function to handle validation result in API routes
 * Returns NextResponse if invalid, null if valid
 */
export function handleValidationResult(result: ValidationResult) {
  if (!result.isValid) {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode || 400 }
    );
  }
  return null;
}
