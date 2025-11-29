// app/api/profile/shots-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";

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

    // Heatmap data - divide table into zones (10x10 grid)
    // Track both total count and shot types per zone
    const heatmapZones: number[][] = Array(10).fill(0).map(() => Array(10).fill(0));
    const heatmapShotTypes: Record<string, number>[][] = Array(10).fill(null).map(() => 
      Array(10).fill(null).map(() => ({}))
    );

    // Process individual matches
    individualMatches.forEach((match: any) => {
      match.games?.forEach((game: any) => {
        game.shots?.forEach((shot: any) => {
          if (shot.player?.toString() === userId) {
            // Count shot types
            if (shot.stroke && shotTypeDistribution.hasOwnProperty(shot.stroke)) {
              shotTypeDistribution[shot.stroke]++;
            }

            // Add to heatmap if landing coordinates exist
            if (shot.landingX !== undefined && shot.landingY !== undefined) {
              const zoneX = Math.min(Math.floor(shot.landingX / 10), 9);
              const zoneY = Math.min(Math.floor(shot.landingY / 10), 9);
              heatmapZones[zoneY][zoneX]++;
              
              // Track shot type for this zone
              if (shot.stroke) {
                heatmapShotTypes[zoneY][zoneX][shot.stroke] = 
                  (heatmapShotTypes[zoneY][zoneX][shot.stroke] || 0) + 1;
              }
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
          sub.games?.forEach((game: any) => {
            game.shots?.forEach((shot: any) => {
              if (shot.player?.toString() === userId) {
                // Count shot types
                if (shot.stroke && shotTypeDistribution.hasOwnProperty(shot.stroke)) {
                  shotTypeDistribution[shot.stroke]++;
                }

                // Add to heatmap
                if (shot.landingX !== undefined && shot.landingY !== undefined) {
                  const zoneX = Math.min(Math.floor(shot.landingX / 10), 9);
                  const zoneY = Math.min(Math.floor(shot.landingY / 10), 9);
                  heatmapZones[zoneY][zoneX]++;
                  
                  // Track shot type for this zone
                  if (shot.stroke) {
                    heatmapShotTypes[zoneY][zoneX][shot.stroke] = 
                      (heatmapShotTypes[zoneY][zoneX][shot.stroke] || 0) + 1;
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
      },
    });
  } catch (error) {
    console.error("Shots analysis error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
