import { axiosInstance } from "@/lib/axiosInstance";
import { create } from "zustand";

interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileState {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  uploadImage: (image: File) => Promise<void>;
  profileImage: string | null;
  setProfileImage: (profileImage: string) => void;
  isUploadingProfile: boolean;
  isLoadingProfile: boolean;
  fetchProfileImage: () => Promise<void>;
  
  // User info management
  userInfo: User | null;
  isLoadingUserInfo: boolean;
  isUpdatingUserInfo: boolean;
  fetchUserInfo: () => Promise<void>;
  updateUserInfo: (data: { fullName: string; email: string }) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  previewUrl: null as string | null,
  setPreviewUrl: (url: string | null) => set({ previewUrl: url }),

  profileImage: null,
  setProfileImage: (profileImage: string) => set({ profileImage }),
  isUploadingProfile: false,
  isLoadingProfile: false,

  userInfo: null,
  isLoadingUserInfo: false,
  isUpdatingUserInfo: false,

  // Fetch profile image from API
  async fetchProfileImage() {
    set({ isLoadingProfile: true });
    try {
      const response = await axiosInstance.get("/profile/image");
      const data = response.data;
      set({ profileImage: data.url || data.profileImage });
    } catch (error) {
      console.error("Error fetching profile image:", error);
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  async uploadImage(image: File) {
    const formData = new FormData();
    formData.append("profileImage", image);

    set({ isUploadingProfile: true });
    try {
      const response = await axiosInstance.post("/profile/image", formData);
      const data = response.data;
      set({ profileImage: data.url });
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      set({ isUploadingProfile: false });
    }
  },

  async fetchUserInfo() {
    set({ isLoadingUserInfo: true });
    try {
      const response = await axiosInstance.get("/profile");
      const data = response.data;
      if (data.success) {
        set({ userInfo: data.user });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      set({ isLoadingUserInfo: false });
    }
  },

  async updateUserInfo(updateData: { fullName: string; email: string }) {
    set({ isUpdatingUserInfo: true });
    try {
      const response = await axiosInstance.put("/profile", updateData);
      const data = response.data;
      
      if (data.success) {
        set({ userInfo: data.user });
        return data;
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating user info:", error);
      throw error;
    } finally {
      set({ isUpdatingUserInfo: false });
    }
  },
}));