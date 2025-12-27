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

  return (
    <header className="bg-[#353535] text-[#ffffff] p-6 space-y-4">
      <h1 className="text-[11px] font-bold uppercase tracking-[0.2em]">
        Scorer Dashboard
      </h1>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#d9d9d9] size-4" />
          <Input
            value={filters.query}
            onChange={(e) =>
              onFiltersChange({ ...filters, query: e.target.value })
            }
            placeholder="Search tournaments..."
            className="pl-9 bg-[#284b63] border-[#284b63] text-[#ffffff] placeholder:text-[#d9d9d9] text-sm focus:ring-1 focus:ring-[#3c6e71]"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 bg-[#284b63] border-[#284b63] hover:bg-[#3c6e71] text-[#ffffff]"
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#284b63] p-4 space-y-3 border border-[#3c6e71]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffffff]">
              Filters
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(false)}
              className="size-6 hover:bg-[#3c6e71] text-[#d9d9d9]"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
              Format
            </label>
            <Select
              value={filters.format}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, format: v })
              }
            >
              <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="knockout">Knockout</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onFiltersChange({ ...filters, status: v })
              }
            >
              <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                <SelectValue placeholder="Status" />
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
      )}
    </header>
  );
}

export default ScorerHeaderHero;
