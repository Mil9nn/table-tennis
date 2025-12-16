import { RateLimitConfig } from "./types";

/**
 * Rate limit configurations for all API routes
 * Organized by priority and route pattern
 */

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // ========== CRITICAL PRIORITY ==========
  
  // Authentication Routes
  "POST:/api/auth/login": {
    limit: 5,
    window: "15 m",
    algorithm: "slidingWindow",
    identifier: "ip", // Per IP to prevent brute force
  },
  "POST:/api/auth/register": {
    limit: 3,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "ip", // Per IP to prevent spam registrations
  },
  "POST:/api/auth/logout": {
    limit: 20,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user", // Per user, less critical
  },

  // File Upload Routes
  "POST:/api/profile/image": {
    limit: 10,
    window: "1 h",
    algorithm: "tokenBucket",
    identifier: "user", // Per authenticated user
  },
  "POST:/api/teams": {
    limit: 5, // Team creation with image upload
    window: "1 h",
    algorithm: "tokenBucket",
    identifier: "user",
  },
  "PUT:/api/teams/[id]": {
    limit: 5, // Team update with image upload
    window: "1 h",
    algorithm: "tokenBucket",
    identifier: "user",
  },

  // Search Endpoints
  "GET:/api/users/search": {
    limit: 60,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "ip", // Per IP, expensive regex queries
  },
  "GET:/api/teams/search": {
    limit: 100,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "ip", // Per IP, expensive regex queries - increased for tournament team selection
  },

  // Score Update Routes (High Frequency)
  "POST:/api/matches/individual/[id]/score": {
    limit: 60,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user", // Per authenticated user, allow rapid scoring
  },
  "POST:/api/matches/team/[id]/submatch/[subMatchId]/score": {
    limit: 60,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "POST:/api/matches/individual/[id]/current-server": {
    limit: 30,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "POST:/api/matches/individual/[id]/status": {
    limit: 20,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "POST:/api/matches/team/[id]/submatch/[subMatchId]/status": {
    limit: 20,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },

  // ========== HIGH PRIORITY ==========

  // Tournament Management Routes
  "POST:/api/tournaments": {
    limit: 5,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user", // Per authenticated user
  },
  "POST:/api/tournaments/[id]/generate-matches": {
    limit: 10,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },
  "POST:/api/tournaments/[id]/custom-bracket": {
    limit: 10,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },
  "POST:/api/tournaments/[id]/reprocess-bracket": {
    limit: 5,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },
  "POST:/api/tournaments/join": {
    limit: 20,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },

  // Match Creation Routes
  "POST:/api/matches/individual": {
    limit: 20,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },
  "POST:/api/matches/team": {
    limit: 10,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },

  // Leaderboard & Stats Routes
  "GET:/api/leaderboard": {
    limit: 60,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "ip", // Per IP, expensive aggregations
  },
  "GET:/api/profile/player-stats": {
    limit: 30,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "GET:/api/profile/insights": {
    limit: 20,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "GET:/api/profile/[id]/stats": {
    limit: 30,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "ip", // Per IP for public profiles
  },

  // ========== MEDIUM PRIORITY ==========

  // Profile Update Routes
  "PUT:/api/profile": {
    limit: 20,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "PUT:/api/auth/update-profile": {
    limit: 10,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },
  "PUT:/api/profile/gender": {
    limit: 5,
    window: "1 m",
    algorithm: "slidingWindow",
    identifier: "user",
  },

  // Team Management Routes
  "PUT:/api/teams/[id]/assign": {
    limit: 30,
    window: "1 h",
    algorithm: "fixedWindow",
    identifier: "user",
  },
};

/**
 * Get rate limit config for a route
 * Supports both exact matches and pattern matching for dynamic routes
 */
export function getRateLimitConfig(
  method: string,
  pathname: string
): RateLimitConfig | null {
  // Try exact match first
  const exactKey = `${method}:${pathname}`;
  if (RATE_LIMIT_CONFIGS[exactKey]) {
    return RATE_LIMIT_CONFIGS[exactKey];
  }

  // Try pattern matching for dynamic routes
  // Replace dynamic segments with [id] pattern
  const patternPath = pathname.replace(/\/[^/]+/g, (segment, index) => {
    // Check if this looks like an ID (ObjectId format or UUID)
    if (/^\/[0-9a-f]{24}$/i.test(segment) || /^\/[0-9a-f-]{36}$/i.test(segment)) {
      return "/[id]";
    }
    // Check for common patterns like submatch/[id]
    if (segment.includes("submatch")) {
      return "/submatch/[subMatchId]";
    }
    return segment;
  });

  const patternKey = `${method}:${patternPath}`;
  if (RATE_LIMIT_CONFIGS[patternKey]) {
    return RATE_LIMIT_CONFIGS[patternKey];
  }

  // Try with just [id] replacement for any segment
  const simplePattern = pathname.replace(/\/[^/]+/g, "/[id]");
  const simpleKey = `${method}:${simplePattern}`;
  if (RATE_LIMIT_CONFIGS[simpleKey]) {
    return RATE_LIMIT_CONFIGS[simpleKey];
  }

  return null;
}

/**
 * Default rate limit for routes without specific config
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  window: "1 m",
  algorithm: "slidingWindow",
  identifier: "ip",
};

