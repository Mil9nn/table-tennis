"use client";

import React from "react";
import { motion } from "framer-motion";
import TableCourt from "@/components/TableCourt";
import { cn } from "@/lib/utils";

interface CourtSelectionStepProps {
  mode: "origin" | "landing";
  selectedPoint: { x: number; y: number } | null;
  originPoint?: { x: number; y: number } | null;
  onSelect: (x: number, y: number) => void;
  restrictToSide?: "left" | "right" | null;
  disabled?: boolean;
}

export function CourtSelectionStep({
  mode,
  selectedPoint,
  originPoint,
  onSelect,
  restrictToSide,
  disabled,
}: CourtSelectionStepProps) {
  const isOrigin = mode === "origin";

  return (
    <div className="space-y-4">
      {/* Court Component */}
      <div className={cn("relative", disabled && "opacity-50 pointer-events-none")}>
        <TableCourt
          onCourtClick={onSelect}
          selectedPoint={selectedPoint}
          originPoint={originPoint}
          label={isOrigin ? "Shot Origin" : "Ball Landing"}
          restrictToSide={restrictToSide}
          mode={mode}
          startScaled={mode === "landing"}
        />
      </div>

      {/* Helper Text */}
      {selectedPoint && (
        <motion.div
          className="text-center text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Point selected. {isOrigin ? "Continue to landing point." : "Ready to submit."}
        </motion.div>
      )}
    </div>
  );
}


