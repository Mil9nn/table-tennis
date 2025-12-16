# Tournament Architecture Refactoring Plan

## Executive Summary

Your tournament implementation has a **solid foundation** with good patterns in the services layer (`services/tournament/`), but has accumulated technical debt in the API routes and UI components. This plan provides an incremental path to clean architecture.

---

## Current Architecture Assessment

### ✅ What's Good

| Area | Status | Notes |
|------|--------|-------|
| **Service Layer** | Excellent | Modular architecture in `services/tournament/` with clear separation |
| **Model Discriminators** | Good | `MatchBase` → `IndividualMatch`/`TeamMatch` pattern is clean |
| **Type Definitions** | Good | Comprehensive types in `types/tournament.type.ts` |
| **Validators** | Good | Centralized `TournamentValidators` |
| **Utilities** | Good | Well-organized calculation helpers |

### ⚠️ Issues Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| API route duplication (18 routes) | High | Auth, error handling, population repeated everywhere |
| Component duplication (tables/matchers) | High | ~80% and ~60% code overlap |
| Two BracketProgressionServices (V1/V2) | Medium | Confusing, potential divergent behavior |
| Tournament.ts duplicates TournamentBase.ts | Low | Schema definitions repeated |

---

## Refactoring Priorities

```
Priority 1: API Layer          ████████████████████  HIGH IMPACT
Priority 2: UI Components      ████████████████      HIGH IMPACT  
Priority 3: Service Consolidation ██████████        MEDIUM IMPACT
Priority 4: Model Cleanup      ██████               LOW IMPACT
```

---

## Priority 1: API Layer Deduplication

### Problem
18 API routes with duplicated patterns:
- Authentication (token verification) - repeated in 12+ routes
- Organizer validation - repeated in 10+ routes
- Tournament population - severely duplicated
- Error handling - repeated in 15+ routes
- Model discriminator registration - repeated in 5+ routes

### Solution: Create API Utilities Module

#### 1.1 Create `lib/api/http.ts`
```typescript
// Standardized error class
export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string, 
    public code?: string
  ) {
    super(message);
  }
}

// Response helpers
export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status }
    );
  }
  console.error(error);
  return Response.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}
```

#### 1.2 Create `lib/api/auth.ts`
```typescript
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { ApiError } from "./http";

export async function requireAuth(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new ApiError(401, "Authentication required", "UNAUTHENTICATED");
  }
  
  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    throw new ApiError(401, "Invalid token", "INVALID_TOKEN");
  }
  
  return { userId: decoded.userId };
}
```

#### 1.3 Create `lib/api/tournamentLoader.ts`
```typescript
import Tournament from "@/models/Tournament";
import Team from "@/models/Team";
import { ApiError } from "./http";

interface LoadOptions {
  requireOrganizer?: boolean;
  requireOrganizerOrScorer?: boolean;
  populateParticipants?: boolean;
  populateScorers?: boolean;
}

export async function loadTournament(
  tournamentId: string,
  userId: string,
  options: LoadOptions = {}
) {
  const tournament = await Tournament.findById(tournamentId);
  
  if (!tournament) {
    throw new ApiError(404, "Tournament not found", "NOT_FOUND");
  }

  // Permission checks
  if (options.requireOrganizer) {
    if (tournament.organizer.toString() !== userId) {
      throw new ApiError(403, "Only organizer can perform this action", "FORBIDDEN");
    }
  }

  if (options.requireOrganizerOrScorer) {
    const isOrganizer = tournament.organizer.toString() === userId;
    const isScorer = tournament.scorers?.some(s => s.toString() === userId);
    if (!isOrganizer && !isScorer) {
      throw new ApiError(403, "Not authorized for this tournament", "FORBIDDEN");
    }
  }

  // Dynamic population based on category
  if (options.populateParticipants) {
    const isTeam = tournament.category === "team";
    if (isTeam) {
      await tournament.populate({
        path: "participants",
        model: Team,
        select: "name logo city captain players",
        populate: [
          { path: "captain", select: "username fullName profileImage" },
          { path: "players.user", select: "username fullName profileImage" },
        ],
      });
    } else {
      await tournament.populate("participants", "username fullName profileImage");
    }
  }

  if (options.populateScorers) {
    await tournament.populate("scorers", "username fullName profileImage");
  }

  return tournament;
}
```

