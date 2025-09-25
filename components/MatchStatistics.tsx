"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { axiosInstance } from "@/lib/axiosInstance";

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
      const response = await axiosInstance.get(`/matches/individual/${matchId}/stats`);
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

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Match Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalGames || 0}</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalShots || 0}</div>
              <div className="text-sm text-gray-600">Total Shots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalRallies || 0}</div>
              <div className="text-sm text-gray-600">Total Rallies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageRallyLength || 0}</div>
              <div className="text-sm text-gray-600">Avg Rally Length</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.playerStats && (
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.playerStats).map(([playerId, playerStat]: [string, any]) => (
                <div key={playerId} className="border rounded-lg p-4">
                  <div className="font-semibold mb-2">Player {playerId}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Badge variant="outline">Winners: {playerStat.winners || 0}</Badge>
                    </div>
                    <div>
                      <Badge variant="outline">Errors: {playerStat.unforcedErrors || 0}</Badge>
                    </div>
                    <div>
                      <Badge variant="outline">Aces: {playerStat.aces || 0}</Badge>
                    </div>
                    <div>
                      <Badge variant="outline">Total Shots: {playerStat.totalShots || 0}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}