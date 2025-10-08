"use client";

import { useEffect, useState, useMemo } from "react";
import MatchesList from "@/components/MatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndividualMatch } from "@/types/match.type";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";

export default function MatchesPage() {
  const [matches, setMatches] = useState<IndividualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await axiosInstance.get("/matches/individual");
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Apply filters client-side
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const nameMatch = match.participants?.some((p) =>
        p?.fullName?.toLowerCase().includes(search.toLowerCase())
      );

      const typeMatch = filterType === "all" || match.matchType === filterType;

      return nameMatch && typeMatch;
    });
  }, [matches, search, filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recent Matches</h1>

        {/* Search + Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 text-gray-400 size-4" />
            <Input
              placeholder="Search by player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm rounded-full"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-44 text-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="singles">Singles</SelectItem>
              <SelectItem value="doubles">Doubles</SelectItem>
              <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? <MatchesListSkeleton /> : <MatchesList matches={filteredMatches} />}
    </div>
  );
}