#### 1.4 Create `lib/api/routeWrapper.ts`
```typescript
import { jsonError } from "./http";

type RouteHandler = (req: Request, context: any) => Promise<Response>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return jsonError(error);
    }
  };
}
```

### Migration Example

**Before (current pattern):**
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    await connectDB();
    const tournament = await Tournament.findById(params.id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    
    // ... business logic
    
  } catch (err: any) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
```

**After (refactored):**
```typescript
import { withErrorHandling } from "@/lib/api/routeWrapper";
import { requireAuth } from "@/lib/api/auth";
import { loadTournament } from "@/lib/api/tournamentLoader";
import { jsonOk } from "@/lib/api/http";

export const POST = withErrorHandling(async (req, { params }) => {
  const { userId } = await requireAuth(req);
  const tournament = await loadTournament(params.id, userId, {
    requireOrganizer: true,
  });
  
  // ... business logic (pure domain logic only)
  
  return jsonOk(result);
});
```

### Files to Create

```
lib/
└── api/
    ├── index.ts           # Central exports
    ├── http.ts            # ApiError, jsonOk, jsonError
    ├── auth.ts            # requireAuth
    ├── tournamentLoader.ts # loadTournament with population
    └── routeWrapper.ts    # withErrorHandling
```

### Migration Order (18 routes)

1. Start with simple GET routes (leaderboard, hybrid-status)
2. Move to mutation routes (seeding, toggle-join-code)
3. Handle complex routes (generate-matches, custom-bracket)

---

## Priority 2: UI Component Deduplication

### Issue 2.1: EnhancedStandingsTable + TournamentLeaderboard (~80% overlap)

Both components:
- Display player rankings with win/loss records
- Show form chips, streaks, and win rates
- Have nearly identical stats dialogs
- Use same Table UI components

#### Solution: Extract Shared Components

**Create `components/tournaments/shared/StandingsTableCore.tsx`:**
```typescript
interface StandingsTableCoreProps<T> {
  data: T[];
  columns: ColumnDefinition[];
  onRowClick?: (row: T) => void;
  highlightFn?: (row: T) => boolean;
  renderAvatar: (row: T) => React.ReactNode;
  renderName: (row: T) => React.ReactNode;
}

export function StandingsTableCore<T>({ ... }) {
  // Core table rendering logic
}
```

**Create `hooks/useStandingsTable.ts`:**
```typescript
export function useStandingsTable<T>(data: T[], options: Options) {
  // Sorting, filtering, pagination logic
  return { sortedData, sortBy, setSortBy, ... };
}
```

**Refactor both components to use shared core:**
- `EnhancedStandingsTable` → Full features for tournament detail page
- `TournamentLeaderboard` → Simplified view for overview

### Issue 2.2: CustomBracketMatcher + CustomKnockoutMatcher (~60% overlap)

Both components share:
- Participant selection logic
- Validation patterns
- Avatar + Select participant picker
- "Unmatched Participants" display

#### Solution: Extract Shared Hook

**Create `hooks/useBracketMatcher.ts`:**
```typescript
interface UseBracketMatcherOptions {
  participants: Participant[];
  existingMatches?: Match[];
  constraints?: {
    respectSeeds?: boolean;
    avoidSameGroup?: boolean;
  };
}

export function useBracketMatcher(options: UseBracketMatcherOptions) {
  const [assignments, setAssignments] = useState<Map<string, string>>();
  
  const assignToSlot = (slotId: string, participantId: string) => { ... };
  const validateAssignments = () => { ... };
  const getAvailableParticipants = (slotId: string) => { ... };
  
  return {
    assignments,
    assignToSlot,
    clearAssignments,
    isValid,
    errors,
    getAvailableParticipants,
  };
}
```

---

## Priority 3: Service Layer Consolidation

### Problem
Two versions of BracketProgressionService coexist:
- `bracketProgressionService.ts` (V1) - Legacy, uses in-document bracket
- `BracketProgressionServiceV2.ts` - New, uses BracketState model + transactions

### Solution: Single Facade

**Create unified facade in `services/tournament/core/bracketProgression.ts`:**
```typescript
// The ONLY export for bracket progression
export async function applyMatchResult(params: {
  tournamentId: string;
  matchId: string;
  winnerId: string;
}) {
  // Internally uses V2 implementation
  return bracketProgressionV2.updateBracketAfterMatch(params);
}

