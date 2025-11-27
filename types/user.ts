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
  playingStyle?: "offensive" | "defensive" | "all_round";

  // Profile completion tracking
  isProfileComplete?: boolean;

  createdAt?: string;
  updatedAt?: string;
}