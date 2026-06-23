export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  profileImage?: string;

  // Profile completion fields
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  handedness?: "left" | "right" | "ambidextrous";
  phoneNumber?: string;
  location?: string;
  bio?: string;

  // Profile completion tracking
  isProfileComplete?: boolean;

  // Shot tracking preference
  shotTrackingMode?: "detailed" | "simple";

  createdAt?: string;
  updatedAt?: string;
}