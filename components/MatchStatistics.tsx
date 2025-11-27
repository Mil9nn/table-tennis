"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MatchStatisticsProps {
  matchId: string;
}

export default function MatchStatistics({ matchId }: MatchStatisticsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [matchId]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(
        `/matches/individual/${matchId}/stats`
      );
      if (response.status === 200) {
        const data = await response.data;
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No statistics available</div>;
  }

  // Prepare serve vs receive data for chart
  const serveData =
    stats.playerStats &&
    Object.entries(stats.playerStats).map(([playerId, s]: [string, any]) => ({
      player: s.fullName || `Player ${playerId}`,
      Serve: s.servePoints || 0,
      Receive: s.receivePoints || 0,
    }));

  return (
    <div className="container mx-auto space-y-8">
      {/* Match Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Match Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.totalGames || 0}</p>
              <p className="text-sm text-gray-600">Games Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRallies || 0}</p>
              <p className="text-sm text-gray-600">Total Rallies</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.averageRallyLength || 0}
              </p>
              <p className="text-sm text-gray-600">Avg Rally Length</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalShots || 0}</p>
              <p className="text-sm text-gray-600">Total Shots</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Comparison */}
      {stats.playerStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Player Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(stats.playerStats).map(
                ([playerId, s]: [string, any]) => (
                  <div
                    key={playerId}
                    className="p-4 border rounded-xl space-y-3"
                  >
                    <h3 className="font-semibold text-center">
                      {s.fullName || `Player ${playerId}`}
                    </h3>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Serve vs Receive Chart */}
      {serveData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Serve vs Receive Points
            </CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serveData}>
                <XAxis dataKey="player" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Serve" fill="#4ade80" />
                <Bar dataKey="Receive" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}