# Standings Architecture

## Overview

This module provides a clean, modular architecture for calculating tournament standings with strict separation between singles and doubles logic.

## Problem Statement

### Root Causes of Duplicate Teams

The previous implementation had several issues that caused duplicate teams in doubles standings:

1. **Mixed Logic in Single Function**: The `calculateStandings` function handled both singles and doubles using conditional logic based on participant count. This led to:
   - Doubles matches with 4 participants being processed as if they were 2 separate players
   - `syncPartnerStats` function creating duplicate entries for both players in a team
   - No canonical team identity - [A, B] and [B, A] were treated as different teams

2. **Inconsistent Participant Normalization**: 
   - Matches stored 4 player IDs, but standings needed 2 pair IDs
   - Conversion logic was fragile and could fail, leaving matches with 4 participants
   - No order-independent team matching

3. **Band-Aid Solutions**: 
   - Deduplication logic in route handlers (symptom, not fix)
   - Multiple safety checks trying to prevent duplicates
   - No clear ownership of responsibility

## Architecture

### Data Flow

```
Matches → Normalized Participants → Stats Aggregation → Ranking
```

### Components

#### 1. Participant Normalization

**`IParticipantNormalizer`** - Interface for normalizing participants
- **`SinglesParticipantNormalizer`**: Treats participants as individual players
- **`DoublesParticipantNormalizer`**: Treats participants as teams (order-independent)

**Key Features:**
- Canonical team identity: [A, B] = [B, A]
- Uses pair IDs when available (from `tournament.doublesPairs`)
- Falls back to canonical keys when pair IDs are not available
- Ensures exactly 1 identifier per unique team

#### 2. Standings Services

**`IStandingsService`** - Interface for standings calculation
- **`SinglesStandingsService`**: Calculates standings for singles tournaments
- **`DoublesStandingsService`**: Calculates standings for doubles tournaments

**Key Differences:**

| Aspect | Singles | Doubles |
|--------|---------|---------|
| Participant | 1 player | 1 team (pair) |
| Match Participants | 2 player IDs | 2 pair IDs (or 4 player IDs normalized to 2 pair IDs) |
| Normalization | Direct ID mapping | Canonical team identity (order-independent) |
| Deduplication | By player ID | By canonical team ID |

#### 3. Standings Calculator

**`StandingsCalculator`** - Factory that routes to appropriate service
- Determines match type (singles/doubles/mixed_doubles)
- Creates appropriate service instance
- Provides unified interface

### How Doubles Standings Differ Internally

1. **Participant Identity**:
   - Singles: `participantId = "player123"`
   - Doubles: `participantId = "pair456"` or `"team:player1:player2"` (canonical)

2. **Match Processing**:
   - Singles: Direct 1:1 mapping between match participants and standings
   - Doubles: Normalizes 4 player IDs → 2 canonical team IDs before processing

3. **Team Canonicalization**:
   - Ensures [A, B] and [B, A] produce the same team ID
   - Uses sorted player IDs for canonical keys when pair IDs unavailable

## Usage

### Basic Usage

```typescript
import { StandingsCalculator } from "./core/standings";

// For singles
const calculator = StandingsCalculator.create("singles");
const standings = calculator.calculateStandings(participants, matches, rules);

// For doubles
const calculator = StandingsCalculator.create("doubles", doublesPairs);
const standings = calculator.calculateStandings(participants, matches, rules);
```

### In Tournament Update Service

```typescript
// Determine match type
const matchType = tournament.matchType || "singles";
const doublesPairs = isDoubles ? tournament.doublesPairs : undefined;

// Create calculator
const calculator = StandingsCalculator.create(matchType, doublesPairs);
const normalizer = calculator.getNormalizer();

// Normalize participants
const normalizedParticipants = normalizer.getUniqueParticipants(participantIds);

// Calculate standings
const standings = calculator.calculateStandings(
  normalizedParticipants,
  matches,
  tournament.rules
);
```

## Benefits

1. **No Duplicates**: Canonical team identity ensures exactly 1 row per unique team
2. **Order Independence**: [A, B] = [B, A] automatically handled
3. **Clear Separation**: Singles and doubles logic completely separate
4. **Deterministic**: Same inputs always produce same outputs
5. **Idempotent**: Can be called multiple times safely
6. **Future-Proof**: Easy to extend for new formats or scoring rules

## Migration Notes

- Old `calculateStandings` function is still available as `calculateStandingsLegacy` for backward compatibility
- New architecture is used in `updateRoundRobinStandings`
- Route handlers no longer need deduplication logic
- Match conversion uses normalizers instead of manual pair mapping

## Testing Considerations

When testing doubles standings:
1. Verify teams appear exactly once (no duplicates)
2. Test order independence: [A, B] vs [B, A] should produce same team
3. Verify stats aggregation is correct for teams
4. Test with both pair IDs and player IDs (legacy format)

