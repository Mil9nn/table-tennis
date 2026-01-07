"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { SHOT_TYPE_COLORS } from "@/constants/constants";
import WagonWheel from "@/components/WagonWheel";
import { EmptyState } from "../components/EmptyState";
import { BubbleChart } from "@mui/icons-material";

interface ShotAnalysisPageProps {
  userId?: string;
}

// Shot Landing Heatmap Component (matches ZoneHeatmap design)
const ShotLandingHeatmap = ({
  heatmapGrid,
  formatShotName,
  maxHeatmapValue,
  SHOT_TYPE_COLORS,
}: {
  heatmapGrid: {
    count: number;
    dominantStroke: string | null;
    shotTypes: Record<string, number>;
  }[][];
  formatShotName: (stroke: string) => string;
  maxHeatmapValue: number;
  SHOT_TYPE_COLORS: Record<string, string>;
}) => {
  const [hoveredZone, setHoveredZone] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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
     Color Logic
  -------------------------------- */
  const getZoneColor = (cell: any): string => {
    if (!cell || cell.count === 0) {
      return "rgba(148, 163, 184, 0.2)";
    }

    const baseColor =
      cell.dominantStroke && SHOT_TYPE_COLORS[cell.dominantStroke]
        ? SHOT_TYPE_COLORS[cell.dominantStroke]
        : "#3c6e71";

    // Calculate opacity based on intensity
    const intensity = Math.min(cell.count / maxHeatmapValue, 1);
    const opacity = 0.3 + intensity * 0.7;

    // Convert hex to rgba if needed
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return baseColor;
  };

  const hoveredCell =
    hoveredZone && heatmapGrid[hoveredZone.y]?.[hoveredZone.x];

  /* -------------------------------
     Tooltip Position
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

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          Shot Landing Heatmap
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Heatmap of point-winning shots by table zone. Colors represent dominant shot type, intensity shows shot frequency.
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
          {heatmapGrid.map((row, y) =>
            row.map((cell, x) => {
              const isHovered = hoveredZone?.x === x && hoveredZone?.y === y;

              return (
                <g key={`${x}-${y}`}>
                  <rect
                    x={x * CELL_WIDTH}
                    y={y * CELL_HEIGHT}
                    width={CELL_WIDTH}
                    height={CELL_HEIGHT}
                    fill={getZoneColor(cell)}
                    stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isHovered ? 3 : 1}
                    vectorEffect="non-scaling-stroke"
                    opacity={cell.count === 0 ? 0.25 : 0.9}
                    onMouseEnter={() => setHoveredZone({ x, y })}
                    onMouseLeave={() => setHoveredZone(null)}
                    style={{
                      cursor: cell.count > 0 ? "pointer" : "default",
                    }}
                  />

                  {cell.count > 0 && (
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
                      {cell.count}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {hoveredCell &&
          hoveredCell.count > 0 &&
          (isMobile ? (
            /* Mobile: Docked panel */
            <div className="absolute w-[calc(100%-24px)] inset-x-3 bottom-0.5 z-40 rounded-lg border border-neutral-200 bg-white p-4 text-xs shadow-xl">
              <TooltipContent
                hoveredCell={hoveredCell}
                x={hoveredZone!.x}
                y={hoveredZone!.y}
                getZoneSectorLabel={getZoneSectorLabel}
                formatShotName={formatShotName}
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
                formatShotName={formatShotName}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

function TooltipContent({
  hoveredCell,
  x,
  y,
  getZoneSectorLabel,
  formatShotName,
}: {
  hoveredCell: any;
  x: number;
  y: number;
  getZoneSectorLabel: (x: number, y: number) => string;
  formatShotName: (stroke: string) => string;
}) {
  return (
    <>
      <p className="mb-2 font-semibold text-neutral-900">
        {getZoneSectorLabel(x, y)}
      </p>

      <div className="space-y-1.5 text-neutral-600">
        <div className="flex justify-between">
          <span>Total shots</span>
          <span className="font-semibold text-neutral-900">
            {hoveredCell.count}
          </span>
        </div>

        {hoveredCell.dominantStroke && (
          <div className="flex justify-between border-t border-neutral-200 pt-2">
            <span>Primary shot</span>
            <span className="font-semibold text-neutral-900">
              {formatShotName(hoveredCell.dominantStroke)}
            </span>
          </div>
        )}

        {hoveredCell.shotTypes &&
          Object.keys(hoveredCell.shotTypes).length > 1 && (
            <div className="border-t border-neutral-200 pt-2">
              <p className="mb-1.5 text-xs font-medium text-neutral-500">
                Shot breakdown:
              </p>
              <div className="space-y-1">
                {Object.entries(hoveredCell.shotTypes)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([stroke, count]) => (
                    <div
                      key={stroke}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-neutral-600">
                        {formatShotName(stroke)}
                      </span>
                      <span className="font-semibold text-neutral-900">
                        {count as number}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
}

const ShotAnalysisPage = ({ userId }: ShotAnalysisPageProps = {}) => {
  const router = useRouter();
  const [shotData, setShotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShotAnalysis = async () => {
      setLoading(true);
      try {
        // Use userId prop if provided, otherwise use current user's profile
        const apiPath = userId ? `/profile/shots-analysis?userId=${userId}` : `/profile/shots-analysis`;
        const response = await axiosInstance.get(apiPath);
        console.log("[Shots Page] API Response:", response.data);
        
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          console.log("[Shots Page] Shot data received:", {
            shotDistribution: data.shotDistribution?.length || 0,
            allShots: data.allShots?.length || 0,
            opponentShots: data.opponentShots?.length || 0,
            heatmapGrid: data.heatmapGrid ? "exists" : "missing"
          });
          setShotData(data);
        } else {
          console.error("Shot analysis API returned unsuccessful response:", response.data);
          setShotData(null);
        }
      } catch (error: any) {
        console.error("Failed to fetch shot analysis:", error);
        console.error("Error details:", error.response?.data || error.message);
        setShotData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShotAnalysis();
  }, [userId]);

  const shotDistribution = shotData?.shotDistribution || [];
  const serveTypeDistribution: Record<string, number> =
    shotData?.serveTypeDistribution || {
      side_spin: 0,
      top_spin: 0,
      back_spin: 0,
      mix_spin: 0,
      no_spin: 0,
    };
  // Initialize 20x9 grid if data is missing (matching zone-sector analysis)
  const defaultGrid: {
    count: number;
    dominantStroke: string | null;
    shotTypes: Record<string, number>;
  }[][] = Array(9).fill(null).map(() => 
    Array(20).fill(null).map(() => ({
      count: 0,
      dominantStroke: null,
      shotTypes: {},
    }))
  );
  const heatmapGrid: {
    count: number;
    dominantStroke: string | null;
    shotTypes: Record<string, number>;
  }[][] = shotData?.heatmapGrid || defaultGrid;
  const allShots = shotData?.allShots || [];
  const opponentShots = shotData?.opponentShots || [];

  // Zone/Sector/Line statistics
  const userZoneStats = shotData?.userZoneStats || {};
  const userSectorStats = shotData?.userSectorStats || {};
  const userLineStats = shotData?.userLineStats || {};
  const userOriginZoneStats = shotData?.userOriginZoneStats || {};
  const opponentZoneStats = shotData?.opponentZoneStats || {};
  const opponentSectorStats = shotData?.opponentSectorStats || {};
  const opponentLineStats = shotData?.opponentLineStats || {};

  // Calculate max value for intensity scaling
  const maxHeatmapValue = heatmapGrid
    .flat()
    .reduce((max: number, cell: any) => Math.max(max, cell?.count || 0), 0);

  // Format shot type name for tooltip
  const formatShotName = (stroke: string) => {
    return stroke
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalShots = shotDistribution.reduce(
    (sum: number, shot: any) => sum + shot.count,
    0
  );

  // Check if we have any shot data at all (from any source)
  const hasAnyShotData = totalShots > 0 || 
    (shotData?.allShots && shotData.allShots.length > 0) ||
    (shotData?.opponentShots && shotData.opponentShots.length > 0) ||
    (shotData?.heatmapGrid && shotData.heatmapGrid.some((row: any[]) => 
      row.some((cell: any) => cell?.count > 0)
    ));

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Shot Analysis
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : !shotData || !hasAnyShotData ? (
          <EmptyState
            icon={BubbleChart}
            title="No shot data available."
            description="Shot statistics will appear after matches are played!"
          />
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-1.5">
                  Winning Shots
                </h3>
                <p className="text-2xl font-bold text-[#353535]">
                  {totalShots}
                </p>
                <p className="text-xs text-[#353535] mt-1.5">
                  Point-winning shots across all matches
                </p>
              </div>

              <div className="p-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-1.5">
                  Most Used Shot
                </h3>
                <p className="text-2xl font-bold text-[#353535]">
                  {shotDistribution[0]?.name || "N/A"}
                </p>
                <p className="text-xs text-[#353535] mt-1.5">
                  {shotDistribution[0]?.count || 0} times •{" "}
                  {shotDistribution[0]
                    ? (
                        (shotDistribution[0].count / totalShots) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-4">
                Shot Type Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shotDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {shotDistribution.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            SHOT_TYPE_COLORS[entry.stroke] || "#3c6e71"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap */}
            {heatmapGrid.length > 0 && (
              <ShotLandingHeatmap
                heatmapGrid={heatmapGrid}
                formatShotName={formatShotName}
                maxHeatmapValue={maxHeatmapValue}
                SHOT_TYPE_COLORS={SHOT_TYPE_COLORS}
              />
            )}

            {/* Shot Trajectories - Wagon Wheel */}
            {allShots.length > 0 && (
              <div className="p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-2">
                  Your Shot Trajectories
                </h3>
                <p className="text-xs text-[#353535] mb-4">
                  Detailed view of your shot placement and trajectories across
                  all matches. Filter by shot type to see patterns.
                </p>
                <WagonWheel shots={allShots} />
              </div>
            )}

            {/* Opponent Shot Trajectories */}
            {opponentShots.length > 0 && (
              <div className="p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-2">
                  Opponent Shot Trajectories
                </h3>
                <p className="text-xs text-[#353535] mb-4">
                  Where your opponents&apos; shots land when they score against
                  you. Identify defensive weaknesses and vulnerable zones.
                </p>
                <WagonWheel shots={opponentShots} />
              </div>
            )}

            {/* Zone/Sector/Line Analysis */}
            {totalShots > 0 && (
              <div className="p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-2">
                  Targeting Analysis
                </h3>
                <p className="text-xs text-[#353535] mb-4">
                  Breakdown of zones, sectors, and lines you target, plus where
                  opponents exploit you defensively.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Your Offensive Patterns */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3c6e71] border-b border-[#d9d9d9] pb-3">
                      Your Offensive Patterns
                    </h4>

                    {/* Zones Targeted */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                        Zones Targeted
                      </p>
                      <div className="space-y-2">
                        {Object.entries(userZoneStats)
                          .sort(
                            ([, a], [, b]) =>
                              (b as number) - (a as number)
                          )
                          .map(([zone, count]) => {
                            const total = (
                              Object.values(userZoneStats) as number[]
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              total > 0
                                ? (((count as number) / total) * 100).toFixed(
                                    1
                                  )
                                : 0;
                            return (
                              <div
                                key={zone}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="capitalize text-[#353535] font-semibold">
                                  {zone}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#3c6e71]"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[#353535] w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Sectors Targeted */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                        Sectors Targeted
                      </p>
                      <div className="space-y-2">
                        {Object.entries(userSectorStats)
                          .sort(
                            ([, a], [, b]) =>
                              (b as number) - (a as number)
                          )
                          .map(([sector, count]) => {
                            const total = (
                              Object.values(userSectorStats) as number[]
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              total > 0
                                ? (((count as number) / total) * 100).toFixed(
                                    1
                                  )
                                : 0;
                            return (
                              <div
                                key={sector}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="capitalize text-[#353535] font-semibold">
                                  {sector}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#3c6e71]"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[#353535] w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Lines Used */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                        Lines of Play
                      </p>
                      <div className="space-y-2">
                        {Object.entries(userLineStats)
                          .sort(
                            ([, a], [, b]) =>
                              (b as number) - (a as number)
                          )
                          .filter(([, count]) => (count as number) > 0)
                          .map(([line, count]) => {
                            const total = (
                              Object.values(userLineStats) as number[]
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              total > 0
                                ? (((count as number) / total) * 100).toFixed(
                                    1
                                  )
                                : 0;
                            return (
                              <div
                                key={line}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="capitalize text-[#353535] font-semibold">
                                  {line}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#3c6e71]"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[#353535] w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Playing Position */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                        Playing Position
                      </p>
                      <div className="space-y-2">
                        {Object.entries(userOriginZoneStats)
                          .sort(
                            ([, a], [, b]) =>
                              (b as number) - (a as number)
                          )
                          .filter(([, count]) => (count as number) > 0)
                          .map(([zone, count]) => {
                            const total = (
                              Object.values(userOriginZoneStats) as number[]
                            ).reduce((a: number, b: number) => a + b, 0);
                            const percentage =
                              total > 0
                                ? (((count as number) / total) * 100).toFixed(
                                    1
                                  )
                                : 0;
                            return (
                              <div
                                key={zone}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-[#353535] font-semibold">
                                  {zone.replace(/-/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#3c6e71]"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-[#353535] w-12 text-right">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Defensive Weaknesses */}
                  {opponentShots.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#EF4444] border-b border-[#d9d9d9] pb-3">
                        Your Defensive Weaknesses
                      </h4>

                      {/* Zones Exploited */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                          Zones Where You&apos;re Scored On
                        </p>
                        <div className="space-y-2">
                          {Object.entries(opponentZoneStats)
                            .sort(
                              ([, a], [, b]) =>
                                (b as number) - (a as number)
                            )
                            .map(([zone, count]) => {
                              const total = (
                                Object.values(opponentZoneStats) as number[]
                              ).reduce((a: number, b: number) => a + b, 0);
                              const percentage =
                                total > 0
                                  ? (((count as number) / total) * 100).toFixed(
                                      1
                                    )
                                  : 0;
                              return (
                                <div
                                  key={zone}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="capitalize text-[#353535] font-semibold">
                                    {zone}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#EF4444]"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-bold text-[#353535] w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Sectors Exploited */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                          Sectors Where You&apos;re Vulnerable
                        </p>
                        <div className="space-y-2">
                          {Object.entries(opponentSectorStats)
                            .sort(
                              ([, a], [, b]) =>
                                (b as number) - (a as number)
                            )
                            .map(([sector, count]) => {
                              const total = (
                                Object.values(opponentSectorStats) as number[]
                              ).reduce((a: number, b: number) => a + b, 0);
                              const percentage =
                                total > 0
                                  ? (((count as number) / total) * 100).toFixed(
                                      1
                                    )
                                  : 0;
                              return (
                                <div
                                  key={sector}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="capitalize text-[#353535] font-semibold">
                                    {sector}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#EF4444]"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-bold text-[#353535] w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Lines Exploited */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#353535] mb-3">
                          Lines Opponents Use Against You
                        </p>
                        <div className="space-y-2">
                          {Object.entries(opponentLineStats)
                            .sort(
                              ([, a], [, b]) =>
                                (b as number) - (a as number)
                            )
                            .filter(([, count]) => (count as number) > 0)
                            .map(([line, count]) => {
                              const total = (
                                Object.values(opponentLineStats) as number[]
                              ).reduce((a: number, b: number) => a + b, 0);
                              const percentage =
                                total > 0
                                  ? (((count as number) / total) * 100).toFixed(
                                      1
                                    )
                                  : 0;
                              return (
                                <div
                                  key={line}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="capitalize text-[#353535] font-semibold">
                                    {line}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-[#d9d9d9] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#EF4444]"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-bold text-[#353535] w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
          </div>
          </div>
          );
};

export default ShotAnalysisPage;
