# Shot Perspective & Coordinate System - Deep Analysis & Refactoring Plan

## Current State Analysis

### 1. Coordinate System Overview
**Good News:** The coordinate system is already **absolute and perspective-independent**:
- **Origin Range:** -100 to 200 (player can hit from anywhere)
- **Landing Range:** 0 to 100 (table surface only)
- **X-axis:** 0-50 = left side, 50-100 = right side (net at X=50)
- **Y-axis:** 0 = near net (top), 100 = deep (back)

This is **CORRECT** - it's a fixed, single-perspective coordinate system.

### 2. Current Shot Analysis Pipeline

**Flow:**
```
Shot Created → TableCourt (absolute coords) → Shot saved in DB → 
Shot analytics (shot-commentary-utils.ts) → Display (WagonWheel, stats)
```

**Key Files:**
1. **`lib/shot-commentary-utils.ts`** - Core analysis logic
   - `getZone()` - Classifies landing position depth (short/mid/deep)
   - `getSector()` - Classifies landing position horizontally (BH/CO/FH)
   - `getLine()` - Classifies trajectory (down-the-line, diagonal, cross-court, middle)
   - `getShotDirection()` - Simple left-to-right analysis

2. **`components/TableCourt.tsx`** - Shot origin/landing selector
   - Converts click position to absolute coordinates (-100 to 200)
   - No perspective transformation applied

3. **`components/WagonWheel.tsx`** - Shot map visualization
   - Maps absolute coordinates to SVG space directly
   - No coordinate flipping for perspective

4. **`components/ShotSelector.tsx`** - Records shot data
   - Stores shots with absolute coordinates

### 3. Sector Classification Logic (ISSUE IDENTIFIED)

In `shot-commentary-utils.ts` lines 178-214:

```typescript
export function getSector(
  landingY: number,
  receivingSide?: Side,  // Side1 or Side2
  isLeftHanded: boolean = false
): "backhand" | "crossover" | "forehand" | null {
  
  // Base classification (always same for Y coordinate)
  let sector: "backhand" | "crossover" | "forehand";
  if (landingY < 33.33) sector = "backhand";
  else if (landingY < 66.67) sector = "crossover";
  else sector = "forehand";
  
  // THEN flip based on side player is on
  if (receivingSide === "side2" || receivingSide === "team2") {
    if (sector === "backhand") sector = "forehand";
    else if (sector === "forehand") sector = "backhand";
  }
  
  // THEN flip again if left-handed
  if (isLeftHanded) { ... flip again ... }
}
```

**The Problem:** 
- Sector classification **includes side information** but this is being applied **on top of absolute Y coordinates**
- When sides are swapped in the API, the coordinate data doesn't change, but the `receivingSide` parameter changes
- This causes **stats to change when only perspective changes**

### 4. Where Swapping Happens

**API Level:**
- `POST /matches/individual/:id/swap` (useIndividualMatch hook, line 510)
- `POST /matches/team/:id/swap` (useTeamMatch hook, line 355)
- These **swap participant positions** but don't modify shot coordinates

**Consequence:**
- Same shot coordinates → Different `receivingSide` parameter → Different sector classification → Different stats

### 5. Current Display Issues

**In WagonWheel.tsx:**
```typescript
const x1 = ((shot.originX! + 100) / 300) * 548;  // Direct mapping
const y1 = ((shot.originY! + 100) / 300) * 305;
const x2 = 182.67 + (shot.landingX! / 100) * 182.67;
const y2 = 101.67 + (shot.landingY! / 100) * 101.67;
```

✅ **Coordinates are NOT flipped** - this is correct!

However, the problem is:
- Shot map displays correctly (always same perspective)
- But **stats recalculate differently** when sides swap because `receivingSide` changes
- Stats should NOT change when only viewing perspective changes

---

## Root Cause

The issue is **semantic confusion** about what sectors represent:

**Current approach (INCORRECT):**
- Sector = "What sector relative to the receiving player on THAT side"
- When side2 is receiving, "backhand" means their physical backhand
- When side1 is receiving, "backhand" means their physical backhand (opposite Y range)

**Correct approach:**
- Sector = "What sector on the table from a FIXED perspective"
- "Backhand sector" = always Y 0-33.33 (top side of table)
- "Forehand sector" = always Y 66.67-100 (bottom side of table)
- Sector labels represent the table location, NOT the player's handedness

---

## The Solution: Decouple Sectors from Receiving Side

### High-Level Plan

1. **Create absolute sector classification** that doesn't depend on `receivingSide`
2. **Store shot data with absolute sectors** (never side-dependent)
3. **For UI display, only transform coordinate appearance, not classification**
4. **Keep handedness handling separate** (for future handedness analysis)

### Implementation Strategy

#### Phase 1: Add Absolute Sector Function

Create a new function that provides **perspective-independent sector classification**:

```typescript
/**
 * Get absolute sector based on landing Y coordinate (table perspective)
 * Always uses the same classification regardless of which side is receiving
 * 
 * Absolute sectors represent fixed table locations:
 * - Top sector (Y 0-33.33): Where left-side players have their backhand
 * - Middle sector (Y 33.33-66.67): Crossover/center
 * - Bottom sector (Y 66.67-100): Where left-side players have their forehand
 */
export function getAbsoluteSector(landingY: number): 
  "top" | "middle" | "bottom" | null {
  if (landingY < THRESHOLDS.SECTOR_BACKHAND) return "top";
  else if (landingY < THRESHOLDS.SECTOR_CROSSOVER) return "middle";
  else return "bottom";
}

/**
 * Get perspective-relative sector (depends on which side is receiving)
 * Used ONLY for UI/commentary, not for stats storage
 */
export function getRelativeSector(
  landingY: number,
  receivingSide?: Side,
  isLeftHanded: boolean = false
): "backhand" | "crossover" | "forehand" | null {
  let sector = getAbsoluteSector(landingY);
  
  // Map absolute sectors to relative names based on receiving side
  if (receivingSide === "side2" || receivingSide === "team2") {
    // Side2 is on bottom - flip mapping
    if (sector === "top") return "forehand";
    if (sector === "bottom") return "backhand";
    return "middle";
  }
  
  // Side1 is on top (default)
  if (sector === "top") return "backhand";
  if (sector === "bottom") return "forehand";
  return "middle";
}
```

