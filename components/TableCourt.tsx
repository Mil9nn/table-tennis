"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TableCourtProps {
  onCourtClick: (x: number, y: number) => void;
  selectedPoint?: { x: number; y: number } | null;
  originPoint?: { x: number; y: number } | null; // Shows racquet at origin when picking landing
  label: string;
  restrictToSide?: "left" | "right" | null;
  mode?: "origin" | "landing"; // origin allows off-table, landing requires on-table
  startScaled?: boolean; // Start in scaled mode
}

export default function TableCourt({
  onCourtClick,
  selectedPoint,
  originPoint,
  label,
  restrictToSide = null,
  mode = "origin",
  startScaled = false,
}: TableCourtProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Table scaling state - replaces old zoom functionality
  const [tableScaled, setTableScaled] = useState(startScaled);

  // Helper function to determine if coordinates are on table surface
  const isOnTableSurface = (x: number, y: number): boolean => {
    return x >= 0 && x <= 100 && y >= 0 && y <= 100;
  };

  // Convert click to logical coordinates based on mode
  const getLogicalCoordinates = (
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): { x: number; y: number } => {
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    if (tableScaled) {
      // Scaled mode: entire container is table (0-100)
      const x = relativeX * 100;
      const y = relativeY * 100;
      return { x, y };
    } else {
      // Normal mode: container represents -100 to 200
      const x = relativeX * 300 - 100;
      const y = relativeY * 300 - 100;
      return { x, y };
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = getLogicalCoordinates(e.clientX, e.clientY, rect);

    // CASE 1: First click on table in normal view → enter scaled mode
    if (!tableScaled && isOnTableSurface(x, y)) {
      setTableScaled(true);
      return;
    }

    // CASE 2: Click in scaled mode → place shot
    if (tableScaled) {
      if (restrictToSide === "left" && x > 50) return;
      if (restrictToSide === "right" && x < 50) return;
      onCourtClick(x, y);

      // Only exit scaled mode after placing landing (final step)
      if (mode === "landing") {
        setTableScaled(false);
      }
      // Stay in scaled mode after placing origin
      return;
    }

    // CASE 3: Click in normal view (not on table) → for off-table origin only
    if (mode === "landing" && !isOnTableSurface(x, y)) return;
    if (restrictToSide === "left" && x > 50) return;
    if (restrictToSide === "right" && x < 50) return;
    onCourtClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = getLogicalCoordinates(e.clientX, e.clientY, rect);

    const isOnTable = isOnTableSurface(x, y);
    setHoveredZone(tableScaled && !isOnTable ? "On Table" : (isOnTable ? "On Table" : "Off Table"));

    const isValidPosition = (() => {
      if (tableScaled && !isOnTable) return false;
      if (mode === "landing" && !isOnTable) return false;
      if (restrictToSide === "left" && x > 50) return false;
      if (restrictToSide === "right" && x < 50) return false;
      return true;
    })();

    setHoverPosition(isValidPosition ? { x, y } : null);
  };

  // Convert coordinate from -100 to 200 range to percentage for display
  const coordToPercent = (coord: number) => {
    return ((coord + 100) / 300) * 100;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {hoveredZone && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-linear-to-r from-blue-500 to-purple-500 text-white">
            {hoveredZone}
          </span>
        )}
      </div>
      <div
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredZone(null);
          setHoverPosition(null);
        }}
        className={`relative w-full max-w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto aspect-[2.74/1.525] bg-linear-to-br from-gray-100 via-gray-200 to-gray-300 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border border-gray-300 ${
          tableScaled ? 'cursor-zoom-out' : 'cursor-crosshair'
        }`}
      >
        {/* Transformable content wrapper */}
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: tableScaled ? 3 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 26,
            mass: 0.8,
          }}
          style={{
            transformOrigin: 'center center',
          }}
        >
          {/* Floor/Off-table area with modern gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-gray-200/50 via-gray-300/30 to-gray-400/20" />

          {/* Table surface - centered with padding for off-table area */}
        <div
          className="absolute bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 shadow-[0_8px_30px_rgb(37,99,235,0.3)]"
          style={{
            left: "33.33%",
            top: "33.33%",
            width: "33.33%",
            height: "33.33%",
          }}
        >
          {/* Table texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_50%,transparent_75%,transparent_100%)] bg-size-[20px_20px]" />

          {/* Center line on table */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/90 shadow-lg" />

          {/* Net */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.75 bg-linear-to-b from-gray-700 via-gray-800 to-gray-700 -translate-x-1/2 shadow-xl" />
          <div className="absolute left-1/2 top-0 w-3 h-3 bg-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg border border-gray-600" />
          <div className="absolute left-1/2 bottom-0 w-3 h-3 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 shadow-lg border border-gray-600" />

          {/* Table edge highlight */}
          <div className="absolute inset-0 border-2 border-white/20" />

          {/* Court zones for doubles */}
          <div className="absolute inset-0 grid grid-cols-2 gap-px opacity-15 pointer-events-none">
            <div className="border border-white" />
            <div className="border border-white" />
          </div>

          {/* Sector dividing lines (horizontal) - Backhand, Crossover, Forehand */}
          <div className="absolute left-0 right-0 top-[33.33%] h-px bg-white/40 pointer-events-none" />
          <div className="absolute left-0 right-0 top-[66.67%] h-px bg-white/40 pointer-events-none" />

          {/* Zone dividing lines (vertical) - Deep, Mid, Short on each side */}
          {/* Left side divisions */}
          <div className="absolute top-0 bottom-0 left-[16.67%] w-px bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-[33.33%] w-px bg-white/40 pointer-events-none" />
          {/* Right side divisions */}
          <div className="absolute top-0 bottom-0 left-[66.67%] w-px bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-[83.33%] w-px bg-white/40 pointer-events-none" />
        </div>

        {/* Distance zone grid lines */}
        {/* 70cm boundary - left side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 pointer-events-none z-20"
          style={{ left: `${((0 - 26 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -left-12 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            70cm
          </div>
        </div>

        {/* 2m boundary - left side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-400/60 pointer-events-none z-20"
          style={{ left: `${((0 - 73 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -left-10 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            2m
          </div>
        </div>

        {/* 70cm boundary - right side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 pointer-events-none z-20"
          style={{ left: `${((100 + 26 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -right-12 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            70cm
          </div>
        </div>

        {/* 2m boundary - right side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-400/60 pointer-events-none z-20"
          style={{ left: `${((100 + 73 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -right-10 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            2m
          </div>
        </div>

        {/* 70cm boundary - top (horizontal) */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-yellow-400/60 pointer-events-none z-20"
          style={{ top: `${((0 - 26 + 100) / 300) * 100}%` }}
        />

        {/* 2m boundary - top (horizontal) */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-orange-400/60 pointer-events-none z-20"
          style={{ top: `${((0 - 73 + 100) / 300) * 100}%` }}
        />

        {/* 70cm boundary - bottom (horizontal) */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-yellow-400/60 pointer-events-none z-20"
          style={{ top: `${((100 + 26 + 100) / 300) * 100}%` }}
        />

        {/* 2m boundary - bottom (horizontal) */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-orange-400/60 pointer-events-none z-20"
          style={{ top: `${((100 + 73 + 100) / 300) * 100}%` }}
        />

        {/* Sector labels on table - positioned directly on the zones */}
        <div className="absolute left-[33.33%] top-[33.33%] w-[33.33%] h-[33.33%] pointer-events-none z-30">
          {/* Backhand zone label */}
          <div className="absolute left-2 top-[16.67%] text-[8px] font-light text-white/25">
            Backhand
          </div>

          {/* Crossover zone label */}
          <div className="absolute left-2 top-[50%] text-[8px] font-light text-white/25">
            Crossover
          </div>

          {/* Forehand zone label */}
          <div className="absolute left-2 top-[83.33%] text-[8px] font-light text-white/25">
            Forehand
          </div>
        </div>

        {/* Zone labels on table - positioned directly on the zones */}
        <div className="absolute left-[33.33%] top-[33.33%] w-[33.33%] h-[33.33%] pointer-events-none z-30">
          {/* Left side zones */}
          <div className="absolute left-[8.33%] top-1 text-[7px] font-light text-white/25">
            Deep
          </div>
          <div className="absolute left-[25%] top-1 text-[7px] font-light text-white/25">
            Mid
          </div>
          <div className="absolute left-[41.67%] top-1 text-[7px] font-light text-white/25">
            Short
          </div>

          {/* Right side zones */}
          <div className="absolute left-[58.33%] top-1 text-[7px] font-light text-white/25">
            Short
          </div>
          <div className="absolute left-[75%] top-1 text-[7px] font-light text-white/25">
            Mid
          </div>
          <div className="absolute left-[91.67%] top-1 text-[7px] font-light text-white/25">
            Deep
          </div>
        </div>

        {/* Overlay to show restricted/allowed sides */}
        {restrictToSide && (
          <>
            {/* Gray out non-clickable side */}
            <div
              className={`absolute top-0 bottom-0 bg-black/10 pointer-events-none ${
                restrictToSide === "left" ? "right-0 w-1/2" : "left-0 w-1/2"
              }`}
            />
          </>
        )}

        {/* Fixed origin indicator - shows where shot originated when picking landing */}
        {originPoint && mode === "landing" && (
          <>
            {/* Main marker */}
            <div
              className="absolute w-2 h-2 bg-linear-to-br from-red-400 to-red-600 rounded-full border border-white shadow-[0_0_20px_rgba(239,68,68,0.6)] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{
                left: `${coordToPercent(originPoint.x)}%`,
                top: `${coordToPercent(originPoint.y)}%`,
              }}
            >
              <div className="absolute inset-0 rounded-full bg-white/40" />
            </div>
          </>
        )}

        {/* Selected point marker with enhanced styling */}
        {selectedPoint && (
          <>
            {mode === "origin" ? (
              /* Origin point marker (shot origin) */
              <>
                {/* Ripple effect */}
                <div
                  className="absolute w-8 h-8 bg-red-500/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                {/* Main marker */}
                <div
                  className="absolute w-2 h-2 bg-linear-to-br from-red-400 to-red-600 rounded-full border border-white shadow-[0_0_20px_rgba(239,68,68,0.6)] -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-pulse" />
                </div>
              </>
            ) : (
              /* Landing point marker (ball landing) */
              <>
                {/* Ripple effect */}
                <div
                  className="absolute w-8 h-8 bg-yellow-400/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                {/* Main marker */}
                <div
                  className="absolute w-2 h-2 bg-linear-to-br from-yellow-300 to-orange-400 rounded-full border border-white shadow-[0_0_20px_rgba(251,191,36,0.6)] -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-pulse" />
                </div>
              </>
            )}
          </>
        )}

        {/* Grid overlay for better positioning */}
        <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-20 transition-opacity">
          <div className="h-full w-full grid grid-cols-8 grid-rows-8">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-400/30" />
            ))}
          </div>
        </div>

        {/* Corner labels for orientation */}
        <div className="absolute top-1 left-1 text-[8px] text-gray-500 font-mono opacity-50">
          (-100,-100)
        </div>
        <div className="absolute top-1 right-1 text-[8px] text-gray-500 font-mono opacity-50">
          (200,-100)
        </div>
        <div className="absolute bottom-1 left-1 text-[8px] text-gray-500 font-mono opacity-50">
          (-100,200)
        </div>
        <div className="absolute bottom-1 right-1 text-[8px] text-gray-500 font-mono opacity-50">
          (200,200)
        </div>
        </motion.div>
      </div>
    </div>
  );
}
