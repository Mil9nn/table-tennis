"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import IndividualTab from "../components/IndividualTab";
import IndividualTabSkeleton from "../skeletons/IndividualTabSkeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PlayerStatsPage = () => {
  const router = useRouter();
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setDetailedStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, []);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Profile</span>
        </button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Player Stats</h1>
          <p className="text-gray-600 mt-2">
            View your detailed match statistics across singles, doubles, and mixed doubles
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <IndividualTabSkeleton />
        ) : (
          <IndividualTab detailedStats={detailedStats} />
        )}
      </div>
    </div>
  );
};

export default PlayerStatsPage;
