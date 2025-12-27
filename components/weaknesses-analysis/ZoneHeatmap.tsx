"use client";

import { useState } from "react";
import { ZoneWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";

interface ZoneHeatmapProps {
  zoneData: ZoneWeaknessData;
}

export function ZoneHeatmap({ zoneData }: ZoneHeatmapProps) {
  const [hoveredZone, setHoveredZone] = useState<{
    x: number;
    y: number;
  } | null>(null);

  /* -------------------------------
     Geometry (Table = SVG Canvas)
  -------------------------------- */
  const TABLE_WIDTH = 1000;
  const TABLE_HEIGHT = 560;

  // Fine-grained grid aligned with zone-sector boundaries
  const GRID_COLS = 20; // 20 columns, 5% each
  const GRID_ROWS = 9;  // 9 rows, ~11.11% each

  const CELL_WIDTH = TABLE_WIDTH / GRID_COLS;
  const CELL_HEIGHT = TABLE_HEIGHT / GRID_ROWS;

  /* -------------------------------
     Color Logic (Based on Vulnerability)
  -------------------------------- */
  const getZoneColor = (
    vulnerability: "high" | "medium" | "low" | undefined,
    totalShots: number
  ): string => {
    if (totalShots === 0) return "rgba(148, 163, 184, 0.25)";

    // Use vulnerability field for coloring (calculated using standard deviation)
    if (vulnerability === "high") return "rgba(239, 68, 68, 0.85)"; // Red - weak zone
    if (vulnerability === "medium") return "rgba(250, 204, 21, 0.7)"; // Yellow - average
    return "rgba(34, 197, 94, 0.8)"; // Green - strong zone
  };

  const hoveredCell =
    hoveredZone &&
    zoneData.heatmapGrid[hoveredZone.y]?.[hoveredZone.x];

  /* -------------------------------
     Tooltip Position (% based)
  -------------------------------- */
  const tooltipLeft = hoveredZone
    ? ((hoveredZone.x + 0.5) / GRID_COLS) * 100
    : 0;

  const tooltipTopRaw = hoveredZone
    ? ((hoveredZone.y + 0.5) / GRID_ROWS) * 100
    : 0;

  const tooltipTop = Math.min(
    Math.max(tooltipTopRaw, 10),
    90
  );

  const isRightSide = tooltipLeft > 65;

  const tooltipStyle: React.CSSProperties = {
    left: isRightSide ? "auto" : `${tooltipLeft}%`,
    right: isRightSide ? `${100 - tooltipLeft}%` : "auto",
    top: `${tooltipTop}%`,
    transform: isRightSide
      ? "translate(-12px, -50%)"
      : "translate(12px, -50%)",
  };

  /* -------------------------------
     Zone/Sector Name Helpers
  -------------------------------- */
  const getZoneName = (x: number): string => {
    // 20 columns: 0-4=Left Deep, 5-7=Left Mid, 8-9=Left Short, 
    //            10-11=Right Short, 12-14=Right Mid, 15-19=Right Deep
    if (x <= 4) return "Left Deep";
    if (x <= 7) return "Left Mid";
    if (x <= 9) return "Left Short";
    if (x <= 11) return "Right Short";
    if (x <= 14) return "Right Mid";
    return "Right Deep";
  };

  const getSectorName = (y: number): string => {
    // 9 rows: 0-2=Backhand, 3-5=Crossover, 6-8=Forehand
    if (y <= 2) return "Backhand";
    if (y <= 5) return "Crossover";
    return "Forehand";
  };

  return (
    <div className="border border-[#d9d9d9] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#353535]">
          Zone-Sector Analysis
        </h3>
        <p className="text-xs text-[#d9d9d9]">
          Zone vulnerability heatmap divided by zones and sectors. Red indicates vulnerability; green indicates strength.
        </p>
      </div>

      <div>
        {/* Responsive SVG Container */}
        <div className="relative w-full aspect-video max-h-[80vh]">
          <svg
            viewBox={`0 0 ${TABLE_WIDTH} ${TABLE_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Table Surface */}
            <rect
              x={0}
              y={0}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="#1E40AF"
              stroke="#ffffff"
              strokeWidth={6}
            />

            {/* Center Line */}
            <line
              x1={TABLE_WIDTH / 2}
              y1={0}
              x2={TABLE_WIDTH / 2}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={3}
              opacity={0.6}
            />

            {/* Net (solid black) */}
            <line
              x1={TABLE_WIDTH / 2}
              y1={0}
              x2={TABLE_WIDTH / 2}
              y2={TABLE_HEIGHT}
              stroke="#000000"
              strokeWidth={4}
              opacity={1}
            />

            {/* Sector dividing lines (horizontal) - Backhand, Crossover, Forehand */}
            <line
              x1={0}
              y1={TABLE_HEIGHT * 0.3333}
              x2={TABLE_WIDTH}
              y2={TABLE_HEIGHT * 0.3333}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />
            <line
              x1={0}
              y1={TABLE_HEIGHT * 0.6667}
              x2={TABLE_WIDTH}
              y2={TABLE_HEIGHT * 0.6667}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />

            {/* Zone dividing lines (vertical) - Deep, Mid, Short on each side */}
            {/* Left side divisions */}
            <line
              x1={TABLE_WIDTH * 0.25}
              y1={0}
              x2={TABLE_WIDTH * 0.25}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />
            <line
              x1={TABLE_WIDTH * 0.40}
              y1={0}
              x2={TABLE_WIDTH * 0.40}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />
            {/* Right side divisions */}
            <line
              x1={TABLE_WIDTH * 0.60}
              y1={0}
              x2={TABLE_WIDTH * 0.60}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />
            <line
              x1={TABLE_WIDTH * 0.75}
              y1={0}
              x2={TABLE_WIDTH * 0.75}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.4}
            />

            {/* Heatmap Cells */}
            {zoneData.heatmapGrid.map((row, y) =>
              row.map((cell, x) => {
                const isHovered =
                  hoveredZone?.x === x &&
                  hoveredZone?.y === y;

                return (
                  <g key={`${x}-${y}`}>
                    <rect
                      x={x * CELL_WIDTH}
                      y={y * CELL_HEIGHT}
                      width={CELL_WIDTH}
                      height={CELL_HEIGHT}
                      fill={getZoneColor(
                        cell.vulnerability,
                        cell.totalShots
                      )}
                      stroke={
                        isHovered
                          ? "#ffffff"
                          : "rgba(255,255,255,0.25)"
                      }
                      strokeWidth={isHovered ? 4 : 1}
                      opacity={
                        cell.totalShots === 0 ? 0.3 : 0.9
                      }
                      vectorEffect="non-scaling-stroke"
                      onMouseEnter={() =>
                        setHoveredZone({ x, y })
                      }
                      onMouseLeave={() =>
                        setHoveredZone(null)
                      }
                      style={{
                        cursor:
                          cell.totalShots > 0
                            ? "pointer"
                            : "default",
                      }}
                    />

                    {/* Shot Count */}
                    {cell.totalShots > 0 && (
                      <text
                        x={
                          x * CELL_WIDTH +
                          CELL_WIDTH / 2
                        }
                        y={
                          y * CELL_HEIGHT +
                          CELL_HEIGHT / 2
                        }
                        fill="#ffffff"
                        fontSize={CELL_WIDTH * 0.35}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontWeight="600"
                        opacity={0.85}
                        pointerEvents="none"
                      >
                        {cell.totalShots}
                      </text>
                    )}

                    {/* Insufficient Data Indicator */}
                    {cell.totalShots > 0 &&
                      cell.totalShots < 3 && (
                        <text
                          x={
                            x * CELL_WIDTH +
                            CELL_WIDTH / 2
                          }
                          y={
                            y * CELL_HEIGHT +
                            CELL_HEIGHT / 2 +
                            CELL_HEIGHT * 0.25
                          }
                          fill="#ffffff"
                          fontSize={CELL_WIDTH * 0.25}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          opacity={0.6}
                          pointerEvents="none"
                        >
                          *
                        </text>
                      )}
                  </g>
                );
              })
            )}
          </svg>

          {/* Tooltip */}
          {hoveredCell && hoveredCell.totalShots > 0 && (
            <div
              className="absolute z-20 bg-white border border-[#d9d9d9] p-3 text-xs w-64 max-w-[90vw]"
              style={tooltipStyle}
            >
              <p className="font-semibold mb-2 text-[#353535]">
                {getSectorName(hoveredZone!.y)} - {getZoneName(hoveredZone!.x)}
              </p>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#d9d9d9]">
                    Point-Ending Shots
                  </span>
                  <span className="font-semibold text-[#353535]">
                    {hoveredCell.totalShots}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#d9d9d9]">
                    Your Points Won
                  </span>
                  <span className="font-semibold text-green-600">
                    {hoveredCell.wins}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#d9d9d9]">
                    Opponent Points Won
                  </span>
                  <span className="font-semibold text-red-600">
                    {hoveredCell.losses}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-[#d9d9d9]/30">
                  <span className="text-[#d9d9d9]">
                    Your Success Rate
                  </span>
                  <span className="font-semibold text-[#353535]">
                    {hoveredCell.winRate.toFixed(1)}%
                  </span>
                </div>

                {hoveredCell.dominantStroke && (
                  <div className="flex justify-between">
                    <span className="text-[#d9d9d9]">
                      Most Used Shot
                    </span>
                    <span className="font-semibold text-[#353535]">
                      {formatStrokeName(
                        hoveredCell.dominantStroke
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-[#d9d9d9]/30">
                  <span className="text-[#d9d9d9]">
                    Zone Strength
                  </span>
                  <span
                    className={`font-semibold text-xs px-2 py-0.5 rounded ${
                      hoveredCell.vulnerability ===
                      "high"
                        ? "bg-red-100 text-red-700"
                        : hoveredCell.vulnerability ===
                          "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {hoveredCell.vulnerability === "high" 
                      ? "Weak Zone" 
                      : hoveredCell.vulnerability === "medium"
                      ? "Average"
                      : "Strong Zone"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
