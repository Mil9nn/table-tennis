/**
 * Authentication Validation Tests
 *
 * TESTING 101:
 * - describe() = groups related tests together
 * - it() or test() = defines a single test case
 * - expect() = checks if something is true
 *
 * Test Structure:
 * 1. Arrange - Set up test data
 * 2. Act - Run the code you're testing
 * 3. Assert - Check if result is correct
 */

import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  registerSchema,
  loginSchema,
} from './auth'

/**
 * EMAIL VALIDATION TESTS
 * Testing: Does our email validator work correctly?
 */
describe('emailSchema', () => {
  // ✅ TEST 1: Valid emails should pass
  it('should accept valid email addresses', () => {
    // Arrange: Create test data
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'name+tag@test.com',
    ]

    // Act & Assert: Test each email
    validEmails.forEach(email => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(true)
    })
  })

  // ❌ TEST 2: Invalid emails should fail
  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com', // space
    ]

    invalidEmails.forEach(email => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(false)
    })
  })

  // 🔄 TEST 3: Emails should be normalized (lowercase, trimmed)
  it('should normalize email addresses', () => {
    const result = emailSchema.safeParse('  USER@EXAMPLE.COM  ')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('user@example.com')
    }
  })

  // 📏 TEST 4: Emails should have max length
  it('should reject emails longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@test.com' // 259 chars
    const result = emailSchema.safeParse(longEmail)

    expect(result.success).toBe(false)
  })
})

/**
 * PASSWORD VALIDATION TESTS
 * Testing: Does our password validator enforce strong passwords?
 */
describe('passwordSchema', () => {
  // ✅ Valid password test
  it('should accept strong passwords', () => {
    const strongPasswords = [
      'Password123!',
      'MyP@ssw0rd',
      'Secure#Pass1',
    ]

    strongPasswords.forEach(password => {
      const result = passwordSchema.safeParse(password)
      expect(result.success).toBe(true)
    })
  })

  // ❌ Too short
  it('should reject passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Pass1!')

    expect(result.success).toBe(false)
    if (!result.success) {
      // Check error message
      expect(result.error.issues[0].message).toContain('at least 8 characters')
    }
  })

  // ❌ No uppercase
  it('should reject passwords without uppercase letters', () => {
    const result = passwordSchema.safeParse('password123!')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('uppercase')
    }
  })

  // ❌ No lowercase
  it('should reject passwords without lowercase letters', () => {
    const result = passwordSchema.safeParse('PASSWORD123!')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('lowercase')
    }
  })

  // ❌ No number
  it('should reject passwords without numbers', () => {
    const result = passwordSchema.safeParse('Password!')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('number')
    }
  })

  // ❌ No special character
  it('should reject passwords without special characters', () => {
    const result = passwordSchema.safeParse('Password123')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('special character')
    }
  })

  // ❌ Too long
  it('should reject passwords longer than 128 characters', () => {
    const longPassword = 'A1!' + 'a'.repeat(130)
    const result = passwordSchema.safeParse(longPassword)

    expect(result.success).toBe(false)
  })
})

/**
 * USERNAME VALIDATION TESTS
 */
describe('usernameSchema', () => {
  it('should accept valid usernames', () => {
    const validUsernames = [
      'john_doe',
      'user123',
      'test-user',
      'abc',
    ]

    validUsernames.forEach(username => {
      const result = usernameSchema.safeParse(username)
      expect(result.success).toBe(true)
    })
  })

  it('should reject usernames shorter than 3 characters', () => {
    const result = usernameSchema.safeParse('ab')
    expect(result.success).toBe(false)
  })

  it('should reject usernames longer than 30 characters', () => {
    const result = usernameSchema.safeParse('a'.repeat(31))
    expect(result.success).toBe(false)
  })

  it('should reject usernames starting with underscore or hyphen', () => {
    expect(usernameSchema.safeParse('_username').success).toBe(false)
    expect(usernameSchema.safeParse('-username').success).toBe(false)
  })

  it('should reject usernames ending with underscore or hyphen', () => {
    expect(usernameSchema.safeParse('username_').success).toBe(false)
    expect(usernameSchema.safeParse('username-').success).toBe(false)
  })

  it('should reject usernames with special characters', () => {
    const invalidUsernames = [
      'user@name',
      'user name', // space
      'user!name',
    ]

    invalidUsernames.forEach(username => {
      expect(usernameSchema.safeParse(username).success).toBe(false)
    })
  })
})

/**
 * REGISTER SCHEMA TESTS
 * Testing: Does the complete registration validation work?
 */
describe('registerSchema', () => {
  // ✅ Complete valid registration
  it('should accept valid registration data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Password123!',
      username: 'testuser',
      fullName: 'Test User',
    }

    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  // ❌ Missing required fields
  it('should reject incomplete registration data', () => {
    const incompleteData = {
      email: 'test@example.com',
      password: 'Password123!',
      // Missing username and fullName
    }

    const result = registerSchema.safeParse(incompleteData)
    expect(result.success).toBe(false)
  })

  // ❌ Multiple validation errors
  it('should return all validation errors', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'weak',
      username: 'a',
      fullName: 'X',
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)

    if (!result.success) {
      // Should have multiple errors (one for each invalid field)
      expect(result.error.issues.length).toBeGreaterThan(1)
    }
  })
})

/**
 * LOGIN SCHEMA TESTS
 */
describe('loginSchema', () => {
  it('should accept valid login credentials', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Password123!',
    }

    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'Password123!',
    }

    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject missing password', () => {
    const invalidData = {
      email: 'user@example.com',
    }

    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
