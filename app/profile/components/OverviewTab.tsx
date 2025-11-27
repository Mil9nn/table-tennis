"use client";

import StatsCards from "./StatsCards";
import RecentMatches from "./RecentMatches";
import HeadToHead from "./HeadToHead";
import { Flame } from "lucide-react";

interface OverviewTabProps {
  detailedStats: any;
}

const OverviewTab = ({ detailedStats }: OverviewTabProps) => {
  const isLoss = detailedStats?.overall?.currentStreak.type == "loss";

  return (
    <div>
      <section className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Streaks</h2>
        <div className="grid grid-cols-3 gap-2">
          {detailedStats?.overall?.currentStreak && (
            <div
              className={`bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] rounded-xl p-4 ${
                isLoss ? "bg-gradient-to-r from-[#FFEBEE] to-[#FFCDD2]" : ""
              }`}
            >
              <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                Current
                {detailedStats.overall.currentStreak.type === "win" && (
                  <Flame className="text-orange-500" size={14} />
                )}
              </h3>
              <p
                className={`text-2xl font-black text-[#2E7D32] ${
                  isLoss ? "text-[#C62828]" : ""
                }`}
              >
                {detailedStats.overall.currentStreak.type == "loss" ? (
                  <span>-</span>
                ) : (
                  <span>+</span>
                )}
                {detailedStats.overall.currentStreak.count}{" "}
              </p>
            </div>
          )}

          {detailedStats?.overall?.bestWinStreak !== undefined && (
            <div className="bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-600 mb-2">
                Best Win
              </h3>
              <p className="text-2xl font-black text-[#2E7D32]">
                {detailedStats.overall.bestWinStreak}
              </p>
            </div>
          )}
        </div>
      </section>

      <RecentMatches detailedStats={detailedStats} />
      <HeadToHead detailedStats={detailedStats} />
    </div>
  );
};

export default OverviewTab;
