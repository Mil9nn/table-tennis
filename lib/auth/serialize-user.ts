import type { AuthUserPayload } from "./types";

type UserLike = {
  _id: unknown;
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  isProfileComplete?: boolean;
};

export function toAuthUserPayload(user: UserLike): AuthUserPayload {
  return {
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    profileImage: user.profileImage,
    isProfileComplete: user.isProfileComplete ?? false,
  };
}
