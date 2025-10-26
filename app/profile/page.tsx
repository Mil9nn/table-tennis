"use client";

import { useProfileStore } from "@/hooks/useProfileStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Camera, Loader2, Mars, Edit2, Flame, Venus } from "lucide-react";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { axiosInstance } from "@/lib/axiosInstance";
import { cropImageToSquare } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import TabsNav from "@/components/TabsNav";
import MatchTypeBadge from "@/components/MatchTypeBadge";

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
  const { previewUrl, setPreviewUrl, uploadImage, isUploadingProfile } =
    useProfileStore();

  const { user, fetchUser } = useAuthStore();
  const profileImage = user?.profileImage || null;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [shotStats, setShotStats] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const authLoading = useAuthStore((state) => state.authLoading);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "individual", label: "Individual" },
    { value: "team", label: "Team" },
    { value: "performance", label: "Performance" },
  ];

  useEffect(() => {
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

    const fetchDetailedStats = async () => {
      try {
        const response = await axiosInstance.get("/profile/detailed-stats");
        const data = await response.data;
        if (data.success) setDetailedStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch detailed stats:", err);
      }
    };

    fetchStats();
    fetchShotStats();
    fetchDetailedStats();
  }, [fetchUser]);

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

  const shotData = shotStats?.detailedShots
    ? Object.entries(shotStats.detailedShots).map(([name, value]) => ({
        name: name.replaceAll("_", " "),
        value,
      }))
    : [];

  const playingStyleData = detailedStats?.shotAnalysis
    ? [
        { name: "FH", value: detailedStats.shotAnalysis.forehand },
        { name: "BH", value: detailedStats.shotAnalysis.backhand },
      ]
    : [];

  const playStyleData = detailedStats?.shotAnalysis
    ? [
        { name: "Offensive", value: detailedStats.shotAnalysis.offensive },
        { name: "Defensive", value: detailedStats.shotAnalysis.defensive },
        { name: "Neutral", value: detailedStats.shotAnalysis.neutral },
      ]
    : [];

  const individualTypeData = detailedStats?.individual
    ? [
        {
          type: "Singles",
          ...detailedStats.individual.byType,
          wins: detailedStats.individual.wins.singles,
          losses: detailedStats.individual.losses.singles,
        },
        {
          type: "Doubles",
          ...detailedStats.individual.byType,
          wins: detailedStats.individual.wins.doubles,
          losses: detailedStats.individual.losses.doubles,
        },
        {
          type: "Mixed",
          ...detailedStats.individual.byType,
          wins: detailedStats.individual.wins.mixed_doubles,
          losses: detailedStats.individual.losses.mixed_doubles,
        },
      ].filter((d) => d.wins + d.losses > 0)
    : [];

  const teamFormatData = detailedStats?.team
    ? [
        {
          format: "Swaythling",
          matches: detailedStats.team.byFormat.five_singles,
        },
        {
          format: "SDS",
          matches: detailedStats.team.byFormat.single_double_single,
        },
        { format: "Custom", matches: detailedStats.team.byFormat.custom },
      ].filter((d) => d.matches > 0)
    : [];

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1 p-2 space-y-2">
            {/* Profile Card */}
            <div className="p-4">
              <div className="relative mx-auto w-32 h-32 mb-4">
                <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-indigo-200 ">
                  {authLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : profileImage || previewUrl ? (
                    <Image
                      src={previewUrl || profileImage || ""}
                      alt="Profile"
                      width={128}
                      height={128}
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
                    className={`w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition  ${
                      isUploadingProfile ? "animate-pulse" : ""
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                </label>
              </div>

              <h2 className="text-xl font-bold text-center text-gray-800">
                {user.fullName}
              </h2>
              <p className="text-center text-gray-600 text-xs">
                @{user.username}
              </p>

              {user?.gender && !isEditingGender ? (
                <div className="flex items-center justify-between gap-2 border-blue-200 border-b-2 py-2 mt-4">
                  <span className="flex items-center gap-1 text-sm font-medium capitalize text-gray-800">
                    {user.gender}
                    {user.gender === "male" ? (
                      <Mars className="size-4 stroke-[2.5] text-blue-500" />
                    ) : (
                      <Venus className="size-4 stroke-[2.5] text-pink-500" />
                    )}
                  </span>
                  <Button
                    variant="link"
                    onClick={() => setIsEditingGender(true)}
                    className="text-indigo-500 hover:text-indigo-700 text-sm p-0 h-auto"
                  >
                    <Edit2 className="inline-block size-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  defaultValue={
                    !user?.gender || isEditingGender ? undefined : user.gender
                  }
                  onValueChange={async (gender) => {
                    try {
                      const res = await axiosInstance.put("/profile/update", {
                        gender,
                      });
                      if (res.data.success) {
                        toast.success("Gender updated successfully!");
                        await fetchUser();
                        setIsEditingGender(false);
                      }
                    } catch (err) {
                      console.error("Failed to update gender:", err);
                      toast.error("Failed to update gender. Try again.");
                    }
                  }}
                >
                  <SelectTrigger className="w-full mt-4">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="mt-6 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </h3>
                  <p className="text-sm text-gray-800">{user.email}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Member Since
                  </h3>
                  <p className="text-sm text-gray-800">
                    {formatDate(user.createdAt || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Streak */}
            {detailedStats?.overall?.currentStreak && (
              <div className="bg-gradient-to-br from-orange-100 to-red-200 space-y-4 shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Current Streak
                </h3>
                <div className="flex items-center gap-1">
                  <Flame className="w-8 h-8 text-orange-500" />
                  <p className="text-3xl font-black text-orange-600">
                    {detailedStats.overall.currentStreak.count}
                  </p>
                </div>
              </div>
            )}

            {/* Teams */}
            {detailedStats?.teams && detailedStats.teams.length > 0 && (
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  My Teams
                </h3>
                <div className="space-y-2">
                  {detailedStats.teams.map((team: any) => (
                    <div
                      key={team._id}
                      className="flex items-center justify-between p-3 bg-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-sm">{team.name}</p>
                        <p className="text-xs text-gray-600">
                          {team.role} • {team.playerCount} players
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-2 md:border-l-2 p-2">
            <TabsNav tabs={tabs} value={activeTab} onChange={setActiveTab} />

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Overall Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-200 to-white rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xs font-semibold text-gray-600">
                        Total Wins
                      </h3>
                    </div>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.overall?.totalWins || 0}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-200 to-white rounded-xl  p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xs font-semibold text-gray-600">
                        Total Matches
                      </h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                      {detailedStats?.overall?.totalMatches || 0}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-200 to-white rounded-xl  p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xs font-semibold text-gray-600">
                        Win Rate
                      </h3>
                    </div>
                    <p className="text-lg font-black text-slate-800">
                      {detailedStats?.overall?.totalMatches
                        ? (
                            (detailedStats.overall.totalWins /
                              detailedStats.overall.totalMatches) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-200 to-white rounded-xl  p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h3 className="text-xs font-semibold text-gray-600">
                        Best Streak
                      </h3>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                      {detailedStats?.overall?.bestWinStreak || 0}
                    </p>
                  </div>
                </div>

                {/* Recent Matches */}
                {detailedStats?.recentMatches &&
                  detailedStats.recentMatches.length > 0 && (
                    <div className="rounded-2xl  p-2">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Recent Matches
                      </h3>
                      <div className="space-y-3">
                        {detailedStats.recentMatches.map(
                          (match: any, idx: number) => (
                            <Link
                              key={idx}
                              href={`/matches/${match.type}/${match._id}`}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 capitalize rounded-full text-xs font-bold ${
                                      match.result === "win"
                                        ? "ring-2 ring-green-100 text-green-700"
                                        : "ring-2 ring-red-100 text-red-700"
                                    }`}
                                  >
                                    {match.result}
                                  </span>
                                  {/* <span className="text-xs text-gray-500">
                                    {match.type === "individual"
                                      ? match.matchType
                                      : match.matchFormat}
                                  </span> */}
                                  {match.type === "individual" ? <MatchTypeBadge type={match.matchType} size="sm" showIcon={false} /> : 
                                  match.matchFormat}
                                </div>
                                <p className="text-sm font-semibold mt-1">
                                  {match.type === "individual"
                                    ? `vs ${match.opponent}`
                                    : match.teams}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {new Date(match.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">
                                  {match.score}
                                </p>
                              </div>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Monthly Activity */}
                {detailedStats?.monthlyActivity &&
                  detailedStats.monthlyActivity.length > 0 && (
                    <div className="bg-white rounded-2xl  p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Activity Over Time
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={detailedStats.monthlyActivity}>
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis width={30} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#6366F1"
                              strokeWidth={2}
                              dot={{ fill: "#6366F1" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
              </>
            )}

            {/* Individual Tab */}
            {activeTab === "individual" && (
              <>
                {/* Individual Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      Total Matches
                    </h3>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.individual?.total || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      Singles
                    </h3>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.individual?.byType?.singles || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      {detailedStats?.individual?.wins?.singles || 0}W-
                      {detailedStats?.individual?.losses?.singles || 0}L
                    </p>
                  </div>
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      Doubles
                    </h3>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.individual?.byType?.doubles || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      {detailedStats?.individual?.wins?.doubles || 0}W-
                      {detailedStats?.individual?.losses?.doubles || 0}L
                    </p>
                  </div>
                </div>

                {/* Match Type Breakdown */}
                {individualTypeData.length > 0 && (
                  <div className="bg-white rounded-2xl  p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Performance by Match Type
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={individualTypeData}>
                          <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                          <YAxis width={30} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="wins" fill="#10B981" name="Wins" />
                          <Bar dataKey="losses" fill="#EF4444" name="Losses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Head to Head */}
                {detailedStats?.headToHead &&
                  detailedStats.headToHead.length > 0 && (
                    <div className="bg-white rounded-2xl  p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Head-to-Head Records
                      </h3>
                      <div className="space-y-3">
                        {detailedStats.headToHead
                          .slice(0, 5)
                          .map((h: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {h.opponent.profileImage && (
                                  <Image
                                    src={h.opponent.profileImage}
                                    alt={h.opponent.fullName}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-sm">
                                    {h.opponent.fullName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    @{h.opponent.username}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">
                                  {h.wins}-{h.losses}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {h.winRate}% Win Rate
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </>
            )}

            {/* Team Tab */}
            {activeTab === "team" && (
              <>
                {/* Team Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      Team Matches
                    </h3>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.team?.total || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      Team Wins
                    </h3>
                    <p className="text-2xl font-black text-green-600">
                      {detailedStats?.team?.wins || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      SubMatches
                    </h3>
                    <p className="text-2xl font-black text-gray-800">
                      {detailedStats?.team?.subMatchesPlayed || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl  p-4">
                    <h3 className="text-xs font-semibold text-gray-600 mb-2">
                      SubMatch Wins
                    </h3>
                    <p className="text-2xl font-black text-green-600">
                      {detailedStats?.team?.subMatchesWon || 0}
                    </p>
                  </div>
                </div>

                {/* Team Format Breakdown */}
                {teamFormatData.length > 0 && (
                  <div className="bg-white rounded-2xl  p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Matches by Format
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamFormatData}>
                          <XAxis dataKey="format" tick={{ fontSize: 12 }} />
                          <YAxis width={30} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="matches">
                            {teamFormatData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <>
                {/* Playing Style Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Forehand vs Backhand */}
                  {playingStyleData.length > 0 && (
                    <div className="p-2 bg-blue-50">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Forehand vs Backhand
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={playingStyleData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {playingStyleData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Playing Style */}
                  {playStyleData.length > 0 && (
                    <div className="p-2 bg-blue-50">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Playing Style
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={playStyleData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {playStyleData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shot Distribution */}
                {shotData.length > 0 && (
                  <div className="bg-blue-50 p-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Career Shot Distribution
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shotData}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis width={30} tick={{ fontSize: 12 }} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
