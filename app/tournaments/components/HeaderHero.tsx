"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, CalendarDays } from "lucide-react";

export type FilterState = {
  query: string;
  status: string;
  format: string;
  sort: string;
  dateFrom: string;
  dateTo: string;
};

type HeaderHeroProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

const DEFAULT_FILTERS: FilterState = {
  query: "",
  status: "all",
  format: "all",
  sort: "recent",
  dateFrom: "",
  dateTo: "",
};

export function HeaderHero({ filters, onFiltersChange }: HeaderHeroProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.query !== DEFAULT_FILTERS.query ||
      filters.status !== DEFAULT_FILTERS.status ||
      filters.format !== DEFAULT_FILTERS.format ||
      filters.dateFrom !== DEFAULT_FILTERS.dateFrom ||
      filters.dateTo !== DEFAULT_FILTERS.dateTo
    );
  }, [filters]);

  const clearAll = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <header className="bg-[#353535] text-[#ffffff] p-6 space-y-4">
      <h1 className="text-[11px] font-bold uppercase tracking-[0.2em]">Tournaments</h1>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#d9d9d9] size-4" />
          <Input
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            placeholder="Search tournaments..."
            className="pl-9 bg-[#284b63] border-[#284b63] text-[#ffffff] placeholder:text-[#d9d9d9] text-sm focus:ring-1 focus:ring-[#3c6e71]"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`shrink-0 border-[#284b63] hover:bg-[#3c6e71] text-[#ffffff] ${
            hasActiveFilters ? "bg-[#3c6e71]" : "bg-[#284b63]"
          }`}
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#284b63] p-4 space-y-3 border border-[#3c6e71]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffffff]">Filters</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-6 px-2 text-[10px] uppercase tracking-wider text-[#d9d9d9] hover:bg-[#3c6e71] hover:text-white"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(false)}
                className="size-6 hover:bg-[#3c6e71] text-[#d9d9d9]"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">Format</label>
              <Select value={filters.format} onValueChange={(v) => onFiltersChange({ ...filters, format: v })}>
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

            <div className="space-y-1">
              <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">Status</label>
              <Select value={filters.status} onValueChange={(v) => onFiltersChange({ ...filters, status: v })}>
                <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold flex items-center gap-1">
              <CalendarDays className="size-3" /> Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                placeholder="From"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="bg-[#353535] border-[#3c6e71] text-[#ffffff] text-sm"
                placeholder="To"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">Sort By</label>
            <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
              <SelectTrigger className="bg-[#353535] border-[#3c6e71] text-[#ffffff]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="upcoming">Upcoming First</SelectItem>
                <SelectItem value="participants">Participants</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </header>
  );
}

export default HeaderHero;
