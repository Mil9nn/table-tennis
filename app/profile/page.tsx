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
import IndividualTabSkeleton from "./skeletons/IndividualTabSkeleton";

const ProfilePage = () => {
  const { user, fetchUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [shotStats, setShotStats] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [loadingProfileStats, setLoadingProfileStats] = useState(false);
  const [loadingDetailedStats, setLoadingDetailedStats] = useState(false);
  const [loadingShotStats, setLoadingShotStats] = useState(false);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "individual", label: "Individual" },
    { value: "team", label: "Team" },
    { value: "performance", label: "Performance" },
  ];

  useEffect(() => {
    const fetchProfileStats = async () => {
      setLoadingProfileStats(true);
      try {
        const response = await axiosInstance.get("/profile/stats");
        setStats(response.data.stats);
      } catch (error) {
        console.log("Failed to fetch profile stats:", error);
      } finally {
        setLoadingProfileStats(false);
      }
    }
  }, [])

  useEffect(() => {
  const fetchDetailedStats = async () => {
    setLoadingDetailedStats(true);
    try {
      const response = await axiosInstance.get("/profile/detailed-stats");
      setDetailedStats(response.data.detailedStats);
    } catch (error) {
      console.log("Failed to fetch detailed stats:", error);
    } finally {
      setLoadingDetailedStats(false);
    }
  };

  fetchDetailedStats();
}, []);

useEffect(() => {
  const fetchShotStats = async () => {
    setLoadingShotStats(true);
    try {
      const response = await axiosInstance.get("/profile/shot-stats");
      setShotStats(response.data.shotStats);
    } catch (error) {
      console.log("Failed to fetch shot stats:", error);
    } finally {
      setLoadingShotStats(false);
    }
  };

  fetchShotStats();
}, []);



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

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto py-4">
        <ProfileHeader user={user} />

        <div className="mt-8">
          <TabsNav 
            tabs={tabs} 
            value={activeTab} 
            onChange={setActiveTab} 
          />

          <div className="mt-6 space-y-6">
            {activeTab === "overview" && (
              loadingDetailedStats ? <IndividualTabSkeleton /> : <OverviewTab stats={stats} detailedStats={detailedStats} />
            )}
            {activeTab === "individual" && (
              loadingDetailedStats ? <IndividualTabSkeleton /> : <IndividualTab detailedStats={detailedStats} />
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