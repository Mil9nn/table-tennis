import { Shot } from "@/types/shot.type";
import { SHOT_TYPE_COLORS } from "@/constants/constants";

export interface PlayerStatsData {
  name: string;
  strokes: Record<string, number>;
}

// lib/match-stats-utils.ts
export const getShotColor = (shotType: string): string => {
  // Convert formatted names back to keys
  const normalized = shotType.toLowerCase()
    .replace('fh ', 'forehand_')
    .replace('bh ', 'backhand_');
  
  return SHOT_TYPE_COLORS[normalized] || "#6B7280";
};

export function computeStats(shots: Shot[]) {
  const shotTypes: Record<string, number> = {};

  (shots || []).forEach((s) => {
    if (!s) return;
    if (s.stroke) {
      shotTypes[s.stroke] = (shotTypes[s.stroke] || 0) + 1;
    }
  });

  return { shotTypes };
}

export function computePlayerStats(shots: Shot[]): Record<string, PlayerStatsData> {
  const playerStats: Record<string, PlayerStatsData> = {};

  (shots || []).forEach((s) => {
    if (!s || !s.player) return;

    const playerId = s.player._id || s.player.toString();
    const playerName = s.player.fullName || s.player.username || "Unknown";

    if (!playerStats[playerId]) {
      playerStats[playerId] = {
        name: playerName,
        strokes: {},
      };
    }

    if (s.stroke) {
      playerStats[playerId].strokes[s.stroke] =
        (playerStats[playerId].strokes[s.stroke] || 0) + 1;
    }
  });

  return playerStats;
}

export function computeServeStats(games: any[], matchCategory: string) {
  const serveStats: Record<
    string,
    { servePoints: number; receivePoints: number; totalServes: number }
  > = {};

  (games || []).forEach((g) => {
    (g.shots || []).forEach((shot: any) => {
      let pointWinnerId: string | null = null;
      if (typeof shot.player === "string") {
        pointWinnerId = shot.player;
      } else if (shot.player?._id) {
        pointWinnerId = shot.player._id.toString();
      } else if (shot.player) {
        pointWinnerId = shot.player.toString();
      }

      let serverId: string | null = null;
      if (typeof shot.server === "string") {
        serverId = shot.server;
      } else if (shot.server?._id) {
        serverId = shot.server._id.toString();
      } else if (shot.server) {
        serverId = shot.server.toString();
      }

      if (!pointWinnerId || !serverId) return;

      if (!serveStats[serverId]) {
        serveStats[serverId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }

      if (!serveStats[pointWinnerId]) {
        serveStats[pointWinnerId] = {
          servePoints: 0,
          receivePoints: 0,
          totalServes: 0,
        };
      }

      serveStats[serverId].totalServes += 1;

      const isServerWinner = pointWinnerId === serverId;

      if (isServerWinner) {
        serveStats[serverId].servePoints += 1;
      } else {
        serveStats[pointWinnerId].receivePoints += 1;
      }
    });
  });

  return serveStats;
}

export function computeServeTypeStats(games: any[]) {
  // Returns mapping playerId -> { serve: {...} }
  // serve = all serve types used by player when serving (regardless of point outcome)
  const stats: Record<string, { serve: Record<string, number> }> = {};

  const createEmptyStats = () => ({
    serve: { side_spin: 0, top_spin: 0, back_spin: 0, mix_spin: 0, no_spin: 0 },
  });

  (games || []).forEach((g) => {
    (g.shots || []).forEach((shot: any) => {
      if (!shot) return;

      let serverId: string | null = null;
      if (typeof shot.server === "string") {
        serverId = shot.server;
      } else if (shot.server?._id) {
        serverId = shot.server._id.toString();
      } else if (shot.server) {
        serverId = shot.server.toString();
      }

      if (!serverId) return;

      // Ensure server has stats initialized (even if no serveType on this shot)
      if (!stats[serverId]) stats[serverId] = createEmptyStats();

      const st = shot.serveType || null;
      if (!st) return;

      // Count the serve type used by the server
      if (stats[serverId].serve[st] !== undefined) {
        stats[serverId].serve[st] += 1;
      }
    });
  });

  return stats;
}

export const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};