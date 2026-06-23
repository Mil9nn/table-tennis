# Leaderboard Empty State - Quick Start (2 minutes)

## TL;DR

A reusable, beautifully designed empty state component for leaderboards.

```tsx
import { LeaderboardEmptyState } from "@/app/leaderboard/components";

// That's it! Use anywhere you have no data
<LeaderboardEmptyState type="singles" />
```

## 5 Types Available

```tsx
<LeaderboardEmptyState type="singles" />          // 🎯 Target icon
<LeaderboardEmptyState type="doubles" />          // 👥 Users icon
<LeaderboardEmptyState type="mixed_doubles" />    // 👥 Users icon
<LeaderboardEmptyState type="teams" />            // 🏆 Trophy icon
<LeaderboardEmptyState type="tournaments" />      // 🏆 Trophy icon
```

## Better Way: State Container

Handles loading → empty → data automatically:

```tsx
import { LeaderboardStateContainer } from "@/app/leaderboard/components";

<LeaderboardStateContainer
  data={leaderboard}
  isLoading={loading}
  type="singles"
>
  <LeaderboardList data={leaderboard} />
</LeaderboardStateContainer>
```

## Customize (Optional)

```tsx
<LeaderboardEmptyState
  type="singles"
  title="Your custom title"
  description="Your custom message"
  showSubtext={false}
/>
```

## What You Get

✅ Type-specific messaging (auto-generated)
✅ Beautiful icon per type
✅ Motivational subtext
✅ Profile design palette applied
✅ Mobile responsive
✅ WCAG AA accessible
✅ Zero config needed

## Design Preview

```
     📌 Icon Box (64×64)
     
     Leaderboard Title
     
     Context-specific description
     about how to earn rankings
     
     Motivational subtext (optional)
```

## Color Reference

| Element | Color |
|---------|-------|
| Title | #353535 (dark gray) |
| Icon | #3c6e71 (teal) |
| Description | #d9d9d9 (light gray) |
| Background | Subtle teal tint |

## All Props

```tsx
interface LeaderboardEmptyStateProps {
  type?: "singles" | "doubles" | "mixed_doubles" | "teams" | "tournaments";
  title?: string;                    // Override default
  description?: string;              // Override default
  icon?: React.ElementType;          // Use custom Lucide icon
  showSubtext?: boolean;             // Show motivational text (default: true)
}
```

## Default Messages

### Singles
- **Title:** No singles rankings yet
- **Message:** Start competing in singles matches to climb the leaderboard
- **Subtext:** Win matches to earn points and improve your ranking

### Doubles
- **Title:** No doubles rankings yet
- **Message:** Team up and compete in doubles matches
- **Subtext:** Build chemistry with your partner to dominate the leaderboard

### Mixed Doubles
- **Title:** No mixed doubles rankings yet
- **Message:** Find a partner and compete in mixed doubles
- **Subtext:** Mixed doubles matches will appear once you compete

### Teams
- **Title:** No team rankings yet
- **Message:** Create or join a team to start competing
- **Subtext:** Team victories will determine your ranking position

### Tournaments
- **Title:** No tournament rankings yet
- **Message:** Participate in tournaments to earn tournament points
- **Subtext:** Tournament results will be reflected in your profile

## Examples

### Example 1: Basic Usage
```tsx
if (data.length === 0) {
  return <LeaderboardEmptyState type="singles" />;
}
return <LeaderboardList data={data} />;
```

### Example 2: With Loading
```tsx
<LeaderboardStateContainer
  data={data}
  isLoading={loading}
  type="singles"
>
  <LeaderboardList data={data} />
</LeaderboardStateContainer>
```

### Example 3: Custom Title
```tsx
<LeaderboardEmptyState
  type="singles"
  title="No custom matches yet"
  description="Create a tournament to start."
/>
```

### Example 4: In a Tab Component
```tsx
<TabsContent value="singles">
  {leaderboard.length === 0 ? (
    <LeaderboardEmptyState type="singles" />
  ) : (
    <LeaderboardList data={leaderboard} />
  )}
</TabsContent>
```

## File Locations

**Components:**
- `app/leaderboard/components/LeaderboardEmptyState.tsx`
- `app/leaderboard/components/LeaderboardStateContainer.tsx`

**Documentation:**
- `app/leaderboard/README.md` - Full overview
- `app/leaderboard/COMPONENT_SUMMARY.md` - Quick reference
- `app/leaderboard/EMPTY_STATE_GUIDE.md` - Detailed docs
- `app/leaderboard/EMPTY_STATE_EXAMPLES.tsx` - Code examples
- `app/leaderboard/EMPTY_STATE_IMPLEMENTATION.md` - Implementation guide
- `app/leaderboard/DESIGN_REFERENCE.md` - Design specs

## Next: Read Full Docs

1. **README.md** (5 min) - Overview
2. **COMPONENT_SUMMARY.md** (5 min) - Features
3. **EMPTY_STATE_EXAMPLES.tsx** (5 min) - Code patterns
4. **EMPTY_STATE_GUIDE.md** (10 min) - All details

## One More Thing

The design is synced with the profile page:
- Same color palette
- Same spacing system
- Same typography scale
- Consistent feel across app

---

**That's it!** You're ready to use it. 🚀
