// components/weaknesses-analysis/ZoneSectorWeaknessTable.tsx

"use client";

import { ZoneSectorWeakness } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

// Helper function to convert absolute sector to relative sector (using side1 as default perspective)
// top → backhand, middle → crossover, bottom → forehand
const getRelativeSectorName = (absoluteSector: "top" | "middle" | "bottom"): "backhand" | "crossover" | "forehand" => {
  if (absoluteSector === "top") return "backhand";
  if (absoluteSector === "middle") return "crossover";
  return "forehand";
};

// Helper function to format zone name with proper capitalization
const formatZoneName = (zone: "short" | "mid" | "deep"): string => {
  if (zone === "mid") return "Mid";
  return zone.charAt(0).toUpperCase() + zone.slice(1);
};

// Helper function to format sector name with proper capitalization
const formatSectorName = (sector: "backhand" | "crossover" | "forehand"): string => {
  if (sector === "crossover") return "Crossover";
  return sector.charAt(0).toUpperCase() + sector.slice(1);
};

// Helper function to format zone-sector label for display
const formatZoneSectorLabel = (zone: "short" | "mid" | "deep", absoluteSector: "top" | "middle" | "bottom"): string => {
  const relativeSector = getRelativeSectorName(absoluteSector);
  return `${formatZoneName(zone)} ${formatSectorName(relativeSector)}`;
};

interface ZoneSectorWeaknessTableProps {
  weaknesses: ZoneSectorWeakness[];
  showAll?: boolean; // Show all 9 or just top vulnerable
  shots?: any[]; // Optional: shots data to show landing positions
  userId?: string; // Optional: user ID to differentiate user vs opponent shots
}

// SVG table coordinates (matching WagonWheel)
const TABLE_X = 182.67;
const TABLE_Y = 101.67;
const TABLE_WIDTH = 182.67;
const TABLE_HEIGHT = 101.67;
const TABLE_CENTER_X = 274; // TABLE_X + TABLE_WIDTH / 2

// Convert landing coordinates (0-100) to SVG coordinates
const landingToSVG = (landingX: number, landingY: number) => {
  const x = TABLE_X + (landingX / 100) * TABLE_WIDTH;
  const y = TABLE_Y + (landingY / 100) * TABLE_HEIGHT;
  return { x, y };
};

