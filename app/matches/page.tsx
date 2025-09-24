"use client";

import { useEffect, useState } from "react";
import MatchesList from "@/components/MatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2 } from "lucide-react";
import { IndividualMatch } from "@/types/match.type";

export default function MatchesPage() {
  const [matches, setMatches] = useState<IndividualMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await axiosInstance.get("/matches/individual");
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="flex items-center gap-2 text-gray-500 text-lg">
          <Loader2 className="animate-spin" />
          <span>Loading matches...</span>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Recent Matches</h1>
      <MatchesList matches={matches} />
    </div>
  );
}
