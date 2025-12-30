"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Users, Target } from "lucide-react";
import { useLeaderboard } from "./hooks/useLeaderboard";
import {
  PlayerLeaderboard,
  TeamLeaderboard,
  TournamentLeaderboard,
  LeaderboardFilters,
} from "./components";
import type { LeaderboardType } from "./types";
import { useAuthStore } from "@/hooks/useAuthStore";
import type { LeaderboardFilters as FilterType } from "@/lib/leaderboard/filterUtils";
import { useSubscription } from "@/hooks/useSubscription";
import { LockedContent } from "@/components/paywall/LockedContent";

import GroupWorkIcon from "@mui/icons-material/GroupWork";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const { hasFeature } = useSubscription();
  const [activeTab, setActiveTab] = useState<LeaderboardType>("individual");
  const [filters, setFilters] = useState<Partial<FilterType>>({});
  
  const {
    leaderboard,
    teamLeaderboard,
    tournamentLeaderboard,
    loading,
    loadingMore,
    hasMore,
    fetchMore,
  } = useLeaderboard(activeTab, { filters });

  const individualObserverTarget = useRef<HTMLDivElement>(null);
  const teamsObserverTarget = useRef<HTMLDivElement>(null);
  const tournamentsObserverTarget = useRef<HTMLDivElement>(null);

  const getObserverTarget = () => {
    switch (activeTab) {
      case "individual":
        return individualObserverTarget;
      case "teams":
        return teamsObserverTarget;
      case "tournaments":
        return tournamentsObserverTarget;
      default:
        return null;
    }
  };

  useEffect(() => {
    const observerTarget = getObserverTarget();
    if (!observerTarget?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && hasMore) {
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

  // Check if user has Pro subscription
  const hasProAccess = hasFeature("profileInsightsAccess");

  if (!hasProAccess) {
    return (
      <div className="min-h-screen bg-lb-white">
        <header className="bg-[#353535] border-b border-[#d9d9d9]">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-5xl font-bold text-lb-white tracking-tight">
                Leaderboards
              </h1>
            </div>
            <div className="h-1 w-20 bg-[#3c6e71] mb-2" />
            <p className="text-[#d9d9d9] text-sm leading-relaxed max-w-2xl">
            Compete, rank, and dominate—track your performance across every match category and tournament.
            </p>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <LockedContent
            feature="leaderboard"
            requiredTier="pro"
            title="Leaderboard Access"
            description="Upgrade to Pro to access leaderboards and see how you rank against other players"
            showUpgradeButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lb-white">
      {/* Hero Header */}
      <header className="bg-[#353535] border-b border-[#d9d9d9]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-5xl font-bold text-lb-white tracking-tight">
              Leaderboards
            </h1>
          </div>
          <div className="h-1 w-20 bg-[#3c6e71] mb-2" />
          <p className="text-[#d9d9d9] text-sm leading-relaxed max-w-2xl">
            Compete, rank and dominate.
          </p>
          <p className="text-[#d9d9d9] text-sm leading-relaxed max-w-2xl">
            Track your performance across all match
            categories and tournaments.
          </p>
        </div>
      </header>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-20 bg-lb-white shadow-sm">
        <div className="max-w-6xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as LeaderboardType)}
            className="w-full"
          >
            <TabsList className="flex items-center flex-wrap w-full h-auto rounded-none p-0 bg-transparent gap-0">
              {/* Individual Tab */}
              <TabsTrigger
                value="individual"
                className="
                  flex-1 p-2 text-xs font-semibold uppercase tracking-wider rounded-none
                  transition-all duration-200 border-0
                  border-b-2 border-transparent
                  text-[#353535] hover:bg-[#f5f5f5]
                  data-[state=active]:border-[#3c6e71] 
                  data-[state=active]:text-[#3c6e71] data-[state=active]:bg-white
                "
              >
                <div className="flex items-center justify-center gap-2">
                  <AutoAwesomeIcon className="w-4 h-4" />
                  <span>Individual</span>
                </div>
              </TabsTrigger>

              {/* Teams Tab */}
              <TabsTrigger
                value="teams"
                className="
                  flex-1 p-2 text-xs font-semibold uppercase tracking-wider rounded-none
                  transition-all duration-200 border-0
                  border-b-2 border-transparent
                  text-[#353535] hover:bg-[#f5f5f5]
                  data-[state=active]:border-[#3c6e71]
                  data-[state=active]:text-[#3c6e71] data-[state=active]:bg-white
                "
              >
                <div className="flex items-center justify-center gap-2">
                  <GroupWorkIcon className="w-4 h-4" />
                  <span>Teams</span>
                </div>
              </TabsTrigger>

              {/* Tournaments Tab */}
              <TabsTrigger
                value="tournaments"
                className="
                  flex-1 p-2 text-xs font-semibold uppercase tracking-wider rounded-none
                  transition-all duration-200 border-0
                  border-b-2 border-transparent
                  text-[#353535] hover:bg-[#f5f5f5]
                  data-[state=active]:border-[#3c6e71]
                  data-[state=active]:text-[#3c6e71] data-[state=active]:bg-white
                "
              >
                <div className="flex items-center justify-center gap-2">
                  <EmojiEventsIcon className="w-4 h-4" />
                  <span>Tournaments</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as LeaderboardType);
            // Clear filters when switching tabs (except for teams/tournaments)
            if (v !== "teams" && v !== "tournaments") {
              setFilters({});
            }
          }}
          className="w-full"
        >
          <TabsContent value="individual" className="p-0">
            <LeaderboardFilters
              filters={filters}
              onFiltersChange={setFilters}
              tabType="individual"
            />
            <LeaderboardPanel
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              observerRef={individualObserverTarget}
            >
              <PlayerLeaderboard
                data={leaderboard}
                loading={loading}
                emptyMessage="No individual matches yet"
                matchType={filters.type || "all"}
                currentUserId={user?._id}
              />
            </LeaderboardPanel>
          </TabsContent>

          <TabsContent value="teams" className="p-0">
            <LeaderboardPanel
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
            </LeaderboardPanel>
          </TabsContent>

          <TabsContent value="tournaments" className="p-0">
            <LeaderboardPanel
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
            </LeaderboardPanel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* Reusable Leaderboard Panel Component */
function LeaderboardPanel({
  children,
  loading,
  loadingMore,
  hasMore,
  observerRef,
}: any) {
  return (
    <div className="border border-[#d9d9d9]">
      {/* Content */}
      <div className="bg-[#ffffff]">{children}</div>

      {/* Infinite Scroll Zone */}
      {!loading && (
        <div
          ref={observerRef}
          className="
            h-14 flex flex-col items-center justify-center
            border-t border-[#d9d9d9]
            bg-[#f9f9f9]
          "
        >
          {loadingMore ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin w-5 h-5 text-[#3c6e71]" />
              <span className="text-sm font-medium text-[#353535]">
                Loading more rankings…
              </span>
            </div>
          ) : !hasMore ? (
            <p className="text-sm text-[#d9d9d9] italic font-medium">
              You've reached the end of the leaderboard
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
