"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import {
  Camera,
  Loader2,
  Edit,
  MapPin,
  Calendar,
  Mail,
  Target,
  Trophy,
  VenusAndMars,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cropImageToSquare } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import EditProfileModal from "./EditProfileModal";

interface ProfileHeaderProps {
  user: any;
  detailedStats: any;
  tournamentStats?: any;
}

const ProfileHeader = ({
  user,
  detailedStats,
  tournamentStats,
}: ProfileHeaderProps) => {
  const { previewUrl, setPreviewUrl, uploadImage, isUploadingProfile } =
    useProfileStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    try {
      const croppedFile = await cropImageToSquare(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(croppedFile);
      await uploadImage(croppedFile);
      toast.success("Profile updated");
    } catch {
      toast.error("Upload failed. Try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const d = new Date(dob);
    return new Date().getFullYear() - d.getFullYear();
  };

  const formatHand = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not specified";

  const formatGender = (value: string) =>
    value
      ? value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : "Not specified";

  const formatStyle = (value: string) =>
    value
      ? value.replace(/_/g, "-").replace(/\b\w/g, (l) => l.toUpperCase())
      : "Not specified";

  return (
    <div className="space-y-2">
      {/* Profile Card */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-blue-200 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="relative w-32 h-32">
              <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200 bg-white">
                {previewUrl || user?.profileImage ? (
                  <Image
                    src={previewUrl || user.profileImage}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={38} />
                  </div>
                )}
              </div>

              {/* Camera Button - Minimal Floating */}
              <label className="absolute bottom-0 right-0 bg-white border-blue-400 border-2 shadow-sm rounded-full p-2 cursor-pointer hover:scale-105 active:scale-100 transition">
                {isUploadingProfile ? (
                  <Loader2 className="animate-spin w-4 h-4 text-gray-600" />
                ) : (
                  <Camera className="w-4 h-4 text-blue-500" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {user.fullName}
                  </h1>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-800 transition flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2">
                {user.handedness && (
                  <div className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-md text-gray-800">
                    {formatHand(user.handedness)} Handed
                  </div>
                )}
                {user.playingStyle && (
                  <div className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-md text-gray-800">
                    {formatStyle(user.playingStyle)} Style
                  </div>
                )}
                {user.location && (
                  <div className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-md text-gray-800 flex items-center gap-1">
                    <MapPin size={12} />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            {user.dateOfBirth && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-xs uppercase">Age:</p>
                  <p className="text-gray-900 font-medium">
                    {calculateAge(user.dateOfBirth)} years
                  </p>
                </div>
              </div>
            )}

            {user.gender && (
              <div className="flex items-start gap-2">
                <VenusAndMars className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex items-center gap-4">
                  <p className="text-gray-500 text-xs uppercase">Gender:</p>
                  <p className="text-gray-900 font-medium">
                    {formatGender(user.gender)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <p className="text-gray-500 text-xs uppercase">Email:</p>
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <p className="text-gray-500 text-xs uppercase">Member Since</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default ProfileHeader;
