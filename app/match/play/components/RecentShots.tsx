"use client";
import { Clock } from "lucide-react";
import { useTennisStore } from "@/hooks/useTennisStore";
import { RecentShot } from "../../play/types";

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(timestamp).toLocaleTimeString();
};

export default function RecentShots() {

  const recentShots = useTennisStore((s) => s.recentShots);
  const players = useTennisStore((s) => s.players);
  const playerOrder = useTennisStore((s) => s.playerOrder);
  const category = useTennisStore((s) => s.category);

  if (!recentShots || recentShots.length === 0) return null;

  const isDoubles = category === "doubles";
  const team1Ids = playerOrder?.length === 4 ? [playerOrder[0], playerOrder[2]] : [playerOrder?.[0]];
  
  return (
    <div className="mb-6 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-gray-800">Recent Shots</h3>
      </div>
      <div className="space-y-2">
        {recentShots.map((shot, index) => (
          <div
            key={`${shot.timestamp}-${index}`}
            className={`flex items-center justify-between p-2 rounded border-l-4 ${
              index === 0 ? "bg-blue-50 border-blue-400" : "bg-white border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${
                team1Ids?.some(id => id === shot.playerId) ? "text-emerald-600" : "text-red-600"
              }`}>
                {shot.playerName}
              </span>
              <span className="text-gray-600">•</span>
              <span className="font-semibold text-xs text-gray-800">{shot.shotName}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Game {shot.gameNumber}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(shot.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
