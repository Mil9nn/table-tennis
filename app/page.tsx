"use client";

import React, { useEffect, useState } from "react";
import { Users, Trophy, BarChart, Smartphone } from "lucide-react";
import Link from "next/link";
import MatchesList from "@/components/MatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2 } from "lucide-react";
import { IndividualMatch } from "@/types/match.type";

export default function HomePage() {
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

  return (
    <div className="flex flex-col space-y-4">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Quick Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Track scores, manage matches, and share results instantly
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/match/create" className="btn btn-primary">
              Create a match
            </Link>
            <Link href="/teams/create" className="btn btn-secondary">
              Create a team
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      <section className="px-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Matches</h2>
          <Link href="/matches" className="text-indigo-600 hover:underline">
            See all →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-6 text-gray-500">
            <Loader2 className="animate-spin mr-2" />
            Loading matches...
          </div>
        ) : matches.length === 0 ? (
          <p className="text-gray-500">No recent matches found.</p>
        ) : (
          <MatchesList matches={matches.slice(0, 2)} />
        )}
      </section>

      {/* Teams Section (still dummy for now) */}
      <section className="px-8 py-4 bg-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Teams</h2>
          <Link href="/teams" className="text-indigo-600 hover:underline">
            See all →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Smash Masters</p>
            <p className="text-sm text-gray-500">4 players</p>
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Spin Kings</p>
            <p className="text-sm text-gray-500">3 players</p>
          </div>
        </div>
      </section>
    </div>
  );
}
