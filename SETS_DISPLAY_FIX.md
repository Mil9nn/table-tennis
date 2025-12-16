# Team Tournament Sets Display - Fix

## Problem

When creating a team tournament with "Sets Per Individual Match: 1", the tournament info page showed "Sets Per Match: 3" and matches were being created with 3 sets instead of 1.

### Root Cause

1. **Form Submission:** Auto-set `setsPerMatch = 3` for team tournaments (hardcoded default)
2. **Info Display:** Showed `rules.setsPerMatch` instead of `teamConfig.setsPerSubMatch` for teams
3. **Result:** User's selection was ignored

## Solution

### Changes Made

#### 1. Form Submission Logic (`app/tournaments/create/page.tsx`, lines 299-304)

**Before:**
```typescript
setsPerMatch: data.category === "team" ? 3 : Number(data.setsPerMatch),
```

**After:**
```typescript
setsPerMatch: data.category === "team" 
  ? Number(data.teamConfig?.setsPerSubMatch) || 3
  : Number(data.setsPerMatch),
```

**Why:** For team tournaments, set `rules.setsPerMatch` to match what the user selected for `teamConfig.setsPerSubMatch`. This ensures consistency across the database and display.

#### 2. Tournament Info Page Display (`app/tournaments/[id]/page.tsx`, lines 1166-1171)

**Before:**
```typescript
<dt className="text-muted-foreground">
  Sets per match
</dt>
<dd className="font-medium text-neutral-700">
  {tournament.rules?.setsPerMatch || "N/A"}
</dd>
```

**After:**
```typescript
<dt className="text-muted-foreground">
  {tournament.category === "team" ? "Sets per submatch" : "Sets per match"}
</dt>
<dd className="font-medium text-neutral-700">
  {tournament.category === "team"
    ? (tournament as any).teamConfig?.setsPerSubMatch || "N/A"
    : tournament.rules?.setsPerMatch || "N/A"}
</dd>
```

**Why:** 
- For team tournaments: Show "Sets per submatch" (clearer label) and read from `teamConfig.setsPerSubMatch`
- For individual tournaments: Show "Sets per match" (existing behavior) and read from `rules.setsPerMatch`

### Data Flow (After Fix)

```
User creates tournament with Sets Per Individual Match: 1
    ↓
Form submission:
  - teamConfig.setsPerSubMatch = 1
  - rules.setsPerMatch = 1 (now matches setsPerSubMatch)
    ↓
Database stores:
  {
    category: "team",
    teamConfig: { setsPerSubMatch: 1 },
    rules: { setsPerMatch: 1 }
  }
    ↓
Info page displays:
  "Sets per submatch: 1" ✓
    ↓
Match generation uses:
  teamConfig.setsPerSubMatch = 1
    ↓
Matches created:
  Each submatch is best-of-1 ✓
```

## Files Changed

1. **`app/tournaments/create/page.tsx`**
   - Lines 299-304: Updated form submission logic

2. **`app/tournaments/[id]/page.tsx`**
   - Lines 1166-1171: Updated info display logic

## Testing

### Scenario 1: Team Tournament with 1 Set
1. Create team tournament
2. Select "Sets Per Individual Match: 1"
3. Submit form
4. Go to tournament info page
5. ✅ Shows "Sets per submatch: 1"
6. Create a match and start it
7. ✅ Match has 1 set (best-of-1)

### Scenario 2: Team Tournament with 5 Sets
1. Create team tournament
2. Select "Sets Per Individual Match: 5"
3. Submit form
4. Go to tournament info page
5. ✅ Shows "Sets per submatch: 5"
6. Create a match and start it
7. ✅ Match has 5 sets (best-of-5)

### Scenario 3: Individual Tournament (Unchanged)
1. Create individual tournament
2. Select "Sets Per Match: 3"
3. Submit form
4. Go to tournament info page
5. ✅ Shows "Sets per match: 3"
6. Create a match and start it
7. ✅ Match has 3 sets (best-of-3)

## How It Works Now

### Team Tournaments
- **User selects:** "Sets Per Individual Match" (what they want each submatch to be)
- **Stored as:** 
  - `teamConfig.setsPerSubMatch` (used by match generation) ✓
  - `rules.setsPerMatch` (synced for consistency)
- **Displayed as:** "Sets per submatch: X"
- **Used by:** Match generation service reads `teamConfig.setsPerSubMatch` ✓

### Individual Tournaments
- **User selects:** "Sets Per Match" (what they want each match to be)
- **Stored as:** `rules.setsPerMatch` (used by match generation) ✓
- **Displayed as:** "Sets per match: X"
- **Used by:** Match generation service reads `rules.setsPerMatch` ✓

## Backward Compatibility

✅ **All existing tournaments continue to work**
- Old team tournaments have `setsPerMatch` values that may not match `setsPerSubMatch`
- They still work correctly because match generation uses `teamConfig.setsPerSubMatch`
- Info page now displays the correct value for new tournaments
- Old tournaments may show slightly different values in info page, but matches work correctly

## Technical Details

### Why `rules.setsPerMatch` is stored for teams
- Keeps database schema consistent
- Some tools/queries might expect this field
- Doesn't hurt to have it (backend doesn't use it for team logic)
- Now synchronized with user's actual selection

### Match Generation (Unchanged)
The match generation service already did this correctly:
```typescript
const setsPerSubMatch = (tournament as any).teamConfig?.setsPerSubMatch 
  ? Number((tournament as any).teamConfig.setsPerSubMatch)
  : 3;

// Then uses setsPerSubMatch for each submatch
// Never looks at rules.setsPerMatch for teams
```

So we only needed to fix:
1. ✅ Form submission (sync the value)
2. ✅ Info display (show the right value)
