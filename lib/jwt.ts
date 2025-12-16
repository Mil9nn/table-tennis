import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { env } from "./env";

export const generateToken = (userId: string) => {
    try {
        if (!env.JWT_SECRET || env.JWT_SECRET.length < 24) {
            throw new Error("JWT_SECRET is invalid or too short (must be at least 24 characters)");
        }
        return jwt.sign({ userId }, env.JWT_SECRET, {
            expiresIn: "7d",
        });
    } catch (error) {
        console.error("Error generating JWT token:", error);
        throw error;
    }
};

export const verifyToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        return decoded;
    } catch (error: any) {
        // Check error type by name property (jsonwebtoken uses name to identify error types)
        if (error && typeof error === "object" && error.name) {
            // Invalid signature usually means JWT_SECRET mismatch
            if (error.name === "JsonWebTokenError" && error.message === "invalid signature") {
                // Only log in development to reduce noise in production
                // Invalid tokens are expected when JWT_SECRET changes
                if (env.NODE_ENV === "development") {
                    console.warn("JWT Token signature invalid - token was signed with a different secret. User should log in again.");
                }
            } else if (error.name === "TokenExpiredError") {
                // Expired tokens are expected and don't need error logging
                // Only log in development for debugging
                if (env.NODE_ENV === "development") {
                    console.debug("Token expired (this is expected for old tokens)");
                }
            } else if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
                // Other JWT errors (malformed, not active yet, etc.)
                if (env.NODE_ENV === "development") {
                    console.error("Token verification failed:", error.message);
                }
            } else {
                // Unexpected error types
                console.error("Unexpected error during token verification:", error);
            }
        } else {
            // Non-JWT errors
            console.error("Unexpected error during token verification:", error);
        }
        return null;
    }
}

export const clearAuthCookie = (response: NextResponse) => {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 0, // Immediately expire
  });
  return response;
}

export const setAuthCookie = (response: NextResponse, token: string) => {
  // First clear any existing token to ensure old/invalid tokens are removed
  clearAuthCookie(response);
  
  // Then set the new token
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return response;
}

export function getTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookiesArr = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookiesArr.find((c) => c.startsWith("token="));
  return tokenCookie ? tokenCookie.split("=")[1] : null;
}

