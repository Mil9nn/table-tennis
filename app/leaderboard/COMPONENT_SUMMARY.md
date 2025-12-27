# Leaderboard Empty State Component Suite

## Overview

A comprehensive, reusable empty state solution for leaderboards with context-aware messaging, consistent design, and flexible customization.

## Components

### 1. **LeaderboardEmptyState** ⭐ PRIMARY
Full-screen empty state component with type-specific messaging.

**File**: `components/LeaderboardEmptyState.tsx`

**Use When**: Tab/section has no data to display

**Features**:
- 5 type-specific configurations (singles, doubles, mixed_doubles, teams, tournaments)
- Auto-generated context-aware messaging
- Customizable title, description, and icon
- Motivational subtext toggle
- Design system aligned styling
- Single file, no dependencies on other empty state components

**Props**:
```tsx
type LeaderboardEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  type?: "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";
  showSubtext?: boolean;
}
```

**Import**:
```tsx
import { LeaderboardEmptyState } from "@/app/leaderboard/components";
```

---

### 2. **LeaderboardStateContainer** 🎯 RECOMMENDED FOR NEW CODE
Smart wrapper that handles loading, empty, and data states automatically.

**File**: `components/LeaderboardStateContainer.tsx`

**Use When**: You want a single component to manage all states (loading → empty → data)

**Features**:
- Automatic state handling
- Clean separation of concerns
- Custom loading component support
- Integrates LeaderboardEmptyState
- Reduces boilerplate code

**Props**:
```tsx
type LeaderboardStateContainerProps = {
  data: any[] | null | undefined;
  isLoading?: boolean;
  type?: "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showSubtext?: boolean;
}
```

**Example**:
```tsx
<LeaderboardStateContainer
  data={leaderboard}
  isLoading={loading}
  type="singles"
>
  <div className="divide-y">
    {leaderboard.map(entry => (
      <PlayerRow key={entry.id} entry={entry} />
    ))}
  </div>
</LeaderboardStateContainer>
```

**Import**:
```tsx
import { LeaderboardStateContainer } from "@/app/leaderboard/components";
```

---

### 3. **LeaderboardEmpty** ⚙️ INTERNAL
Lightweight list-level empty state component (for modal/section contexts).

**File**: `components/shared/LeaderboardEmpty.tsx`

**Use When**: List section (not full tab) needs empty feedback

**Features**:
- Compact styling (less vertical padding)
- Generic message support
- Simple, minimal design
- Backward compatible

**Props**:
```tsx
type LeaderboardEmptyProps = {
  message: string;
  subtext?: string;
  icon?: React.ReactNode;
}
```

**Note**: Prefer `LeaderboardEmptyState` for new implementations

---

## Design System Consistency

All components use the unified color palette:

| Element | Color | Usage |
|---------|-------|-------|
| Title/Primary Text | `#353535` | Main headings, labels |
| Accent | `#3c6e71` | Icons, highlights, interactive |
| Secondary | `#284b63` | Deeper backgrounds |
| Light/Border | `#d9d9d9` | Dividers, secondary text |
| Background | `#ffffff` | Canvas, containers |

## Quick Reference

### When to Use What?

| Scenario | Component | Example |
|----------|-----------|---------|
| Single tab has no data | `LeaderboardEmptyState` | `<LeaderboardEmptyState type="singles" />` |
| Need to manage states | `LeaderboardStateContainer` | Wraps loading/empty/data logic |
| List section is empty | `LeaderboardEmpty` | Internal modal sections |

### Recommended Pattern (2025 Best Practice)

```tsx
// OLD - Manual state management
if (loading) return <Loader />;
if (!data?.length) return <CustomEmpty />;
return <List data={data} />;

// NEW - Cleaner abstraction
<LeaderboardStateContainer
  data={data}
  isLoading={loading}
  type="singles"
>
  <List data={data} />
</LeaderboardStateContainer>
```

## File Structure

```
/app/leaderboard/
├── components/
│   ├── index.ts
│   ├── LeaderboardEmptyState.tsx      ← Main component
│   ├── LeaderboardStateContainer.tsx  ← Smart wrapper
│   ├── PlayerLeaderboard.tsx
│   ├── TeamLeaderboard.tsx
│   ├── TournamentLeaderboard.tsx
│   ├── shared/
│   │   ├── index.ts
│   │   ├── LeaderboardEmpty.tsx       ← Internal variant
│   │   ├── LeaderboardLoading.tsx
│   │   ├── RankBadge.tsx
│   │   └── StreakBadge.tsx
├── COMPONENT_SUMMARY.md               ← This file
├── EMPTY_STATE_GUIDE.md               ← Detailed docs
├── EMPTY_STATE_EXAMPLES.tsx           ← Code examples
└── EMPTY_STATE_IMPLEMENTATION.md      ← Implementation guide
```

