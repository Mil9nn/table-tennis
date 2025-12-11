// components/weaknesses-analysis/ZoneHeatmap.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoneWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";

interface ZoneHeatmapProps {
  zoneData: ZoneWeaknessData;
  viewMode?: "winRate" | "shotCount" | "vulnerability";
}

export function ZoneHeatmap({ zoneData, viewMode = "winRate" }: ZoneHeatmapProps) {
  const [hoveredZone, setHoveredZone] = useState<{ x: number; y: number } | null>(null);

  // Table dimensions in SVG units
  const TABLE_X = 182.67;
  const TABLE_Y = 101.67;
  const TABLE_WIDTH = 182.67;
  const TABLE_HEIGHT = 101.67;

  // Grid cell size
  const CELL_WIDTH = TABLE_WIDTH / 10;
  const CELL_HEIGHT = TABLE_HEIGHT / 10;

  // Get color based on win rate
  const getWinRateColor = (winRate: number, totalShots: number): string => {
    if (totalShots < 3) return "rgba(156, 163, 175, 0.2)"; // Gray for insufficient data

    // Green (safe) to Red (vulnerable)
    if (winRate >= 65) return "rgba(34, 197, 94, 0.7)"; // Strong green
    if (winRate >= 55) return "rgba(132, 204, 22, 0.6)"; // Light green
    if (winRate >= 50) return "rgba(250, 204, 21, 0.6)"; // Yellow
    if (winRate >= 40) return "rgba(249, 115, 22, 0.7)"; // Orange
    return "rgba(239, 68, 68, 0.8)"; // Red
  };

  // Get color based on vulnerability
  const getVulnerabilityColor = (vulnerability: string, totalShots: number): string => {
    if (totalShots < 3) return "rgba(156, 163, 175, 0.2)";

    if (vulnerability === "high") return "rgba(239, 68, 68, 0.8)";
    if (vulnerability === "medium") return "rgba(250, 204, 21, 0.6)";
    return "rgba(34, 197, 94, 0.5)";
  };

  // Get color based on shot count
  const getShotCountColor = (shotCount: number): string => {
    const maxShots = Math.max(
      ...zoneData.heatmapGrid.flat().map((cell) => cell.totalShots)
    );
    if (shotCount === 0) return "rgba(156, 163, 175, 0.2)";

    const intensity = Math.min(shotCount / (maxShots || 1), 1);
    return `rgba(59, 130, 246, ${0.3 + intensity * 0.6})`;
  };

  // Get zone color based on view mode
  const getZoneColor = (cell: any): string => {
    if (viewMode === "winRate") {
      return getWinRateColor(cell.winRate, cell.totalShots);
    } else if (viewMode === "vulnerability") {
      return getVulnerabilityColor(cell.vulnerability, cell.totalShots);
    } else {
      return getShotCountColor(cell.totalShots);
    }
  };

  // Get hovered cell data
  const hoveredCell = hoveredZone
    ? zoneData.heatmapGrid[hoveredZone.y]?.[hoveredZone.x]
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Zone Vulnerability Heatmap</CardTitle>
        <p className="text-xs text-gray-500">
          Hover over zones to see detailed stats. Red = <span className="font-semibold">vulnerable</span>, Green = <span className="font-semibold">safe</span>
        </p>
      </CardHeader>
      <CardContent>
        {/* SVG Heatmap */}
        <div className="relative">
          <svg viewBox="0 0 548 305" className="w-full h-auto" style={{ maxHeight: "500px" }}>
            {/* Background */}
            <rect x="0" y="0" width="548" height="305" fill="#000" rx="8" />

            {/* Table surface */}
            <rect
              x={TABLE_X}
              y={TABLE_Y}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="#1E40AF"
              stroke="#1E3A8A"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Center line */}
            <line
              x1={TABLE_X + TABLE_WIDTH / 2}
              y1={TABLE_Y}
              x2={TABLE_X + TABLE_WIDTH / 2}
              y2={TABLE_Y + TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Grid cells */}
            {zoneData.heatmapGrid.map((row, y) =>
              row.map((cell, x) => {
                const cellX = TABLE_X + x * CELL_WIDTH;
                const cellY = TABLE_Y + y * CELL_HEIGHT;
                const isHovered = hoveredZone?.x === x && hoveredZone?.y === y;

                return (
                  <g key={`${x}-${y}`}>
                    <rect
                      x={cellX}
                      y={cellY}
                      width={CELL_WIDTH}
                      height={CELL_HEIGHT}
                      fill={getZoneColor(cell)}
                      stroke={isHovered ? "#ffffff" : "#1E3A8A"}
                      strokeWidth={isHovered ? "2" : "0.5"}
                      opacity={isHovered ? "1" : "0.85"}
                      onMouseEnter={() => setHoveredZone({ x, y })}
                      onMouseLeave={() => setHoveredZone(null)}
                      style={{ cursor: cell.totalShots > 0 ? "pointer" : "default" }}
                    />

                    {/* Shot count label for cells with data */}
                    {cell.totalShots > 0 && (
                      <text
                        x={cellX + CELL_WIDTH / 2}
                        y={cellY + CELL_HEIGHT / 2}
                        fill="#ffffff"
                        fontSize="8"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        fontWeight="bold"
                        opacity="0.7"
                      >
                        {cell.totalShots}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Table borders */}
            <rect
              x={TABLE_X}
              y={TABLE_Y}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>

          {/* Tooltip for hovered cell */}
          {hoveredCell && hoveredCell.totalShots > 0 && (
            <div className="absolute top-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3 z-10 max-w-xs">
              <p className="font-semibold text-sm mb-2">
                Zone ({hoveredZone!.x}, {hoveredZone!.y})
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Total Shots:</span>
                  <span className="font-semibold">{hoveredCell.totalShots}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Win Rate:</span>
                  <span
                    className={`font-semibold ${
                      hoveredCell.winRate >= 55
                        ? "text-green-600"
                        : hoveredCell.winRate >= 45
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {hoveredCell.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Wins/Losses:</span>
                  <span className="font-semibold">
                    {hoveredCell.wins}/{hoveredCell.losses}
                  </span>
                </div>
                {hoveredCell.dominantStroke && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Dominant Shot:</span>
                    <span className="font-semibold">
                      {formatStrokeName(hoveredCell.dominantStroke)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Vulnerability:</span>
                  <span
                    className={`font-semibold ${
                      hoveredCell.vulnerability === "high"
                        ? "text-red-600"
                        : hoveredCell.vulnerability === "medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {hoveredCell.vulnerability.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700">Color Legend:</span>
            <span className="text-gray-500">
              {viewMode === "winRate" && "Win Rate"}
              {viewMode === "vulnerability" && "Vulnerability Level"}
              {viewMode === "shotCount" && "Shot Frequency"}
            </span>
          </div>

          {viewMode === "winRate" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
              <div className="flex items-center gap-2 flex-wrap w-full text-xs text-gray-600">
                <span className="">Vulnerable (&lt;45%)</span>
                <span>Average (45-55%)</span>
                <span className="">Safe (&gt;55%)</span>
              </div>
            </div>
          )}

          {viewMode === "vulnerability" && (
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-500 opacity-80"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-yellow-500 opacity-60"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-500 opacity-50"></div>
                <span>Low</span>
              </div>
            </div>
          )}
        </div>

        {/* Vulnerable Zones Summary */}
        {zoneData.vulnerableZones.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-sm text-red-900 mb-2">Top Vulnerable Zones:</p>
            <ul className="space-y-1 text-xs text-red-800">
              {zoneData.vulnerableZones.map((zone, idx) => (
                <li key={idx}>
                  • {zone.zone} - {zone.lossRate.toFixed(0)}% loss rate
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
