import { z } from "zod";

/**
 * Email validation schema
 * Validates email format according to RFC 5322 standards
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

/**
 * Password strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
  );

/**
 * Username validation schema
 * - 3-30 characters
 * - Alphanumeric, underscore, and hyphen only
 * - Cannot start or end with underscore or hyphen
 */
export const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username must be less than 30 characters")
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
    "Username can only contain letters, numbers, underscores, and hyphens. It cannot start or end with underscore or hyphen."
  );

/**
 * Full name validation schema
 */
export const fullNameSchema = z
  .string()
  .min(1, "Full name is required")
  .min(2, "Full name must be at least 2 characters long")
  .max(100, "Full name must be less than 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Full name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .trim();

/**
 * Registration schema
 * Validates all fields for user registration
 */
export const registerSchema = z.object({
  username: usernameSchema,
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});

/**
 * Type exports for TypeScript
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

