"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import { Camera, Loader2, Mars, Venus, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cropImageToSquare } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import GenderEditModal from "./GenderEditModal";

interface ProfileHeaderProps {
  user: any;
  stats: any;
  detailedStats: any;
}

const ProfileHeader = ({ user, stats, detailedStats }: ProfileHeaderProps) => {
  const { previewUrl, setPreviewUrl, uploadImage, isUploadingProfile } = useProfileStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingGender, setIsEditingGender] = useState(false);

  const profileImage = user?.profileImage || null;

  // Prefer detailedStats.overall which includes both individual AND team matches
  const totalMatches = detailedStats?.overall?.totalMatches ?? stats?.totalMatches ?? 0;
  const totalWins = detailedStats?.overall?.totalWins ?? stats?.totalWins ?? 0;
  const winPercentage = totalMatches > 0 
    ? ((totalWins / totalMatches) * 100).toFixed(1)
    : "0";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const croppedFile = await cropImageToSquare(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(croppedFile);
      await uploadImage(croppedFile);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-blue-200 overflow-hidden bg-gray-100">
            {previewUrl || profileImage ? (
              <Image
                src={previewUrl || profileImage}
                alt="Profile"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Camera size={40} />
              </div>
            )}
          </div>

          <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-all">
            {isUploadingProfile ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Camera size={20} />
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploadingProfile}
            />
          </label>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <h1 className="text-3xl font-black text-gray-800">{user.fullName}</h1>
            {user.gender && (
              <div className="flex items-center gap-2">
                {user.gender === "male" ? (
                  <Mars className="text-blue-500" size={24} />
                ) : (
                  <Venus className="text-pink-500" size={24} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGender(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 size={14} />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <p
              onClick={() => copyToClipboard(user.username, "Username")}
              className="text-gray-600 cursor-pointer hover:text-blue-500 transition-colors"
            >
              @{user.username}
              {copiedField === "Username" && " ✓"}
            </p>
            <p
              onClick={() => copyToClipboard(user.email, "Email")}
              className="text-gray-600 cursor-pointer hover:text-blue-500 transition-colors"
            >
              {user.email}
              {copiedField === "Email" && " ✓"}
            </p>
            <p className="text-sm text-gray-500">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalMatches}</p>
              <p className="text-xs text-gray-600">Matches</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalWins}</p>
              <p className="text-xs text-gray-600">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{winPercentage}%</p>
              <p className="text-xs text-gray-600">Win Rate</p>
            </div>
          </div>
        </div>
      </div>

      {isEditingGender && (
        <GenderEditModal
          isOpen={isEditingGender}
          onClose={() => setIsEditingGender(false)}
          currentGender={user.gender}
        />
      )}
    </div>
  );
};

export default ProfileHeader;