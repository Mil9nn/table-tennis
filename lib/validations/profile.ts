/**
 * Profile Validation Schemas
 *
 * Validates profile updates and related operations
 */

import { z } from "zod";

// Gender options
export const genderSchema = z.enum(["male", "female", "other"], {
  error: "Gender must be 'male', 'female', or 'other'",
});

// Playing hand
export const playingHandSchema = z.enum(["right", "left"], {
  error: "Playing hand must be 'right' or 'left'",
});

// Grip style
export const gripStyleSchema = z.enum(["shakehand", "penhold"], {
  error: "Grip style must be 'shakehand' or 'penhold'",
});

// Complete profile schema (used after registration)
export const completeProfileSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes")
    .trim(),

  dateOfBirth: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 5 && age <= 120;
    }, "Age must be between 5 and 120 years"),

  gender: genderSchema,

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),

  country: z.string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must not exceed 100 characters")
    .trim()
    .optional(),

  playingHand: playingHandSchema.optional(),

  gripStyle: gripStyleSchema.optional(),

  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .trim()
    .optional(),
}).strict();

// Update profile schema (all fields optional)
export const updateProfileSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),

  dateOfBirth: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 5 && age <= 120;
    }, "Age must be between 5 and 120 years")
    .optional(),

  gender: genderSchema.optional(),

  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters")
    .trim()
    .optional(),

  country: z.string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must not exceed 100 characters")
    .trim()
    .optional(),

  playingHand: playingHandSchema.optional(),

  gripStyle: gripStyleSchema.optional(),

  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .trim()
    .optional(),
}).strict();

// Profile image upload schema
export const profileImageSchema = z.object({
  profileImage: z.instanceof(Blob)
    .refine(
      (file) => file.size > 0,
      "File cannot be empty"
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      "File size must not exceed 5MB"
    )
    .refine(
      (file) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        return allowedTypes.includes(file.type);
      },
      "Only JPEG, PNG, GIF, and WebP images are allowed"
    ),
}).strict();

// Update gender schema
export const updateGenderSchema = z.object({
  gender: genderSchema,
}).strict();

// Update user preference schema (for PATCH /api/auth/me)
export const updateUserPreferenceSchema = z.object({
  shotTrackingMode: z.enum(["detailed", "simple"], {
    error: "shotTrackingMode must be 'detailed' or 'simple'",
  }).optional(),
}).strict();

// Export type inference
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileImageInput = z.infer<typeof profileImageSchema>;
export type UpdateGenderInput = z.infer<typeof updateGenderSchema>;
export type UpdateUserPreferenceInput = z.infer<typeof updateUserPreferenceSchema>;
