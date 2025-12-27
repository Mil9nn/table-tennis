/**
 * LeaderboardEmptyState Examples
 * 
 * This file demonstrates all variations and use cases of the LeaderboardEmptyState component.
 * Use this as reference when implementing the component in your leaderboards.
 */

import { LeaderboardEmptyState } from "./components";

/**
 * Example 1: Default Singles Leaderboard Empty State
 */
export function ExampleSinglesEmpty() {
  return <LeaderboardEmptyState type="singles" />;
}

/**
 * Example 2: Doubles Leaderboard Empty State
 */
export function ExampleDoublesEmpty() {
  return <LeaderboardEmptyState type="doubles" />;
}

/**
 * Example 3: Mixed Doubles Leaderboard Empty State
 */
export function ExampleMixedDoublesEmpty() {
  return <LeaderboardEmptyState type="mixed_doubles" />;
}

/**
 * Example 4: Teams Leaderboard Empty State
 */
export function ExampleTeamsEmpty() {
  return <LeaderboardEmptyState type="teams" />;
}

/**
 * Example 5: Tournaments Leaderboard Empty State
 */
export function ExampleTournamentsEmpty() {
  return <LeaderboardEmptyState type="tournaments" />;
}

/**
 * Example 6: Custom Title and Description
 */
export function ExampleCustomText() {
  return (
    <LeaderboardEmptyState
      type="singles"
      title="No matches recorded"
      description="Your singles match history will appear here once you complete your first match."
    />
  );
}

/**
 * Example 7: Without Subtext
 */
export function ExampleNoSubtext() {
  return <LeaderboardEmptyState type="doubles" showSubtext={false} />;
}

/**
 * Example 8: In a Tab Component (Recommended Pattern)
 */
export function ExampleInTabs() {
  const leaderboardData = {
    singles: [] as any[],
    doubles: [] as any[],
    teams: [] as any[],
  };

  return (
    <div className="space-y-4">
      {/* Singles Tab */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-[#353535]">Singles</h3>
        {leaderboardData.singles.length === 0 ? (
          <LeaderboardEmptyState type="singles" />
        ) : (
          <div>{/* Your leaderboard list here */}</div>
        )}
      </div>

      {/* Doubles Tab */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-[#353535]">Doubles</h3>
        {leaderboardData.doubles.length === 0 ? (
          <LeaderboardEmptyState type="doubles" />
        ) : (
          <div>{/* Your leaderboard list here */}</div>
        )}
      </div>

      {/* Teams Tab */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-[#353535]">Teams</h3>
        {leaderboardData.teams.length === 0 ? (
          <LeaderboardEmptyState type="teams" />
        ) : (
          <div>{/* Your leaderboard list here */}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 9: Full Leaderboard Component Pattern
 */
export function ExampleFullComponent() {
  // Mock data
  const leaderboard: any[] = []; // or null
  const loading = false;
  const matchType = "singles" as const;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return <LeaderboardEmptyState type={matchType} />;
  }

  return (
    <div className="divide-y border-[#d9d9d9]">
      {/* Render leaderboard entries */}
    </div>
  );
}

/**
 * Example 10: Conditional Rendering with Different States
 */
export function ExampleConditionalRendering() {
  // Example file showing all possible states - using 'as' to allow demonstration of all states
  const state = "empty" as "loading" | "empty" | "data" | "error";

  return (
    <div>
      {state === "loading" && <div className="p-6 text-center">Loading rankings...</div>}

      {state === "empty" && (
        <LeaderboardEmptyState
          type="singles"
          title="No rankings available"
          description="Start playing matches to earn your ranking."
        />
      )}

      {state === "data" && (
        <div className="divide-y">{/* Your data here */}</div>
      )}

      {state === "error" && (
        <div className="p-6 text-center text-red-600">Failed to load leaderboard</div>
      )}
    </div>
  );
}

/**
 * Design System - Color Reference
 * 
 * Primary: #353535 (dark gray text)
 * Accent: #3c6e71 (teal)
 * Light: #d9d9d9 (borders & light text)
 * Icon container bg: rgba(60, 110, 113, 0.08)
 * Container bg: rgba(60, 110, 113, 0.02)
 */

/**
 * Component Props Reference
 * 
 * type?: 'singles' | 'doubles' | 'mixed_doubles' | 'teams' | 'tournaments'
 *   - Determines icon, title, description, and subtext
 *   - Default: 'singles'
 * 
 * title?: string
 *   - Override the default type-specific title
 * 
 * description?: string
 *   - Override the default type-specific description
 * 
 * icon?: React.ElementType
 *   - Override the default type-specific icon (use Lucide icons)
 * 
 * showSubtext?: boolean
 *   - Show/hide the motivational subtext
 *   - Default: true
 */
