"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import TabsNav from "@/components/TabsNav";
import ProfileHeader from "./components/ProfileHeader";
import OverviewTab from "./components/OverviewTab";
import IndividualTab from "./components/IndividualTab";
import TeamTab from "./components/TeamTab";
import PerformanceTab from "./components/PerformanceTab";

const ProfilePage = () => {
  const { user, fetchUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [shotStats, setShotStats] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "individual", label: "Individual" },
    { value: "team", label: "Team" },
    { value: "performance", label: "Performance" },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await fetchUser();

        const [statsRes, shotStatsRes, detailedRes] = await Promise.all([
          axiosInstance.get("/profile/stats"),
          axiosInstance.get("/profile/shot-stats"),
          axiosInstance.get("/profile/detailed-stats"),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        if (shotStatsRes.data.success) {
          setShotStats(shotStatsRes.data.stats);
        }
        if (detailedRes.data.success) {
          setDetailedStats(detailedRes.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (!user || loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin text-indigo-500" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProfileHeader user={user} stats={stats} />

        <div className="mt-8">
          <TabsNav 
            tabs={tabs} 
            value={activeTab} 
            onChange={setActiveTab} 
          />

          <div className="mt-6 space-y-6">
            {activeTab === "overview" && (
              <OverviewTab stats={stats} detailedStats={detailedStats} />
            )}
            {activeTab === "individual" && (
              <IndividualTab detailedStats={detailedStats} />
            )}
            {activeTab === "team" && <TeamTab detailedStats={detailedStats} />}
            {activeTab === "performance" && (
              <PerformanceTab shotStats={shotStats} detailedStats={detailedStats} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;