"use client";

import { motion } from "framer-motion";

export const WinRateRing = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="36"
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-100 dark:text-zinc-100">
          {percentage}%
        </span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Win</span>
      </div>
    </div>
  );
};

export default WinRateRing;
