"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { PlayerLeaderboard, TeamLeaderboard, TournamentLeaderboard } from "./components";
import type { LeaderboardType } from "./types";

import GroupWorkIcon from "@mui/icons-material/GroupWork";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("singles");
  const {
    leaderboard,
    teamLeaderboard,
    tournamentLeaderboard,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
  } = useLeaderboard(activeTab);

  // Individual observers
  const singlesObserverTarget = useRef<HTMLDivElement>(null);
  const doublesObserverTarget = useRef<HTMLDivElement>(null);
  const mixedObserverTarget = useRef<HTMLDivElement>(null);
  const teamsObserverTarget = useRef<HTMLDivElement>(null);
  const tournamentsObserverTarget = useRef<HTMLDivElement>(null);

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

  // Infinite scroll handler
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
      { threshold: 0.15 }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadingMore, loading, hasMore, activeTab, fetchMore]);

  return (
    <div className="max-w-4xl mx-auto pb-10">

      {/* -------------------------------------------------- */}
      {/*  HERO HEADER */}
      {/* -------------------------------------------------- */}
      <header className="px-4 py-10 rounded-b-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-lg">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboards</h1>
          <p className="text-sm opacity-80 mt-1">
            Rankings across all match categories and tournaments
          </p>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/*  TABS */}
      {/* -------------------------------------------------- */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md mt-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as LeaderboardType)}
          className="w-full"
        >
          <TabsList
            className="
              flex flex-wrap w-full h-auto
              rounded-none p-0 border-b border-slate-200/50
            "
          >
              <TabsTrigger
                value="singles"
                className="
                  flex-1 px-4 py-2 text-sm rounded-none
                  data-[state=active]:bg-white data-[state=active]:shadow
                  transition-all
                "
              >
                Singles
              </TabsTrigger>

              <TabsTrigger
                value="doubles"
                className="
                  flex-1 px-4 py-2 text-sm rounded-none
                  data-[state=active]:bg-white data-[state=active]:shadow
                  transition-all
                "
              >
                Doubles
              </TabsTrigger>

              <TabsTrigger
                value="mixed_doubles"
                className="
                  flex-1 px-4 py-2 text-sm rounded-none
                  data-[state=active]:bg-white data-[state=active]:shadow
                  transition-all
                "
              >
                Mixed Doubles
              </TabsTrigger>

              <TabsTrigger
                value="teams"
                className="
                  flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm rounded-none
                  data-[state=active]:bg-white data-[state=active]:shadow
                  transition-all
                "
              >
                <GroupWorkIcon className="size-4 text-gray-700" />
                Teams
              </TabsTrigger>

              <TabsTrigger
                value="tournaments"
                className="
                  flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm rounded-none
                  data-[state=active]:bg-white data-[state=active]:shadow
                  transition-all
                "
              >
                <EmojiEventsIcon className="size-4 text-yellow-600" />
                Tournaments
              </TabsTrigger>
            </TabsList>

          {/* -------------------------------------------------- */}
          {/*  TAB CONTENT PANELS */}
          {/* -------------------------------------------------- */}

          <LeaderboardTabPanel
            value="singles"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            observerRef={singlesObserverTarget}
          >
            <PlayerLeaderboard
              data={leaderboard}
              loading={loading}
              emptyMessage="No singles matches yet"
              matchType="singles"
            />
          </LeaderboardTabPanel>

          <LeaderboardTabPanel
            value="doubles"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            observerRef={doublesObserverTarget}
          >
            <PlayerLeaderboard
              data={leaderboard}
              loading={loading}
              emptyMessage="No doubles matches yet"
              matchType="doubles"
            />
          </LeaderboardTabPanel>

          <LeaderboardTabPanel
            value="mixed_doubles"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            observerRef={mixedObserverTarget}
          >
            <PlayerLeaderboard
              data={leaderboard}
              loading={loading}
              emptyMessage="No mixed doubles matches yet"
              matchType="mixed_doubles"
            />
          </LeaderboardTabPanel>

          <LeaderboardTabPanel
            value="teams"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            observerRef={teamsObserverTarget}
          >
            <TeamLeaderboard
              data={teamLeaderboard}
              loading={loading}
            />
          </LeaderboardTabPanel>

          <LeaderboardTabPanel
            value="tournaments"
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            observerRef={tournamentsObserverTarget}
          >
            <TournamentLeaderboard
              data={tournamentLeaderboard}
              loading={loading}
            />
          </LeaderboardTabPanel>

        </Tabs>
      </div>
    </div>
  );
}

/* --------------------------------------------- */
/*  REUSABLE TAB PANEL WITH MODERN SHELL         */
/* --------------------------------------------- */

function LeaderboardTabPanel({
  value,
  children,
  loading,
  loadingMore,
  hasMore,
  observerRef,
}: any) {
  return (
    <TabsContent value={value} className="p-0">

      {/* CONTENT CARD */}
      <div className="border border-slate-200/50">
        {children}

        {/* INFINITE SCROLL ZONE */}
        {!loading && (
          <div
            ref={observerRef}
            className="h-20 flex items-center justify-center"
          >
            {loadingMore && (
              <div className="flex items-center gap-2 text-indigo-600">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm">Loading more…</span>
              </div>
            )}

            {!hasMore && (
              <p className="text-sm text-slate-500">End of leaderboard</p>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
}