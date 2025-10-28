"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import TabsNav from "@/components/TabsNav";
import ProfileHeader from "./components/ProfileHeader";
import OverviewTab from "./components/OverviewTab";
import IndividualTab from "./components/IndividualTab";
import TeamTab from "./components/TeamTab";
import PerformanceTab from "./components/PerformanceTab";
import OverviewTabSkeleton from "./skeletons/OverviewTabSkeleton";
import ProfileHeaderSkeleton from "./skeletons/ProfileHeaderSkeleton";

const ProfilePage = () => {
  const { user, fetchUser } = useAuthStore();

  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingDetailedStats, setLoadingDetailedStats] = useState(false);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "individual", label: "Individual" },
    { value: "team", label: "Team" },
    { value: "performance", label: "Performance" },
  ];

  useEffect(() => {
    const fetchDetailedStats = async () => {
      setLoadingDetailedStats(true);
      try {
        const response = await axiosInstance.get("/profile/detailed-stats");
        setDetailedStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
      } finally {
        setLoadingDetailedStats(false);
      }
    };

    fetchDetailedStats();
  }, []);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        {user ? <ProfileHeader user={user} /> : <ProfileHeaderSkeleton />}

        <div className="mt-8">
          <TabsNav 
            tabs={tabs} 
            value={activeTab} 
            onChange={setActiveTab} 
          />

          <div className="mt-6 space-y-2">
            {activeTab === "overview" && (
              loadingDetailedStats ? <OverviewTabSkeleton /> : <OverviewTab detailedStats={detailedStats} />
            )}
            {activeTab === "individual" && (
              <IndividualTab detailedStats={detailedStats} />
            )}
            {activeTab === "team" && <TeamTab detailedStats={detailedStats} />}
            {activeTab === "performance" && (
              <PerformanceTab detailedStats={detailedStats} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;