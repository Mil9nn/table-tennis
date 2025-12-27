"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import type { LeaderboardFilters as FilterType } from "@/lib/leaderboard/filterUtils";

interface LeaderboardFiltersProps {
  filters: Partial<FilterType>;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  tabType: "individual" | "teams" | "tournaments";
}

export function LeaderboardFilters({
  filters,
  onFiltersChange,
  tabType,
}: LeaderboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterType, value: string | undefined) => {
    if (value === "" || value === "all" || value === undefined) {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowFilters(false);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="border-b border-[#d9d9d9] bg-[#ffffff]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 px-3 text-xs font-semibold uppercase tracking-wider text-[#353535] hover:bg-[#f5f5f5] hover:text-[#3c6e71]"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#3c6e71] text-white text-[10px] font-bold">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-2 text-xs text-[#d9d9d9] hover:text-[#353535]"
          >
            Clear all
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="border-t border-[#d9d9d9] bg-[#f9f9f9] p-4">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Match Type - Only for Individual tab */}
            {tabType === "individual" && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                  Match Type
                </label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(v) => updateFilter("type", v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                    <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Time Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Time Range
              </label>
              <Select
                value={filters.timeRange || "all_time"}
                onValueChange={(v) => updateFilter("timeRange", v === "all_time" ? undefined : v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Gender
              </label>
              <Select
                value={filters.gender || "all"}
                onValueChange={(v) => updateFilter("gender", v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  {tabType === "individual" && (filters.type === "mixed_doubles" || filters.type === "all" || !filters.type) && (
                    <SelectItem value="mixed">Mixed</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Age Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Age Category
              </label>
              <Select
                value={filters.ageCategory || "all"}
                onValueChange={(v) => updateFilter("ageCategory", v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="U13">Under 13</SelectItem>
                  <SelectItem value="U15">Under 15</SelectItem>
                  <SelectItem value="U18">Under 18</SelectItem>
                  <SelectItem value="Open">Open (18-39)</SelectItem>
                  <SelectItem value="40+">40+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Sort By
              </label>
              <Select
                value={filters.sortBy || "winRate"}
                onValueChange={(v) => updateFilter("sortBy", v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                  <SelectItem value="wins">Total Wins</SelectItem>
                  <SelectItem value="pointDifference">Point Difference</SelectItem>
                  <SelectItem value="winStreak">Win Streak</SelectItem>
                  <SelectItem value="matchesPlayed">Matches Played</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Player Type - Only for Individual tab */}
            {tabType === "individual" && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                  Player Type
                </label>
                <Select
                  value={filters.playerType || "both"}
                  onValueChange={(v) => updateFilter("playerType", v === "both" ? undefined : v)}
                >
                  <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="singles_only">Singles Only</SelectItem>
                    <SelectItem value="doubles_only">Doubles Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Handedness */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Handedness
              </label>
              <Select
                value={filters.handedness || "all"}
                onValueChange={(v) => updateFilter("handedness", v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Competition Format */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Competition Format
              </label>
              <Select
                value={filters.matchFormat || "all"}
                onValueChange={(v) => updateFilter("matchFormat", v)}
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

