# Fix Badge Display for Team Tournaments in Custom Knockout Matcher

## Problem Analysis

The badge display works correctly for singles and doubles tournaments, but has issues specifically for team tournaments. The issue is in the qualification check logic where `item._id` is used without `.toString()`, causing inconsistent ID comparison for teams.

## Files to Modify

- `components/tournaments/CustomKnockoutMatcher.tsx` - Fix qualification check to use `.toString()` consistently for teams (same as singles/doubles pattern)

## Root Cause

Looking at the code:
- Line 547: `eliminatedIds.has(item._id.toString())` ✅ Uses `.toString()`
- Line 554: `qualifiedParticipantIds.has(item._id)` ❌ Missing `.toString()`
- Line 699: `qualifiedParticipantIds.has(item._id)` ❌ Missing `.toString()`

The `qualifiedParticipantIds` Set contains string IDs (created with `.toString()` in custom-matching page), but the comparison doesn't convert `item._id` to string, causing the check to fail for teams.

## Implementation

### Fix Qualification Check for Teams

Apply the same pattern used for `eliminatedIds` check - use `.toString()` for consistent ID comparison:

**Change in two places (participant1 and participant2 dropdowns):**

Line ~554 (participant1):
```typescript
// Current (broken for teams):
qualifiedParticipantIds.has(item._id)

// Fixed (consistent with eliminatedIds check):
qualifiedParticipantIds.has(item._id.toString())
```

Line ~699 (participant2):
```typescript
// Current (broken for teams):
qualifiedParticipantIds.has(item._id)

// Fixed (consistent with eliminatedIds check):
qualifiedParticipantIds.has(item._id.toString())
```

### Also Fix in getAvailableParticipants Filter

Line ~213 already uses `p._id` without `.toString()`, but this should also be fixed for consistency:
```typescript
// Current:
if (qualifiedParticipantIds && !qualifiedParticipantIds.has(p._id)) return false;

// Fixed:
if (qualifiedParticipantIds && !qualifiedParticipantIds.has(p._id.toString())) return false;
```

## Summary

The fix is simple: ensure all `qualifiedParticipantIds.has()` calls use `.toString()` on the ID, matching the pattern already used for `eliminatedIds.has()`. This ensures consistent string comparison for both individual and team participant IDs.

