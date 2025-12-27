// app/api/profile/shots-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { analyzeShotPlacement } from "@/lib/shot-commentary-utils";
import type { Side } from "@/types/shot.type";
import { requireFeature } from "@/lib/middleware/subscription";

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // TEMPORARILY DISABLED: Subscription check for frontend development
    // const featureCheck = await requireFeature(request, "shotAnalysisAccess");
    // if (!featureCheck.allowed) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "This feature requires a Pro subscription",
    //       error: "UPGRADE_REQUIRED",
    //       tier: featureCheck.subscription?.tier || "free",
    //     },
    //     { status: 403 }
    //   );
    // }

    // Normalize landing coordinates to side1 perspective (left side player)
    // This ensures all shots are shown from a consistent perspective
    // If player was on side2 (right), flip the X coordinate
    function normalizeLandingX(landingX: number, side: string | undefined): number {
      if (!side) return landingX;
      // Normalize to side1 perspective: if on side2, flip X coordinate
      return side === "side2" || side === "team2" ? 100 - landingX : landingX;
    }

    // Fetch all completed matches
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    }).lean();

    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    }).lean();

    // Initialize shot type distribution
    const shotTypeDistribution: Record<string, number> = {
      forehand_drive: 0,
      backhand_drive: 0,
      forehand_topspin: 0,
      backhand_topspin: 0,
      forehand_loop: 0,
      backhand_loop: 0,
      forehand_smash: 0,
      backhand_smash: 0,
      forehand_push: 0,
      backhand_push: 0,
      forehand_chop: 0,
      backhand_chop: 0,
      forehand_flick: 0,
      backhand_flick: 0,
      forehand_block: 0,
      backhand_block: 0,
      forehand_drop: 0,
      backhand_drop: 0,
      net_point: 0,
      serve_point: 0,
    };

    // Track which serve types fetched points for this user
    const serveTypeDistribution: Record<string, number> = {
      side_spin: 0,
      top_spin: 0,
      back_spin: 0,
      mix_spin: 0,
      no_spin: 0,
    };

    // Heatmap data - divide table into zones (10x10 grid)
    // Track both total count and shot types per zone
    const heatmapZones: number[][] = Array(10).fill(0).map(() => Array(10).fill(0));
    const heatmapShotTypes: Record<string, number>[][] = Array(10).fill(null).map(() =>
      Array(10).fill(null).map(() => ({}))
    );

    // Collect individual shots for wagon wheel visualization
    const allShots: any[] = [];

    // Collect opponent shots (where opponents scored against user)
    const opponentShots: any[] = [];

    // Zone/Sector/Line statistics for user shots
    const userZoneStats: Record<string, number> = { short: 0, mid: 0, deep: 0 };
    const userSectorStats: Record<string, number> = { backhand: 0, crossover: 0, forehand: 0 };
    const userLineStats: Record<string, number> = { "down the line": 0, diagonal: 0, "cross court": 0, "middle line": 0 };
    const userOriginZoneStats: Record<string, number> = { "close-to-table": 0, "mid-distance": 0, "far-distance": 0 };

    // Zone/Sector/Line statistics for opponent shots (defensive weaknesses)
    const opponentZoneStats: Record<string, number> = { short: 0, mid: 0, deep: 0 };
    const opponentSectorStats: Record<string, number> = { backhand: 0, crossover: 0, forehand: 0 };
    const opponentLineStats: Record<string, number> = { "down the line": 0, diagonal: 0, "cross court": 0, "middle line": 0 };

    // Process individual matches
    individualMatches.forEach((match: any) => {
      // Determine user's side in this match
      const userSide = match.participants.findIndex((p: any) => p.toString() === userId.toString()) === 0 ? "side1" : "side2";

      match.games?.forEach((game: any) => {
        game.shots?.forEach((shot: any) => {
          if (shot.player?.toString() === userId) {
            // Count shot types
            if (shot.stroke && shotTypeDistribution.hasOwnProperty(shot.stroke)) {
              shotTypeDistribution[shot.stroke]++;
            }

            // If this was a serve point and serveType is present, track it
            if (shot.stroke === "serve_point" && shot.serveType && serveTypeDistribution.hasOwnProperty(shot.serveType)) {
              serveTypeDistribution[shot.serveType]++;
            }

            // Add to heatmap if landing coordinates exist
            if (shot.landingX !== undefined && shot.landingY !== undefined) {
              // Normalize coordinates to side1 perspective
              const normalizedX = normalizeLandingX(shot.landingX, shot.side);
              const zoneX = Math.min(Math.floor(normalizedX / 10), 9);
              const zoneY = Math.min(Math.floor(shot.landingY / 10), 9);
              heatmapZones[zoneY][zoneX]++;

              // Track shot type for this zone
              if (shot.stroke) {
                heatmapShotTypes[zoneY][zoneX][shot.stroke] =
                  (heatmapShotTypes[zoneY][zoneX][shot.stroke] || 0) + 1;
              }

              // Collect individual shot for wagon wheel
              if (shot.originX !== undefined && shot.originY !== undefined) {
                const shotData = {
                  originX: shot.side === "side2" ? 100 - shot.originX : shot.originX,
                  originY: shot.originY,
                  landingX: normalizedX,
                  landingY: shot.landingY,
                  stroke: shot.stroke,
                  player: shot.player,
                  side: shot.side,
                };
                allShots.push(shotData);

                // Analyze shot placement for statistics
                const analysis = analyzeShotPlacement(shotData);
                if (analysis.zone) userZoneStats[analysis.zone]++;
                if (analysis.sector) userSectorStats[analysis.sector]++;
                if (analysis.line) userLineStats[analysis.line]++;
                if (analysis.originZone) userOriginZoneStats[analysis.originZone]++;
              }
            }
          } else if (shot.player?.toString() !== userId) {
            // This is an opponent's shot that scored
            if (shot.landingX !== undefined && shot.landingY !== undefined &&
                shot.originX !== undefined && shot.originY !== undefined) {
              // Normalize to user's defensive perspective
              // If user was on side2, opponent was on side1, so flip coordinates
              const normalizedOriginX = userSide === "side2" ? 100 - shot.originX : shot.originX;
              const normalizedLandingX = userSide === "side2" ? 100 - shot.landingX : shot.landingX;

              const opponentShotData = {
                originX: normalizedOriginX,
                originY: shot.originY,
                landingX: normalizedLandingX,
                landingY: shot.landingY,
                stroke: shot.stroke,
                player: shot.player,
                side: (userSide === "side1" ? "side2" : "side1") as Side, // Opponent's side
              };
              opponentShots.push(opponentShotData);

              // Analyze opponent shot placement for defensive weaknesses
              const analysis = analyzeShotPlacement(opponentShotData, userSide);
              if (analysis.zone) opponentZoneStats[analysis.zone]++;
              if (analysis.sector) opponentSectorStats[analysis.sector]++;
              if (analysis.line) opponentLineStats[analysis.line]++;
            }
          }
        });
      });
    });

    // Process team matches
    teamMatches.forEach((match: any) => {
      match.subMatches?.forEach((sub: any) => {
        const playerIds = [
          ...(Array.isArray(sub.playerTeam1) ? sub.playerTeam1 : [sub.playerTeam1]),
          ...(Array.isArray(sub.playerTeam2) ? sub.playerTeam2 : [sub.playerTeam2]),
        ].map((p: any) => p.toString());

        if (playerIds.includes(userId.toString())) {
          // Determine user's side in this submatch
          const userInTeam1 = Array.isArray(sub.playerTeam1)
            ? sub.playerTeam1.some((p: any) => p.toString() === userId.toString())
            : sub.playerTeam1?.toString() === userId.toString();
          const userSide = userInTeam1 ? "team1" : "team2";

          sub.games?.forEach((game: any) => {
            game.shots?.forEach((shot: any) => {
              if (shot.player?.toString() === userId) {
                // Count shot types
                if (shot.stroke && shotTypeDistribution.hasOwnProperty(shot.stroke)) {
                  shotTypeDistribution[shot.stroke]++;
                }

                // Add to heatmap
                if (shot.landingX !== undefined && shot.landingY !== undefined) {
                  // Normalize coordinates to side1 perspective
                  // Use shot.side if available, otherwise determine from subMatch structure
                  let shotSide = shot.side;
                  if (!shotSide) {
                    shotSide = userSide;
                  }
                  const normalizedX = normalizeLandingX(shot.landingX, shotSide);
                  const zoneX = Math.min(Math.floor(normalizedX / 10), 9);
                  const zoneY = Math.min(Math.floor(shot.landingY / 10), 9);
                  heatmapZones[zoneY][zoneX]++;

                  // Track shot type for this zone
                  if (shot.stroke) {
                    heatmapShotTypes[zoneY][zoneX][shot.stroke] =
                      (heatmapShotTypes[zoneY][zoneX][shot.stroke] || 0) + 1;
                  }

                  // Collect individual shot for wagon wheel
                  if (shot.originX !== undefined && shot.originY !== undefined) {
                    const normalizedOriginX = shotSide === "side2" || shotSide === "team2"
                      ? 100 - shot.originX
                      : shot.originX;
                    const shotData = {
                      originX: normalizedOriginX,
                      originY: shot.originY,
                      landingX: normalizedX,
                      landingY: shot.landingY,
                      stroke: shot.stroke,
                      player: shot.player,
                      side: shotSide,
                    };
                    allShots.push(shotData);

                    // Analyze shot placement for statistics
                    const analysis = analyzeShotPlacement(shotData);
                    if (analysis.zone) userZoneStats[analysis.zone]++;
                    if (analysis.sector) userSectorStats[analysis.sector]++;
                    if (analysis.line) userLineStats[analysis.line]++;
                    if (analysis.originZone) userOriginZoneStats[analysis.originZone]++;
                  }
                }
              } else if (shot.player?.toString() !== userId) {
                // This is an opponent's shot that scored
                if (shot.landingX !== undefined && shot.landingY !== undefined &&
                    shot.originX !== undefined && shot.originY !== undefined) {
                  // Normalize to user's defensive perspective
                  let shotSide = shot.side;
                  if (!shotSide) {
                    shotSide = userSide;
                  }
                  // If user was on team2, opponent was on team1, so flip coordinates
                  const normalizedOriginX = userSide === "team2" ? 100 - shot.originX : shot.originX;
                  const normalizedLandingX = userSide === "team2" ? 100 - shot.landingX : shot.landingX;

                  const opponentShotData = {
                    originX: normalizedOriginX,
                    originY: shot.originY,
                    landingX: normalizedLandingX,
                    landingY: shot.landingY,
                    stroke: shot.stroke,
                    player: shot.player,
                    side: (userSide === "team1" ? "team2" : "team1") as Side, // Opponent's side
                  };
                  opponentShots.push(opponentShotData);

                  // Analyze opponent shot placement for defensive weaknesses
                  const analysis = analyzeShotPlacement(opponentShotData, userSide);
                  if (analysis.zone) opponentZoneStats[analysis.zone]++;
                  if (analysis.sector) opponentSectorStats[analysis.sector]++;
                  if (analysis.line) opponentLineStats[analysis.line]++;
                }
              }
            });
          });
        }
      });
    });

    // Calculate dominant shot type for each zone
    const heatmapWithDominant = heatmapZones.map((row, y) =>
      row.map((count, x) => {
        const shotTypes = heatmapShotTypes[y][x];
        let dominantStroke: string | null = null;
        let maxCount = 0;
        
        for (const [stroke, strokeCount] of Object.entries(shotTypes)) {
          if (strokeCount > maxCount) {
            maxCount = strokeCount;
            dominantStroke = stroke;
          }
        }
        
        return {
          count,
          dominantStroke,
          shotTypes, // Include full breakdown for tooltip
        };
      })
    );

    // Convert shot distribution to array format for charts
    const shotDistributionArray = Object.entries(shotTypeDistribution)
      .filter(([_, count]) => count > 0)
      .map(([stroke, count]) => ({
        stroke, // Include original stroke key for color lookup
        name: stroke.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Convert heatmap to format suitable for visualization
    const heatmapData = heatmapZones.flatMap((row, y) =>
      row.map((value, x) => ({
        x: x * 10 + 5, // Center of zone
        y: y * 10 + 5, // Center of zone
        value,
      }))
    ).filter(zone => zone.value > 0);

    return NextResponse.json({
      success: true,
      data: {
        shotDistribution: shotDistributionArray,
        heatmap: heatmapData,
        heatmapGrid: heatmapWithDominant, // Grid with dominant shot type and count
        serveTypeDistribution: serveTypeDistribution,
        allShots, // Individual shots for wagon wheel visualization
        opponentShots, // Opponent shots that scored against user
        // Zone/Sector/Line statistics
        userZoneStats,
        userSectorStats,
        userLineStats,
        userOriginZoneStats,
        opponentZoneStats,
        opponentSectorStats,
        opponentLineStats,
      },
    });
  } catch (error) {
    console.error("Shots analysis error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
