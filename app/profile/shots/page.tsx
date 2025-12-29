"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { FeatureGate } from "@/components/FeatureGate";
import { LockedContent } from "@/components/paywall/LockedContent";
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

// SVG Heatmap Component (matches ZoneHeatmap structure)
const ShotLandingHeatmapSVG = ({
  heatmapGrid,
  getHeatmapStyle,
  formatShotName,
  maxHeatmapValue,
  SHOT_TYPE_COLORS,
}: {
  heatmapGrid: {
    count: number;
    dominantStroke: string | null;
    shotTypes: Record<string, number>;
  }[][];
  getHeatmapStyle: (cell: any) => React.CSSProperties;
  formatShotName: (stroke: string) => string;
  maxHeatmapValue: number;
  SHOT_TYPE_COLORS: Record<string, string>;
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Helper to get SVG fill color (converts CSS style to rgba for SVG)
  const getSVGFillColor = (cell: any) => {
    if (!cell || cell.count === 0) {
      return "rgba(148, 163, 184, 0.25)";
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
    
    return baseColor; // Already rgba or rgb
  };

  // Geometry (Table = SVG Canvas) - matching ZoneHeatmap
  const TABLE_WIDTH = 1000;
  const TABLE_HEIGHT = 560;

  // Grid dimensions matching zone-sector analysis (20x9 grid)
  // X-axis: 20 columns (5% width each) aligned with zone boundaries
  // Y-axis: 9 rows (~11.11% height each) aligned with sector boundaries
  const GRID_ROWS = 9;
  const GRID_COLS = 20;

  const CELL_WIDTH = TABLE_WIDTH / GRID_COLS;
  const CELL_HEIGHT = TABLE_HEIGHT / GRID_ROWS;

  const hoveredCellData = hoveredCell && heatmapGrid[hoveredCell.y]?.[hoveredCell.x];

  // Helper to get zone from column index (x)
  const getZoneFromColumn = (x: number): "short" | "mid" | "deep" => {
    if (x <= 4) return "deep";      // Columns 0-4 (0-25%): Left Deep
    if (x <= 7) return "mid";       // Columns 5-7 (25-40%): Left Mid
    if (x <= 9) return "short";     // Columns 8-9 (40-50%): Left Short
    if (x <= 11) return "short";    // Columns 10-11 (50-60%): Right Short
    if (x <= 14) return "mid";      // Columns 12-14 (60-75%): Right Mid
    return "deep";                  // Columns 15-19 (75-100%): Right Deep
  };

  // Helper to get sector from row index (y)
  const getSectorFromRow = (y: number): "backhand" | "crossover" | "forehand" => {
    if (y <= 2) return "backhand";   // Rows 0-2 (0-33.33%): Top/Backhand
    if (y <= 5) return "crossover";  // Rows 3-5 (33.33-66.67%): Middle/Crossover
    return "forehand";                // Rows 6-8 (66.67-100%): Bottom/Forehand
  };

  // Helper to format zone name
  const formatZoneName = (zone: "short" | "mid" | "deep"): string => {
    if (zone === "mid") return "Mid";
    return zone.charAt(0).toUpperCase() + zone.slice(1);
  };

  // Helper to format sector name
  const formatSectorName = (sector: "backhand" | "crossover" | "forehand"): string => {
    if (sector === "crossover") return "Crossover";
    return sector.charAt(0).toUpperCase() + sector.slice(1);
  };

  // Get zone-sector label for hovered cell
  const getZoneSectorLabel = (x: number, y: number): string => {
    const zone = getZoneFromColumn(x);
    const sector = getSectorFromRow(y);
    return `${formatZoneName(zone)} ${formatSectorName(sector)}`;
  };

  // Tooltip positioning
  const tooltipLeft = hoveredCell
    ? ((hoveredCell.x + 0.5) / GRID_COLS) * 100
    : 0;

  const tooltipTopRaw = hoveredCell
    ? ((hoveredCell.y + 0.5) / GRID_ROWS) * 100
    : 0;

  const tooltipTop = Math.min(Math.max(tooltipTopRaw, 10), 90);
  const isRightSide = tooltipLeft > 65;

  const tooltipStyle: React.CSSProperties = {
    left: isRightSide ? "auto" : `${tooltipLeft}%`,
    right: isRightSide ? `${100 - tooltipLeft}%` : "auto",
    top: `${tooltipTop}%`,
    transform: isRightSide
      ? "translate(-12px, -50%)"
      : "translate(12px, -50%)",
  };

  return (
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

        {/* Center Line (white, semi-transparent) */}
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

        {/* Minor grid lines (faded) - All cell divisions */}
        {/* Vertical lines for all 20 columns */}
        {Array.from({ length: GRID_COLS - 1 }, (_, i) => {
          const x = (i + 1) * CELL_WIDTH;
          // Skip zone dividing lines (they'll be drawn separately with firm styling)
          const isZoneLine = 
            Math.abs(x - TABLE_WIDTH * 0.25) < 1 ||
            Math.abs(x - TABLE_WIDTH * 0.40) < 1 ||
            Math.abs(x - TABLE_WIDTH * 0.50) < 1 ||
            Math.abs(x - TABLE_WIDTH * 0.60) < 1 ||
            Math.abs(x - TABLE_WIDTH * 0.75) < 1;
          
          if (isZoneLine) return null;
          
          return (
            <line
              key={`v-grid-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={TABLE_HEIGHT}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.15}
            />
          );
        })}

        {/* Horizontal lines for all 9 rows */}
        {Array.from({ length: GRID_ROWS - 1 }, (_, i) => {
          const y = (i + 1) * CELL_HEIGHT;
          // Skip sector dividing lines (they'll be drawn separately with firm styling)
          const isSectorLine = 
            Math.abs(y - TABLE_HEIGHT * 0.3333) < 1 ||
            Math.abs(y - TABLE_HEIGHT * 0.6667) < 1;
          
          if (isSectorLine) return null;
          
          return (
            <line
              key={`h-grid-${i}`}
              x1={0}
              y1={y}
              x2={TABLE_WIDTH}
              y2={y}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.15}
            />
          );
        })}

        {/* Heatmap Cells */}
        {heatmapGrid.map((row, y) =>
          row.map((cell, x) => {
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
            const fillColor = getSVGFillColor(cell);

            return (
              <g key={`${x}-${y}`}>
                <rect
                  x={x * CELL_WIDTH}
                  y={y * CELL_HEIGHT}
                  width={CELL_WIDTH}
                  height={CELL_HEIGHT}
                  fill={fillColor}
                  stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.25)"}
                  strokeWidth={isHovered ? 4 : 1}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHoveredCell({ x, y })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    cursor: cell?.count > 0 ? "pointer" : "default",
                  }}
                />
              </g>
            );
          })
        )}

        {/* Firm Zone dividing lines (vertical) - Drawn on top of cells */}
        {/* Left side divisions */}
        <line
          x1={TABLE_WIDTH * 0.25}
          y1={0}
          x2={TABLE_WIDTH * 0.25}
          y2={TABLE_HEIGHT}
          stroke="#000000"
          strokeWidth={3}
        />
        <line
          x1={TABLE_WIDTH * 0.40}
          y1={0}
          x2={TABLE_WIDTH * 0.40}
          y2={TABLE_HEIGHT}
          stroke="#000000"
          strokeWidth={3}
        />
        {/* Center line (net) - already drawn, but also a zone boundary */}
        {/* Right side divisions */}
        <line
          x1={TABLE_WIDTH * 0.60}
          y1={0}
          x2={TABLE_WIDTH * 0.60}
          y2={TABLE_HEIGHT}
          stroke="#000000"
          strokeWidth={3}
        />
        <line
          x1={TABLE_WIDTH * 0.75}
          y1={0}
          x2={TABLE_WIDTH * 0.75}
          y2={TABLE_HEIGHT}
          stroke="#000000"
          strokeWidth={3}
        />

        {/* Firm Sector dividing lines (horizontal) - Drawn on top of cells */}
        <line
          x1={0}
          y1={TABLE_HEIGHT * 0.3333}
          x2={TABLE_WIDTH}
          y2={TABLE_HEIGHT * 0.3333}
          stroke="#000000"
          strokeWidth={3}
        />
        <line
          x1={0}
          y1={TABLE_HEIGHT * 0.6667}
          x2={TABLE_WIDTH}
          y2={TABLE_HEIGHT * 0.6667}
          stroke="#000000"
          strokeWidth={3}
        />
      </svg>

      {/* Tooltip - Show for all cells, including empty ones */}
      {hoveredCell && (
        <div
          className="absolute z-20 bg-[#353535] text-white text-[9px] rounded-lg px-2 py-1.5 shadow-lg min-w-[140px]"
          style={tooltipStyle}
        >
          {/* Zone-Sector Label */}
          <div className="font-bold mb-1.5 text-[10px] border-b border-gray-600 pb-1">
            {getZoneSectorLabel(hoveredCell.x, hoveredCell.y)}
          </div>
          
          {hoveredCellData && hoveredCellData.count > 0 ? (
            <>
              {/* Shot Count */}
              <div className="text-gray-300 mb-1.5">
                <span className="font-semibold">{hoveredCellData.count}</span> shot{hoveredCellData.count > 1 ? "s" : ""}
              </div>

              {/* Dominant Stroke */}
              {hoveredCellData.dominantStroke && (
                <div className="mb-1.5">
                  <span className="text-gray-400 text-[8px]">Dominant: </span>
                  <span className="font-semibold">
                    {formatShotName(hoveredCellData.dominantStroke)}
                  </span>
                </div>
              )}

              {/* Shot Type Breakdown */}
              {hoveredCellData.shotTypes &&
                Object.keys(hoveredCellData.shotTypes).length > 1 && (
                  <div className="border-t border-gray-700 mt-1.5 pt-1.5 text-gray-400">
                    <div className="text-[8px] mb-1 text-gray-500">Breakdown:</div>
                    {Object.entries(hoveredCellData.shotTypes)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([stroke, count]) => (
                        <div key={stroke} className="text-[8px] flex justify-between gap-2">
                          <span>{formatShotName(stroke)}:</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
            </>
          ) : (
            <div className="text-gray-400 text-[9px]">
              No shots in this zone
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ShotAnalysisPage = ({ userId }: ShotAnalysisPageProps = {}) => {
  const router = useRouter();
  const [shotData, setShotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShotAnalysis = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/shots-analysis`);
        setShotData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch shot analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShotAnalysis();
  }, []);

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

  // Get heatmap cell style based on dominant shot type and intensity
  const getHeatmapStyle = (cell: {
    count: number;
    dominantStroke: string | null;
  }) => {
    if (!cell || cell.count === 0) {
      return { backgroundColor: "rgba(148, 163, 184, 0.25)" }; // Semi-transparent gray overlay on blue background
    }

    const baseColor =
      cell.dominantStroke && SHOT_TYPE_COLORS[cell.dominantStroke]
        ? SHOT_TYPE_COLORS[cell.dominantStroke]
        : "#3c6e71";

    // Calculate opacity based on intensity (0.3 to 1.0 range)
    const intensity = Math.min(cell.count / maxHeatmapValue, 1);
    const opacity = 0.3 + intensity * 0.7;

    return {
      backgroundColor: baseColor,
      opacity,
    };
  };

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

        <FeatureGate
          feature="shotAnalysisAccess"
          fallback={<LockedContent feature="shotAnalysisAccess" />}
        >
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
              <Loader2 className="animate-spin text-[#3c6e71]" />
            </div>
          ) : totalShots === 0 ? (
            <EmptyState
              icon={BubbleChart}
              title="No shot data available."
              description="Shot statistics will appear after matches are played!"
            />
          ) : (
            <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Winning Shots
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {totalShots}
                </p>
                <p className="text-xs text-[#353535] mt-3">
                  Point-winning shots across all matches
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Most Used Shot
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {shotDistribution[0]?.name || "N/A"}
                </p>
                <p className="text-xs text-[#353535] mt-3">
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
            <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-6">
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
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                  Shot Landing Heatmap
                </h3>
                <p className="text-xs text-[#353535] mb-6">
                  Aggregated shot landing positions from all your matches.
                  Colors represent dominant shot type in each zone. Brighter =
                  more shots.
                </p>

                <ShotLandingHeatmapSVG heatmapGrid={heatmapGrid} getHeatmapStyle={getHeatmapStyle} formatShotName={formatShotName} maxHeatmapValue={maxHeatmapValue} SHOT_TYPE_COLORS={SHOT_TYPE_COLORS} />

                {/* Legend */}
                <div className="mt-6">
                  <div className="text-center">
                    <p className="text-xs font-bold text-[#353535]">
                      Left Side ← | → Right Side
                    </p>
                    <p className="text-[10px] text-[#666666] mt-1">
                      (All shots normalized to consistent perspective)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Shot Trajectories - Wagon Wheel */}
            {allShots.length > 0 && (
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                  Your Shot Trajectories
                </h3>
                <p className="text-xs text-[#353535] mb-6">
                  Detailed view of your shot placement and trajectories across
                  all matches. Filter by shot type to see patterns.
                </p>
                <WagonWheel shots={allShots} />
              </div>
            )}

            {/* Opponent Shot Trajectories */}
            {opponentShots.length > 0 && (
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                  Opponent Shot Trajectories
                </h3>
                <p className="text-xs text-[#353535] mb-6">
                  Where your opponents&apos; shots land when they score against
                  you. Identify defensive weaknesses and vulnerable zones.
                </p>
                <WagonWheel shots={opponentShots} />
              </div>
            )}

            {/* Zone/Sector/Line Analysis */}
            {totalShots > 0 && (
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-3">
                  Targeting Analysis
                </h3>
                <p className="text-xs text-[#353535] mb-6">
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
        </FeatureGate>
      </div>
    </div>
  );
};

export default ShotAnalysisPage;
