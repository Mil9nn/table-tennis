import {
    computeStats,
    computePlayerStats,
    computeServeStats,
    computeServeTypeStats,
    detectAchievements,
    generatePerformanceInsights,
    generatePerformanceCommentary,
    calculateTotalWinningShots,
  } from "@/lib/match-stats-utils";
  import { isIndividualMatch, isTeamMatch } from "@/types/match.type";
  import { formatStrokeName } from "@/lib/utils";
  
  export function normalizeMatchStats(match: any) {
    if (isIndividualMatch(match)) {
      const games = match.games || [];
      const shots = games.flatMap((g: any) => g.shots || []);
      const participants = match.participants || [];

      const { shotTypes: rawShotTypes } = computeStats(shots);
      const rawServeStats = computeServeStats(games, match.matchCategory);
      const rawServeTypeStats = computeServeTypeStats(games);
      const rawPlayerStats = computePlayerStats(shots);

      // Transform serveStats from object to array format for ServeReceiveChart
      const serveStats = Object.entries(rawServeStats).map(([playerId, s]: [string, any]) => {
        const player = participants.find(
          (p: any) => p._id?.toString() === playerId || p.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          Serve: s.servePoints || 0,
          Receive: s.receivePoints || 0,
        };
      });

      // Transform serveTypeStats from object to array format
      const serveTypeStats = Object.entries(rawServeTypeStats).map(([playerId, s]: [string, any]) => {
        const player = participants.find(
          (p: any) => p._id?.toString() === playerId || p.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          type: "Serve" as const,
          side_spin: s.serve.side_spin || 0,
          top_spin: s.serve.top_spin || 0,
          back_spin: s.serve.back_spin || 0,
          mix_spin: s.serve.mix_spin || 0,
          no_spin: s.serve.no_spin || 0,
        };
      });

      // Transform shotTypes from object to array format for ShotTypeChart
      const shotTypes = Object.entries(rawShotTypes).map(([type, value]) => ({
        name: formatStrokeName(type),
        value: value as number,
      }));

      // Transform playerStats from object to array format for PlayerShotAnalysis
      const playerStats = Object.entries(rawPlayerStats).map(
        ([playerId, pStats]: [string, any]) => ({
          playerId,
          playerName: pStats.name || "Unknown",
          data: Object.entries(pStats.strokes || {}).map(([stroke, count]) => ({
            name: formatStrokeName(stroke),
            value: count as number,
          })),
        })
      );

      return {
        type: "individual",
        match,
        games,
        shots,
        participants,
        stats: {
          shotTypes,
          serveStats,
          serveTypeStats,
          playerStats,
          achievements: detectAchievements(games, match.finalScore, match.winnerSide as string | undefined),
          insights: generatePerformanceInsights(
            rawShotTypes,
            rawServeStats,
            shots.length,
            participants.map((p: any) => p.fullName || p.username)
          ),
          commentary: generatePerformanceCommentary(
            rawShotTypes,
            rawServeStats,
            games,
            shots.length
          ),
          totalWinningShots: calculateTotalWinningShots(games),
        },
      };
    }
  
    if (isTeamMatch(match)) {
      const games = match.subMatches?.flatMap((sm: any) => sm.games || []) || [];
      const shots = games.flatMap((g: any) => g.shots || []);
      const { shotTypes: rawShotTypes } = computeStats(shots);
      const rawServeStats = computeServeStats(games, match.matchCategory);
      const rawServeTypeStats = computeServeTypeStats(games);
      const rawPlayerStats = computePlayerStats(shots);

      // Extract all participants from subMatches
      const allParticipants: any[] = [];
      (match.subMatches || []).forEach((sm: any) => {
        if (sm.playerTeam1) {
          allParticipants.push(...(Array.isArray(sm.playerTeam1) ? sm.playerTeam1 : [sm.playerTeam1]));
        }
        if (sm.playerTeam2) {
          allParticipants.push(...(Array.isArray(sm.playerTeam2) ? sm.playerTeam2 : [sm.playerTeam2]));
        }
      });

      // Transform serveStats from object to array format for ServeReceiveChart
      const serveStats = Object.entries(rawServeStats).map(([playerId, s]: [string, any]) => {
        const player = allParticipants.find(
          (p: any) => p._id?.toString() === playerId || p.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          Serve: s.servePoints || 0,
          Receive: s.receivePoints || 0,
        };
      });

      // Transform serveTypeStats from object to array format
      const serveTypeStats = Object.entries(rawServeTypeStats).map(([playerId, s]: [string, any]) => {
        const player = allParticipants.find(
          (p: any) => p._id?.toString() === playerId || p.toString() === playerId
        );
        const playerName = player?.fullName || player?.username || "Unknown";
        return {
          player: playerName,
          type: "Serve" as const,
          side_spin: s.serve.side_spin || 0,
          top_spin: s.serve.top_spin || 0,
          back_spin: s.serve.back_spin || 0,
          mix_spin: s.serve.mix_spin || 0,
          no_spin: s.serve.no_spin || 0,
        };
      });

      // Transform shotTypes from object to array format for ShotTypeChart
      const shotTypes = Object.entries(rawShotTypes).map(([type, value]) => ({
        name: formatStrokeName(type),
        value: value as number,
      }));

      // Transform playerStats from object to array format for PlayerShotAnalysis
      const playerStats = Object.entries(rawPlayerStats).map(
        ([playerId, pStats]: [string, any]) => ({
          playerId,
          playerName: pStats.name || "Unknown",
          data: Object.entries(pStats.strokes || {}).map(([stroke, count]) => ({
            name: formatStrokeName(stroke),
            value: count as number,
          })),
        })
      );

      return {
        type: "team",
        match,
        games,
        shots,
        participants: [],
        stats: {
          shotTypes,
          serveStats,
          serveTypeStats,
          playerStats,
          achievements: detectAchievements(games, match.finalScore, undefined),
          insights: [],
          commentary: [],
          totalWinningShots: calculateTotalWinningShots(games),
        },
      };
    }
  
    return null;
  }
  