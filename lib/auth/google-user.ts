import { User } from "@/models/User";
import type { GoogleProfile } from "./types";
import { generateUniqueUsername } from "./username";

type UserDocument = InstanceType<typeof User>;

export type GoogleAuthResult =
  | { action: "login"; user: UserDocument }
  | { action: "register"; user: UserDocument };

/**
 * Finds an existing user by Google ID or email, links Google when appropriate,
 * or creates a new user. Google sign-in always marks email as verified.
 */
export async function resolveUserFromGoogle(
  profile: GoogleProfile
): Promise<GoogleAuthResult> {
  const byGoogleId = await User.findOne({ googleId: profile.googleId });
  if (byGoogleId) {
    await applyGoogleProfileUpdates(byGoogleId, profile);
    return { action: "login", user: byGoogleId };
  }

  const byEmail = await User.findOne({ email: profile.email });
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.googleId) {
      throw new Error("ACCOUNT_CONFLICT");
    }

    byEmail.googleId = profile.googleId;
    byEmail.isEmailVerified = true;
    byEmail.emailVerifiedAt = byEmail.emailVerifiedAt ?? new Date();
    await applyGoogleProfileUpdates(byEmail, profile);
    await byEmail.save();

    return { action: "login", user: byEmail };
  }

  const username = await generateUniqueUsername(profile.email);
  const newUser = await User.create({
    username,
    fullName: profile.fullName,
    email: profile.email,
    googleId: profile.googleId,
    profileImage: profile.profileImage,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  });

  return { action: "register", user: newUser };
}

async function applyGoogleProfileUpdates(
  user: UserDocument,
  profile: GoogleProfile
): Promise<void> {
  let dirty = false;

  if (profile.profileImage && !user.profileImage?.includes("dicebear.com")) {
    user.profileImage = profile.profileImage;
    dirty = true;
  }

  if (profile.fullName && user.fullName !== profile.fullName) {
    user.fullName = profile.fullName;
    dirty = true;
  }

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    dirty = true;
  }

  if (dirty) {
    await user.save();
  }
}

export function userUsesGoogleOnly(user: { googleId?: string; password?: string }): boolean {
  return Boolean(user.googleId && !user.password);
}
