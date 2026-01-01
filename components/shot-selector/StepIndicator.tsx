"use client";

import React from "react";
import { motion } from "framer-motion";
import { SelectionStep } from "@/types/shot-selector.types";

interface StepIndicatorProps {
  currentStep: SelectionStep;
  needsPlayerSelection: boolean;
  isServe: boolean;
  className?: string;
}

export function StepIndicator({
  currentStep,
  needsPlayerSelection,
  isServe,
  className,
}: StepIndicatorProps) {
  const steps: SelectionStep[] = [
    ...(needsPlayerSelection ? (["player"] as SelectionStep[]) : []),
    "shot",
    ...(isServe ? (["serveType"] as SelectionStep[]) : []),
    "origin",
    "landing",
  ];

  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}