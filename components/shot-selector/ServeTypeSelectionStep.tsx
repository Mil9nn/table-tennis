"use client";

import React from "react";
import { motion } from "framer-motion";
import { SERVE_TYPES } from "@/constants/shot-selector.constants";
import { ServeType } from "@/types/shot.type";
import { cn } from "@/lib/utils";

interface ServeTypeSelectionStepProps {
  selectedServeType: ServeType | null;
  onSelect: (serveType: ServeType) => void;
}

export function ServeTypeSelectionStep({
  selectedServeType,
  onSelect,
}: ServeTypeSelectionStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {SERVE_TYPES.map((serveType, index) => {
          const isSelected = selectedServeType === serveType.value;

          return (
            <motion.button
              key={serveType.value}
              onClick={() => onSelect(serveType.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-left",
                "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {serveType.label}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 ml-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}