#### Phase 2: Update ShotCommentary Interface

```typescript
export interface ShotCommentary {
  // ABSOLUTE (never change, perspective-independent)
  absoluteSector: "top" | "middle" | "bottom" | null;
  zone: "short" | "mid" | "deep" | null;
  line: "down the line" | "diagonal" | "cross court" | "middle line" | null;
  
  // RELATIVE (perspective-dependent, for UI only)
  sector: "backhand" | "crossover" | "forehand" | null;
  
  // Legacy fields...
}
```

#### Phase 3: Update analyzeShotPlacement()

```typescript
export function analyzeShotPlacement(
  shot: Shot,
  receivingSide?: Side
): ShotCommentary {
  // ... existing code ...
  
  // ALWAYS calculate absolute sector (independent of receivingSide)
  commentary.absoluteSector = getAbsoluteSector(landingY);
  
  // ONLY calculate relative sector if needed for display
  commentary.sector = getRelativeSector(landingY, receivingSide);
  
  // ... rest ...
}
```

#### Phase 4: Update Stats Calculation

In `lib/match-stats-utils.tsx`:
- Use `absoluteSector` for statistics
- Use `sector` only for commentary/display
- This ensures stats **never change when sides swap**

#### Phase 5: Update Weakness Analysis

In `lib/weaknesses-analysis-utils.ts`:
- Rebuild heatmaps using `absoluteSector`
- Weakness data becomes perspective-independent
- Display only transforms perspective for UI

#### Phase 6: Update Display Components

**WagonWheel.tsx:**
- Already correct! No changes needed (uses raw coordinates)

**Shot Analysis Components:**
- Use `absoluteSector` for stats
- Can optionally show relative sector in commentary

**Stats Displays:**
- Filter and aggregate using `absoluteSector`
- Stats remain constant across side swaps

---

## File-by-File Action Plan

### CREATE (1 new file)
- **`lib/sector-utils.ts`** - Standalone sector utilities

### MODIFY (8 files)

1. **`lib/shot-commentary-utils.ts`** (core logic)
   - Add `getAbsoluteSector()`
   - Rename `getSector()` → `getRelativeSector()`
   - Update `analyzeShotPlacement()` to populate both

2. **`types/shot.type.ts`** (type definitions)
   - Add `absoluteSector` field to Shot or ShotCommentary

3. **`lib/match-stats-utils.tsx`** (stats calculation)
   - Use `absoluteSector` in `computeStats()`
   - Use `absoluteSector` in weakness analysis

4. **`lib/weaknesses-analysis-utils.ts`** (weakness heatmaps)
   - Use `absoluteSector` for grid calculations
   - Heatmaps stay the same when sides swap

5. **`components/match-stats/WagonWheelSection.tsx`**
   - No changes (already displays correctly)

6. **`components/live-scorer/common/ShotFeed.tsx`**
   - Use `sector` (relative) for commentary
   - Ensure it doesn't affect stats

7. **`components/match-details/MatchScore.tsx`**
   - Display uses `sector` only

8. **`hooks/useIndividualMatch.tsx` & `hooks/useTeamMatch.tsx`**
   - After swap, don't recalculate shot sectors
   - Stats should remain stable

### VERIFY (5 components)
- WagonWheelSection
- PlayerShotAnalysis
- ZoneHeatmap
- Match stats pages
- Shot commentary generation

---

## Expected Outcomes

### Before Fix:
```
Match: Side1 vs Side2
Shot: Player 1 hits to landing Y=80
- Shows as: Forehand shot (to side1's forehand)
- Stats: 1 forehand shot

After SWAP:
- Shows as: Backhand shot (to side2's backhand)  ← WRONG!
- Stats: 1 backhand shot  ← STATS CHANGED!
```

### After Fix:
```
Match: Side1 vs Side2
Shot: Player 1 hits to landing Y=80
- Absolute: Bottom sector shot
- Relative (side1 receiving): Forehand
- Stats: 1 bottom-sector shot (constant)

After SWAP:
- Absolute: Bottom sector shot
- Relative (side2 receiving): Backhand
- Stats: 1 bottom-sector shot (UNCHANGED!) ✓
```

---

## Implementation Order

1. **Step 1:** Create `sector-utils.ts` with both functions
2. **Step 2:** Add tests to verify both work correctly
3. **Step 3:** Update `shot-commentary-utils.ts` (non-breaking)
4. **Step 4:** Add `absoluteSector` to type definitions
5. **Step 5:** Update stats calculations to use `absoluteSector`
6. **Step 6:** Update weakness analysis
7. **Step 7:** Update all stats display components
8. **Step 8:** Test full match flow with side swaps
9. **Step 9:** Deprecate old sector usage in commentary

---

## Risk Mitigation

- ✅ Changes are **additive** (new functions, not replacing)
- ✅ Old `sector` field remains for **backward compatibility**
- ✅ No database migrations needed
- ✅ Can test incrementally by feature
- ✅ Display logic unaffected
- ✅ Coordinates always correct (never flipped)

