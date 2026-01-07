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

    // Get userId from query parameter if viewing another user's profile, otherwise use authenticated user
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId") || decoded.userId;
    
    // Use targetUserId for fetching matches, but keep decoded.userId for authentication
    const userId = targetUserId;

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

    // Fetch all completed matches (no limit - get all matches)
    const individualMatches = await IndividualMatch.find({
      participants: userId,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": userId },
        { "team2.players.user": userId },
      ],
    })
      .populate("team1.players.user", "username fullName profileImage")
      .populate("team2.players.user", "username fullName profileImage")
      .lean();

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

    // Heatmap data - divide table into zones (20x9 grid matching zone-sector analysis)
    // X-axis: 20 columns (5% width each) aligned with zone boundaries:
    //   - Columns 0-4 (0-25%): Left Deep
    //   - Columns 5-7 (25-40%): Left Mid
    //   - Columns 8-9 (40-50%): Left Short
    //   - Columns 10-11 (50-60%): Right Short
    //   - Columns 12-14 (60-75%): Right Mid
    //   - Columns 15-19 (75-100%): Right Deep
    // Y-axis: 9 rows (~11.11% height each) aligned with sector boundaries:
    //   - Rows 0-2 (0-33.33%): Top/Backhand
    //   - Rows 3-5 (33.33-66.67%): Middle/Crossover
    //   - Rows 6-8 (66.67-100%): Bottom/Forehand
    const GRID_COLS = 20;
    const GRID_ROWS = 9;
    const heatmapZones: number[][] = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));
    const heatmapShotTypes: Record<string, number>[][] = Array(GRID_ROWS).fill(null).map(() =>
      Array(GRID_COLS).fill(null).map(() => ({}))
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
    let totalMatchesProcessed = 0;
    let totalGamesProcessed = 0;
    let totalShotsFound = 0;
    let userShotsFound = 0;

    individualMatches.forEach((match: any) => {
      totalMatchesProcessed++;
      // Determine user's side in this match
      const userSide = match.participants.findIndex((p: any) => p.toString() === userId.toString()) === 0 ? "side1" : "side2";

      match.games?.forEach((game: any) => {
        if (game.shots && game.shots.length > 0) {
          totalGamesProcessed++;
        }
        game.shots?.forEach((shot: any) => {
          totalShotsFound++;
          // Compare player IDs - handle both ObjectId and string formats
          const shotPlayerId = shot.player?.toString();
          const userIdStr = userId.toString();
          
          if (shotPlayerId === userIdStr) {
            userShotsFound++;
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
              // X: 20 columns, 5% width each
              const zoneX = Math.min(GRID_COLS - 1, Math.floor(normalizedX / 5));
              // Y: 9 rows, ~11.11% height each
              const zoneY = Math.min(GRID_ROWS - 1, Math.floor(shot.landingY / (100 / GRID_ROWS)));
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
          } else {
            // This is an opponent's shot that scored
            const shotPlayerId = shot.player?.toString();
            const userIdStr = userId.toString();
            
            if (shotPlayerId && shotPlayerId !== userIdStr) {
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
          }
        });
      });
    });

    // Log processing stats
    console.log(`[Shots Analysis] Processed ${totalMatchesProcessed} individual matches, ${totalGamesProcessed} games, ${totalShotsFound} total shots, ${userShotsFound} user shots`);

    // Process team matches
    let teamMatchesProcessed = 0;
    let teamGamesProcessed = 0;
    let teamShotsFound = 0;
    let teamUserShotsFound = 0;

    teamMatches.forEach((match: any) => {
      teamMatchesProcessed++;
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
            if (game.shots && game.shots.length > 0) {
              teamGamesProcessed++;
            }
            game.shots?.forEach((shot: any) => {
              teamShotsFound++;
              // Compare player IDs - handle both ObjectId and string formats
              const shotPlayerId = shot.player?.toString();
              const userIdStr = userId.toString();
              
              if (shotPlayerId === userIdStr) {
                teamUserShotsFound++;
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
                  // X: 20 columns, 5% width each
                  const zoneX = Math.min(GRID_COLS - 1, Math.floor(normalizedX / 5));
                  // Y: 9 rows, ~11.11% height each
                  const zoneY = Math.min(GRID_ROWS - 1, Math.floor(shot.landingY / (100 / GRID_ROWS)));
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
              } else {
                // This is an opponent's shot that scored
                const shotPlayerId = shot.player?.toString();
                const userIdStr = userId.toString();
                
                if (shotPlayerId && shotPlayerId !== userIdStr) {
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

    // Log final stats
    console.log(`[Shots Analysis] Team matches: ${teamMatchesProcessed} matches, ${teamGamesProcessed} games, ${teamShotsFound} total shots, ${teamUserShotsFound} user shots`);
    console.log(`[Shots Analysis] Shot type distribution:`, shotTypeDistribution);
    console.log(`[Shots Analysis] Total shots collected: ${allShots.length} user shots, ${opponentShots.length} opponent shots`);

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
        x: x * 5 + 2.5, // Center of zone (5% width each)
        y: y * (100 / GRID_ROWS) + (100 / GRID_ROWS) / 2, // Center of zone
        value,
      }))
    ).filter(zone => zone.value > 0);

    const responseData = {
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
    };

    console.log(`[Shots Analysis] Returning data with ${shotDistributionArray.length} shot types, ${allShots.length} user shots, ${opponentShots.length} opponent shots`);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Shots analysis error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
