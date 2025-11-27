import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import type { PlayerStats, TeamStats, TournamentPlayerStats, LeaderboardType } from "../types";

interface UseLeaderboardReturn {
  leaderboard: PlayerStats[];
  teamLeaderboard: TeamStats[];
  tournamentLeaderboard: TournamentPlayerStats[];
  loading: boolean;
}

export function useLeaderboard(activeTab: LeaderboardType): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamStats[]>([]);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<TournamentPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "teams") {
          const { data } = await axiosInstance.get("/leaderboard/teams");
          setTeamLeaderboard(data.leaderboard || []);
        } else if (activeTab === "tournaments") {
          const { data } = await axiosInstance.get("/leaderboard/tournaments");
          setTournamentLeaderboard(data.leaderboard || []);
        } else {
          const { data } = await axiosInstance.get(`/leaderboard/unified?type=${activeTab}`);
          setLeaderboard(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        if (activeTab === "teams") {
          setTeamLeaderboard([]);
        } else if (activeTab === "tournaments") {
          setTournamentLeaderboard([]);
        } else {
          setLeaderboard([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return { leaderboard, teamLeaderboard, tournamentLeaderboard, loading };
}
