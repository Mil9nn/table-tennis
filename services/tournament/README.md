# Tournament Services - Modular Architecture

This directory contains a clean, modular architecture for all tournament-related services.

## 📁 Directory Structure

```
services/tournament/
├── core/                          # Core business logic services
│   ├── matchGenerationService.ts  # Draw generation and match creations
│   ├── statisticsService.ts       # Detailed leaderboard calculations
│   ├── schedulingService.ts       # Round-robin scheduling (Berger Tables)
│   ├── standingsService.ts        # ITTF-compliant standings calculation
│   └── seedingService.ts          # Seeding algorithms
├── validators/
│   └── tournamentValidators.ts    # Centralized validation logic
├── utils/                         # Utility functions
│   ├── groupAllocator.ts          # Group allocation with snake seeding
│   ├── tournamentCalculations.ts  # Pure calculation functions
│   ├── codeGenerator.ts           # Code and identifier generation
│   └── progressHelpers.ts         # Progress tracking utilities
├── types/
│   └── tournament.types.ts        # Shared type definitions
├── tournamentUpdateService.ts     # Standings update service
└── index.ts                       # Centralized exports
```

## 🎯 Design Principles

### 1. **Single Responsibility**
Each service module has one clear purpose:
- `schedulingService` → Round-robin scheduling only
- `standingsService` → Standings calculation only
- `seedingService` → Seeding logic only

### 2. **Separation of Concerns**
- **Core services** → Complex business logic
- **Validators** → All validation rules
- **Utils** → Pure helper functions
- **Types** → Shared interfaces

### 3. **Modularity**
Each module can be:
- Tested independently
- Modified without affecting others
- Reused across the application

### 4. **Maintainability**
- Clear file naming
- Comprehensive documentation
- Type-safe interfaces
- Backward compatibility

## 📦 How to Use

### Import from the main index (Recommended)

```typescript
import {
  generateTournamentDraw,
  calculateStandings,
  generateRandomSeeding,
  TournamentValidators,
} from "@/services/tournament";
```

### Import specific services directly

```typescript
import { generateRoundRobinSchedule } from "@/services/tournament/core/schedulingService";
import { allocateGroups } from "@/services/tournament/utils/groupAllocator";
```

## 🔄 Migration Guide

The old `services/tournamentService.ts` has been replaced with this modular structure. However, **backward compatibility is maintained**:

```typescript
// Old way (still works)
import { calculateStandings } from "@/services/tournamentService";

// New way (recommended)
import { calculateStandings } from "@/services/tournament";
```

## 📚 Core Services

### matchGenerationService.ts
Handles tournament draw generation:
- `generateTournamentDraw()` - Main draw generation
- `createScheduledMatch()` - Create individual matches
- `prepareSeeding()` - Initialize seeding
- `initializeStandings()` - Initialize standings structure

### statisticsService.ts
Generates detailed player statistics:
- `generateDetailedLeaderboard()` - Comprehensive leaderboard with advanced stats
- Includes: win rates, form, head-to-head records, dominance rating

### schedulingService.ts
Round-robin scheduling algorithms:
- `generateRoundRobinSchedule()` - Berger Tables algorithm
- `generateSeededRoundRobinSchedule()` - Seeded variant
- `validateScheduleCompleteness()` - Verify match count

### standingsService.ts
ITTF-compliant standings calculation:
- `calculateStandings()` - Main standings calculation
- `calculateGroupStandings()` - Group-specific standings
- `getHeadToHeadRecord()` - H2H statistics
- Implements full ITTF tiebreaker rules

### seedingService.ts
Seeding algorithms:
- `generateRandomSeeding()` - Random seeding
- `generateRankingBasedSeeding()` - Based on rankings
- `generatePointsBasedSeeding()` - Based on points/ratings
- `generateRegistrationOrderSeeding()` - First-come-first-served

## 🛠️ Utilities

### groupAllocator.ts
Group allocation with snake seeding:
- `allocateGroups()` - Distribute participants into balanced groups
- `calculateOptimalGroupCount()` - Suggest optimal group count
- `validateGroupConfiguration()` - Validate group setup

### tournamentCalculations.ts
Pure calculation functions:
- Win rates, set ratios, point differentials
- Streak calculations (current and longest)
- Dominance rating composite score
- Format helpers for display

### progressHelpers.ts
Progress tracking utilities:
- `calculateTournamentProgress()` - Detailed progress stats
- `getRoundCompletionStatus()` - Per-round status
- `estimateTournamentDuration()` - Time estimation
- `calculateTournamentStatus()` - Overall status

### codeGenerator.ts
Code and identifier generation:
- `generateUniqueJoinCode()` - 6-character tournament codes
- `generateGroupIdentifier()` - Group naming (A, B, C...)
- `generateMatchIdentifier()` - Unique match IDs

## ✅ Validators

### TournamentValidators
Centralized validation with clear error messages:
- `validateDrawNotGenerated()` - Prevent changes after draw
- `validateCapacity()` - Check participant limits
- `validateMinimumParticipants()` - Ensure enough players
- `validateDoublesParticipants()` - Even number for doubles
- `validateGroupConfiguration()` - Group setup validation
- `canJoinTournament()` - Composite validation for joining
- `canGenerateDraw()` - Composite validation for draw generation

## 🔧 Types

All shared types are in `types/tournament.types.ts`:
- `MatchPairing`, `RoundSchedule` - Scheduling types
- `GroupAllocation` - Group structure
- `StandingData`, `MatchResult` - Standings types
- `SeedingInfo` - Seeding information
- `TournamentProgress` - Progress tracking

## 🧪 Testing

Each service can be tested independently:

```typescript
import { calculateStandings } from "@/services/tournament/core/standingsService";
import { generateRoundRobinSchedule } from "@/services/tournament/core/schedulingService";

// Test in isolation
describe("Standings Service", () => {
  it("should calculate ITTF-compliant standings", () => {
    // Test implementation
  });
});
```

## 🚀 Benefits

### Before (Monolithic)
- 673 lines in one file
- Mixed responsibilities
- Hard to test
- Difficult to navigate
- Tight coupling

### After (Modular)
- ✅ Clear separation of concerns
- ✅ Each service < 200 lines
- ✅ Easy to test independently
- ✅ Simple to navigate
- ✅ Loose coupling
- ✅ Backward compatible
- ✅ Type-safe with shared types

## 📖 Examples

### Generate Tournament Draw
```typescript
import { generateTournamentDraw } from "@/services/tournament";

const result = await generateTournamentDraw(tournament, scorerId, {
  courtsAvailable: 2,
  matchDuration: 60,
});
```

### Calculate Standings
```typescript
import { calculateStandings } from "@/services/tournament";

const standings = calculateStandings(participants, matches, rules);
```

### Validate Before Join
```typescript
import { TournamentValidators } from "@/services/tournament";

const validation = TournamentValidators.canJoinTournament(tournament, userId);
if (!validation.isValid) {
  console.error(validation.error);
}
```

## 🔮 Future Enhancements

This modular architecture makes it easy to add:
- New tournament formats (knockout, Swiss system)
- Additional seeding methods
- Custom tiebreaker rules
- Advanced statistics
- Real-time progress tracking

Each enhancement can be added as a new module without affecting existing code!
