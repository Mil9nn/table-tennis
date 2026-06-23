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
    <header className="bg-gray-50 text-gray-800 p-4 space-y-4 shadow-sm">
      <div>
        <h1 className="text-[11px] mb-1 font-bold uppercase tracking-[0.2em]">Tournaments</h1>
        <div className="h-1 w-20 rounded-full bg-gradient-to-r from-indigo-400 to-teal-400" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-blue-400 size-4" />
          <Input
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
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

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 space-y-3 border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-6 px-2 text-[10px] uppercase tracking-wider text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">Format</label>
              <Select value={filters.format} onValueChange={(v) => onFiltersChange({ ...filters, format: v })}>
                <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
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
                <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
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
            <label className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CalendarDays className="size-3" /> Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="bg-white border border-gray-200 text-gray-800 text-sm"
                placeholder="From"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="bg-white border border-gray-200 text-gray-800 text-sm"
                placeholder="To"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#d9d9d9] uppercase tracking-wider font-semibold">Sort By</label>
            <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
              <SelectTrigger className="bg-white border border-gray-200 text-gray-800">
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
