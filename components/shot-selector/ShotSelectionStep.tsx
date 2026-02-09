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
    <div className="">
      <div className="max-h-[520px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
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
                <div key={category} className="grid grid-cols-2 gap-2 bg-gray-100 p-1">
                  {fhShot && (
                    <button
                      key={fhShot.value}
                      type="button"
                      onClick={() => onSelect(fhShot.value as Stroke)}
                      className={cn(
                        "rounded-sm border p-2 text-left text-xs transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        isFHSelected
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {formatStrokeName(fhShot.value)}
                    </button>
                  )}
                  {bhShot && (
                    <button
                      key={bhShot.value}
                      type="button"
                      onClick={() => onSelect(bhShot.value as Stroke)}
                      className={cn(
                        "rounded-sm border p-2 text-left text-xs transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        isBHSelected
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {formatStrokeName(bhShot.value)}
                    </button>
                  )}
                </div>
              );
            } else {
              // Individual shots (for net_point, serve_point, etc.)
              return categoryData.shots.map((shot) => {
                const isSelected = selectedShot === shot.value;

                return (
                  <div key={shot.value} className="grid grid-cols-2 gap-2 bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => onSelect(shot.value as Stroke)}
                      className={cn(
                        "rounded-sm border p-2 text-left text-xs transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {formatStrokeName(shot.value)}
                    </button>
                  </div>
                );
              });
            }
          })}
        </div>
      </div>
    </div>
  );
}

