"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Swords, TrendingUp, TrendingDown, Minus, User, MoveLeft, Loader2 } from "lucide-react";
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
    if (wins > losses) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (wins < losses) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getRecordBorderColor = (wins: number, losses: number) => {
    if (wins > losses) return "border-l-green-500";
    if (wins < losses) return "border-l-red-500";
    return "border-l-gray-400";
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-green-600";
    if (winRate >= 40) return "text-gray-700";
    return "text-red-600";
  };

  // Calculate summary stats
  const totalOpponents = headToHead.length;
  const dominantRecord = headToHead.filter((h) => h.wins > h.losses).length;
  const evenRecord = headToHead.filter((h) => h.wins === h.losses).length;
  const losingRecord = headToHead.filter((h) => h.wins < h.losses).length;

  return (
    <div className="min-h-[calc(100vh-65px)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-sm flex items-center gap-2 font-bold text-gray-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 p-1 border-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoveLeft className="size-4" />
            </button>
            <span>Head to Head</span>
          </h1>
          <p className="text-xs mt-2 text-gray-600">
            Your matchup records against individual opponents
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
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
          <div className="space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-blue-500 tracking-wide">
                    Total Opponents
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{totalOpponents}</p>
                <p className="text-xs text-gray-500 mt-1">Unique players faced</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-green-500 tracking-wide">
                    Winning Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{dominantRecord}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalOpponents > 0 ? ((dominantRecord / totalOpponents) * 100).toFixed(0) : 0}% of opponents
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 tracking-wide">
                    Even Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{evenRecord}</p>
                <p className="text-xs text-gray-500 mt-1">Tied matchups</p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold text-red-500 tracking-wide">
                    Losing Records
                  </h3>
                </div>
                <p className="text-xl font-bold text-gray-700">{losingRecord}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalOpponents > 0 ? ((losingRecord / totalOpponents) * 100).toFixed(0) : 0}% of opponents
                </p>
              </div>
            </div>

            {/* Matchup List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Opponent Records</h3>
                <p className="text-xs text-gray-500 mt-1">Sorted by most matches played</p>
              </div>

              <div className="divide-y divide-gray-100">
                {headToHead.map((record, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/profile/${record.opponent._id}`)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getRecordBorderColor(record.wins, record.losses)}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Opponent Info */}
                      <div className="flex items-center gap-3 flex-1">
                        {/* Avatar */}
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {record.opponent.profileImage ? (
                            <Image
                              src={record.opponent.profileImage}
                              alt={record.opponent.fullName || record.opponent.username}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                              {(record.opponent.fullName?.[0] || record.opponent.username?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name and username */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm truncate">
                            {record.opponent.fullName || record.opponent.username}
                          </h4>
                          {record.opponent.fullName && (
                            <p className="text-xs text-gray-500 truncate">@{record.opponent.username}</p>
                          )}
                        </div>

                        {/* Record Icon */}
                        <div>{getRecordIcon(record.wins, record.losses)}</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Record</p>
                          <p className="text-sm font-bold text-gray-800">
                            {record.wins}-{record.losses}
                          </p>
                        </div>

                        <div className="min-w-[60px]">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Win Rate</p>
                          <p className={`text-sm font-bold ${getWinRateColor(parseFloat(record.winRate))}`}>
                            {record.winRate}%
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Matches</p>
                          <p className="text-sm font-bold text-gray-800">{record.total}</p>
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
