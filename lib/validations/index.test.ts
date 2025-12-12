/**
 * Validation Utilities Tests
 *
 * This demonstrates testing utility functions
 */

import { describe, it, expect } from 'vitest'
import { isValidObjectId, areValidObjectIds } from './index'

/**
 * TESTING PURE FUNCTIONS
 * These functions always return the same output for the same input
 * They're the easiest to test!
 */
describe('isValidObjectId', () => {
  /**
   * Testing pattern:
   * - Test the happy path (valid input)
   * - Test invalid inputs
   * - Test edge cases
   */

  it('should return true for valid MongoDB ObjectIds', () => {
    const validIds = [
      '507f1f77bcf86cd799439011',
      '6075a4b8c3d6e4f5a8b9c0d1',
      'ffffffffffffffffffffffff',
      '000000000000000000000000',
    ]

    validIds.forEach(id => {
      expect(isValidObjectId(id)).toBe(true)
    })
  })

  it('should return false for invalid ObjectIds', () => {
    const invalidIds = [
      '123', // Too short
      'not-an-objectid', // Invalid characters
      '507f1f77bcf86cd79943901', // Too short (23 chars)
      '507f1f77bcf86cd7994390111', // Too long (25 chars)
      '507f1f77bcf86cd79943901g', // Invalid character 'g'
      '', // Empty string
      '507f1f77-bcf8-6cd7-9943-9011', // Dashes not allowed
    ]

    invalidIds.forEach(id => {
      expect(isValidObjectId(id)).toBe(false)
    })
  })

  it('should handle uppercase hexadecimal characters', () => {
    const uppercaseId = '507F1F77BCF86CD799439011'
    expect(isValidObjectId(uppercaseId)).toBe(true)
  })

  it('should handle mixed case hexadecimal characters', () => {
    const mixedCaseId = '507f1F77BcF86cD799439011'
    expect(isValidObjectId(mixedCaseId)).toBe(true)
  })
})

describe('areValidObjectIds', () => {
  it('should return true when all IDs are valid', () => {
    const validIds = [
      '507f1f77bcf86cd799439011',
      '6075a4b8c3d6e4f5a8b9c0d1',
      'ffffffffffffffffffffffff',
    ]

    expect(areValidObjectIds(validIds)).toBe(true)
  })

  it('should return false when any ID is invalid', () => {
    const mixedIds = [
      '507f1f77bcf86cd799439011', // Valid
      'invalid-id', // Invalid
      '6075a4b8c3d6e4f5a8b9c0d1', // Valid
    ]

    expect(areValidObjectIds(mixedIds)).toBe(false)
  })

  it('should return true for empty array', () => {
    expect(areValidObjectIds([])).toBe(true)
  })

  it('should return false if first ID is invalid', () => {
    const ids = [
      'invalid', // First one invalid
      '507f1f77bcf86cd799439011',
    ]

    expect(areValidObjectIds(ids)).toBe(false)
  })

  it('should return false if last ID is invalid', () => {
    const ids = [
      '507f1f77bcf86cd799439011',
      'invalid', // Last one invalid
    ]

    expect(areValidObjectIds(ids)).toBe(false)
  })
})
