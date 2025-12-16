# Naming Confusion Analysis

You're absolutely right - there's confusing duplication in field names for essentially the same concept. Here's the breakdown:

## The Problem: Multiple Names for Same Thing

### Sets Per Sub-Match (Team Tournaments)
Different names used interchangeably:
- `teamConfig.setsPerSubMatch` (Primary - used in database)
- `numberOfSetsPerSubMatch` (Match object field)
- `setsPerMatch` in rules (Secondary - misleading for teams)

**What it represents:** How many sets required to win each individual match within a team event.

Example: "Best of 3" for each of the 5 singles matches in a team event.

---

## Current Architecture Issues

### Issue 1: Confusing Field Names

| Concept | Field Names | Context | Problem |
|---------|------------|---------|---------|
| Individual tournament set requirement | `tournament.rules.setsPerMatch` | Individual tournaments | Clear ✓ |
| Team tournament submatch set requirement | `tournament.teamConfig.setsPerSubMatch` | Team tournaments | Inconsistent naming with below ✗ |
| Match document representation | `match.numberOfSetsPerSubMatch` (individual: `match.numberOfSets`) | All match types | "numberOfSets" vs "numberOfSetsPerSubMatch" ✗ |
| Rules storage (unused for teams) | `tournament.rules.setsPerMatch` | Team tournaments | Stored but never used ✗ |

### Issue 2: Redundant Storage

**In Team Tournaments, TWO places store essentially the same info:**

```
Tournament.teamConfig.setsPerSubMatch = 1      ✓ Used
Tournament.rules.setsPerMatch = 1              ✗ Stored but never read
```

This creates confusion:
- Users see both fields in the form
- Only one is actually used
- Second field appears to do nothing

### Issue 3: Type Inconsistency

When passing values through the pipeline:
```
Form → "1" (string)
   ↓
API → 1 (number)
   ↓
Database → 1 (number)
   ↓
Match Gen → 1 (number)
   ↓
Display → Shows "Best of 1"
```

Different layers expect different types (string vs number).

---

## Recommended Solution: Normalize Naming

### Option A: Rename Everything to `setsPerSubMatch` (Recommended)

```typescript
// BEFORE (Confusing):
- tournament.teamConfig.setsPerSubMatch
- match.numberOfSetsPerSubMatch
- tournament.rules.setsPerMatch (unused)

// AFTER (Clear):
- tournament.teamConfig.setsPerSubMatch
- match.setsPerSubMatch
- tournament.rules.setsPerMatch → REMOVED for team tournaments
```

**Benefits:**
- Single name for the concept
- Removes unused field
- Clearer intent

### Option B: Use Fully Qualified Names

```typescript
- tournament.teamMatches.setsPerSubMatch
- match.teamMatch.setsPerSubMatch
- match.individualMatch.numberOfSets
```

**Benefits:**
- Makes tournament type clear
- Separates team vs individual logic

### Option C: Enum-based Configuration (Best Practice)

```typescript
enum MatchConfiguration {
  SETS_FOR_INDIVIDUAL_MATCH = 'setsPerMatch',        // Individual tournaments
  SETS_FOR_TEAM_SUBMATCH = 'setsPerSubMatch',        // Team tournaments
}

// Usage:
const getValue = (tournament: Tournament, config: MatchConfiguration) => {
  if (config === MatchConfiguration.SETS_FOR_TEAM_SUBMATCH) {
    return tournament.teamConfig.setsPerSubMatch;
  }
  return tournament.rules.setsPerMatch;
};
```

---

## Immediate Fix Checklist

### 1. Remove Unused Field
- Remove `setsPerMatch` from team tournament forms
- Remove `setsPerMatch` from team tournament API payload
- Keep only `teamConfig.setsPerSubMatch`

### 2. Standardize Match Field Names
Change `match.numberOfSets` to `match.numberOfSetsPerSubMatch` for consistency.

### 3. Add Type Guards
```typescript
// Ensure consistent types at each layer
function normalizeSetsValue(value: unknown): number {
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'number') return value;
  throw new Error(`Invalid sets value: ${value}`);
}
```

### 4. Create Type-Safe Helpers
```typescript
class TournamentSetsHelper {
  static getSubMatchSets(tournament: Tournament): number {
    if (tournament.category === 'team') {
      return Number(tournament.teamConfig?.setsPerSubMatch) || 3;
    }
    return Number(tournament.rules.setsPerMatch) || 3;
  }
}
```

---

## Code Locations with Naming Issues

| File | Issue | Line | Fix |
|------|-------|------|-----|
| `models/Tournament.ts` | Both `rules.setsPerMatch` and `teamConfig.setsPerSubMatch` stored | N/A | Remove setsPerMatch from team tournaments |
| `models/TeamMatch.ts` | Called `numberOfSetsPerSubMatch` | 117 | Consistent with field name |
| `models/IndividualMatch.ts` | Called `numberOfSets` | N/A | Inconsistent with team matches |
| `app/tournaments/create/page.tsx` | Shows both fields | 708+ | Remove setsPerMatch for teams |
| `services/tournament/core/matchGenerationService.ts` | Converts `setsPerSubMatch` to `numberOfSetsPerSubMatch` | 248 | Clarify naming chain |

---

## Summary of Field Names to Normalize

**Current Mess:**
```
Input: teamConfig.setsPerSubMatch (string or number)
  ↓
API: rules.setsPerMatch + teamConfig.setsPerSubMatch
  ↓
DB: teamConfig.setsPerSubMatch (number)
  ↓
Match Gen: setsPerSubMatch (number)
  ↓
Match Object: numberOfSetsPerSubMatch (number)
  ↓
Display: "Best of X"
```

**Should Be:**
```
Input: teamConfig.setsPerSubMatch (number)
  ↓
API: teamConfig.setsPerSubMatch only
  ↓
DB: teamConfig.setsPerSubMatch (number)
  ↓
Match Gen: setsPerSubMatch (number)
  ↓
Match Object: setsPerSubMatch (number)
  ↓
Display: "Best of X"
```

**Single path, single name, no confusion.**

---

## Why This Matters

The naming confusion directly caused the bug you discovered:
1. Two different field names meant code was written to look for different fields
2. The unused field persisted in the form
3. Developers got confused about which field was actually used
4. Made debugging harder because you had to trace multiple field names

Clear, consistent naming prevents bugs by making the data flow obvious.
