"use client";

import { Crown, Clock, Trophy, ExternalLink, Users, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { set } from "mongoose";
import { formatDuration } from "@/lib/utils";

const Page = () => {
  const [recentMatches, setRecentMatches] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecentMatches = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.post('/match/save');
        setRecentMatches(response.data);
      } catch (error) {
        console.error("Error fetching recent matches:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [recentMatches]);

  const handleRowClick = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[90vh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recent matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="p-2">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Recent Matches</h1>

        <p className="text-gray-600 my-2">Latest match results - click on any match row to see comprehensive match statistics</p>

        <div className="overflow-x-auto rounded-2xl shadow-xl border bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Match #</th>
                <th className="px-6 py-4 text-left font-semibold">Players</th>
                <th className="px-6 py-4 text-left font-semibold">Winner</th>
                <th className="px-6 py-4 text-left font-semibold">Duration</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Final Score
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Quick Stats
                </th>
              </tr>
            </thead>
            <tbody>
              {recentMatches?.matches.map((match: any, idx: number) => (
                console.log(match),
                <tr
                  key={match._id}
                  className="border-t hover:bg-indigo-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(match.id)}
                >
                  {/* Match Number */}
                  <td className="px-6 py-4 font-bold text-gray-700">
                    <span className="text-lg">#{idx + 1}</span>
                  </td>

                  {/* Players */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {match.player1.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {match.player1.username}
                        </span>
                      </div>
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {match.player2.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {match.player2.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Winner */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {match.winner.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          {match.winner.username}
                          <Crown className="text-yellow-500 w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 font-medium">
                        {formatDuration(match.startTime, match.endTime)}
                      </span>
                    </div>
                  </td>

                  {/* Final Score */}
                  <td className="px-6 py-4 font-bold text-gray-800 text-lg">
                    {match.finalScore || `${match.games.length}-0`}
                  </td>

                  {/* Quick Stats */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Best of {match.bestOf}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{match.stats.totalPoints} pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{match.games.length} games</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {recentMatches?.matches.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No matches found
            </h3>
            <p className="text-gray-500">
              Start playing to see your match history here!
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Click on any match row or "View Details" button to see comprehensive
            match statistics
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
