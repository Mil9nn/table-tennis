"use client";

import React from "react";
import { shotCategories } from "@/constants/constants";
import { formatStrokeName, cn } from "@/lib/utils";
import { Stroke } from "@/types/shot.type";

interface ShotSelectionStepProps {
  selectedShot: Stroke | null;
  onSelect: (shot: Stroke) => void;
}

export function ShotSelectionStep({
  selectedShot,
  onSelect,
}: ShotSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="max-h-[520px] p-2 space-y-5 overflow-y-auto">
        {Object.entries(shotCategories).map(([category, categoryData]) => {
          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {category.replace(/_/g, " ")}
              </div>

              {/* Shot Grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categoryData.shots.map((shot) => {
                  const isSelected = selectedShot === shot.value;

                  return (
                    <button
                      key={shot.value}
                      type="button"
                      onClick={() => onSelect(shot.value as Stroke)}
                      className={cn(
                        "rounded-lg border p-2 text-left text-sm transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {formatStrokeName(shot.value)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

