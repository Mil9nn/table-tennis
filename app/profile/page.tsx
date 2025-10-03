"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Camera, Copy, Loader2, CheckCircle2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { axiosInstance } from "@/lib/axiosInstance";
import { cropImageToSquare } from "@/lib/utils";

// --- Shared colors for charts ---
const COLORS = [
  "#F59E0B",
  "#8B5CF6",
  "#14B8A6",
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#EF4444",
];

const ProfilePage = () => {
  const {
    previewUrl,
    setPreviewUrl,
    uploadImage,
    fetchProfileImage,
    isUploadingProfile,
    isLoadingProfile,
  } = useProfileStore();

  const { user, fetchUser } = useAuthStore();
  const profileImage = user?.profileImage || null;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [shotStats, setShotStats] = useState<any>(null);

  // Fetch profile + stats
  useEffect(() => {
    fetchProfileImage();
    fetchUser();

    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/profile/stats");
        const data = await response.data;
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchShotStats = async () => {
      try {
        const response = await axiosInstance.get("/profile/shot-stats");
        const data = await response.data;
        if (data.success) setShotStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch shot stats:", err);
      }
    };

    fetchStats();
    fetchShotStats();
  }, [fetchProfileImage, fetchUser]);

  // Auto upload on file select
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

      // Generate preview instantly
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(croppedFile);

      // Upload instantly
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin text-indigo-500" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Format detailed shots for chart
  const shotData = shotStats?.detailedShots
    ? Object.entries(shotStats.detailedShots).map(([name, value]) => ({
        name: name.replaceAll("_", " "),
        value,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="px-4">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image Section */}
          <div className="lg:col-span-1">
            <div className="p-6">
              <div className="relative mx-auto w-32 h-32">
                <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-indigo-200 shadow-lg">
                  {isLoadingProfile ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : profileImage || previewUrl ? (
                    <img
                      src={previewUrl || profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
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
                  <div
                    className={`w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition shadow-lg ${
                      isUploadingProfile ? "animate-pulse" : ""
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                </label>
              </div>
              {isUploadingProfile && <p className="text-center text-gray-400 mt-2 animate-pulse">Updating your profile image...</p>}
            </div>
          </div>

          {/* Info + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700 font-bold">Full Name</label>
                  <div className="p-2 text-sm font-medium">{user.fullName}</div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Username</label>
                  <div className="w-fit gap-4 flex items-center justify-between p-2 border rounded-lg">
                    <span className="font-medium text-sm">@{user.username}</span>
                    <button
                      onClick={() => copyToClipboard(user.username, "Username")}
                    >
                      {copiedField === "Username" ? (
                        <CheckCircle2 className="text-emerald-500 size-5" />
                      ) : (
                        <Copy className="size-4 text-gray-700" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-700 font-bold">Email</label>
                  <div className="p-2 bg-gray-50 rounded text-sm font-medium">{user.email}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-700 font-bold">Member Since</label>
                  <div className="p-2 bg-gray-50 rounded font-medium text-sm">
                    {formatDate(user.createdAt || "")}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Stats */}
            <div className="bg-white shadow-sm p-6 space-y-2">
              <h2 className="text-xl font-semibold">Statistics</h2>
              <p>Track your performance and progress</p>
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-4">
                <div className="p-4 bg-gradient-to-r from-white to-blue-100 rounded-xl shadow-md">
                  <h3 className="text-sm font-semibold text-blue-800">Matches Played</h3>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {stats?.matchesPlayed ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-white to-blue-100 rounded-xl shadow-md">
                  <h3 className="text-sm font-semibold text-blue-800">Record (W-L-D)</h3>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {stats
                      ? `${stats.wins}-${stats.losses}-${stats.draws}`
                      : "0-0-0"}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-white to-blue-100 shadow-md rounded-xl">
                  <div className="text-2xl font-bold">
                    <h3 className="text-sm font-semibold text-blue-800">Win Rate</h3>
                    <span className="font-extrabold text-blue-600">
                      {stats?.matchesPlayed
                        ? `${((stats.wins / stats.matchesPlayed) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-white to-yellow-100 shadow-md rounded-xl">
                  <div className="text-sm font-semibold text-yellow-800">Strength</div>
                  <div className="font-bold text-yellow-600 capitalize">
                    {stats?.bestShot
                      ? stats.bestShot.replaceAll("_", " ")
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Shot Breakdown */}
            {shotData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-2">
                <h2 className="text-xl font-semibold mb-6">
                  Career Shot Distribution
                </h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shotData}>
                      <XAxis dataKey="name" />
                      <YAxis width={30} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {shotData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