// For legacy code during transition
export { advanceWinner } from "./bracketProgressionService";
```

**Migration path:**
1. Create facade that wraps V2
2. Update all import sites to use facade
3. Mark V1 functions as deprecated
4. After full migration, remove V1

---

## Priority 4: Model Layer Cleanup

### Problem
`Tournament.ts` duplicates schemas already defined in `TournamentBase.ts`:
- `standingSchema` - defined twice
- `roundSchema` - defined twice
- `groupSchema` - defined twice

### Solution: Reuse Base Schemas

**Modify `Tournament.ts`:**
```typescript
// Before: Redefined schemas locally
const standingSchema = new Schema({ ... }); // DUPLICATE

// After: Import from TournamentBase
import { 
  standingSchema, 
  roundSchema, 
  groupSchema,
  baseTournamentFields 
} from "./TournamentBase";

const tournamentSchema = new Schema<ITournament>({
  ...baseTournamentFields,
  
  // Tournament-specific fields only
  category: { type: String, enum: ["individual", "team"], required: true },
  matchType: { type: String, enum: ["singles", "doubles", "mixed_doubles"] },
  participants: [{ type: Schema.Types.ObjectId }],
  
  // Use imported schemas
  rounds: [roundSchema],
  standings: [standingSchema],
  groups: [groupSchema],
});
```

---

## Implementation Timeline

```
Week 1: API Layer
├── Day 1-2: Create lib/api utilities
├── Day 3-4: Migrate simple routes (5-6 routes)
└── Day 5: Migrate remaining routes

Week 2: UI Components  
├── Day 1-2: Extract StandingsTableCore + hook
├── Day 3: Refactor EnhancedStandingsTable
├── Day 4: Refactor TournamentLeaderboard
└── Day 5: Extract useBracketMatcher hook

Week 3: Services & Models
├── Day 1-2: Create BracketProgression facade
├── Day 3: Migrate call sites to facade
├── Day 4: Dedupe Tournament.ts schemas
└── Day 5: Testing & cleanup
```

---

## Architecture Diagram (Target State)

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  lib/api/                                                │   │
│  │  ├── auth.ts (requireAuth)                               │   │
│  │  ├── http.ts (ApiError, jsonOk, jsonError)              │   │
│  │  ├── tournamentLoader.ts (loadTournament)               │   │
│  │  └── routeWrapper.ts (withErrorHandling)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  app/api/tournaments/[id]/*/route.ts                     │   │
│  │  (Business logic only - no boilerplate)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  services/tournament/                                    │   │
│  │  ├── core/                                               │   │
│  │  │   ├── matchGenerationService.ts                       │   │
│  │  │   ├── bracketProgression.ts (UNIFIED FACADE)         │   │
│  │  │   ├── standingsService.ts                             │   │
│  │  │   └── ...                                             │   │
│  │  ├── repositories/                                       │   │
│  │  ├── validators/                                         │   │
│  │  └── utils/                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Model Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  models/                                                 │   │
│  │  ├── TournamentBase.ts (BASE SCHEMAS)                   │   │
│  │  ├── Tournament.ts (extends TournamentBase)             │   │
│  │  ├── MatchBase.ts                                        │   │
│  │  ├── IndividualMatch.ts (discriminator)                 │   │
│  │  └── TeamMatch.ts (discriminator)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lines of duplicated code in API routes | ~500+ | <50 |
| Component files with >50% overlap | 2 pairs | 0 |
| BracketProgression implementations | 2 | 1 facade |
| Duplicated schema definitions | 3 | 0 |

---

## Risk Mitigation

1. **API Changes**: Test each route individually before moving to next
2. **Component Changes**: Use Storybook/visual regression if available
3. **Service Changes**: Keep legacy adapter during transition
4. **Model Changes**: Run schema comparison in dev before deploying

---

## Questions Before Starting

1. Should we start with API layer (highest ROI) or components (most visible)?
2. Any specific routes that are critical and should be migrated first/last?
3. Are there any planned feature additions that might affect this refactoring?
