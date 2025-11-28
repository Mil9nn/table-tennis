"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  ArrowLeft,
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const HeadToHeadPage = () => {
  const router = useRouter();
  const [headToHead, setHeadToHead] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHeadToHead = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setHeadToHead(response.data.stats.headToHead || []);
      } catch (error) {
        console.error("Failed to fetch head to head:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadToHead();
  }, []);

  const getRecordIcon = (wins: number, losses: number) => {
    if (wins > losses) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (wins < losses) {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getRecordColor = (wins: number, losses: number) => {
    if (wins > losses) {
      return "bg-green-50 border-green-200";
    } else if (wins < losses) {
      return "bg-red-50 border-red-200";
    }
    return "bg-gray-50 border-gray-200";
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-green-700";
    if (winRate >= 40) return "text-gray-700";
    return "text-red-700";
  };

  // Calculate summary stats
  const totalOpponents = headToHead.length;
  const dominantRecord = headToHead.filter((h) => h.wins > h.losses).length;
  const evenRecord = headToHead.filter((h) => h.wins === h.losses).length;
  const losingRecord = headToHead.filter((h) => h.wins < h.losses).length;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Head to Head</h1>
          <p className="text-gray-600 mt-2">
            Your matchup records against individual opponents
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : headToHead.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Head-to-Head Data
            </h3>
            <p className="text-gray-600">
              Play matches to build your head-to-head records!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Total Opponents
                  </h3>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {totalOpponents}
                </p>
                <p className="text-xs text-blue-600 mt-1">Unique players faced</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">
                    Winning Records
                  </h3>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {dominantRecord}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {totalOpponents > 0
                    ? ((dominantRecord / totalOpponents) * 100).toFixed(0)
                    : 0}
                  % of opponents
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Minus className="w-5 h-5 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Even Records
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-700">{evenRecord}</p>
                <p className="text-xs text-gray-600 mt-1">Tied matchups</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-900">
                    Losing Records
                  </h3>
                </div>
                <p className="text-3xl font-bold text-red-700">{losingRecord}</p>
                <p className="text-xs text-red-600 mt-1">
                  {totalOpponents > 0
                    ? ((losingRecord / totalOpponents) * 100).toFixed(0)
                    : 0}
                  % of opponents
                </p>
              </div>
            </div>

            {/* Matchup List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Opponent Records
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sorted by most matches played
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {headToHead.map((record, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      router.push(`/profile/${record.opponent._id}`)
                    }
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getRecordColor(
                      record.wins,
                      record.losses
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Opponent Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {record.opponent.profileImage ? (
                            <Image
                              src={record.opponent.profileImage}
                              alt={
                                record.opponent.fullName ||
                                record.opponent.username
                              }
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                              {(
                                record.opponent.fullName?.[0] ||
                                record.opponent.username?.[0] ||
                                "?"
                              ).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name and username */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {record.opponent.fullName ||
                              record.opponent.username}
                          </h4>
                          {record.opponent.fullName && (
                            <p className="text-sm text-gray-500">
                              @{record.opponent.username}
                            </p>
                          )}
                        </div>

                        {/* Record Icon */}
                        <div>{getRecordIcon(record.wins, record.losses)}</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        {/* W-L Record */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Record</p>
                          <p className="text-lg font-bold text-gray-800">
                            {record.wins}-{record.losses}
                          </p>
                        </div>

                        {/* Win Rate */}
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm text-gray-500">Win Rate</p>
                          <p
                            className={`text-lg font-bold ${getWinRateColor(
                              parseFloat(record.winRate)
                            )}`}
                          >
                            {record.winRate}%
                          </p>
                        </div>

                        {/* Total Matches */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Matches</p>
                          <p className="text-lg font-bold text-gray-800">
                            {record.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadToHeadPage;
