"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

export type FilterState = {
  query: string;
  status: string;
  format: string;
  sort: string;
};

type HeaderHeroProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

export function HeaderHero({ filters, onFiltersChange }: HeaderHeroProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <header className="text-white p-4 space-y-4" style={{ backgroundColor: '#323139' }}>
      <h1 className="text-2xl font-bold">Tournaments</h1>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400 size-4" />
          <Input
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            placeholder="Search tournaments..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 text-sm rounded-lg focus:ring-2 focus:ring-zinc-700"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-zinc-900 rounded-lg p-4 space-y-3 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Filters</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(false)}
              className="size-6 hover:bg-zinc-800 text-zinc-400"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide">Format</label>
            <Select value={filters.format} onValueChange={(v) => onFiltersChange({ ...filters, format: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="knockout">Knockout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide">Status</label>
            <Select value={filters.status} onValueChange={(v) => onFiltersChange({ ...filters, status: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide">Sort By</label>
            <Select value={filters.sort} onValueChange={(v) => onFiltersChange({ ...filters, sort: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
