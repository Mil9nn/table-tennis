"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export type FilterState = {
  query: string;
  status: string;
  format: string;
  sort: string;
};

export function FiltersBar({ value, onChange }: { value: FilterState; onChange: (next: FilterState) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div className="relative md:max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Search tournaments by name or city..."
          className="pl-9"
        />
      </div>

      <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-3">
        <Select value={value.format} onValueChange={(v) => onChange({ ...value, format: v })}>
          <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Format" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="round_robin">Round Robin</SelectItem>
            <SelectItem value="knockout">Knockout</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
          <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.sort} onValueChange={(v) => onChange({ ...value, sort: v })}>
          <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="upcoming">Upcoming First</SelectItem>
            <SelectItem value="participants">Participants</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default FiltersBar;
