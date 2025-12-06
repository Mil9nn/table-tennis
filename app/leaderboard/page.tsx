"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { PlayerLeaderboard, TeamLeaderboard, TournamentLeaderboard } from "./components";
import type { LeaderboardType } from "./types";

import GroupWorkIcon from '@mui/icons-material/GroupWork';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("singles");
  const { leaderboard, teamLeaderboard, tournamentLeaderboard, loading, loadingMore, hasMore, fetchMore } = useLeaderboard(activeTab);
  
  // Intersection Observer refs for each tab
  const singlesObserverTarget = useRef<HTMLDivElement>(null);
  const doublesObserverTarget = useRef<HTMLDivElement>(null);
  const mixedObserverTarget = useRef<HTMLDivElement>(null);
  const teamsObserverTarget = useRef<HTMLDivElement>(null);
  const tournamentsObserverTarget = useRef<HTMLDivElement>(null);

  // Get the appropriate observer target based on active tab
  const getObserverTarget = () => {
    switch (activeTab) {
      case "singles": return singlesObserverTarget;
      case "doubles": return doublesObserverTarget;
      case "mixed_doubles": return mixedObserverTarget;
      case "teams": return teamsObserverTarget;
      case "tournaments": return tournamentsObserverTarget;
      default: return null;
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observerTarget = getObserverTarget();
    if (!observerTarget?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !loading &&
          hasMore
        ) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadingMore, loading, hasMore, activeTab, fetchMore]);

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
          <TabsList className="w-full flex-wrap justify-start h-auto rounded-none p-0 bg-muted">
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
            {!loading && (
              <div ref={singlesObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && leaderboard.length > 0 && (
                  <p className="text-sm text-gray-500">No more players to load</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="doubles" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <PlayerLeaderboard data={leaderboard} loading={loading} emptyMessage="No doubles matches yet" />
            {!loading && (
              <div ref={doublesObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && leaderboard.length > 0 && (
                  <p className="text-sm text-gray-500">No more players to load</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mixed_doubles" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <PlayerLeaderboard data={leaderboard} loading={loading} emptyMessage="No mixed doubles matches yet" />
            {!loading && (
              <div ref={mixedObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && leaderboard.length > 0 && (
                  <p className="text-sm text-gray-500">No more players to load</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <TeamLeaderboard data={teamLeaderboard} loading={loading} />
            {!loading && (
              <div ref={teamsObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && teamLeaderboard.length > 0 && (
                  <p className="text-sm text-gray-500">No more teams to load</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-4">
          <div className="bg-background border-y border-border/50">
            <TournamentLeaderboard data={tournamentLeaderboard} loading={loading} />
            {!loading && (
              <div ref={tournamentsObserverTarget} className="h-20 flex items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && tournamentLeaderboard.length > 0 && (
                  <p className="text-sm text-gray-500">No more players to load</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
