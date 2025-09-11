"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Camera, User, Mail, Calendar, Copy, Check, Edit3, Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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

  const { user, fetchUser } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    fullName: "",
    email: ""
  });

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfileImage();
    fetchUser();
  }, [fetchProfileImage, fetchUser]);

  useEffect(() => {
    if (user) {
      setEditedUser({
        fullName: user.fullName || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreviewUrl(base64String as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;

    try {
      await uploadImage(file);
      setFile(null);
      setPreviewUrl(null);
      toast.success("Profile image updated successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Error uploading image:", error);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      if (user) {
        setEditedUser({
          fullName: user.fullName || "",
          email: user.email || ""
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically make an API call to update user info
      // For now, we'll just show a success message
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      
      // You should implement an API call here like:
      // await updateUserProfile(editedUser);
      // await fetchUser(); // Refresh user data
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account settings and information</p>
            </div>
            <Button
              onClick={handleEditToggle}
              className="bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Picture</h2>
                
                <form onSubmit={handleImageSubmit} className="space-y-4">
                  <div className="relative mx-auto w-32 h-32">
                    <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-indigo-200 shadow-lg">
                      {isLoadingProfile ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={previewUrl || profileImage || '/default-avatar.svg'}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <label
                      className="absolute bottom-0 right-0 cursor-pointer"
                      htmlFor="profileImage"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        id="profileImage"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploadingProfile}
                      />
                      <div className={`w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition shadow-lg ${
                        isUploadingProfile ? "animate-spin" : ""
                      }`}>
                        <Camera className="w-5 h-5" />
                      </div>
                    </label>
                  </div>

                  {file && (
                    <button 
                      type="submit" 
                      disabled={isUploadingProfile}
                      className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploadingProfile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Update Image
                        </>
                      )}
                    </button>
                  )}
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Maximum file size: 5MB<br />
                    Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* User Information Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                  {isEditing && (
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.fullName}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-lg">
                        <span className="text-gray-800 font-medium">{user.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Username
                    </label>
                    <div className="flex items-center justify-between border-2 p-2 rounded-lg">
                      <span className="text-gray-800 font-medium">@{user.username}</span>
                      <button
                        onClick={() => copyToClipboard(user.username, "Username")}
                        className="cursor-pointer text-gray-400 hover:scale-[1.05] active:scale-[0.95] transition"
                      >
                        {copiedField === "Username" ? (
                          <Check className="text-emerald-500" />
                        ) : (
                          <Copy />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Enter your email address"
                      />
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="text-gray-800 font-medium">{user.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </label>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-800 font-medium">
                        {formatDate(user.createdAt || "")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Overview</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-800">Matches Played</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-green-800">Matches Won</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">0%</div>
                    <div className="text-sm text-purple-800">Win Rate</div>
                  </div>
                  
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;