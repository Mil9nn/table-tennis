"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { timeAgo } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";
import { useIndividualMatch } from "@/hooks/useIndividualMatch";
import { set } from "mongoose";
import RecentMatchesSkeleton from "@/components/skeletons/RecentMatchesSkeleton";
import Image from "next/image";

export default function HomePage() {
  const [matches, setMatches] = useState<IndividualMatch[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/matches/individual?limit=2");
        setMatches(response.data.matches);
      } catch (error) {
        console.error("Error fetching recent matches:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-20 overflow-hidden">
        <div className="max-w-2xl z-10">
          <h1 className="text-4xl md:text-6xl text-indigo-900/80 font-extrabold tracking-tight mb-6 drop-shadow-md">
            Quick Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-700">
            Track scores, manage matches, and share results instantly with a
            sleek, modern, and intuitive interface.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/match/create"
              className="px-6 py-3 text-sm rounded-full bg-white text-indigo-700 font-semibold shadow hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-200"
            >
              Create a Match
            </Link>
            <Link
              href="/teams/create"
              className="px-6 py-3 text-sm rounded-full bg-indigo-900/80 text-white font-semibold shadow hover:bg-indigo-950 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Create a Team
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      <section className="px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Recent Matches
          </h2>
          <Link
            href="/matches"
            className="text-indigo-600 font-medium hover:underline"
          >
            See all →
          </Link>
        </div>

        {loading ? <RecentMatchesSkeleton /> : <div className="grid md:grid-cols-3 gap-8">
            {matches.length > 0 ? (
              matches.map((match) => (
                <div
                  key={match._id}
                  className="flex flex-col justify-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
                >
                  {/* Players row */}
                  <div className="flex items-center justify-between gap-6">
                    {/* Player 1 */}
                    <div className="flex items-center gap-3">
                      {match.participants[0].profileImage ? (
                        <Image
                          src={match.participants[0].profileImage}
                          alt={match.participants[0].username}
                          width={48}
                          height={48}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-lg border border-gray-200 shadow-sm">
                          {match.participants[0].username
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                        {match.participants[0].username}
                      </h3>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                        {match.participants[1].username}
                      </h3>
                      {match.participants[1].profileImage ? (
                        <Image
                          src={match.participants[1].profileImage}
                          alt={match.participants[1].username}
                          width={48}
                          height={48}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-lg border border-gray-200 shadow-sm">
                          {match.participants[1].username
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score + Time */}
                  <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
                    <p className="text-lg font-bold text-gray-900">
                      {match.finalScore.side1Sets} -{" "}
                      {match.finalScore.side2Sets}
                    </p>
                    <p className="text-sm text-gray-500">
                      {timeAgo(match.updatedAt!)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent matches available.</p>
            )}
          </div>
        }
      </section>
    </div>
  );
}
