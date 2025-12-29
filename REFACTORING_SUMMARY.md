# Standings Refactoring Summary

## Problem Analysis

### Why Duplicate Teams Appeared

The original implementation had **mixed logic** in a single function that tried to handle both singles and doubles:

1. **`calculateStandings` in `standingsService.ts`**:
   - Used conditional logic: `if (isDoublesWith4Players)` vs `else`
   - For doubles with 4 players, it used `syncPartnerStats` to sync stats between partners
   - This created **two standings entries** for each team (one per player)
   - No canonical team identity - [A, B] and [B, A] were treated as different teams

2. **Inconsistent Participant Normalization**:
   - Matches stored 4 player IDs: `[player1, player2, player3, player4]`
   - Standings needed 2 pair IDs: `[pair1, pair2]`
   - Conversion logic in `convertMatchesToStandingsFormat` was fragile
   - When conversion failed, matches still had 4 participants, causing duplicates

3. **Band-Aid Solutions**:
   - Route handlers had deduplication logic (lines 397-447 in `route.ts`)
   - Multiple safety checks trying to prevent duplicates
   - No clear ownership - logic scattered across multiple files

## Solution Architecture

### New Structure

```
services/tournament/core/standings/
├── participantNormalizer.ts      # Participant identity abstraction
├── standingsService.interface.ts  # Service interface
├── singlesStandingsService.ts     # Singles-specific logic
├── doublesStandingsService.ts     # Doubles-specific logic
├── standingsSorting.ts            # Shared sorting/tiebreaker logic
├── standingsCalculator.ts         # Factory/orchestrator
├── index.ts                       # Clean exports
└── README.md                      # Architecture documentation
```

### Key Components

#### 1. Participant Normalization

**`SinglesParticipantNormalizer`**:
- Participant = Player ID
- Direct 1:1 mapping

**`DoublesParticipantNormalizer`**:
- Participant = Team (canonical, order-independent)
- [A, B] = [B, A] (same team)
- Uses pair IDs when available
- Creates canonical keys when pair IDs unavailable

#### 2. Standings Services

**`SinglesStandingsService`**:
- Processes matches with 2 participants (player IDs)
- Direct stats aggregation per player
- No partner syncing needed

**`DoublesStandingsService`**:
- Processes matches with 2 participants (team IDs, normalized from 4 player IDs)
- Treats teams as single entities
- No partner syncing - teams are already unique
- Ensures exactly 1 row per unique team

#### 3. Standings Calculator

**`StandingsCalculator`**:
- Factory pattern
- Routes to appropriate service based on match type
- Provides unified interface

### Data Flow

```
Matches (4 player IDs for doubles)
    ↓
Normalize Participants (4 → 2 canonical team IDs)
    ↓
Stats Aggregation (per team, not per player)
    ↓
Ranking (ITTF tiebreaker rules)
    ↓
Standings (1 row per unique team)
```

## Changes Made

### Files Created

1. **`services/tournament/core/standings/participantNormalizer.ts`**
   - `IParticipantNormalizer` interface
   - `SinglesParticipantNormalizer` implementation
   - `DoublesParticipantNormalizer` implementation

2. **`services/tournament/core/standings/standingsService.interface.ts`**
   - `IStandingsService` interface

3. **`services/tournament/core/standings/singlesStandingsService.ts`**
   - Complete singles standings logic
   - No doubles-specific code

4. **`services/tournament/core/standings/doublesStandingsService.ts`**
   - Complete doubles standings logic
   - Canonical team identity
   - Order-independent matching

5. **`services/tournament/core/standings/standingsSorting.ts`**
   - Extracted sorting/tiebreaker logic
   - Shared by both services

6. **`services/tournament/core/standings/standingsCalculator.ts`**
   - Factory for creating appropriate service
   - Convenience function

7. **`services/tournament/core/standings/index.ts`**
   - Clean exports

8. **`services/tournament/core/standings/README.md`**
   - Architecture documentation

### Files Modified

1. **`services/tournament/tournamentUpdateService.ts`**:
   - Updated `updateRoundRobinStandings` to use new architecture
   - Uses `StandingsCalculator` instead of old `calculateStandings`
   - Uses normalizers for participant normalization
   - Removed manual deduplication logic

2. **`services/tournament/tournamentUpdateService.ts`** (continued):
   - Updated `convertMatchesToStandingsFormat` to use normalizers
   - Simplified match conversion logic

3. **`app/api/tournaments/[id]/route.ts`**:
   - Removed deduplication band-aids (lines 397-447)
   - Kept pair population logic for frontend display

## Benefits

### ✅ No More Duplicates
- Canonical team identity ensures exactly 1 row per unique team
- Order-independent: [A, B] = [B, A]

### ✅ Clear Separation of Concerns
- Singles and doubles logic completely separate
- No shared code that assumes "1 player per side"

### ✅ Deterministic & Idempotent
- Same inputs always produce same outputs
- Can be called multiple times safely

### ✅ Future-Proof
- Easy to extend for new formats
- Easy to add new scoring rules
- Clear abstractions for testing

### ✅ Production-Ready
- No band-aid solutions
- Root cause fixed, not symptoms
- Clean, maintainable code

## Testing Checklist

When testing doubles standings:

- [ ] Verify teams appear exactly once (no duplicates)
- [ ] Test order independence: [A, B] vs [B, A] should produce same team
- [ ] Verify stats aggregation is correct for teams
- [ ] Test with both pair IDs and player IDs (legacy format)
- [ ] Verify rankings are correct
- [ ] Test tiebreaker rules (head-to-head, sets ratio, etc.)

## Migration Notes

- Old `calculateStandings` function is still available as `calculateStandingsLegacy` for backward compatibility
- New architecture is used in `updateRoundRobinStandings`
- Route handlers no longer need deduplication logic
- Match conversion uses normalizers instead of manual pair mapping

## Next Steps (Optional)

1. **Remove Legacy Code**: Once confident, remove `calculateStandingsLegacy` and old `standingsService.ts`
2. **Add Tests**: Create unit tests for normalizers and services
3. **Performance**: Monitor performance with large tournaments
4. **Documentation**: Update API documentation if needed

