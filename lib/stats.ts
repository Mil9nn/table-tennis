// lib/stats.ts
import Match from "@/models/Match";
import dbConnect from "./db";

export async function computeMatchStats(matchId: string) {
  await dbConnect();
  const match = await Match.findById(matchId).lean();
  if (!match) throw new Error("not found");

  // Basic tallies:
  const playerTotals: Record<string, { points: number; winningShots: Record<string, number>; totalShots: number }> = {};

  for (const g of match.games || []) {
    for (const p of g.points || []) {
      const scorer = p.scorerId;
      playerTotals[scorer] = playerTotals[scorer] || { points: 0, winningShots: {}, totalShots: 0 };
      playerTotals[scorer].points += 1;

      if (p.shots && p.shots.length) {
        const lastShot = p.shots[p.shots.length - 1].shotName || "unknown";
        playerTotals[scorer].winningShots[lastShot] = (playerTotals[scorer].winningShots[lastShot] || 0) + 1;
        playerTotals[scorer].totalShots += p.shots.length;
      }
      // count shots played by other players (optionally)
      for (const s of p.shots || []) {
        for (const pl of s.playerWhoPlayed || []) {
          playerTotals[pl] = playerTotals[pl] || { points: 0, winningShots: {}, totalShots: 0 };
          playerTotals[pl].totalShots += 1;
        }
      }
    }
  }

  // Convert to sorted arrays, etc.
  return { playerTotals };
}
