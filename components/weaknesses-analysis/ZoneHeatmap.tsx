// components/weaknesses-analysis/ZoneHeatmap.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoneWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";

interface ZoneHeatmapProps {
  zoneData: ZoneWeaknessData;
}

export function ZoneHeatmap({ zoneData }: ZoneHeatmapProps) {
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
    if (totalShots === 0) return "rgba(156, 163, 175, 0.2)"; // Gray for no data

    // Calculate relative thresholds based on average win rate for better sensitivity
    const allWinRates = zoneData.heatmapGrid
      .flat()
      .filter((cell) => cell.totalShots > 0)
      .map((cell) => cell.winRate);
    
    const avgWinRate = allWinRates.length > 0
      ? allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length
      : 50;
    
    // Use relative thresholds: zones below average are more vulnerable
    // Red: significantly below average (< avg - 10%)
    // Orange: below average (< avg - 5%)
    // Yellow: slightly below average (< avg)
    // Light green: above average (>= avg)
    // Strong green: significantly above average (>= avg + 10%)
    if (winRate >= avgWinRate + 10) return "rgba(34, 197, 94, 0.7)"; // Strong green
    if (winRate >= avgWinRate) return "rgba(132, 204, 22, 0.6)"; // Light green
    if (winRate >= avgWinRate - 5) return "rgba(250, 204, 21, 0.6)"; // Yellow
    if (winRate >= avgWinRate - 10) return "rgba(249, 115, 22, 0.7)"; // Orange
    return "rgba(239, 68, 68, 0.8)"; // Red
  };

  // Get zone color based on win rate
  const getZoneColor = (cell: any): string => {
    return getWinRateColor(cell.winRate, cell.totalShots);
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
          Hover over zones to see detailed stats. Colors show performance in that zone relative to your average performance across all zones (Red = below average, Green = above average)
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
                    {/* Indicator for insufficient data */}
                    {cell.totalShots > 0 && cell.totalShots < 3 && (
                      <text
                        x={cellX + CELL_WIDTH / 2}
                        y={cellY + CELL_HEIGHT / 2 + 10}
                        fill="#ffffff"
                        fontSize="6"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        opacity="0.5"
                      >
                        *
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
                  <span className="font-semibold">
                    {hoveredCell.totalShots}
                    {hoveredCell.totalShots < 3 && (
                      <span className="text-gray-400 text-xs ml-1">(insufficient data)</span>
                    )}
                  </span>
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
            <span className="text-gray-500">Win Rate</span>
          </div>

          {(() => {
            const allWinRates = zoneData.heatmapGrid
              .flat()
              .filter((cell) => cell.totalShots > 0)
              .map((cell) => cell.winRate);
            const avgWinRate = allWinRates.length > 0
              ? allWinRates.reduce((a, b) => a + b, 0) / allWinRates.length
              : 50;
            
            return (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-600 font-medium">
                  Your average win rate across zones: <span className="font-semibold text-blue-600">{avgWinRate.toFixed(1)}%</span>
                </p>
                <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-lime-500 to-green-500"></div>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-80"></div>
                    <span className="text-gray-600">Very Weak (&lt; avg - 10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-orange-500 opacity-70"></div>
                    <span className="text-gray-600">Weak (avg - 10% to -5%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-60"></div>
                    <span className="text-gray-600">Below Average (avg - 5% to avg)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-lime-500 opacity-60"></div>
                    <span className="text-gray-600">Above Average (avg to avg + 10%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-green-500 opacity-70"></div>
                    <span className="text-gray-600">Very Strong (&gt;= avg + 10%)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * Zones with fewer than 3 shots are marked as neutral (insufficient data)
                </p>
              </div>
            );
          })()}
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
