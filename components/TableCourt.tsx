"use client";

import { useState } from "react";

interface TableCourtProps {
  onCourtClick: (x: number, y: number) => void;
  selectedPoint?: { x: number; y: number } | null;
  originPoint?: { x: number; y: number } | null; // Shows racquet at origin when picking landing
  label: string;
  restrictToSide?: "left" | "right" | null;
  mode?: "origin" | "landing"; // origin allows off-table, landing requires on-table
}

export default function TableCourt({
  onCourtClick,
  selectedPoint,
  originPoint,
  label,
  restrictToSide = null,
  mode = "origin",
}: TableCourtProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Map click position to extended coordinate system (-100 to 200)
    // The clickable area represents: 33.33% margin + 33.33% table + 33.33% margin
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;

    // Convert to -100 to 200 range
    const x = relativeX * 300 - 100;
    const y = relativeY * 300 - 100;

    // Landing must be on-table (point scored), origin can be anywhere (player position)
    if (mode === "landing" && (x < 0 || x > 100 || y < 0 || y > 100)) {
      return; // Landing must be on table surface
    }

    // Validate click is on allowed side (check against table area 0-100 for side restriction)
    if (restrictToSide === "left" && x > 50) {
      return; // Clicked right when restricted to left
    }
    if (restrictToSide === "right" && x < 50) {
      return; // Clicked left when restricted to right
    }

    onCourtClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    const x = relativeX * 300 - 100;
    const y = relativeY * 300 - 100;

    // Determine zone for tooltip
    const isOnTable = x >= 0 && x <= 100 && y >= 0 && y <= 100;
    if (isOnTable) {
      setHoveredZone("On Table");
    } else {
      setHoveredZone("Off Table");
    }

    // Check if position is valid for clicking
    const isValidPosition = (() => {
      if (mode === "landing" && !isOnTable) return false;
      if (restrictToSide === "left" && x > 50) return false;
      if (restrictToSide === "right" && x < 50) return false;
      return true;
    })();

    if (isValidPosition) {
      setHoverPosition({ x, y });
    } else {
      setHoverPosition(null);
    }
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
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
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
        className="relative w-full max-w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto aspect-[2.74/1.525] bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 shadow-2xl cursor-crosshair hover:shadow-3xl transition-all duration-300 overflow-hidden border border-gray-300"
      >
        {/* Floor/Off-table area with modern gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-200/50 via-gray-300/30 to-gray-400/20" />

        {/* Table surface - centered with padding for off-table area */}
        <div
          className="absolute bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 shadow-[0_8px_30px_rgb(37,99,235,0.3)]"
          style={{
            left: "33.33%",
            top: "33.33%",
            width: "33.33%",
            height: "33.33%",
          }}
        >
          {/* Table texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />

          {/* Center line on table */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/90 shadow-lg" />

          {/* Net */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gray-700 via-gray-800 to-gray-700 -translate-x-1/2 shadow-xl" />
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
          <div className="absolute left-0 right-0 top-[33.33%] h-[1px] bg-white/40 pointer-events-none" />
          <div className="absolute left-0 right-0 top-[66.67%] h-[1px] bg-white/40 pointer-events-none" />

          {/* Zone dividing lines (vertical) - Deep, Mid, Short on each side */}
          {/* Left side divisions */}
          <div className="absolute top-0 bottom-0 left-[16.67%] w-[1px] bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-[33.33%] w-[1px] bg-white/40 pointer-events-none" />
          {/* Right side divisions */}
          <div className="absolute top-0 bottom-0 left-[66.67%] w-[1px] bg-white/40 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-[83.33%] w-[1px] bg-white/40 pointer-events-none" />
        </div>

        {/* Distance zone grid lines */}
        {/* 70cm boundary - left side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-400/60 pointer-events-none z-20"
          style={{ left: `${((0 - 26 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -left-12 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            70cm
          </div>
        </div>

        {/* 2m boundary - left side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-orange-400/60 pointer-events-none z-20"
          style={{ left: `${((0 - 73 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -left-10 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            2m
          </div>
        </div>

        {/* 70cm boundary - right side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-400/60 pointer-events-none z-20"
          style={{ left: `${((100 + 26 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -right-12 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            70cm
          </div>
        </div>

        {/* 2m boundary - right side (vertical) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-orange-400/60 pointer-events-none z-20"
          style={{ left: `${((100 + 73 + 100) / 300) * 100}%` }}
        >
          <div className="absolute top-[10%] -right-10 text-[8px] font-normal text-gray-600/35 px-1 whitespace-nowrap">
            2m
          </div>
        </div>

        {/* 70cm boundary - top (horizontal) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-yellow-400/60 pointer-events-none z-20"
          style={{ top: `${((0 - 26 + 100) / 300) * 100}%` }}
        />

        {/* 2m boundary - top (horizontal) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-orange-400/60 pointer-events-none z-20"
          style={{ top: `${((0 - 73 + 100) / 300) * 100}%` }}
        />

        {/* 70cm boundary - bottom (horizontal) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-yellow-400/60 pointer-events-none z-20"
          style={{ top: `${((100 + 26 + 100) / 300) * 100}%` }}
        />

        {/* 2m boundary - bottom (horizontal) */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-orange-400/60 pointer-events-none z-20"
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
              className={`absolute top-0 bottom-0 bg-black/10 pointer-events-none backdrop-blur-[1px] ${
                restrictToSide === "left" ? "right-0 w-1/2" : "left-0 w-1/2"
              }`}
            />
          </>
        )}

        {/* Hover indicator - Racquet for origin mode */}
        {hoverPosition && mode === "origin" && (
          <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none opacity-90"
            style={{
              left: `${coordToPercent(hoverPosition.x)}%`,
              top: `${coordToPercent(hoverPosition.y)}%`,
            }}
          >
            {/* Soft shadow */}
            <ellipse
              cx="52"
              cy="70"
              rx="28"
              ry="10"
              fill="black"
              opacity="0.15"
            />

            {/* Paddle head with modern gradient */}
            <defs>
              <radialGradient id="rubberGrad" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff5b5b" />
                <stop offset="60%" stopColor="#e02626" />
                <stop offset="100%" stopColor="#b91c1c" />
              </radialGradient>

              <linearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c49a6c" />
                <stop offset="100%" stopColor="#8b5e2a" />
              </linearGradient>
            </defs>

            {/* Paddle head */}
            <ellipse
              cx="50"
              cy="35"
              rx="28"
              ry="32"
              fill="url(#rubberGrad)"
              stroke="#7f1d1d"
              strokeWidth="2"
            />

            {/* Subtle highlight */}
            <ellipse
              cx="38"
              cy="25"
              rx="10"
              ry="14"
              fill="white"
              opacity="0.15"
            />

            {/* Handle */}
            <rect
              x="44"
              y="55"
              width="12"
              height="32"
              rx="4"
              fill="url(#handleGrad)"
            />

            {/* Handle edge shading */}
            <rect
              x="44"
              y="55"
              width="12"
              height="32"
              rx="4"
              fill="black"
              opacity="0.12"
            />
          </svg>
        )}

        {/* Fixed origin racquet - shows where shot originated when picking landing */}
        {originPoint && mode === "landing" && (
          <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-lg"
            style={{
              left: `${coordToPercent(originPoint.x)}%`,
              top: `${coordToPercent(originPoint.y)}%`,
            }}
          >
            {/* Soft shadow */}
            <ellipse cx="52" cy="70" rx="28" ry="10" fill="black" opacity="0.15" />

            <defs>
              <radialGradient id="rubberGradOrigin" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff5b5b" />
                <stop offset="60%" stopColor="#e02626" />
                <stop offset="100%" stopColor="#b91c1c" />
              </radialGradient>
              <linearGradient id="handleGradOrigin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c49a6c" />
                <stop offset="100%" stopColor="#8b5e2a" />
              </linearGradient>
            </defs>

            {/* Paddle head */}
            <ellipse
              cx="50"
              cy="35"
              rx="28"
              ry="32"
              fill="url(#rubberGradOrigin)"
              stroke="#7f1d1d"
              strokeWidth="2"
            />

            {/* Subtle highlight */}
            <ellipse cx="38" cy="25" rx="10" ry="14" fill="white" opacity="0.15" />

            {/* Handle */}
            <rect x="44" y="55" width="12" height="32" rx="4" fill="url(#handleGradOrigin)" />

            {/* Handle edge shading */}
            <rect x="44" y="55" width="12" height="32" rx="4" fill="black" opacity="0.12" />
          </svg>
        )}

        {/* Selected point marker with enhanced styling */}
        {selectedPoint && (
          <>
            {mode === "origin" ? (
              /* Table Tennis Racquet indicator for shot origin */
              <>
                {/* Ripple effect */}
                <div
                  className="absolute w-12 h-12 bg-red-500/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping z-10"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                {/* Racquet SVG */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 100 100"
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 drop-shadow-lg"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                >
                  {/* Soft shadow */}
                  <ellipse cx="52" cy="70" rx="28" ry="10" fill="black" opacity="0.15" />

                  <defs>
                    <radialGradient id="rubberGradSelected" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#ff5b5b" />
                      <stop offset="60%" stopColor="#e02626" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </radialGradient>
                    <linearGradient id="handleGradSelected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c49a6c" />
                      <stop offset="100%" stopColor="#8b5e2a" />
                    </linearGradient>
                  </defs>

                  {/* Paddle head */}
                  <ellipse
                    cx="50"
                    cy="35"
                    rx="28"
                    ry="32"
                    fill="url(#rubberGradSelected)"
                    stroke="#7f1d1d"
                    strokeWidth="2"
                  />

                  {/* Subtle highlight */}
                  <ellipse cx="38" cy="25" rx="10" ry="14" fill="white" opacity="0.15" />

                  {/* Handle */}
                  <rect x="44" y="55" width="12" height="32" rx="4" fill="url(#handleGradSelected)" />

                  {/* Handle edge shading */}
                  <rect x="44" y="55" width="12" height="32" rx="4" fill="black" opacity="0.12" />
                </svg>
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
                  className="absolute w-5 h-5 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.6)] -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/40 animate-pulse" />
                </div>
                {/* Crosshair */}
                <div
                  className="absolute w-[1px] h-4 bg-yellow-400 -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                <div
                  className="absolute w-[1px] h-4 bg-yellow-400 -translate-x-1/2"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                <div
                  className="absolute h-[1px] w-4 bg-yellow-400 -translate-y-1/2 -translate-x-full"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
                <div
                  className="absolute h-[1px] w-4 bg-yellow-400 -translate-y-1/2"
                  style={{
                    left: `${coordToPercent(selectedPoint.x)}%`,
                    top: `${coordToPercent(selectedPoint.y)}%`,
                  }}
                />
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
      </div>
    </div>
  );
}
