// services/validation/TournamentValidationService.ts
import { ITournamentIndividual } from "@/models/TournamentIndividual";
import { ITournamentTeam } from "@/models/TournamentTeam";

/**
 * Tournament Validation Service
 *
 * Centralizes all tournament validation logic.
 * Replaces scattered validation across routes, services, and validators.
 *
 * Benefits:
 * - Single source of truth for validation rules
 * - Consistent error messages
 * - Easy to test and maintain
 * - Composable validators
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class TournamentValidationService {
  /**
   * Validate participant count for tournament
   */
  validateParticipantCount(
    tournament: ITournamentIndividual | ITournamentTeam
  ): ValidationResult {
    const errors: string[] = [];
    const count = tournament.participants.length;

    // Check minimum
    if (count < (tournament.minParticipants || 2)) {
      errors.push(`Minimum ${tournament.minParticipants || 2} participants required`);
    }

    // Check maximum
    if (tournament.maxParticipants && count > tournament.maxParticipants) {
      errors.push(`Maximum ${tournament.maxParticipants} participants allowed`);
    }

    // Format-specific checks
    if (tournament.format === 'knockout') {
      // For knockout, warn if not power of 2 (byes will be added)
      const nextPowerOf2 = this.getNextPowerOf2(count);
      if (count < 2) {
        errors.push('Knockout tournaments require at least 2 participants');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate doubles tournament requirements
   */
  validateDoublesRequirements(tournament: ITournamentIndividual): ValidationResult {
    const errors: string[] = [];

    if (tournament.matchType === 'doubles' || tournament.matchType === 'mixed_doubles') {
      const count = tournament.participants.length;

      if (count % 2 !== 0) {
        errors.push('Doubles tournaments require an even number of participants');
      }

      if (count < 4) {
        errors.push('Doubles tournaments require at least 4 participants (2 pairs)');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate group configuration
   * CRITICAL: Groups are NOT allowed for pure round-robin format
   */
  validateGroupConfiguration(
    tournament: ITournamentIndividual | ITournamentTeam
  ): ValidationResult {
    const errors: string[] = [];

    // RULE: Groups only allowed for hybrid tournaments, not round-robin
    if (tournament.useGroups && tournament.format === 'round_robin') {
      errors.push(
        'Groups are not allowed for round-robin format. Use hybrid format instead if you want round-robin groups followed by knockout.'
      );
    }

    // If using groups, validate configuration
    if (tournament.useGroups) {
      if (!tournament.numberOfGroups || tournament.numberOfGroups < 2) {
        errors.push('At least 2 groups are required when using groups');
      }

      if (tournament.numberOfGroups && tournament.numberOfGroups > 8) {
        errors.push('Maximum 8 groups allowed');
      }

      const participantCount = tournament.participants.length;
      const groupCount = tournament.numberOfGroups || 0;

      if (participantCount < groupCount * 2) {
        errors.push(`Need at least ${groupCount * 2} participants for ${groupCount} groups (minimum 2 per group)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate hybrid tournament configuration
   */
  validateHybridConfiguration(
    tournament: ITournamentIndividual | ITournamentTeam
  ): ValidationResult {
    const errors: string[] = [];

    if (tournament.format !== 'hybrid') {
      return { valid: true, errors: [] };
    }

    if (!tournament.hybridConfig) {
      errors.push('Hybrid tournaments require hybridConfig');
      return { valid: false, errors };
    }

    const config = tournament.hybridConfig;

    // Validate qualification method
    if (!config.qualificationMethod) {
      errors.push('Qualification method is required for hybrid tournaments');
    }

    // Validate qualification parameters based on method
    switch (config.qualificationMethod) {
      case 'top_n_per_group':
        if (!config.roundRobinUseGroups) {
          errors.push('top_n_per_group qualification requires groups in round-robin phase');
        }
        if (!config.qualifyingPerGroup || config.qualifyingPerGroup < 1) {
          errors.push('Qualifying per group must be at least 1');
        }
        break;
    }

    // Warn if qualified count won't be power of 2
    const qualifiedCount = this.estimateQualifiedCount(tournament);
    const nextPowerOf2 = this.getNextPowerOf2(qualifiedCount);
    if (qualifiedCount !== nextPowerOf2) {
      // This is a warning, not an error - byes will handle it
      console.warn(`Qualified participants (${qualifiedCount}) is not a power of 2. Byes will be added to reach ${nextPowerOf2}.`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate that draw hasn't been generated yet
   */
  validateDrawNotGenerated(tournament: ITournamentIndividual | ITournamentTeam): ValidationResult {
    const errors: string[] = [];

    if (tournament.drawGenerated) {
      errors.push('Tournament draw has already been generated. Cannot modify participants or configuration.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate tournament can generate draw
   */
  validateCanGenerateDraw(tournament: ITournamentIndividual | ITournamentTeam): ValidationResult {
    const errors: string[] = [];

    // Check if already generated
    if (tournament.drawGenerated) {
      errors.push('Tournament draw has already been generated');
      return { valid: false, errors };
    }

    // Validate participants
    const participantResult = this.validateParticipantCount(tournament);
    if (!participantResult.valid) {
      errors.push(...participantResult.errors);
    }

    // Validate format-specific requirements
    if (tournament.category === 'individual') {
      const doublesResult = this.validateDoublesRequirements(tournament as ITournamentIndividual);
      if (!doublesResult.valid) {
        errors.push(...doublesResult.errors);
      }
    }

    // Validate group configuration
    const groupResult = this.validateGroupConfiguration(tournament);
    if (!groupResult.valid) {
      errors.push(...groupResult.errors);
    }

    // Validate hybrid configuration
    const hybridResult = this.validateHybridConfiguration(tournament);
    if (!hybridResult.valid) {
      errors.push(...hybridResult.errors);
    }

    // Validate seeding if required
    if (tournament.seedingMethod !== 'none' && tournament.seeding.length === 0) {
      errors.push('Seeding is required but not configured');
    }

    if (tournament.seeding.length > 0) {
      const seedingResult = this.validateSeeding(tournament);
      if (!seedingResult.valid) {
        errors.push(...seedingResult.errors);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate seeding configuration
   */
  validateSeeding(tournament: ITournamentIndividual | ITournamentTeam): ValidationResult {
    const errors: string[] = [];

    if (tournament.seeding.length === 0) {
      return { valid: true, errors: [] };
    }

    const participantIds = new Set(tournament.participants.map(p => p.toString()));
    const seedNumbers = new Set<number>();

    // Check each seeding entry
    for (const seed of tournament.seeding) {
      // Validate participant is in tournament
      if (!participantIds.has(seed.participant.toString())) {
        errors.push(`Seeding contains participant not in tournament: ${seed.participant}`);
      }

      // Validate seed number
      if (seed.seedNumber < 1) {
        errors.push('Seed numbers must be at least 1');
      }

      // Check for duplicate seed numbers
      if (seedNumbers.has(seed.seedNumber)) {
        errors.push(`Duplicate seed number: ${seed.seedNumber}`);
      }
      seedNumbers.add(seed.seedNumber);
    }

    // Validate all participants are seeded
    if (tournament.seeding.length !== tournament.participants.length) {
      errors.push(`All ${tournament.participants.length} participants must be seeded, but only ${tournament.seeding.length} are seeded`);
    }

    // Validate seed numbers are sequential (1, 2, 3, ...)
    const sortedSeeds = Array.from(seedNumbers).sort((a, b) => a - b);
    for (let i = 0; i < sortedSeeds.length; i++) {
      if (sortedSeeds[i] !== i + 1) {
        errors.push('Seed numbers must be sequential starting from 1');
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate team tournament configuration
   */
  validateTeamConfiguration(tournament: ITournamentTeam): ValidationResult {
    const errors: string[] = [];

    if (!tournament.teamConfig) {
      errors.push('Team tournaments require teamConfig');
      return { valid: false, errors };
    }

    const config = tournament.teamConfig;

    if (!config.matchFormat) {
      errors.push('Team match format is required');
    }

    if (config.matchFormat === 'custom') {
      if (!config.customSubMatches || config.customSubMatches.length === 0) {
        errors.push('Custom team format requires customSubMatches configuration');
      }
    }

    if (!config.setsPerSubMatch || config.setsPerSubMatch < 1) {
      errors.push('Sets per sub-match must be at least 1');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Composite validation: Can participant join tournament
   */
  canJoinTournament(
    tournament: ITournamentIndividual | ITournamentTeam,
    participantId: string
  ): ValidationResult {
    const errors: string[] = [];

    // Check if draw already generated
    if (tournament.drawGenerated) {
      errors.push('Cannot join tournament after draw has been generated');
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      errors.push('Registration deadline has passed');
    }

    // Check capacity
    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      errors.push('Tournament is full');
    }

    // Check if already joined
    const alreadyJoined = tournament.participants.some(
      p => p.toString() === participantId
    );
    if (alreadyJoined) {
      errors.push('Participant has already joined this tournament');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper: Get next power of 2
   */
  private getNextPowerOf2(n: number): number {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  /**
   * Helper: Estimate qualified participant count for hybrid tournaments
   */
  private estimateQualifiedCount(tournament: ITournamentIndividual | ITournamentTeam): number {
    if (tournament.format !== 'hybrid' || !tournament.hybridConfig) {
      return 0;
    }

    const config = tournament.hybridConfig;
    const totalParticipants = tournament.participants.length;

    switch (config.qualificationMethod) {
      case 'top_n_per_group':
        const groups = config.roundRobinNumberOfGroups || 0;
        const perGroup = config.qualifyingPerGroup || 0;
        return groups * perGroup;

      default:
        return 0;
    }
  }

  /**
   * Helper: Format validation errors for API response
   */
  formatValidationErrors(result: ValidationResult): string {
    return result.errors.join('; ');
  }
}

// Singleton instance for convenience
export const tournamentValidationService = new TournamentValidationService();
