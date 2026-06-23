"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { LeaderboardEmptyState } from "./LeaderboardEmptyState";

interface LeaderboardStateContainerProps {
  /**
   * The data to render. If empty/falsy, shows empty state
   */
  data: any[] | null | undefined;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Leaderboard type for context-specific messaging
   */
  type?: "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";

  /**
   * Custom empty state title
   */
  emptyTitle?: string;

  /**
   * Custom empty state description
   */
  emptyDescription?: string;

  /**
   * The content to render when data is available
   */
  children: React.ReactNode;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Show subtext in empty state
   */
  showSubtext?: boolean;
}

/**
 * Container component that handles loading, empty, and data states
 * for leaderboards. Provides a clean abstraction for state management.
 *
 * @example
 * ```tsx
 * <LeaderboardStateContainer
 *   data={leaderboard}
 *   isLoading={loading}
 *   type="singles"
 * >
 *   <div className="divide-y">
 *     {leaderboard.map(entry => (
 *       <PlayerRow key={entry.id} entry={entry} />
 *     ))}
 *   </div>
 * </LeaderboardStateContainer>
 * ```
 */
export function LeaderboardStateContainer({
  data,
  isLoading = false,
  type = "singles",
  emptyTitle,
  emptyDescription,
  children,
  loadingComponent,
  showSubtext = true,
}: LeaderboardStateContainerProps) {
  // Loading state
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Loader2
            className="animate-spin mb-3"
            size={32}
            style={{ color: "#3c6e71" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "#d9d9d9" }}
          >
            Loading leaderboard...
          </p>
        </div>
      )
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <LeaderboardEmptyState
        type={type}
        title={emptyTitle}
        description={emptyDescription}
        showSubtext={showSubtext}
      />
    );
  }

  // Data available
  return <>{children}</>;
}
