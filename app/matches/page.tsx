"use client";

import { useEffect, useState, useMemo } from "react";
import MatchesList from "@/components/MatchesList";
import TeamMatchesList from "@/components/TeamMatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndividualMatch, TeamMatch } from "@/types/match.type";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MatchesPage() {
  // Individual matches state
  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>([]);
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualSearch, setIndividualSearch] = useState("");
  const [individualFilterType, setIndividualFilterType] = useState("all");

  // Team matches state
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilterFormat, setTeamFilterFormat] = useState("all");

  // Fetch individual matches
  useEffect(() => {
    const fetchIndividualMatches = async () => {
      try {
        const { data } = await axiosInstance.get("/matches/individual");
        setIndividualMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching individual matches:", err);
      } finally {
        setIndividualLoading(false);
      }
    };

    fetchIndividualMatches();
  }, []);

  // Fetch team matches
  useEffect(() => {
    const fetchTeamMatches = async () => {
      try {
        const { data } = await axiosInstance.get("/matches/team");
        setTeamMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching team matches:", err);
      } finally {
        setTeamLoading(false);
      }
    };

    fetchTeamMatches();
  }, []);

  // Filter individual matches
  const filteredIndividualMatches = useMemo(() => {
    return individualMatches.filter((match) => {
      const nameMatch = match.participants?.some((p) =>
        p?.fullName?.toLowerCase().includes(individualSearch.toLowerCase())
      );

      const typeMatch = individualFilterType === "all" || match.matchType === individualFilterType;

      return nameMatch && typeMatch;
    });
  }, [individualMatches, individualSearch, individualFilterType]);

  // Filter team matches
  const filteredTeamMatches = useMemo(() => {
    return teamMatches.filter((match) => {
      const nameMatch =
        match.team1?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
        match.team2?.name?.toLowerCase().includes(teamSearch.toLowerCase());

      const formatMatch = teamFilterFormat === "all" || match.matchFormat === teamFilterFormat;

      return nameMatch && formatMatch;
    });
  }, [teamMatches, teamSearch, teamFilterFormat]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Matches</h1>
        <Button variant={"default"}>
          <Link href="/match/create" className="text-sm hover:underline flex items-center gap-1">
          <Plus strokeWidth={3} />
          New Match</Link>
        </Button>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto mb-6 h-fit" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <TabsTrigger className="p-2" value="individual">Individual Matches</TabsTrigger>
          <TabsTrigger className="p-2" value="team">Team Matches</TabsTrigger>
        </TabsList>

        {/* Individual Matches Tab */}
        <TabsContent value="individual" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400 size-4" />
              <Input
                placeholder="Search by player name..."
                value={individualSearch}
                onChange={(e) => setIndividualSearch(e.target.value)}
                className="pl-9 text-sm rounded-full"
              />
            </div>

            <Select value={individualFilterType} onValueChange={setIndividualFilterType}>
              <SelectTrigger className="w-full sm:w-44 text-sm">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="singles">Singles</SelectItem>
                <SelectItem value="doubles">Doubles</SelectItem>
                <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {individualLoading ? (
            <MatchesListSkeleton />
          ) : (
            <MatchesList matches={filteredIndividualMatches} />
          )}
        </TabsContent>

        {/* Team Matches Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400 size-4" />
              <Input
                placeholder="Search by team name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-9 text-sm rounded-full"
              />
            </div>

            <Select value={teamFilterFormat} onValueChange={setTeamFilterFormat}>
              <SelectTrigger className="w-full sm:w-52 text-sm">
                <SelectValue placeholder="Filter by format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="five_singles">Swaythling (5 Singles)</SelectItem>
                <SelectItem value="single_double_single">Single-Double-Single</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {teamLoading ? (
            <MatchesListSkeleton />
          ) : (
            <TeamMatchesList matches={filteredTeamMatches} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}