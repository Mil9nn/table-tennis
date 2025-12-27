# LeaderboardEmptyState Implementation Guide

## Quick Start

### Import
```tsx
import { LeaderboardEmptyState } from "@/app/leaderboard/components";
```

### Basic Usage
```tsx
<LeaderboardEmptyState type="singles" />
```

## Component Hierarchy

```
LeaderboardEmptyState (Main, full-screen)
├── For tab-level empty states
└── Exports from: components/index.ts

LeaderboardEmpty (Secondary, list-level)
├── For section-level empty states
└── Internal component in: components/shared/
```

## File Structure

```
/app/leaderboard/
├── components/
│   ├── LeaderboardEmptyState.tsx    ← NEW (main component)
│   ├── shared/
│   │   └── LeaderboardEmpty.tsx     ← Updated (internal)
│   ├── PlayerLeaderboard.tsx
│   ├── TeamLeaderboard.tsx
│   └── index.ts                     ← Updated (exports)
├── EMPTY_STATE_GUIDE.md             ← Detailed docs
├── EMPTY_STATE_EXAMPLES.tsx         ← Code examples
└── EMPTY_STATE_IMPLEMENTATION.md    ← This file
```

## Design System Alignment

### Color Palette
Consistent with Profile page colors:
- **Primary Text**: `#353535` (dark gray)
- **Accent**: `#3c6e71` (teal - primary interactive color)
- **Secondary**: `#284b63` (dark teal - for deeper elements)
- **Light**: `#d9d9d9` (borders, secondary text)
- **Background**: `#ffffff` (white/transparent)

### Typography Hierarchy
- Icon: 32px (h-8 w-8)
- Title: 18px font-semibold
- Description: 14px
- Subtext: 12px (lighter, motivational)

### Spacing
- Container padding: 5rem vertical, 1.5rem horizontal
- Icon container: 64px square with 16px margin-bottom
- Title: 8px margin-bottom
- Subtext: 8px margin-top

## Type-Specific Configurations

### 1. Singles
- **Icon**: Target (bullseye)
- **Purpose**: Individual competition ranking
- **Message Focus**: Personal achievement, point accumulation

### 2. Doubles
- **Icon**: Users (two people)
- **Purpose**: Team-of-two competition ranking
- **Message Focus**: Partnership, collaboration

### 3. Mixed Doubles
- **Icon**: Users (two people)
- **Purpose**: Gender-mixed team ranking
- **Message Focus**: Partnership across genders

### 4. Teams
- **Icon**: Trophy (achievement)
- **Purpose**: Full team competition ranking
- **Message Focus**: Team building, victory

### 5. Tournaments
- **Icon**: Trophy (achievement)
- **Purpose**: Tournament-specific rankings
- **Message Focus**: Competition wins, milestone achievements

## Implementation Checklist

- [x] Create `LeaderboardEmptyState.tsx` component
- [x] Update `components/index.ts` to export new component
- [x] Update `LeaderboardEmpty.tsx` (internal variant)
- [x] Add JSDoc comments
- [x] Create comprehensive documentation
- [x] Provide usage examples
- [x] Ensure color consistency with profile palette
- [x] Test all 5 type variants
- [ ] Integrate into PlayerLeaderboard (when list is empty)
- [ ] Integrate into TeamLeaderboard (when list is empty)
- [ ] Integrate into TournamentLeaderboard (when list is empty)

## Migration Guide (If Updating Existing Code)

### Before
```tsx
if (data.length === 0) {
  return (
    <div>
      <p>No data available</p>
    </div>
  );
}
```

### After
```tsx
if (data.length === 0) {
  return <LeaderboardEmptyState type="singles" />;
}
```

## Props Deep Dive

### `type` (Required for auto-messaging)
Controls which default configuration is used. All 5 types have unique messaging that contextually informs users about the specific leaderboard.

```tsx
<LeaderboardEmptyState type="teams" />
// Shows: "No team rankings yet"
// Icon: Trophy
// Subtext: "Team victories will determine your ranking position."
```

### `title` (Optional)
Override the default type-specific title for custom messaging.

```tsx
<LeaderboardEmptyState 
  type="singles"
  title="You haven't played any singles matches yet"
/>
```

### `description` (Optional)
Override the default type-specific description.

```tsx
<LeaderboardEmptyState 
  type="doubles"
  description="Find a partner and start competing today!"
/>
```

### `icon` (Optional)
Use a custom Lucide icon instead of the type-specific default.

```tsx
import { Zap } from "lucide-react";

<LeaderboardEmptyState 
  type="singles"
  icon={Zap}
/>
```

### `showSubtext` (Optional)
Show or hide the motivational subtext.

```tsx
<LeaderboardEmptyState type="singles" showSubtext={false} />
```

## Best Practices

### ✅ Do
- Use type-specific props for accurate context
- Show at the tab/section level
- Keep the motivational subtext enabled
- Use default messaging when possible
- Pair with loading state during data fetch

### ❌ Don't
- Nest multiple empty states
- Remove the icon
- Use generic "No data" messaging
- Override messaging without purpose
- Show empty state while loading data

## Performance

The component is lightweight and stateless:
- No data fetching
- No complex computations
- No animation (just CSS transitions)
- Renders instantly

## Accessibility

- Semantic heading with `<h3>` tag
- Icon provides visual context
- Text descriptions for all users
- WCAG AA color contrast compliant
- No rely on color alone for information

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Related Documentation

- `EMPTY_STATE_GUIDE.md` - Detailed feature documentation
- `EMPTY_STATE_EXAMPLES.tsx` - Code examples and patterns
- Profile EmptyState - Alternative simpler implementation
- Tournament EmptyState - Similar structure with actions

## Troubleshooting

### Empty state not showing?
Check that data length is 0:
```tsx
if (!data || data.length === 0) {
  return <LeaderboardEmptyState type="singles" />;
}
```

### Wrong icon/message?
Verify the `type` prop matches your leaderboard:
```tsx
// Singles leaderboard
<LeaderboardEmptyState type="singles" />

// Teams leaderboard
<LeaderboardEmptyState type="teams" />
```

### Need custom styling?
Override with custom props:
```tsx
<LeaderboardEmptyState
  type="singles"
  title="Custom title"
  description="Custom description"
/>
```

## Future Enhancements

- [ ] Add action button (e.g., "Browse Tournaments")
- [ ] Animated empty state illustrations
- [ ] Multi-language support
- [ ] Dark mode variant
- [ ] Skeleton loading variant
