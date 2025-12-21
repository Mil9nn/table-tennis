"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { PlayerLeaderboard, TeamLeaderboard, TournamentLeaderboard } from "./components";
import type { LeaderboardType } from "./types";
import { useAuthStore } from "@/hooks/useAuthStore";

import GroupWorkIcon from "@mui/icons-material/GroupWork";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function LeaderboardPage() {
  const { user } = useAuthStore();
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
      <header
        className="px-6 p-4 flex flex-col justify-center"
        style={{
          backgroundColor: '#323139',
          boxShadow: '0 4px 20px rgba(50, 49, 57, 0.08)'
        }}
      >
        <div className="lb-font-primary">
          <h1
            className="text-[2.5rem] md:text-[2.5rem] font-bold tracking-tight"
            style={{ color: '#ffffff' }}
          >
            Leaderboards
          </h1>
          <div
            className="w-15 h-1 mt-3 mb-4"
            style={{ backgroundColor: '#18c3f8' }}
          />
          <p
            className="text-[0.9375rem]"
            style={{ color: '#ccbcbc' }}
          >
            Rankings across all match categories and tournaments
          </p>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/*  TABS */}
      {/* -------------------------------------------------- */}
      <div
        className="sticky top-0 z-20"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 16px rgba(50, 49, 57, 0.08)'
        }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as LeaderboardType)}
          className="w-full"
        >
          <TabsList
            className="flex flex-wrap w-full h-auto rounded-none p-0"
            style={{
              borderBottom: '2px solid rgba(204, 188, 188, 0.3)',
              backgroundColor: 'transparent'
            }}
          >
              <TabsTrigger
                value="singles"
                className="
                  lb-font-primary
                  flex-1 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-none
                  transition-all duration-250
                  data-[state=inactive]:opacity-60
                  data-[state=active]:font-semibold
                  data-[state=active]:opacity-100
                  hover:bg-[rgba(204,188,188,0.08)]
                "
                style={{
                  color: '#323139',
                  borderBottom: activeTab === 'singles' ? '3px solid #18c3f8' : '3px solid transparent'
                }}
              >
                Singles
              </TabsTrigger>

              <TabsTrigger
                value="doubles"
                className="
                  lb-font-primary
                  flex-1 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-none
                  transition-all duration-250
                  data-[state=inactive]:opacity-60
                  data-[state=active]:font-semibold
                  data-[state=active]:opacity-100
                  hover:bg-[rgba(204,188,188,0.08)]
                "
                style={{
                  color: '#323139',
                  borderBottom: activeTab === 'doubles' ? '3px solid #18c3f8' : '3px solid transparent'
                }}
              >
                Doubles
              </TabsTrigger>

              <TabsTrigger
                value="mixed_doubles"
                className="
                  lb-font-primary
                  flex-1 px-4 py-3 text-xs font-medium uppercase tracking-wide rounded-none
                  transition-all duration-250
                  data-[state=inactive]:opacity-60
                  data-[state=active]:font-semibold
                  data-[state=active]:opacity-100
                  hover:bg-[rgba(204,188,188,0.08)]
                "
                style={{
                  color: '#323139',
                  borderBottom: activeTab === 'mixed_doubles' ? '3px solid #18c3f8' : '3px solid transparent'
                }}
              >
                Mixed Doubles
              </TabsTrigger>

              <TabsTrigger
                value="teams"
                className="
                  lb-font-primary
                  flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-none
                  transition-all duration-250
                  data-[state=inactive]:opacity-60
                  data-[state=active]:font-semibold
                  data-[state=active]:opacity-100
                  hover:bg-[rgba(204,188,188,0.08)]
                "
                style={{
                  color: '#323139',
                  borderBottom: activeTab === 'teams' ? '3px solid #18c3f8' : '3px solid transparent'
                }}
              >
                <GroupWorkIcon
                  className="size-4"
                  style={{ color: '#323139' }}
                />
                Teams
              </TabsTrigger>

              <TabsTrigger
                value="tournaments"
                className="
                  lb-font-primary
                  flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-none
                  transition-all duration-250
                  data-[state=inactive]:opacity-60
                  data-[state=active]:font-semibold
                  data-[state=active]:opacity-100
                  hover:bg-[rgba(204,188,188,0.08)]
                "
                style={{
                  color: '#323139',
                  borderBottom: activeTab === 'tournaments' ? '3px solid #18c3f8' : '3px solid transparent'
                }}
              >
                <EmojiEventsIcon
                  className="size-4"
                  style={{ color: '#18c3f8' }}
                />
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
              currentUserId={user?._id}
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
              currentUserId={user?._id}
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
              currentUserId={user?._id}
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
              currentUserId={user?._id}
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
              currentUserId={user?._id}
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
            className="h-20 flex items-center justify-center lb-font-primary"
          >
            {loadingMore && (
              <div className="flex items-center gap-2">
                <Loader2
                  className="animate-spin"
                  size={24}
                  style={{ color: '#18c3f8' }}
                />
                <span
                  className="text-[0.875rem]"
                  style={{ color: '#ccbcbc' }}
                >
                  Loading more…
                </span>
              </div>
            )}

            {!hasMore && (
              <p
                className="text-[0.875rem] italic"
                style={{ color: 'rgba(204, 188, 188, 0.7)' }}
              >
                End of leaderboard
              </p>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
}