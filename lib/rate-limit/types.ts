import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitAlgorithm = "fixedWindow" | "slidingWindow" | "tokenBucket";

export interface RateLimitConfig {
  limit: number;
  window: string; // e.g., "15 m", "1 h", "60 s"
  algorithm: RateLimitAlgorithm;
  identifier: "ip" | "user" | "ip-or-user"; // How to identify the requester
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds until retry is allowed
}

export type RateLimitKey = string;

