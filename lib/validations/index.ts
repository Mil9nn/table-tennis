/**
 * Validation Utilities
 *
 * Centralized validation helpers for API routes
 */

import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validate request body against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with parsed data or error response
 *
 * @example
 * ```typescript
 * const validation = validateRequest(createTournamentSchema, body);
 * if (!validation.success) {
 *   return validation.error; // Returns NextResponse with 400 status
 * }
 * const { data } = validation; // Typed and validated data
 * ```
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
{
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for better readability
      const errors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Validation failed",
            errors,
          },
          { status: 400 }
        ),
      };
    }

    // Unexpected error
    return {
      success: false,
      error: NextResponse.json(
        {
          error: "Invalid request data",
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams to validate
 * @returns Validation result with parsed data or error response
 *
 * @example
 * ```typescript
 * const { searchParams } = new URL(req.url);
 * const validation = validateQueryParams(getTournamentsQuerySchema, searchParams);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { status, format, limit } = validation.data;
 * ```
 */
export function validateQueryParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
{
  // Convert URLSearchParams to plain object
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateRequest(schema, params);
}

/**
 * Validate FormData against a Zod schema
 * Useful for multipart/form-data requests (file uploads)
 *
 * @param schema - Zod schema to validate against
 * @param formData - FormData to validate
 * @returns Validation result with parsed data or error response
 *
 * @example
 * ```typescript
 * const formData = await req.formData();
 * const validation = validateFormData(createTeamSchema, formData);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { name, captain, players } = validation.data;
 * ```
 */
export function validateFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
{
  // Convert FormData to plain object
  const data: Record<string, any> = {};

  formData.forEach((value, key) => {
    // Handle JSON strings (e.g., arrays)
    if (typeof value === "string") {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(value);
        data[key] = parsed;
      } catch {
        // Not JSON, use as-is
        data[key] = value;
      }
    } else {
      // File/Blob
      data[key] = value;
    }
  });

  return validateRequest(schema, data);
}

/**
 * Validate MongoDB ObjectId
 *
 * @param id - ID string to validate
 * @returns true if valid ObjectId format, false otherwise
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate array of MongoDB ObjectIds
 *
 * @param ids - Array of ID strings to validate
 * @returns true if all are valid ObjectId formats, false otherwise
 */
export function areValidObjectIds(ids: string[]): boolean {
  return ids.every(isValidObjectId);
}

// Re-export all validation schemas for convenience
export * from "./auth";
export * from "./tournaments";
export * from "./matches";
export * from "./teams";
export * from "./profile";
