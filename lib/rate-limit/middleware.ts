import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  getRateLimitConfig,
  DEFAULT_RATE_LIMIT,
} from "./config";
import { RateLimitConfig } from "./types";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { env } from "@/lib/env";

// Initialize Redis client only if credentials are available
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache for rate limiters to avoid recreating them
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Get or create a rate limiter instance
 */
function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) {
    return null;
  }

  const cacheKey = `${config.algorithm}-${config.limit}-${config.window}`;

  if (rateLimiterCache.has(cacheKey)) {
    return rateLimiterCache.get(cacheKey)!;
  }

  let ratelimit: Ratelimit;

  switch (config.algorithm) {
    case "fixedWindow":
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(
          config.limit,
          config.window as `${number} ${"s" | "m" | "h" | "d"}`
        ),
        analytics: true,
      });
      break;
    case "slidingWindow":
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          config.limit,
          config.window as `${number} ${"s" | "m" | "h" | "d"}`
        ),
        analytics: true,
      });
      break;
    case "tokenBucket":
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(
          config.limit,
          config.window as `${number} ${"s" | "m" | "h" | "d"}`,
          config.limit // refill rate equals limit
        ),
        analytics: true,
      });
      break;
    default:
      // Default to sliding window
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          config.limit,
          config.window as `${number} ${"s" | "m" | "h" | "d"}`
        ),
        analytics: true,
      });
  }

  rateLimiterCache.set(cacheKey, ratelimit);
  return ratelimit;
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
function getIdentifier(
  request: NextRequest,
  config: RateLimitConfig
): string {
  // Check if rate limiting is disabled
  if (env.RATE_LIMIT_ENABLED === "false") {
    return "bypass";
  }

  // Check for bypass key
  const bypassKey = request.headers.get("X-RateLimit-Bypass");
  if (bypassKey && env.RATE_LIMIT_BYPASS_KEY && bypassKey === env.RATE_LIMIT_BYPASS_KEY) {
    return "bypass";
  }

  switch (config.identifier) {
    case "ip":
      return getClientIP(request);
    case "user":
      const userId = getUserId(request);
      if (!userId) {
        // Fallback to IP if user not authenticated
        return getClientIP(request);
      }
      return `user:${userId}`;
    case "ip-or-user":
      const user = getUserId(request);
      return user ? `user:${user}` : getClientIP(request);
    default:
      return getClientIP(request);
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for IP (in order of preference)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (may not work in serverless)
  return (request as any).ip || "unknown";
}

/**
 * Get user ID from JWT token
 */
function getUserId(request: NextRequest): string | null {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }
    const decoded = verifyToken(token);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

/**
 * Create rate limit error response
 */
function createRateLimitResponse(
  limit: number,
  remaining: number,
  reset: number,
  retryAfter: number
): NextResponse {
  const response = NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter,
      limit,
      remaining,
      reset: new Date(reset).toISOString(),
    },
    { status: 429 }
  );

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());
  response.headers.set("Retry-After", retryAfter.toString());

  return response;
}

/**
 * Add rate limit headers to successful response
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): void {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());
}

/**
 * Log rate limit violation
 */
function logRateLimitViolation(
  method: string,
  pathname: string,
  identifier: string,
  limit: number
): void {
  if (env.NODE_ENV === "production") {
    // In production, you might want to send this to a logging service
    console.warn(
      `[Rate Limit] ${method} ${pathname} - Identifier: ${identifier} - Limit: ${limit}`
    );
  } else {
    console.warn(
      `[Rate Limit Violation] ${method} ${pathname} - Identifier: ${identifier} - Limit: ${limit}`
    );
  }
}

/**
 * Rate limit middleware for Next.js API routes
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await rateLimit(request, "POST", "/api/auth/login");
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Your route handler code...
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  method: string,
  pathname: string
): Promise<NextResponse | null> {
  // Skip rate limiting if disabled
  if (env.RATE_LIMIT_ENABLED === "false") {
    return null;
  }

  // Skip if Redis is not configured
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[Rate Limit] Redis not configured, skipping rate limiting");
    return null;
  }

  // Get rate limit config for this route
  const config = getRateLimitConfig(method, pathname) || DEFAULT_RATE_LIMIT;

  // Get identifier
  const identifier = getIdentifier(request, config);

  // Bypass if identifier is "bypass"
  if (identifier === "bypass") {
    return null;
  }

  try {
    // Get rate limiter
    const ratelimit = getRateLimiter(config);

    // If rate limiter is not available, skip
    if (!ratelimit) {
      return null;
    }

    // Create unique key for this route and identifier
    const key = `ratelimit:${method}:${pathname}:${identifier}`;

    // Check rate limit
    const result = await ratelimit.limit(key);

    // If rate limit exceeded
    if (!result.success) {
      logRateLimitViolation(method, pathname, identifier, config.limit);

      const resetTime = result.reset;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return createRateLimitResponse(
        config.limit,
        result.remaining,
        resetTime,
        retryAfter
      );
    }

    // Rate limit passed - return null to continue
    // Headers will be added by the caller if needed
    return null;
  } catch (error) {
    // If rate limiting fails, log error but don't block the request
    console.error("[Rate Limit] Error checking rate limit:", error);
    return null;
  }
}

/**
 * Rate limit middleware that automatically adds headers to response
 * Use this version if you want headers added automatically
 */
export async function rateLimitWithHeaders(
  request: NextRequest,
  method: string,
  pathname: string,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = await rateLimit(request, method, pathname);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Execute handler
  const response = await handler(request);

  // Add rate limit headers to successful response
  const config = getRateLimitConfig(method, pathname) || DEFAULT_RATE_LIMIT;
  const identifier = getIdentifier(request, config);

  if (identifier !== "bypass" && env.UPSTASH_REDIS_REST_URL && redis) {
    try {
      const ratelimit = getRateLimiter(config);

      if (!ratelimit) {
        return response;
      }

      const key = `ratelimit:${method}:${pathname}:${identifier}`;
      const result = await ratelimit.limit(key);

      if (result.success) {
        addRateLimitHeaders(response, config.limit, result.remaining, result.reset);
      }
    } catch (error) {
      // Silently fail - headers are optional
      console.error("[Rate Limit] Error adding headers:", error);
    }
  }

  return response;
}

