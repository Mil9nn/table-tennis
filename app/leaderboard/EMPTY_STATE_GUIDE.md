# Leaderboard Empty State Component Guide

## Overview

The `LeaderboardEmptyState` is a reusable, context-aware empty state component designed specifically for leaderboard pages. It provides visual feedback when no ranking data is available, with type-specific messaging that guides users toward taking action.

## Component Structure

```
LeaderboardEmptyState
├── Icon Container (colored background)
├── Title
├── Description
└── Subtext (optional)
```

## Usage

### Basic Usage

```tsx
import { LeaderboardEmptyState } from "@/app/leaderboard/components";

export function MyLeaderboard() {
  return (
    <>
      {data.length === 0 && (
        <LeaderboardEmptyState type="singles" />
      )}
    </>
  );
}
```

### With Custom Props

```tsx
<LeaderboardEmptyState
  type="teams"
  title="No teams competing yet"
  description="Your team's rankings will appear here once you start competing."
  showSubtext={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'singles' \| 'doubles' \| 'mixed_doubles' \| 'teams' \| 'tournaments'` | `'singles'` | The leaderboard type - determines default messaging and icon |
| `title` | `string` | Type-specific | Custom title override |
| `description` | `string` | Type-specific | Custom description override |
| `icon` | `React.ElementType` | Type-specific | Custom icon component (Lucide icon) |
| `showSubtext` | `boolean` | `true` | Whether to show the motivational subtext |

## Type-Specific Configurations

### Singles
```tsx
{
  icon: Target,
  title: "No singles rankings yet",
  description: "Start competing in singles matches to climb the leaderboard.",
  subtext: "Win matches to earn points and improve your ranking."
}
```

### Doubles
```tsx
{
  icon: Users,
  title: "No doubles rankings yet",
  description: "Team up and compete in doubles matches.",
  subtext: "Build chemistry with your partner to dominate the leaderboard."
}
```

### Mixed Doubles
```tsx
{
  icon: Users,
  title: "No mixed doubles rankings yet",
  description: "Find a partner and compete in mixed doubles.",
  subtext: "Mixed doubles matches will appear once you compete."
}
```

### Teams
```tsx
{
  icon: Trophy,
  title: "No team rankings yet",
  description: "Create or join a team to start competing.",
  subtext: "Team victories will determine your ranking position."
}
```

### Tournaments
```tsx
{
  icon: Trophy,
  title: "No tournament rankings yet",
  description: "Participate in tournaments to earn tournament points.",
  subtext: "Tournament results will be reflected in your profile."
}
```

## Design Features

- **Color Palette**: Uses the profile palette for consistency
  - Primary: `#353535` (dark gray text)
  - Accent: `#3c6e71` (teal)
  - Light: `#d9d9d9` (borders & light text)

- **Icon Container**: Semi-transparent teal background with rounded corners
- **Responsive**: Adjusts padding and sizing for mobile/desktop
- **Motivational**: Includes supportive subtext to encourage user action

## Related Components

- **LeaderboardEmpty** - Internal component for list-level empty states (use sparingly)
- **EmptyState** (Profile) - Different styling, simpler structure
- **EmptyState** (Tournaments) - Similar structure with action links

## Best Practices

1. **Always provide the `type` prop** for accurate context-specific messaging
2. **Use at tab level** - Show when a leaderboard tab has no data
3. **Don't show multiple empty states** - Use one at the most relevant level
4. **Customize if needed** - Override title/description for special cases but maintain tone
5. **Keep subtext enabled** - The motivational text improves UX engagement

## Example: Full Integration

```tsx
import { LeaderboardEmptyState } from "@/app/leaderboard/components";

function PlayerLeaderboard({ data, matchType }: Props) {
  if (loading) return <LeaderboardLoading />;
  
  if (data.length === 0) {
    return <LeaderboardEmptyState type={matchType} />;
  }

  return (
    <div className="divide-y">
      {data.map(entry => (
        <PlayerRow key={entry.player._id} entry={entry} />
      ))}
    </div>
  );
}
```

## Accessibility

- Icon provides visual context without relying on color alone
- Semantic heading hierarchy with proper `<h3>` tag
- Clear, descriptive text for all user levels
- Sufficient color contrast ratios (WCAG AA compliant)

## Styling Details

### Color Values
- Icon container background: `rgba(60, 110, 113, 0.08)`
- Container background: `rgba(60, 110, 113, 0.02)`
- Title color: `#353535`
- Description color: `#d9d9d9`
- Subtext color: `rgba(217, 217, 217, 0.7)`

### Spacing
- Top/bottom padding: `5rem` (py-20)
- Icon size: `32px` (h-8 w-8)
- Icon container size: `64px` (h-16 w-16)
- Icon container margin bottom: `1rem` (mb-4)
- Title margin bottom: `0.5rem` (mb-2)
- Subtext margin top: `0.5rem` (mt-2)
