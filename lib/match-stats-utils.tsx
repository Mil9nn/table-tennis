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

// Achievement detection
export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export function detectAchievements(
  games: any[],
  finalScore: any,
  winnerSide?: string
): Achievement[] {
  const achievements: Achievement[] = [];

  if (!games || games.length === 0) return achievements;

  const side1Sets = finalScore?.side1Sets || finalScore?.team1Matches || 0;
  const side2Sets = finalScore?.side2Sets || finalScore?.team2Matches || 0;
  const totalGames = games.length;

  // Perfect Victory - Won all games
  if (side1Sets === totalGames || side2Sets === totalGames) {
    achievements.push({
      id: "perfect-game",
      icon: "🏆",
      title: "Perfect Victory",
      description: "Won the match without dropping a single game",
    });
  }

  // Epic Comeback - Lost first 2 games but won match
  if (games.length >= 3) {
    const game1Winner =
      games[0].side1Score > games[0].side2Score ? "side1" : "side2";
    const game2Winner =
      games[1].side1Score > games[1].side2Score ? "side1" : "side2";

    const winner = side1Sets > side2Sets ? "side1" : "side2";

    if (
      game1Winner !== winner &&
      game2Winner !== winner &&
      ((winner === "side1" && side1Sets > side2Sets) ||
        (winner === "side2" && side2Sets > side1Sets))
    ) {
      achievements.push({
        id: "comeback",
        icon: "🔥",
        title: "Epic Comeback",
        description: "Won the match after losing the first two games",
      });
    }
  }

  // Clean Sweep - Won all games by 5+ points
  const allGamesWonBy5Plus = games.every((game: any) => {
    const diff = Math.abs(game.side1Score - game.side2Score);
    return diff >= 5;
  });

  if (
    allGamesWonBy5Plus &&
    games.length >= 3 &&
    (side1Sets === totalGames || side2Sets === totalGames)
  ) {
    achievements.push({
      id: "clean-sweep",
      icon: "💪",
      title: "Dominant Performance",
      description: "Won every game by 5 or more points",
    });
  }

  // Close Match - Every game decided by 3 or fewer points
  const allGamesClose = games.every((game: any) => {
    const diff = Math.abs(game.side1Score - game.side2Score);
    return diff <= 3;
  });

  if (allGamesClose && games.length >= 3) {
    achievements.push({
      id: "close-match",
      icon: "⚔️",
      title: "Nail Biter",
      description: "Every game was decided by 3 points or fewer",
    });
  }

  return achievements;
}

// Insight generation
export interface Insight {
  type: "success" | "info" | "warning" | "highlight";
  headline: string;
  description: string;
  metric?: { label: string; value: string | number };
}

export function generatePerformanceInsights(
  shotTypes: Record<string, number>,
  serveStats: Record<string, any>,
  totalShots: number,
  playerNames: string[]
): Insight[] {
  const insights: Insight[] = [];

  // Dominant shot type
  const sortedShots = Object.entries(shotTypes).sort((a, b) => b[1] - a[1]);
  if (sortedShots.length > 0 && sortedShots[0][1] > totalShots * 0.2) {
    const [shotType, count] = sortedShots[0];
    const percentage = Math.round((count / totalShots) * 100);
    const formatStrokeName = (stroke: string) =>
      stroke
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    insights.push({
      type: "success",
      headline: `${formatStrokeName(shotType)} Dominance`,
      description: `This shot type accounted for ${percentage}% of all shots played, making it the most frequently used technique in the match.`,
      metric: { label: "Usage Rate", value: `${percentage}%` },
    });
  }

  // Serve performance
  const serveStatsArray = Object.entries(serveStats);
  if (serveStatsArray.length > 0) {
    const bestServer = serveStatsArray.reduce((best, current) => {
      const currentRate =
        current[1].totalServes > 0
          ? current[1].servePoints / current[1].totalServes
          : 0;
      const bestRate =
        best[1].totalServes > 0 ? best[1].servePoints / best[1].totalServes : 0;
      return currentRate > bestRate ? current : best;
    });

    if (bestServer[1].totalServes > 0) {
      const winRate = Math.round(
        (bestServer[1].servePoints / bestServer[1].totalServes) * 100
      );
      if (winRate >= 60) {
        insights.push({
          type: "highlight",
          headline: "Strong Service Game",
          description: `The server won ${winRate}% of service points, demonstrating excellent serve effectiveness and control.`,
          metric: { label: "Serve Win Rate", value: `${winRate}%` },
        });
      }
    }
  }

  // Shot variety
  const uniqueShotTypes = Object.keys(shotTypes).length;
  if (uniqueShotTypes >= 8) {
    insights.push({
      type: "info",
      headline: "Diverse Shot Selection",
      description: `The match featured ${uniqueShotTypes} different shot types, showcasing tactical variety and adaptability.`,
    });
  }

  return insights;
}

// Performance commentary generation
export function generatePerformanceCommentary(
  shotTypes: Record<string, number>,
  serveStats: Record<string, any>,
  games: any[],
  totalShots: number
): string[] {
  const commentary: string[] = [];
  const formatStrokeName = (stroke: string) =>
    stroke
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Shot analysis
  const sortedShots = Object.entries(shotTypes).sort((a, b) => b[1] - a[1]);
  if (sortedShots.length > 0) {
    const top3 = sortedShots.slice(0, 3);
    const shotDescriptions = top3
      .map(
        ([type, count]) =>
          `${formatStrokeName(type)} (${Math.round((count / totalShots) * 100)}%)`
      )
      .join(", ");

    commentary.push(
      `The match featured a total of ${totalShots} shots across ${games.length} games. The most frequently used shots were ${shotDescriptions}, indicating the primary tactical approaches employed during the match.`
    );
  }

  // Serve analysis
  const serveStatsArray = Object.entries(serveStats);
  if (serveStatsArray.length > 0) {
    const avgServeWinRate =
      serveStatsArray.reduce((sum, [_, stats]) => {
        return (
          sum +
          (stats.totalServes > 0 ? stats.servePoints / stats.totalServes : 0)
        );
      }, 0) / serveStatsArray.length;

    const serveWinPct = Math.round(avgServeWinRate * 100);

    if (serveWinPct >= 65) {
      commentary.push(
        `Serve performance was exceptional with an average ${serveWinPct}% win rate on service points. This strong serving gave players a significant advantage in controlling rally tempo and dictating play.`
      );
    } else if (serveWinPct >= 50) {
      commentary.push(
        `Service points were won at a ${serveWinPct}% rate, showing balanced serve and receive capabilities from both sides.`
      );
    } else {
      commentary.push(
        `With a ${serveWinPct}% serve win rate, receivers had the advantage in this match, indicating strong return game and defensive skills.`
      );
    }
  }

  // Game progression analysis
  if (games.length > 2) {
    const closeGames = games.filter(
      (g: any) => Math.abs(g.side1Score - g.side2Score) <= 2
    ).length;

    if (closeGames >= games.length * 0.6) {
      commentary.push(
        `The match was highly competitive with ${closeGames} out of ${games.length} games decided by 2 points or fewer, showcasing evenly matched opponents.`
      );
    }
  }

  return commentary;
}

// Calculate total winning shots across all games
export function calculateTotalWinningShots(games: any[]): number {
  let total = 0;

  games.forEach((game) => {
    if (game.shots && Array.isArray(game.shots)) {
      total += game.shots.length;
    }
  });

  return total;
}