"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import { Camera } from "lucide-react";
import React, { useEffect, useState } from "react";

const ProfilePage = () => {
  const { 
    previewUrl, 
    setPreviewUrl, 
    uploadImage, 
    fetchProfileImage,
    profileImage,
    isUploadingProfile,
    isLoadingProfile
  } = useProfileStore();

  const [file, setFile] = useState<File | null>(null);

  // Fetch profile image when component mounts
  useEffect(() => {
    fetchProfileImage();
  }, [fetchProfileImage]);

  console.log("Profile Image URL from store:", profileImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreviewUrl(base64String as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;

    try {
      await uploadImage(file);
      setFile(null);
      setPreviewUrl(null);
      console.log("Profile image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative w-28 h-28 mx-auto">
              <div className="rounded-full overflow-hidden w-28 h-28 border-2 border-black/40">
                {isLoadingProfile ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : (
                  <img
                    src={previewUrl || profileImage || '/default-avatar.svg'}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <label
                className="absolute bottom-0 right-0"
                htmlFor="profileImage"
              >
                <input
                  type="file"
                  accept="image/*"
                  id="profileImage"
                  className="w-full hidden"
                  onChange={handleFileChange}
                  disabled={isUploadingProfile}
                />
                <Camera 
                  className={`w-10 h-10 text-gray-200 bg-indigo-500 p-2 rounded-full hover:bg-indigo-700 transition cursor-pointer ${
                    isUploadingProfile && "animate-spin"
                  }`} 
                />
              </label>
            </div>
            <button 
              type="submit" 
              disabled={!file || isUploadingProfile}
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isUploadingProfile ? 'Uploading...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;