export function ZoneSectorWeaknessTable({
  weaknesses,
  showAll = false,
  shots,
  userId,
}: ZoneSectorWeaknessTableProps) {
  // Handle undefined/null weaknesses
  if (!weaknesses || !Array.isArray(weaknesses)) {
    return null;
  }

  // Filter to show only zones with data, or all 9
  const displayWeaknesses = showAll
    ? weaknesses
    : weaknesses.filter((w) => w.totalShots >= 3);

  // Return null if no displayable data
  if (displayWeaknesses.length === 0) {
    return null;
  }

  // Filter and prepare shots for visualization (if provided)
  // Note: Only point-winning shots are stored, so each shot represents a point won
  const userShots: Array<{ x: number; y: number }> = [];
  const opponentShots: Array<{ x: number; y: number }> = [];

  if (shots && userId) {
    const userIdStr = userId.toString();
    shots.forEach((shot: any) => {
      if (shot.landingX == null || shot.landingY == null) return;
      
      // Handle different player ID formats
      const shotPlayerId = shot.player?._id?.toString() || shot.player?.toString() || shot.player;
      const { x, y } = landingToSVG(shot.landingX, shot.landingY);
      
      // Compare as strings to handle ObjectId and string comparisons
      if (shotPlayerId && shotPlayerId.toString() === userIdStr) {
        userShots.push({ x, y });
      } else if (shotPlayerId) {
        // Only add if we have a valid player ID (not null/undefined)
        opponentShots.push({ x, y });
      }
    });
  }

  // Helper to get vulnerability color
  const getVulnerabilityColor = (vulnerability: "high" | "medium" | "low"): string => {
    if (vulnerability === "high") return "bg-red-500/10";
    if (vulnerability === "medium") return "bg-amber-500/10";
    return "bg-[#3c6e71]/10";
  };

  // Helper to get SVG fill color for zones (more visible)
  const getZoneFillColor = (vulnerability: "high" | "medium" | "low"): string => {
    if (vulnerability === "high") return "#ef4444"; // red-500
    if (vulnerability === "medium") return "#f59e0b"; // amber-500
    return "#10b981"; // green-500
  };

  // Get zone X bounds for SVG (mirrored on both sides of table)
  const getZoneXBounds = (zone: "short" | "mid" | "deep", side: "left" | "right") => {
    // Zone percentages based on thresholds in shot-commentary-utils.ts
    if (side === "left") {
      if (zone === "deep") return { x: 0, width: 0.25 }; // 0-25%
      if (zone === "mid") return { x: 0.25, width: 0.15 }; // 25-40%
      return { x: 0.40, width: 0.10 }; // 40-50% (short)
    } else {
      if (zone === "short") return { x: 0.50, width: 0.10 }; // 50-60%
      if (zone === "mid") return { x: 0.60, width: 0.15 }; // 60-75%
      return { x: 0.75, width: 0.25 }; // 75-100% (deep)
    }
  };

  // Helper to get vulnerability text color
  const getVulnerabilityTextColor = (vulnerability: "high" | "medium" | "low"): string => {
    if (vulnerability === "high") return "text-red-600";
    if (vulnerability === "medium") return "text-amber-600";
    return "text-[#3c6e71]";
  };

  // Sort weaknesses for display
  const sortedWeaknesses = [...displayWeaknesses].sort((a, b) => {
    // Sort by total shots (descending), then by win rate (ascending - most vulnerable first)
    if (b.totalShots !== a.totalShots) return b.totalShots - a.totalShots;
    return a.winRate - b.winRate;
  });

  // Helper function to get sector boundaries
  const getSectorBounds = (sector: "top" | "middle" | "bottom") => {
    if (sector === "top") {
      return { y: 0, height: 0.3333 };
    } else if (sector === "middle") {
      return { y: 0.3333, height: 0.3334 };
    } else {
      return { y: 0.6667, height: 0.3333 };
    }
  };

  // Create a set of zones that have user shots (from weaknesses data)
  const zonesWithShots = new Set<string>();
  displayWeaknesses.forEach((w) => {
    if (w.totalShots > 0) {
      zonesWithShots.add(`${w.zone}-${w.sector}`);
    }
  });

  return (
    <section className="bg-white border border-[#d9d9d9] p-4">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-[#353535]">Zone-Sector Analysis</h3>
        <p className="text-xs text-[#d9d9d9]">
          Where points were won/lost - Landing positions on the table
        </p>
      </header>
      <div>
        {/* SVG Table Court - Clean visualization matching WagonWheel */}
        <div className="w-full">
          <svg
            viewBox={`${TABLE_X} ${TABLE_Y} ${TABLE_WIDTH} ${TABLE_HEIGHT}`}
            className="w-full"
            style={{ height: "auto" }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Table surface with white border */}
            <rect
              x={TABLE_X}
              y={TABLE_Y}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="#1a4d8f"
              stroke="#ffffff"
              strokeWidth="3"
            />

            {/* Center line on table (white line for doubles) */}
            <line
              x1={TABLE_CENTER_X}
              y1={TABLE_Y}
              x2={TABLE_CENTER_X}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="white"
              strokeWidth="1"
              opacity="1"
            />

            {/* Net (solid black) */}
            <line
              x1={TABLE_CENTER_X}
              y1={TABLE_Y}
              x2={TABLE_CENTER_X}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#000000"
              strokeWidth="4"
              opacity="1"
            />

            {/* Sector dividing lines (horizontal) - Backhand, Crossover, Forehand */}
            <line
              x1={TABLE_X}
              y1={TABLE_Y + TABLE_HEIGHT * 0.3333}
              x2={TABLE_X + TABLE_WIDTH}
              y2={TABLE_Y + TABLE_HEIGHT * 0.3333}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1={TABLE_X}
              y1={TABLE_Y + TABLE_HEIGHT * 0.6667}
              x2={TABLE_X + TABLE_WIDTH}
              y2={TABLE_Y + TABLE_HEIGHT * 0.6667}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Zone dividing lines (vertical) - Deep, Mid, Short on each side */}
            {/* Left side divisions */}
            <line
              x1={TABLE_X + TABLE_WIDTH * 0.25}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH * 0.25}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1={TABLE_X + TABLE_WIDTH * 0.40}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH * 0.40}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />
            {/* Right side divisions */}
            <line
              x1={TABLE_X + TABLE_WIDTH * 0.60}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH * 0.60}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />
            <line
              x1={TABLE_X + TABLE_WIDTH * 0.75}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH * 0.75}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Zone vulnerability overlays - colored rectangles based on vulnerability */}
            {displayWeaknesses.map((weakness) => {
              if (weakness.totalShots === 0) return null;
              const sectorBounds = getSectorBounds(weakness.sector);
              const fillColor = getZoneFillColor(weakness.vulnerability);
              const opacity = weakness.vulnerability === "high" ? 0.35 : 
                              weakness.vulnerability === "medium" ? 0.25 : 0.15;
              
              // Render on both sides of the table
              return ["left", "right"].map((side) => {
                const zoneBounds = getZoneXBounds(weakness.zone, side as "left" | "right");
                return (
                  <rect
                    key={`zone-${weakness.zone}-${weakness.sector}-${side}`}
                    x={TABLE_X + TABLE_WIDTH * zoneBounds.x}
                    y={TABLE_Y + TABLE_HEIGHT * sectorBounds.y}
                    width={TABLE_WIDTH * zoneBounds.width}
                    height={TABLE_HEIGHT * sectorBounds.height}
                    fill={fillColor}
                    opacity={opacity}
                  />
                );
              });
            })}

            {/* Landing position markers - User shots (winning shots) */}
            {userShots.map((shot, idx) => (
              <circle
                key={`user-${idx}`}
                cx={shot.x}
                cy={shot.y}
                r="3"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.8"
              />
            ))}

            {/* Landing position markers - Opponent shots (points lost) */}
            {opponentShots.map((shot, idx) => (
              <circle
                key={`opponent-${idx}`}
                cx={shot.x}
                cy={shot.y}
                r="3"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.8"
              />
            ))}
          </svg>
        </div>

        {/* Legend for markers and zones */}
        <div className="flex flex-col gap-2 text-xs mb-6 text-[#353535]">
          {/* Shot markers legend */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981] border border-white"></div>
              <span>Your winning shots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              <span>Opponent winning shots</span>
            </div>
          </div>
          {/* Zone vulnerability legend */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/50"></div>
              <span>High vulnerability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500/40"></div>
              <span>Medium vulnerability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500/30"></div>
              <span>Low vulnerability</span>
            </div>
          </div>
        </div>

        {/* Stats Table - Zone-Sector Statistics */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 text-[#353535]">Zone-Sector Statistics</h4>
          <div className="overflow-x-auto">
            {sortedWeaknesses.length === 0 ? (
              <div className="text-center py-8 text-[#d9d9d9] text-sm">
                <p>No zone-sector data available for this match.</p>
                <p className="text-xs mt-2">Play more matches to see zone-sector statistics.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d9d9d9]">
                    <th className="text-left py-2 px-3 font-semibold text-[#353535]">Zone-Sector</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#353535]">Your Shots</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#353535]">Opponent Shots</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#353535]">Win Rate</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#353535]">Dominant Stroke</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#353535]">Vulnerability</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWeaknesses.map((weakness, idx) => (
                    <tr
                      key={`${weakness.zone}-${weakness.sector}`}
                      className={`border-b border-[#d9d9d9] ${getVulnerabilityColor(weakness.vulnerability)}`}
                    >
                      <td className="py-3 px-3 font-medium text-[#353535]">
                        {formatZoneSectorLabel(weakness.zone, weakness.sector)}
                        {weakness.totalShots < 3 && (
                          <span className="text-xs text-[#d9d9d9] ml-1">*</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-[#3c6e71]">
                        {weakness.wins}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-red-600">
                        {weakness.losses}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#353535]">
                        {weakness.winRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        {weakness.dominantStroke ? (
                          <span className="text-xs bg-[#f8f8f8] px-2 py-1 text-[#353535]">
                            {formatStrokeName(weakness.dominantStroke)}
                          </span>
                        ) : (
                          <span className="text-[#d9d9d9] text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-xs font-semibold ${getVulnerabilityTextColor(weakness.vulnerability)}`}
                        >
                          {weakness.vulnerability === "high" && "High"}
                          {weakness.vulnerability === "medium" && "Medium"}
                          {weakness.vulnerability === "low" && "Low"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {displayWeaknesses.some((w) => w.totalShots > 0 && w.totalShots < 3) && (
            <p className="text-xs text-[#d9d9d9] mt-3">
              * Zone-sectors with fewer than 3 shots have insufficient data for reliable analysis
            </p>
          )}
        </div>

        {/* Recommendations for top 3 vulnerable */}
        {sortedWeaknesses
          .filter((w) => w.totalShots >= 5 && w.vulnerability === "high")
          .slice(0, 3)
          .map((w, idx) => (
            <div
              key={idx}
              className="mt-4 p-3 bg-red-500/5 border border-red-500/20 text-sm text-red-700"
            >
              <RecommendationText text={w.recommendation} />
            </div>
          ))}
      </div>
    </section>
  );
}