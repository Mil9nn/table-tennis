/** Payload returned to clients after successful authentication */
export type AuthUserPayload = {
  _id: unknown;
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  isProfileComplete: boolean;
};

/** Verified claims from a Google ID token */
export type GoogleProfile = {
  googleId: string;
  email: string;
  fullName: string;
  profileImage?: string;
  emailVerified: boolean;
};
