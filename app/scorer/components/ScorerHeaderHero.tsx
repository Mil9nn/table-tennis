"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

export type ScorerFilterState = {
  query: string;
  status: string;
  format: string;
};

type ScorerHeaderHeroProps = {
  filters: ScorerFilterState;
  onFiltersChange: (filters: ScorerFilterState) => void;
};

export function ScorerHeaderHero({
  filters,
  onFiltersChange,
}: ScorerHeaderHeroProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.query || filters.status !== "all" || filters.format !== "all";

  return (
    <header className="bg-gray-50 text-gray-800 p-4 space-y-4 shadow-sm flex-shrink-0">
      <div>
        <h1 className="text-[11px] mb-1 font-bold uppercase tracking-[0.2em]">
          Scorer Dashboard
        </h1>
        <div className="h-1 w-20 rounded-full bg-gradient-to-r from-indigo-400 to-teal-400" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-blue-400 size-4" />
          <Input
            value={filters.query}
            onChange={(e) =>
              onFiltersChange({ ...filters, query: e.target.value })
            }
            placeholder="Search tournaments..."
            className="pl-9 rounded-full bg-white border border-gray-200 text-gray-800 text-sm focus:ring-1 focus:ring-blue-400 focus-visible:ring-blue-400 focus-visible:ring-2"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 rounded-full border-gray-200 hover:bg-gray-100 text-gray-700 ${
            hasActiveFilters ? "bg-gray-100" : "bg-white"
          }`}
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 space-y-3 border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ query: "", status: "all", format: "all" })
                  }
                  className="h-6 px-2 text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                Format
              </label>
              <Select
                value={filters.format}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, format: v })
                }
              >
                <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, status: v })
                }
              >
                <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default ScorerHeaderHero;
