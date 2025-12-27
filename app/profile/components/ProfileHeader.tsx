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
import { cropImageToSquare, formatDateLong } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import EditProfileModal from "./EditProfileModal";
import WinRateRing from "./WinRateRing";

interface ProfileHeaderProps {
  user: any;
  detailedStats: any;
  tournamentStats?: any;
  stats?: any;
  isOwnProfile?: boolean;
}

const ProfileHeader = ({
  user,
  detailedStats,
  tournamentStats,
  stats,
  isOwnProfile = true,
}: ProfileHeaderProps) => {
  const { previewUrl, setPreviewUrl, uploadImage, isUploadingProfile } =
    useProfileStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Calculate win rate from stats
  const calculateWinRate = () => {
    if (!stats) return 0;
    const totalMatches =
      (stats.individual?.overall?.totalMatches || 0) +
      (stats.team?.totalMatches || 0);
    const totalWins =
      (stats.individual?.overall?.wins || 0) + (stats.team?.wins || 0);
    return totalMatches > 0
      ? Math.round((totalWins / totalMatches) * 100)
      : 0;
  };

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

  return (
    <div>
      {/* Profile Card */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#353535] px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <div className="w-28 h-28 overflow-hidden bg-[#284b63]">
                {previewUrl || user?.profileImage ? (
                  <Image
                    src={previewUrl || user.profileImage}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#d9d9d9]">
                    <Camera size={32} />
                  </div>
                )}
              </div>

              {/* Camera Button - Only show for own profile */}
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-[#3c6e71] p-2 cursor-pointer hover:bg-[#284b63] transition-colors">
                  {isUploadingProfile ? (
                    <Loader2 className="animate-spin w-4 h-4 text-[#ffffff]" />
                  ) : (
                    <Camera className="w-4 h-4 text-[#ffffff]" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="w-full space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#ffffff] tracking-tight">
                    {user.fullName}
                  </h1>
                  <p className="text-[#d9d9d9] text-sm mt-0.5">@{user.username}</p>
                </div>

                {/* Edit Button - Only show for own profile */}
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold bg-[#3c6e71] text-[#ffffff] hover:bg-[#284b63] transition-colors flex items-center gap-2 uppercase tracking-wider"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                )}
              </div>

              {/* Win Rate Display */}
              {stats && (
                <div className="flex items-center gap-2 text-sm text-[#d9d9d9]">
                  <span className="text-xs font-semibold">Overall Win Rate</span>
                  <span className="text-lg font-bold text-[#ffffff]">{calculateWinRate()}%</span>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <p className="text-[#d9d9d9] text-sm leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2">
                {user.handedness && (
                  <div className="px-3 py-1.5 text-xs bg-[#284b63] text-[#ffffff] font-medium">
                    {formatHand(user.handedness)} Handed
                  </div>
                )}
                {user.location && (
                  <div className="px-3 py-1.5 text-xs bg-[#284b63] text-[#ffffff] flex items-center gap-1.5 font-medium">
                    <MapPin size={12} />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Personal Info Card */}
        <div className="bg-[#ffffff] px-6 py-6 border-t border-[#d9d9d9]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-4">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {user.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#3c6e71]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#353535] font-semibold mb-0.5">Age</p>
                  <p className="text-[#353535] font-medium">
                    {calculateAge(user.dateOfBirth)} years
                  </p>
                </div>
              </div>
            )}

            {user.gender && (
              <div className="flex items-center gap-3">
                <VenusAndMars className="w-4 h-4 text-[#3c6e71]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#353535] font-semibold mb-0.5">Gender</p>
                  <p className="text-[#353535] font-medium">
                    {formatGender(user.gender)}
                  </p>
                </div>
              </div>
            )}

            {/* Email - Only show for own profile */}
            {isOwnProfile && user.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#3c6e71]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#353535] font-semibold mb-0.5">Email</p>
                  <p className="text-[#353535] font-medium">{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-[#3c6e71]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#353535] font-semibold mb-0.5">Member Since</p>
                <p className="text-[#353535] font-medium">
                  {formatDateLong(user.createdAt)}
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
