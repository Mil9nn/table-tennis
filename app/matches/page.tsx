"use client";

import { useEffect, useState, useMemo } from "react";
import MatchesList from "@/components/MatchesList";
import TeamMatchesList from "@/components/TeamMatchesList";
import { axiosInstance } from "@/lib/axiosInstance";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndividualMatch, TeamMatch } from "@/types/match.type";
import MatchesListSkeleton from "@/components/skeletons/MatchesListSkeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState("individual");

  // Individual
  const [individualMatches, setIndividualMatches] = useState<IndividualMatch[]>(
    []
  );
  const [individualLoading, setIndividualLoading] = useState(true);
  const [individualSearch, setIndividualSearch] = useState("");
  const [individualFilterType, setIndividualFilterType] = useState("all");

  // Team
  const [teamMatches, setTeamMatches] = useState<TeamMatch[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilterFormat, setTeamFilterFormat] = useState("all");

  useEffect(() => {
    const fetchIndividualMatches = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/matches/individual?context=casual"
        );
        setIndividualMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching individual matches:", err);
      } finally {
        setIndividualLoading(false);
      }
    };
    fetchIndividualMatches();
  }, []);

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

  const filteredIndividualMatches = useMemo(() => {
    return individualMatches.filter((match) => {
      const nameMatch = match.participants?.some((p) =>
        p?.fullName?.toLowerCase().includes(individualSearch.toLowerCase())
      );
      const typeMatch =
        individualFilterType === "all" ||
        match.matchType === individualFilterType;
      return nameMatch && typeMatch;
    });
  }, [individualMatches, individualSearch, individualFilterType]);

  const filteredTeamMatches = useMemo(() => {
    return teamMatches.filter((match) => {
      const nameMatch =
        match.team1?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
        match.team2?.name?.toLowerCase().includes(teamSearch.toLowerCase());

      const formatMatch =
        teamFilterFormat === "all" || match.matchFormat === teamFilterFormat;

      return nameMatch && formatMatch;
    });
  }, [teamMatches, teamSearch, teamFilterFormat]);

  return (
    <div>
      {/* HEADER AREA — same as before */}
      <div className="p-4 bg-[#6878E1] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-white">Matches</h1>

          <Button className="bg-white text-zinc-800 hover:bg-blue-400">
            <Link
              href="/match/create"
              className="text-sm flex items-center gap-1"
            >
              <Plus
                strokeWidth={5}
                className="bg-[#6878E1] text-white p-1 rounded-full"
              />
              New Match
            </Link>
          </Button>
        </div>

        {/* CONDITIONAL FILTERS — ONLY CHANGE */}
        {activeTab === "individual" && (
          <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
              <Input
                placeholder="Search by player name..."
                value={individualSearch}
                onChange={(e) => setIndividualSearch(e.target.value)}
                className="pl-8 border-2 bg-[#F7F8FE] text-sm rounded-full"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Select
                value={individualFilterType}
                onValueChange={setIndividualFilterType}
              >
                <SelectTrigger className="w-full sm:w-30 bg-white text-sm">
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
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-2 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 text-blue-500 size-4" />
              <Input
                placeholder="Search by team name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-8 border-2 bg-[#F7F8FE] text-sm rounded-full"
              />
            </div>

            <Select
              value={teamFilterFormat}
              onValueChange={setTeamFilterFormat}
            >
              <SelectTrigger className="w-full sm:w-30 bg-white text-sm">
                <SelectValue placeholder="Filter by format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="five_singles">
                  Swaythling (5 Singles)
                </SelectItem>
                <SelectItem value="single_double_single">
                  Single-Double-Single
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* TABS */}
      <Tabs
        defaultValue="individual"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          className="grid w-full max-w-md mx-auto h-fit rounded-none p-0"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <TabsTrigger className="p-2 rounded-none" value="individual">
            Individual Matches
          </TabsTrigger>
          <TabsTrigger className="p-2 rounded-none" value="team">
            Team Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          {individualLoading ? (
            <MatchesListSkeleton />
          ) : (
            <MatchesList matches={filteredIndividualMatches} />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
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
