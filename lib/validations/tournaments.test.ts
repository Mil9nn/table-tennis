/**
 * Tournament Validation Tests
 *
 * This demonstrates testing more complex validation with business logic
 */

import { createTournamentSchema } from './tournaments'

describe('createTournamentSchema', () => {
  /**
   * HAPPY PATH TEST
   * Test the "ideal" scenario where everything is correct
   */
  it('should accept valid tournament data', () => {
    const validTournament = {
      name: 'Summer Championship',
      format: 'round_robin',
      category: 'individual',
      matchType: 'singles',
      startDate: '2025-12-25', // Future date
      city: 'New York',
      venue: 'Central Sports Complex',
      participants: [], // Optional
    }

    const result = createTournamentSchema.safeParse(validTournament)

    expect(result.success).toBe(true)
  })

  /**
   * FIELD VALIDATION TESTS
   * Test individual field requirements
   */
  describe('name validation', () => {
    it('should reject names shorter than 3 characters', () => {
      const data = {
        name: 'AB', // Too short
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject names longer than 100 characters', () => {
      const data = {
        name: 'A'.repeat(101), // Too long
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('format validation', () => {
    it('should accept valid formats', () => {
      const validFormats = ['round_robin', 'knockout', 'hybrid']

      validFormats.forEach(format => {
        const data: any = {
          name: 'Test Tournament',
          format,
          category: 'individual',
          matchType: 'singles',
          startDate: '2025-12-25',
          city: 'NYC',
          venue: 'Arena',
        }

        // Hybrid format requires hybridConfig
        if (format === 'hybrid') {
          data.hybridConfig = {}
        }

        const result = createTournamentSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid formats', () => {
      const data = {
        name: 'Test Tournament',
        format: 'invalid_format', // Not allowed
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('startDate validation', () => {
    it('should reject past dates', () => {
      const data = {
        name: 'Test Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2020-01-01', // Past date
        city: 'NYC',
        venue: 'Arena',
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be in the past')
      }
    })

    it('should accept future dates', () => {
      const data = {
        name: 'Test Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2030-12-31', // Far future
        city: 'NYC',
        venue: 'Arena',
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  /**
   * BUSINESS LOGIC TESTS
   * Test complex validation rules
   */
  describe('business logic validation', () => {
    it('should reject groups with round-robin format', () => {
      const data = {
        name: 'Test Tournament',
        format: 'round_robin',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        useGroups: true, // NOT allowed with round-robin
        numberOfGroups: 2,
        advancePerGroup: 2,
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be used with round-robin')
      }
    })

    it('should require teamConfig for team tournaments', () => {
      const data = {
        name: 'Team Tournament',
        format: 'knockout',
        category: 'team', // Team tournament
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        // Missing teamConfig!
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues[0].message).toContain('teamConfig')
      }
    })

    it('should require hybridConfig for hybrid tournaments', () => {
      const data = {
        name: 'Hybrid Tournament',
        format: 'hybrid', // Hybrid format
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        // Missing hybridConfig!
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should require at least 2 participants for singles', () => {
      const data = {
        name: 'Singles Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        participants: ['507f1f77bcf86cd799439011'], // Only 1 participant
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 participants')
      }
    })

    it('should require at least 4 participants for doubles', () => {
      const data = {
        name: 'Doubles Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'doubles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        participants: [
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
        ], // Only 2 participants
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 4 participants')
      }
    })

    it('should require even number of participants for doubles', () => {
      const data = {
        name: 'Doubles Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'doubles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        participants: [
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          '507f1f77bcf86cd799439013',
          '507f1f77bcf86cd799439014',
          '507f1f77bcf86cd799439015', // 5 participants (odd number)
        ],
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  /**
   * EDGE CASES
   * Test unusual but valid scenarios
   */
  describe('edge cases', () => {
    it('should accept tournament with no participants', () => {
      const data = {
        name: 'Open Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        participants: [], // Empty is allowed
      }

      const result = createTournamentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept tournament with optional fields omitted', () => {
      const minimalData = {
        name: 'Minimal Tournament',
        format: 'knockout',
        category: 'individual',
        matchType: 'singles',
        startDate: '2025-12-25',
        city: 'NYC',
        venue: 'Arena',
        // All optional fields omitted
      }

      const result = createTournamentSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })
})
