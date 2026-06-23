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

export interface TournamentFilters {
  matchType?: "singles" | "doubles" | "all";
  format?: "round_robin" | "knockout" | "hybrid" | "all";
  status?: "completed" | "in_progress" | "all";
  timeRange?: "all_time" | "this_year" | "this_month" | "custom";
  season?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface TournamentLeaderboardFiltersProps {
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
}

export function TournamentLeaderboardFilters({
  filters,
  onFiltersChange,
}: TournamentLeaderboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (
    key: keyof TournamentFilters,
    value: string | number | undefined
  ) => {
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

  const hasActiveFilters =
    Object.keys(filters).filter((key) => {
      const value = filters[key as keyof TournamentFilters];
      return value !== undefined && value !== "all" && value !== "all_time";
    }).length > 0;

  // Get current year for season selector
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
                {Object.keys(filters).filter(
                  (key) =>
                    filters[key as keyof TournamentFilters] !== undefined &&
                    filters[key as keyof TournamentFilters] !== "all" &&
                    filters[key as keyof TournamentFilters] !== "all_time"
                ).length}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Match Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Match Type
              </label>
              <Select
                value={filters.matchType || "all"}
                onValueChange={(v) =>
                  updateFilter("matchType", v === "all" ? undefined : v)
                }
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="singles">Singles</SelectItem>
                  <SelectItem value="doubles">Doubles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tournament Format */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Format
              </label>
              <Select
                value={filters.format || "all"}
                onValueChange={(v) =>
                  updateFilter("format", v === "all" ? undefined : v)
                }
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Status
              </label>
              <Select
                value={filters.status || "completed"}
                onValueChange={(v) =>
                  updateFilter("status", v === "all" ? undefined : v)
                }
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                  <SelectItem value="in_progress">Include In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Time Range
              </label>
              <Select
                value={filters.timeRange || "all_time"}
                onValueChange={(v) =>
                  updateFilter("timeRange", v === "all_time" ? undefined : v)
                }
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Season */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#353535]">
                Season
              </label>
              <Select
                value={filters.season?.toString() || "all"}
                onValueChange={(v) =>
                  updateFilter("season", v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger className="bg-white border-[#d9d9d9] text-[#353535] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seasons</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

