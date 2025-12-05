"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { PlayerLeaderboard, TeamLeaderboard, TournamentLeaderboard } from "./components";
import type { LeaderboardType } from "./types";

import GroupWorkIcon from '@mui/icons-material/GroupWork';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("singles");
  const { leaderboard, teamLeaderboard, tournamentLeaderboard, loading } = useLeaderboard(activeTab);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rankings across all matches and tournaments
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)} className="w-full">
        <div className="px-4">
          <TabsList className="w-full flex-wrap justify-start h-auto rounded-none p-0 bg-muted/50">
            <TabsTrigger
              value="singles"
              className="text-xs rounded-none sm:text-sm data-[state=active]:bg-background flex-shrink-0"
            >
              Singles
            </TabsTrigger>
            <TabsTrigger
              value="doubles"
              className="text-xs rounded-none sm:text-sm data-[state=active]:bg-background flex-shrink-0"
            >
              Doubles
            </TabsTrigger>
            <TabsTrigger
              value="mixed_doubles"
              className="text-xs rounded-none sm:text-sm data-[state=active]:bg-background flex-shrink-0"
            >
              Mixed
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="text-xs rounded-none sm:text-sm data-[state=active]:bg-background flex-shrink-0"
            >
              <GroupWorkIcon className="size-3 text-gray-600" />
              <span className="">Teams</span>
            </TabsTrigger>
            <TabsTrigger
              value="tournaments"
              className="text-xs rounded-none sm:text-sm data-[state=active]:bg-background flex-shrink-0"
            >
              <EmojiEventsIcon className="size-3 text-yellow-600" />
              <span className="">Tournaments</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="singles" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <PlayerLeaderboard data={leaderboard} loading={loading} emptyMessage="No singles matches yet" />
          </div>
        </TabsContent>

        <TabsContent value="doubles" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <PlayerLeaderboard data={leaderboard} loading={loading} emptyMessage="No doubles matches yet" />
          </div>
        </TabsContent>

        <TabsContent value="mixed_doubles" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <PlayerLeaderboard data={leaderboard} loading={loading} emptyMessage="No mixed doubles matches yet" />
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <TeamLeaderboard data={teamLeaderboard} loading={loading} />
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <TournamentLeaderboard data={tournamentLeaderboard} loading={loading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
