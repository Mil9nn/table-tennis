"use client";

import { useState, useEffect } from "react";
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

  const GRID_COLS = 20;
  const GRID_ROWS = 9;

  const CELL_WIDTH = TABLE_WIDTH / GRID_COLS;
  const CELL_HEIGHT = TABLE_HEIGHT / GRID_ROWS;

  /* -------------------------------
     Color Logic (UNCHANGED)
  -------------------------------- */
  const getZoneColor = (
    vulnerability: "high" | "medium" | "low" | undefined,
    totalShots: number
  ): string => {
    if (totalShots === 0) return "rgba(148, 163, 184, 0.2)";

    if (vulnerability === "high") return "rgba(239, 68, 68, 0.65)";
    if (vulnerability === "medium") return "rgba(250, 204, 21, 0.55)";
    return "rgba(34, 197, 94, 0.65)";
  };

  const hoveredCell =
    hoveredZone && zoneData.heatmapGrid[hoveredZone.y]?.[hoveredZone.x];

  /* -------------------------------
     Tooltip Position (UNCHANGED)
  -------------------------------- */
  const tooltipLeft = hoveredZone
    ? ((hoveredZone.x + 0.5) / GRID_COLS) * 100
    : 0;

  const tooltipTopRaw = hoveredZone
    ? ((hoveredZone.y + 0.5) / GRID_ROWS) * 100
    : 0;

  const tooltipTop = Math.min(Math.max(tooltipTopRaw, 10), 90);
  const isRightSide = tooltipLeft > 65;

  const tooltipStyle: React.CSSProperties = {
    left: isRightSide ? "auto" : `${tooltipLeft}%`,
    right: isRightSide ? `${100 - tooltipLeft}%` : "auto",
    top: `${tooltipTop}%`,
    transform: isRightSide ? "translate(-14px, -50%)" : "translate(14px, -50%)",
  };

  /* -------------------------------
     Naming Helpers
  -------------------------------- */
  const getZoneName = (x: number): string => {
    if (x <= 4) return "Deep";
    if (x <= 7) return "Mid";
    if (x <= 9) return "Short";
    if (x <= 11) return "Short";
    if (x <= 14) return "Mid";
    return "Deep";
  };

  const getSectorName = (y: number): string => {
    if (y <= 2) return "Backhand";
    if (y <= 5) return "Crossover";
    return "Forehand";
  };

  const getZoneSectorLabel = (x: number, y: number): string => {
    return `${getZoneName(x)} ${getSectorName(y)}`;
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          Zone & Sector Vulnerability
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Heatmap of point-ending shots by table zone. Higher intensity
          indicates greater opponent success.
        </p>
      </div>

      {/* Heatmap */}
      <div className="relative w-full aspect-video max-h-[80vh] overflow-hidden bg-neutral-50">
        <svg
          viewBox={`0 0 ${TABLE_WIDTH} ${TABLE_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Table */}
          <rect
            x={0}
            y={0}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            fill="#1E3A8A"
            stroke="#ffffff"
            strokeWidth={4}
          />

          {/* Net */}
          <line
            x1={TABLE_WIDTH / 2}
            y1={0}
            x2={TABLE_WIDTH / 2}
            y2={TABLE_HEIGHT}
            stroke="#000000"
            strokeWidth={3}
          />

          {/* Center line */}
          <line
            x1={TABLE_WIDTH / 2}
            y1={0}
            x2={TABLE_WIDTH / 2}
            y2={TABLE_HEIGHT}
            stroke="#ffffff"
            strokeWidth={2}
            opacity={0.4}
          />

          {/* Sector lines */}
          <line
            x1={0}
            y1={TABLE_HEIGHT * 0.3333}
            x2={TABLE_WIDTH}
            y2={TABLE_HEIGHT * 0.3333}
            stroke="#ffffff"
            strokeWidth={1.5}
            opacity={0.35}
          />
          <line
            x1={0}
            y1={TABLE_HEIGHT * 0.6667}
            x2={TABLE_WIDTH}
            y2={TABLE_HEIGHT * 0.6667}
            stroke="#ffffff"
            strokeWidth={1.5}
            opacity={0.35}
          />

          {/* Zone lines */}
          {[0.25, 0.4, 0.6, 0.75].map((x) => (
            <line
              key={x}
              x1={TABLE_WIDTH * x}
              y1={0}
              x2={TABLE_WIDTH * x}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={1.5}
              opacity={0.35}
            />
          ))}

          {/* Heatmap Cells */}
          {zoneData.heatmapGrid.map((row, y) =>
            row.map((cell, x) => {
              const isHovered = hoveredZone?.x === x && hoveredZone?.y === y;

              return (
                <g key={`${x}-${y}`}>
                  <rect
                    x={x * CELL_WIDTH}
                    y={y * CELL_HEIGHT}
                    width={CELL_WIDTH}
                    height={CELL_HEIGHT}
                    fill={getZoneColor(cell.vulnerability, cell.totalShots)}
                    stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isHovered ? 3 : 1}
                    vectorEffect="non-scaling-stroke"
                    opacity={cell.totalShots === 0 ? 0.25 : 0.9}
                    onMouseEnter={() => setHoveredZone({ x, y })}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{
                      cursor: cell.totalShots > 0 ? "pointer" : "default",
                    }}
                  />

                  {cell.totalShots > 0 && (
                    <text
                      x={x * CELL_WIDTH + CELL_WIDTH / 2}
                      y={y * CELL_HEIGHT + CELL_HEIGHT / 2}
                      fill="#ffffff"
                      fontSize={CELL_WIDTH * 0.32}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="600"
                      opacity={0.85}
                      pointerEvents="none"
                    >
                      {cell.totalShots}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {/* Tooltip */}
        {hoveredCell &&
          hoveredCell.totalShots > 0 &&
          (isMobile ? (
            /* Mobile: Docked panel */
            <div className="absolute w-50 inset-x-3 bottom-0.5 z-40 rounded-lg border border-neutral-200 bg-white p-4 text-xs shadow-xl">
              <TooltipContent
                hoveredCell={hoveredCell}
                x={hoveredZone!.x}
                y={hoveredZone!.y}
                getZoneSectorLabel={getZoneSectorLabel}
              />
            </div>
          ) : (
            /* Desktop: Floating tooltip */
            <div
              className="absolute z-30 w-64 rounded-md border border-neutral-200 bg-white p-4 text-xs shadow-lg pointer-events-none"
              style={tooltipStyle}
            >
              <TooltipContent
                hoveredCell={hoveredCell}
                x={hoveredZone!.x}
                y={hoveredZone!.y}
                getZoneSectorLabel={getZoneSectorLabel}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function TooltipContent({
  hoveredCell,
  x,
  y,
  getZoneSectorLabel,
}: any) {
  return (
    <>
      <p className="mb-2 font-semibold text-neutral-900">
        {getZoneSectorLabel(x, y)}
      </p>

      <div className="space-y-1.5 text-neutral-600">
        <div className="flex justify-between">
          <span>Total points</span>
          <span className="font-semibold text-neutral-900">
            {hoveredCell.totalShots}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Your wins</span>
          <span className="font-semibold text-green-600">
            {hoveredCell.wins}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Opponent wins</span>
          <span className="font-semibold text-red-600">
            {hoveredCell.losses}
          </span>
        </div>

        <div className="flex justify-between border-t border-neutral-200 pt-2">
          <span>Success rate</span>
          <span className="font-semibold text-neutral-900">
            {hoveredCell.winRate.toFixed(1)}%
          </span>
        </div>

        {hoveredCell.dominantStroke && (
          <div className="flex justify-between">
            <span>Primary shot</span>
            <span className="font-semibold text-neutral-900">
              {formatStrokeName(hoveredCell.dominantStroke)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
