"use client";

import { Shot } from "@/types/shot.type";
import { SHOT_TYPE_COLORS } from "@/constants/constants";
import { useState } from "react";
import { formatStrokeName } from "@/lib/utils";
import { getShotColor } from "@/lib/match-stats-utils";
import { generateShortCommentary } from "@/lib/shot-commentary-utils";
import { motion } from "framer-motion";

interface WagonWheelProps {
  shots: Shot[];
  title?: string;
  animateOnce?: boolean;
}

export default function WagonWheel({ shots, title, animateOnce }: WagonWheelProps) {
  const [hoveredShot, setHoveredShot] = useState<number | null>(null);
  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);

  const validShots = shots.filter(
    (s) =>
      s.originX != null &&
      s.originY != null &&
      s.landingX != null &&
      s.landingY != null
  );

  if (validShots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-gray-500 font-medium">No shot data available</p>
        <p className="text-sm text-gray-400 mt-1">
          Start tracking to see shot patterns
        </p>
      </div>
    );
  }

  const strokeTypes = Array.from(
    new Set(validShots.map((s) => s.stroke).filter(Boolean))
  );

  const displayShots = selectedStroke
    ? validShots.filter((s) => s.stroke === selectedStroke)
    : validShots;
  

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedStroke(null);
            
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            selectedStroke === null
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {strokeTypes.map((stroke) => {
          const count = validShots.filter((s) => s.stroke === stroke).length;
          const color = getShotColor(stroke!);
          return (
            <button
              key={stroke}
              onClick={() => {
                setSelectedStroke(stroke!);
                
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedStroke === stroke
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={{
                backgroundColor: selectedStroke === stroke ? color : undefined,
              }}
            >
              {formatStrokeName(stroke!)}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 548 305"
          className="w-full h-auto"
          style={{ maxHeight: "600px" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="floorGradient">
              <stop offset="0%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor="#D1D5DB" />
            </radialGradient>
            <linearGradient
              id="tableGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>

          {/* Floor/Off-table area (visual context) */}
          <rect
            x="0"
            y="0"
            width="548"
            height="305"
            fill="#000"
            stroke="#fff"
            strokeWidth={5}
            rx="8"
          />

          {/* Table surface - all landing points are here, origin can be anywhere */}
          <rect
            x="137"
            y="76.25"
            width="274"
            height="152.5"
            fill="url(#tableGradient)"
            rx="4"
            stroke="#1E3A8A"
            strokeWidth="2"
            opacity="0.95"
          />

          {/* Table texture overlay */}
          <rect
            x="137"
            y="76.25"
            width="274"
            height="152.5"
            fill="url(#tablePattern)"
            rx="4"
            opacity="0.1"
          />

          {/* Center line on table */}
          <line
            x1="274"
            y1="76.25"
            x2="274"
            y2="228.75"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.5"
          />

          {/* Net */}
          <line
            x1="274"
            y1="76.25"
            x2="274"
            y2="228.75"
            stroke="#fff"
            strokeWidth="4"
            opacity="0.7"
          />

          {/* Net posts */}
          <circle
            cx="274"
            cy="76.25"
            r="6"
            fill="#1F2937"
            stroke="#374151"
            strokeWidth="1"
          />
          <circle
            cx="274"
            cy="228.75"
            r="6"
            fill="#1F2937"
            stroke="#374151"
            strokeWidth="1"
          />

          {/* Table edge lines */}
          <line
            x1="137"
            y1="152.5"
            x2="411"
            y2="152.5"
            stroke="white"
            strokeWidth="0.5"
            opacity="0.2"
          />

          {/* Reference grid (subtle visual guides) */}
          <g opacity="0.1">
            {/* Vertical lines */}
            {[0, 137, 274, 411, 548].map((x) => (
              <line
                key={`v-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="305"
                stroke="#6B7280"
                strokeWidth="0.5"
              />
            ))}
            {/* Horizontal lines */}
            {[0, 76.25, 152.5, 228.75, 305].map((y) => (
              <line
                key={`h-${y}`}
                x1="0"
                y1={y}
                x2="548"
                y2={y}
                stroke="#6B7280"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {displayShots.map((shot, idx) => {
            // Origin: -50 to 150 range maps to full viewBox (0-548 x, 0-305 y)
            // Landing: 0 to 100 range maps to table area (137-411 x, 76.25-228.75 y)
            const x1 = ((shot.originX! + 50) / 200) * 548;
            const y1 = ((shot.originY! + 50) / 200) * 305;
            const x2 = 137 + (shot.landingX! / 100) * 274;
            const y2 = 76.25 + (shot.landingY! / 100) * 152.5;

            const isHovered = hoveredShot === idx;
            const shotColor = getShotColor(shot.stroke!);

            // Check if origin is on or off table
            const originOnTable =
              shot.originX! >= 0 &&
              shot.originX! <= 100 &&
              shot.originY! >= 0 &&
              shot.originY! <= 100;

            return (
              <motion.g
                key={idx}
                onMouseEnter={() => setHoveredShot(idx)}
                onMouseLeave={() => setHoveredShot(null)}
                className="cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: hoveredShot !== null && !isHovered ? 0.3 : 1
                }}
                transition={{ 
                  delay: idx * 0.03,
                  duration: 0.5,
                  ease: "easeOut"
                }}
              >
                {/* Shot trajectory line */}
                <motion.line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={shotColor}
                  strokeWidth={isHovered ? 2 : 1}
                  strokeLinecap="round"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 0.85, pathLength: 1 }}
                  transition={{ 
                    delay: idx * 0.03 + 0.1,
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                  style={{ transition: "stroke-width 0.2s" }}
                />

                {/* Origin marker (where player hit from) */}
                <motion.circle
                  cx={x1}
                  cy={y1}
                  r={isHovered ? 5 : 2.5}
                  fill={originOnTable ? shotColor : "#9CA3AF"}
                  stroke="white"
                  strokeWidth="0.5"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  transition={{ 
                    delay: idx * 0.03 + 0.2,
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                  style={{ transition: "r 0.2s" }}
                />

                {/* Landing marker (where ball landed) */}
                <motion.circle
                  cx={x2}
                  cy={y2}
                  r={isHovered ? 7 : 4}
                  fill="#FFD700"
                  stroke="white"
                  strokeWidth={isHovered ? "2" : "1"}
                  filter={isHovered ? "url(#glow)" : undefined}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: idx * 0.03 + 0.3,
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                  style={{ transition: "r 0.2s, stroke-width 0.2s" }}
                />
              </motion.g>
            );
          })}
        </svg>

        {hoveredShot !== null && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-2xl border-2 border-gray-300 max-w-xs">
            <p className="text-xs font-bold text-gray-800 mb-1">
              Point #{hoveredShot + 1}
            </p>
            <p className="text-xs font-medium text-blue-600 mb-2">
              {formatStrokeName(displayShots[hoveredShot].stroke || "Unknown")}
            </p>

            {/* Advanced Commentary */}
            <div className="mb-2 pb-2 border-b border-gray-200">
              <p className="text-[10px] text-gray-700 italic leading-relaxed">
                {generateShortCommentary(displayShots[hoveredShot])}
              </p>
            </div>

            <div className="space-y-1 text-[10px] text-gray-600">
              <p>
                Origin: ({displayShots[hoveredShot].originX?.toFixed(0)},{" "}
                {displayShots[hoveredShot].originY?.toFixed(0)})
              </p>
              <p>
                Landing: ({displayShots[hoveredShot].landingX?.toFixed(0)},{" "}
                {displayShots[hoveredShot].landingY?.toFixed(0)})
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 ">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FFD700] border border-white"></div>
          <span className="font-medium">Landing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500"></div>
          <span className="font-medium">Shot trajectory</span>
        </div>
      </div>
    </div>
  );
}
