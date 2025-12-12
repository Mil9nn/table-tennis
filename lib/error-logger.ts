/**
 * Error Logging Utility
 *
 * Provides centralized error logging with GlitchTip integration
 * Use this instead of console.error for production error tracking
 */

import * as Sentry from "@sentry/nextjs";

type ErrorContext = {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

/**
 * Log an error to GlitchTip and console
 *
 * @param error - The error object or message
 * @param context - Additional context (user, tags, extra data)
 *
 * @example
 * ```typescript
 * try {
 *   await processMatch(matchId);
 * } catch (error) {
 *   logError(error, {
 *     user: { id: userId, email: userEmail },
 *     tags: { feature: 'match-scoring' },
 *     extra: { matchId, tournamentId }
 *   });
 * }
 * ```
 */
export function logError(error: Error | string | unknown, context?: ErrorContext): void {
  // Always log to console for local debugging
  console.error("[Error]", error, context);

  // If GlitchTip is enabled, send to error tracking
  if (process.env.GLITCHTIP_ENABLED === "true" || process.env.NEXT_PUBLIC_GLITCHTIP_DSN) {
    // Set user context if provided
    if (context?.user) {
      Sentry.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
      });
    }

    // Set tags if provided
    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    // Set extra context if provided
    if (context?.extra) {
      Sentry.setContext("additional_info", context.extra);
    }

    // Capture the error
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: context?.level || "error",
      });
    } else if (typeof error === "string") {
      Sentry.captureMessage(error, {
        level: context?.level || "error",
      });
    } else {
      Sentry.captureException(new Error(String(error)), {
        level: context?.level || "error",
      });
    }
  }
}

/**
 * Log a warning to GlitchTip and console
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", message, context);

  if (process.env.GLITCHTIP_ENABLED === "true" || process.env.NEXT_PUBLIC_GLITCHTIP_DSN) {
    if (context?.user) {
      Sentry.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
      });
    }

    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setContext("additional_info", context.extra);
    }

    Sentry.captureMessage(message, {
      level: "warning",
    });
  }
}

/**
 * Log an info message to GlitchTip (useful for important events)
 *
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(message: string, context?: ErrorContext): void {
  console.info("[Info]", message, context);

  if (process.env.GLITCHTIP_ENABLED === "true" || process.env.NEXT_PUBLIC_GLITCHTIP_DSN) {
    if (context?.user) {
      Sentry.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
      });
    }

    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setContext("additional_info", context.extra);
    }

    Sentry.captureMessage(message, {
      level: "info",
    });
  }
}

/**
 * Wrap an async function with error logging
 * Automatically logs any errors that occur
 *
 * @example
 * ```typescript
 * const processMatch = withErrorLogging(
 *   async (matchId: string) => {
 *     // Your code here
 *   },
 *   { tags: { feature: 'match-processing' } }
 * );
 * ```
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error; // Re-throw to allow caller to handle
    }
  }) as T;
}

/**
 * Start a performance transaction for monitoring
 *
 * @param name - Transaction name
 * @param operation - Operation type (e.g., 'http.server', 'db.query')
 * @returns Transaction object with finish() method
 */
export function startTransaction(name: string, operation: string) {
  if (process.env.GLITCHTIP_ENABLED === "true" || process.env.NEXT_PUBLIC_GLITCHTIP_DSN) {
    return Sentry.startSpan(
      {
        name,
        op: operation,
      },
      (span) => span
    );
  }

  // Return a no-op object if GlitchTip is disabled
  return {
    finish: () => {},
  };
}
