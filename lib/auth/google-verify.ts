import { OAuth2Client } from "google-auth-library";
import { env } from "@/lib/env";
import type { GoogleProfile } from "./types";

let oauthClient: OAuth2Client | null = null;

function getGoogleAudiences(): string[] {
  const raw = env.GOOGLE_CLIENT_IDS?.trim();
  if (!raw) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

function getOAuthClient(): OAuth2Client {
  if (!oauthClient) {
    oauthClient = new OAuth2Client();
  }
  return oauthClient;
}

/**
 * Verifies a Google ID token and returns normalized profile data.
 * @throws Error when Google auth is not configured or the token is invalid
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const audiences = getGoogleAudiences();
  if (audiences.length === 0) {
    throw new Error("GOOGLE_CLIENT_IDS is not configured");
  }

  const ticket = await getOAuthClient().verifyIdToken({
    idToken,
    audience: audiences,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Google token is missing required profile fields");
  }

  if (!payload.email_verified) {
    throw new Error("Google account email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    fullName: payload.name?.trim() || payload.email.split("@")[0],
    profileImage: payload.picture,
    emailVerified: true,
  };
}

export function isGoogleAuthConfigured(): boolean {
  return getGoogleAudiences().length > 0;
}
