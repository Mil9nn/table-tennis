import { axiosInstance } from "@/lib/axiosInstance";
import { create } from "zustand";

interface ProfileState {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  uploadImage: (image: File) => Promise<void>;
  profileImage: string | null;
  setProfileImage: (profileImage: string) => void;
  isUploadingProfile: boolean;
  isLoadingProfile: boolean;
  fetchProfileImage: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  previewUrl: null as string | null,
  setPreviewUrl: (url: string | null) => set({ previewUrl: url }),

  profileImage: null,
  setProfileImage: (profileImage: string) => set({ profileImage }),
  isUploadingProfile: false,
  isLoadingProfile: false,

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
    } finally {
      set({ isUploadingProfile: false });
    }
  },
}));