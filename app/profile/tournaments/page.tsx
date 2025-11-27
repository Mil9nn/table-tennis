"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import TournamentTab from "../components/TournamentTab";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const TournamentsPage = () => {
  const router = useRouter();
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTournamentStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/tournament-stats`);
        setTournamentStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch tournament stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentStats();
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
          <h1 className="text-3xl font-bold text-gray-800">Tournaments</h1>
          <p className="text-gray-600 mt-2">
            Browse your tournament history and view detailed results
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : (
          <TournamentTab tournamentStats={tournamentStats} />
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