## Type Configurations

### Singles
```
Icon: Target (bullseye)
Title: "No singles rankings yet"
Message: "Start competing in singles matches to climb the leaderboard."
Subtext: "Win matches to earn points and improve your ranking."
```

### Doubles
```
Icon: Users (two people)
Title: "No doubles rankings yet"
Message: "Team up and compete in doubles matches."
Subtext: "Build chemistry with your partner to dominate the leaderboard."
```

### Mixed Doubles
```
Icon: Users
Title: "No mixed doubles rankings yet"
Message: "Find a partner and compete in mixed doubles."
Subtext: "Mixed doubles matches will appear once you compete."
```

### Teams
```
Icon: Trophy
Title: "No team rankings yet"
Message: "Create or join a team to start competing."
Subtext: "Team victories will determine your ranking position."
```

### Tournaments
```
Icon: Trophy
Title: "No tournament rankings yet"
Message: "Participate in tournaments to earn tournament points."
Subtext: "Tournament results will be reflected in your profile."
```

## Integration Examples

### Example 1: Simple Tab Integration
```tsx
function SinglesLeaderboard({ data, loading }) {
  return (
    <>
      {loading && <LeaderboardLoading />}
      {!loading && (
        <>
          {data.length === 0 ? (
            <LeaderboardEmptyState type="singles" />
          ) : (
            <LeaderboardRows data={data} />
          )}
        </>
      )}
    </>
  );
}
```

### Example 2: Using StateContainer (Recommended)
```tsx
function SinglesLeaderboard({ data, loading }) {
  return (
    <LeaderboardStateContainer
      data={data}
      isLoading={loading}
      type="singles"
    >
      <LeaderboardRows data={data} />
    </LeaderboardStateContainer>
  );
}
```

### Example 3: Custom Messaging
```tsx
function CustomLeaderboard({ data, loading, matchType }) {
  return (
    <LeaderboardStateContainer
      data={data}
      isLoading={loading}
      type={matchType}
      emptyTitle="No matches in your history"
      emptyDescription="Your matches will be displayed here once you start playing."
    >
      <LeaderboardRows data={data} />
    </LeaderboardStateContainer>
  );
}
```

## Documentation Files

1. **COMPONENT_SUMMARY.md** ← You are here
   - Overview and quick reference
   - Component comparison
   - File structure
   - Integration examples

2. **EMPTY_STATE_GUIDE.md**
   - Detailed feature documentation
   - Props reference
   - Type configurations
   - Best practices
   - Accessibility notes

3. **EMPTY_STATE_EXAMPLES.tsx**
   - Working code examples
   - All 10 use cases
   - Copy-paste ready patterns

4. **EMPTY_STATE_IMPLEMENTATION.md**
   - Step-by-step implementation
   - Troubleshooting guide
   - Migration from old code
   - Performance notes

## Key Features

✅ **Type-Safe**: Full TypeScript support with proper prop types
✅ **Accessible**: WCAG AA compliant, semantic HTML
✅ **Responsive**: Mobile-first design with proper spacing
✅ **Performant**: No data fetching, instant render
✅ **Consistent**: Unified color palette with profile page
✅ **Flexible**: Highly customizable while maintaining defaults
✅ **Documented**: Comprehensive guide with examples
✅ **Reusable**: Copy across all leaderboard types

## Next Steps

1. **Review** the EMPTY_STATE_GUIDE.md for detailed documentation
2. **Check** EMPTY_STATE_EXAMPLES.tsx for code samples
3. **Choose** between:
   - `LeaderboardEmptyState` - Direct usage
   - `LeaderboardStateContainer` - Recommended for new code
4. **Import** from `@/app/leaderboard/components`
5. **Integrate** into your leaderboard components

## Version History

### v1.0 (Current)
- Initial release
- 5 type configurations
- Comprehensive documentation
- Smart state container
- Design system aligned

## Contributing

When adding new features:
1. Update all 4 documentation files
2. Add code examples to EMPTY_STATE_EXAMPLES.tsx
3. Update type configurations if needed
4. Test across all 5 leaderboard types
5. Ensure color consistency

## Support

Questions or issues?
1. Check EMPTY_STATE_GUIDE.md first
2. Review EMPTY_STATE_EXAMPLES.tsx for patterns
3. See EMPTY_STATE_IMPLEMENTATION.md troubleshooting
4. Create a new Amp thread with details
