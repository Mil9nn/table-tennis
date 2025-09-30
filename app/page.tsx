"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { timeAgo } from "@/lib/utils";
import { IndividualMatch } from "@/types/match.type";

export default function HomePage() {
  const [matches, setMatches] = useState<IndividualMatch[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // get only 02 recent matches
        const response = await axiosInstance.get("/matches/individual?limit=2");
        setMatches(response.data.matches);
      } catch (error) {
        console.error("Error fetching recent matches:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-12">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl overflow-hidden">
        <div className="max-w-2xl z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            Quick Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-100">
            Track scores, manage matches, and share results instantly with a
            sleek and easy-to-use interface.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/match/create"
              className="px-6 py-3 rounded-full bg-white text-indigo-600 font-semibold shadow hover:scale-105 active:scale-95 transition"
            >
              Create a Match
            </Link>
            <Link
              href="/teams/create"
              className="px-6 py-3 rounded-full bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 hover:scale-105 active:scale-95 transition"
            >
              Create a Team
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      <section className="px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Recent Matches
          </h2>
          <Link
            href="/matches"
            className="text-indigo-600 font-medium hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {matches.length > 0 ? (
            matches.map((match) => (
              <div
                key={match._id}
                className="flex flex-col justify-center p-6 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100"
              >
                {/* Players row */}
                <div className="flex items-center gap-4">
                  {/* Player 1 */}
                  <div className="flex items-center gap-1">
                    <h3 className="font-medium text-gray-700 text-sm">
                      {match.participants[0].username}
                    </h3>
                    {match.participants[0].profileImage ? (
                      <img
                        src={match.participants[0].profileImage}
                        alt={match.participants[0].username}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-lg border border-gray-300 shadow-sm">
                        {match.participants[0].username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="flex items-center gap-1">
                    {match.participants[1].profileImage ? (
                      <img
                        src={match.participants[1].profileImage}
                        alt={match.participants[1].username}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-lg border border-gray-300 shadow-sm">
                        {match.participants[1].username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="font-medium text-gray-700 text-sm">
                      {match.participants[1].username}
                    </h3>
                  </div>
                </div>

                {/* Score + Time */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-gray-800">
                    Final Score: {match.finalScore.side1Sets} -{" "}
                    {match.finalScore.side2Sets}
                  </p>
                  <p className="text-sm text-gray-500 text-right">
                    {timeAgo(new Date(match.updatedAt!).toLocaleString())}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent matches available.</p>
          )}
        </div>
      </section>

      {/* Teams Section */}
      <section className="px-8 py-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Teams
          </h2>
          <Link
            href="/teams"
            className="text-indigo-600 font-medium hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Example placeholder team cards */}
          {[1, 2].map((team) => (
            <div
              key={team}
              className="flex items-center justify-between p-6 bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-700">
                  Team {team}
                </h3>
                <p className="text-gray-500 text-sm">2 Players</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                Active
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
