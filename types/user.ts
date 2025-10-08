export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  profileImage?: string;
  gender?: "male" | "female";
  createdAt?: string;
  updatedAt?: string;
}