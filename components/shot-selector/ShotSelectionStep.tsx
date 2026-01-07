"use client";

import React from "react";
import { shotCategories } from "@/constants/constants";
import { formatStrokeName, cn } from "@/lib/utils";
import { Stroke } from "@/types/shot.type";

interface ShotSelectionStepProps {
  selectedShot: Stroke | null;
  onSelect: (shot: Stroke) => void;
}

// Helper to get shot type name (e.g., "drive" from "forehand_drive")
const getShotTypeName = (stroke: string): string => {
  const parts = stroke.split("_");
  if (parts.length >= 2) {
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  }
  return stroke;
};

// Helper to check if category has both FH and BH variants
const hasBothVariants = (shots: Array<{ value: string; label: string }>): boolean => {
  const hasFH = shots.some(s => s.value.startsWith("forehand_"));
  const hasBH = shots.some(s => s.value.startsWith("backhand_"));
  return hasFH && hasBH && shots.length === 2;
};

export function ShotSelectionStep({
  selectedShot,
  onSelect,
}: ShotSelectionStepProps) {
  return (
    <div className="space-y-2">
      <div className="max-h-[520px] p-2 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {Object.entries(shotCategories).flatMap(([category, categoryData]) => {
            const bothVariants = hasBothVariants(categoryData.shots);
            
            if (bothVariants) {
              const fhShot = categoryData.shots.find(s => s.value.startsWith("forehand_"));
              const bhShot = categoryData.shots.find(s => s.value.startsWith("backhand_"));
              const fhValue = fhShot?.value;
              const bhValue = bhShot?.value;
              const isFHSelected = selectedShot === fhValue;
              const isBHSelected = selectedShot === bhValue;
              
              return (
                // Grouped FH/BH variant
                <div key={category} className="rounded-lg border border-gray-200 bg-white overflow-hidden shrink-0">
                  <div className="flex items-center divide-x divide-gray-200">
                    {/* Shot type label */}
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 min-w-[70px]">
                      {getShotTypeName(categoryData.shots[0].value)}
                    </div>
                    
                    {/* FH button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fhValue) onSelect(fhValue as Stroke);
                      }}
                      className={cn(
                        "px-2 py-1.5 text-xs transition-colors min-w-[40px]",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                        isFHSelected
                          ? "bg-blue-500 text-white font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      FH
                    </button>
                    
                    {/* BH button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (bhValue) onSelect(bhValue as Stroke);
                      }}
                      className={cn(
                        "px-2 py-1.5 text-xs transition-colors min-w-[40px]",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                        isBHSelected
                          ? "bg-blue-500 text-white font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      BH
                    </button>
                  </div>
                </div>
              );
            } else {
              // Individual shots (for net_point, serve_point, etc.)
              return categoryData.shots.map((shot) => {
                const isSelected = selectedShot === shot.value;

                return (
                  <button
                    key={shot.value}
                    type="button"
                    onClick={() => onSelect(shot.value as Stroke)}
                    className={cn(
                      "rounded-lg border p-1.5 text-left text-xs transition-colors shrink-0",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {formatStrokeName(shot.value)}
                  </button>
                );
              });
            }
          })}
        </div>
      </div>
    </div>
  );
}

