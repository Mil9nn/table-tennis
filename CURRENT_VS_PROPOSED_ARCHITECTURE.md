# Current vs Proposed Architecture Comparison

## 📐 Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│                    Types Layer (Scattered)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  types/tournament.type.ts    ← Main types                  │
│  ├─ Tournament interface                                   │
│  ├─ UserParticipant                                        │
│  └─ Helper functions                                       │
│                                                             │
│  models/Tournament.ts        ← Duplicate schemas           │
│  ├─ ITournament                                            │
│  ├─ ISeeding (DUPLICATE)                                   │
│  ├─ IStanding (DUPLICATE)                                  │
│  └─ IGroup (DUPLICATE)                                     │
│                                                             │
│  models/TournamentTeam.ts    ← More duplication            │
│  ├─ ITournamentTeam                                        │
│  ├─ ISeeding (DUPLICATE!)                                  │
│  ├─ IStanding (DUPLICATE!)                                 │
│  └─ IGroup (DUPLICATE!)                                    │
│                                                             │
│  models/TournamentIndividual.ts ← Even more!              │
│  ├─ ITournamentIndividual                                  │
│  ├─ ISeeding (DUPLICATE!!)                                 │
│  ├─ IStanding (DUPLICATE!!)                                │
│  └─ IGroup (DUPLICATE!!)                                   │
│                                                             │
│  services/tournament/types/tournament.types.ts ← Separate   │
│  ├─ MatchPairing                                           │
│  └─ RoundSchedule                                          │
│                                                             │
│  shared/match/teamMatchTypes.ts ← More scattered           │
│  └─ Match-related types                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • 3x interface duplication (ISeeding, IStanding, IGroup)
   • 6 different locations for types
   • No clear hierarchy
   • Hard to find types
   • Type divergence risk


┌─────────────────────────────────────────────────────────────┐
│                   Models Layer (Duplicated)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TournamentBase.ts                                          │
│  ├─ standingSchema (DUPLICATE)                             │
│  ├─ roundSchema (DUPLICATE)                                │
│  └─ groupSchema (DUPLICATE)                                │
│      ↓                                                      │
│  Tournament.ts                                              │
│  ├─ standingSchema (DUPLICATE AGAIN!)                      │
│  ├─ roundSchema (DUPLICATE AGAIN!)                         │
│  ├─ groupSchema (DUPLICATE AGAIN!)                         │
│  └─ tournamentSchema (using above)                         │
│      ↓ (imports from TournamentBase)                       │
│  TournamentTeam.ts                                          │
│  ├─ Custom schemas wrapping shared ones                    │
│  ├─ cascadeDelete hooks (50+ lines)                        │
│  └─ virtualBracket (duplication)                           │
│      ↓ (imports from TournamentBase)                       │
│  TournamentIndividual.ts                                    │
│  ├─ Custom schemas wrapping shared ones                    │
│  ├─ cascadeDelete hooks (50+ lines, IDENTICAL!)            │
│  └─ virtualBracket (duplication, IDENTICAL!)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • Schemas defined 3-4 places (standingSchema, etc)
   • 50+ line cascade delete code appears 2x identically
   • Virtual population code appears 2x identically
   • Changing schema requires updates in 3+ places
   • Easy to miss updates → bugs


┌─────────────────────────────────────────────────────────────┐
│                 Services Layer (Confusing)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  services/tournamentService.ts (DEPRECATED)                │
│  └─ "Kept for backward compatibility" 🚫                   │
│                                                             │
│  services/tournament/ (NEW)                                │
│  ├─ core/                                                  │
│  │  ├─ matchGenerationService.ts                           │
│  │  ├─ matchGenerationOrchestrator.ts                      │
│  │  ├─ bracketGenerationService.ts                         │
│  │  ├─ bracketProgressionService.ts                        │
│  │  ├─ BracketProgressionServiceV2.ts ← VERSION!?          │
│  │  ├─ bracketSchedulingService.ts                         │
│  │  ├─ schedulingService.ts                                │
│  │  ├─ standingsService.ts                                 │
│  │  ├─ seedingService.ts                                   │
│  │  ├─ statisticsService.ts                                │
│  │  ├─ phaseManagementService.ts                           │
│  │  ├─ qualificationService.ts                             │
│  │  └─ hybridMatchGenerationService.ts                     │
│  │                                                         │
│  ├─ MatchGenerationOrchestrator.ts (AT ROOT?!)             │
│  │                                                         │
│  ├─ validators/                                            │
│  │  └─ tournamentValidators.ts                             │
│  │                                                         │
│  ├─ validation/                                            │
│  │  └─ TournamentValidationService.ts (DUPLICATE!)         │
│  │                                                         │
│  ├─ utils/                                                 │
│  │  ├─ groupAllocator.ts                                   │
│  │  ├─ tournamentCalculations.ts                           │
│  │  ├─ codeGenerator.ts                                    │
│  │  └─ progressHelpers.ts                                  │
│  │                                                         │
│  ├─ types/                                                 │
│  │  └─ tournament.types.ts                                 │
│  │                                                         │
│  ├─ repositories/                                          │
│  │  ├─ TournamentRepository.ts                             │
│  │  └─ MatchRepository.ts                                  │
│  │                                                         │
│  └─ index.ts (100+ exports - hard to understand)           │
│                                                             │
│  services/match/ (SEPARATE)                                │
│  ├─ teamMatchService.ts                                    │
│  └─ subMatchFactory.ts (duplicate logic?)                  │
│                                                             │
│  services/validation/ (SEPARATE AGAIN)                     │
│  └─ TournamentValidationService.ts (duplicate!)            │
│                                                             │
│  lib/validations/ (ANOTHER LOCATION)                       │
│  └─ tournaments.ts (duplicate validators?)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • 20+ services with overlapping names
   • Unclear service responsibilities
   • Validation in 3 separate locations
   • Duplicate validators (validators/ vs validation/ vs lib/)
   • MatchGenerationOrchestrator appears 2x?
   • V1 and V2 versions both exist - which to use?
   • No clear organization/structure
   • Entry point: deprecated + new = confusion
   • Hard to find what you need


┌─────────────────────────────────────────────────────────────┐
│                 Validation Layer (Scattered)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. models/TournamentTeam.ts                               │
│     └─ Schema pre-save hook                               │
│                                                             │
│  2. models/TournamentIndividual.ts                         │
│     └─ Schema pre-save hook                               │
│                                                             │
│  3. services/tournament/validators/tournamentValidators.ts  │
│     └─ TournamentValidators class                         │
│                                                             │
│  4. services/validation/TournamentValidationService.ts     │
│     └─ Different validator class                          │
│                                                             │
│  5. lib/validations/tournaments.ts                         │
│     └─ Even more validators                               │
│                                                             │
│  6. services/match/subMatchFactory.ts                      │
│     └─ Validation mixed with factory                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • Same validation in 6 locations
   • No consistency
   • Easy to add validation in wrong place
   • Hard to find/update a validation rule


┌─────────────────────────────────────────────────────────────┐
│               Naming Inconsistencies (Confusing)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File Naming:                                               │
│  ├─ bracketProgressionService.ts    (camelCase)            │
│  ├─ BracketProgressionServiceV2.ts  (PascalCase + V2!)     │
│  ├─ TournamentQueryService.ts       (PascalCase)           │
│  ├─ tournamentUpdateService.ts      (camelCase)            │
│  └─ Inconsistent patterns                                  │
│                                                             │
│  Interface Naming:                                          │
│  ├─ Tournament (from types/)                               │
│  ├─ ITournament (from models/)                             │
│  ├─ ITournamentTeam (from models/)                         │
│  ├─ TournamentDocument (not used)                          │
│  └─ Which is canonical?                                    │
│                                                             │
│  Method Naming:                                            │
│  ├─ calculateStandings()                                   │
│  ├─ calculateTournamentProgress()                          │
│  ├─ calculateTournamentStatus()                            │
│  ├─ getTournamentProgress() ← Also exists!                 │
│  ├─ calculateProgressPercentage() ← Alias?                 │
│  └─ Too many similar names                                 │
│                                                             │
│  Variable Naming:                                          │
│  ├─ drawGenerated: boolean        (ambiguous - generated?)  │
│  ├─ drawGeneratedAt: Date?        (timestamp?)              │
│  ├─ drawGeneratedBy: User?        (who generated?)          │
│  └─ Better names exist                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ PROBLEMS:
   • No naming standards document
   • Mixed PascalCase and camelCase
   • Ambiguous variable names
   • Too many similar function names
   • Hard to remember correct names
```

---

## 🎯 Proposed Architecture (Clean & Scalable)

```
┌─────────────────────────────────────────────────────────────┐
│              Types Layer (Unified & Organized)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  types/tournament/                 ← SINGLE SOURCE          │
│  ├─ domain.types.ts      (Business logic types)            │
│  │  ├─ Tournament                                          │
│  │  ├─ Participant                                         │
│  │  ├─ Seeding                                             │
│  │  ├─ Standing                                            │
│  │  ├─ Group                                               │
│  │  └─ Helper functions                                    │
│  │                                                         │
│  ├─ mongo.types.ts       (Mongoose Document types)         │
│  │  ├─ TournamentDocument                                  │
│  │  └─ Extends domain types                                │
│  │                                                         │
│  ├─ service.types.ts     (Service operation types)         │
│  │  ├─ MatchPairing                                        │
│  │  ├─ RoundSchedule                                       │
│  │  ├─ GenerationResult                                    │
│  │  └─ Operation types                                     │
│  │                                                         │
│  └─ index.ts             (Single export point)             │
│     └─ export * from all above                             │
│                                                             │
│  ✅ BENEFITS:                                               │
│     • Single location for all types                        │
│     • Clear hierarchy (domain → mongo → service)           │
│     • Type guards and helpers in one place                 │
│     • Easy to find/update types                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│               Models Layer (No Duplication)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  models/schemas/                                            │
│  ├─ shared.schemas.ts    ← SHARED SCHEMAS                  │
│  │  ├─ standingSchema                                      │
│  │  ├─ roundSchema                                         │
│  │  ├─ groupSchema                                         │
│  │  └─ Used by all models                                  │
│  │                                                         │
│  ├─ hooks.ts             ← SHARED HOOKS                    │
│  │  ├─ cascadeDeleteHook()   (used by both models)        │
│  │  └─ attachVirtualHook()   (used by both models)        │
│  │                                                         │
│  ├─ indexes.ts           ← SHARED INDEXES                  │
│  │  └─ baseIndexes, categoryIndexes                        │
│  │                                                         │
│  └─ tournament.schemas.ts ← TOURNAMENT SCHEMAS             │
│     ├─ Individual tournament schema                        │
│     └─ Team tournament schema                              │
│                                                             │
│  models/                                                    │
│  ├─ TournamentIndividual.ts                               │
│  │  ├─ Uses shared schemas                                 │
│  │  ├─ Uses shared hooks                                   │
│  │  └─ Uses shared indexes                                 │
│  │                                                         │
│  ├─ TournamentTeam.ts                                     │
│  │  ├─ Uses shared schemas                                 │
│  │  ├─ Uses shared hooks (NO DUPLICATION!)                │
│  │  └─ Uses shared indexes (NO DUPLICATION!)              │
│  │                                                         │
│  └─ index.ts             ← Model exports                   │
│     └─ export both models                                  │
│                                                             │
│  ✅ BENEFITS:                                               │
│     • No schema duplication                                │
│     • No hook duplication                                  │
│     • Changes in one place                                 │
│     • Easy to extend                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              Services Layer (Organized & Clear)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  services/tournament/                ← SINGLE ENTRY        │
│  ├─ index.ts             ← MAIN EXPORT                     │
│  │  └─ Export all public services                          │
│  │                                                         │
│  ├─ algorithms/           ← SCHEDULING & SEEDING           │
│  │  ├─ SchedulingAlgorithm.ts                              │
│  │  │  └─ generateRoundRobinSchedule()                     │
│  │  └─ SeedingAlgorithm.ts                                 │
│  │     └─ generateSeeding()                                │
│  │                                                         │
│  ├─ calculations/         ← COMPUTATIONS                   │
│  │  ├─ StandingsCalculator.ts                              │
│  │  │  └─ calculateStandings()                             │
│  │  └─ StatisticsCalculator.ts                             │
│  │     └─ calculateLeaderboard()                           │
│  │                                                         │
│  ├─ generation/           ← DRAW & MATCH GENERATION        │
│  │  ├─ DrawGenerator.ts                                    │
│  │  │  └─ generateDraw()                                   │
│  │  └─ MatchGenerator.ts                                   │
│  │     └─ createMatches()                                  │
│  │                                                         │
│  ├─ orchestration/        ← HIGH-LEVEL OPERATIONS          │
│  │  ├─ TournamentOrchestrator.ts                          │
│  │  │  ├─ createTournament()                               │
│  │  │  ├─ startTournament()                                │
│  │  │  └─ completeTournament()                             │
│  │  └─ MatchOrchestrator.ts                               │
│  │     └─ processMatchResult()                             │
│  │                                                         │
│  ├─ persistence/          ← DATA ACCESS                    │
│  │  ├─ TournamentRepository.ts                             │
│  │  │  ├─ findById()                                       │
│  │  │  ├─ create()                                         │
│  │  │  └─ update()                                         │
│  │  └─ MatchRepository.ts                                  │
│  │     └─ Data access for matches                          │
│  │                                                         │
│  ├─ validation/           ← SINGLE VALIDATION              │
│  │  ├─ TournamentValidator.ts                              │
│  │  │  ├─ validateCapacity()                               │
│  │  │  ├─ validateDrawGeneration()                         │
│  │  │  └─ ... all validators                               │
│  │  └─ rules.ts           ← Validation rules               │
│  │     └─ CAPACITY_RULES, DRAW_RULES, etc                 │
│  │                                                         │
│  ├─ types/                ← SHARED TYPES (link to types/) │
│  │  └─ index.ts → import from types/tournament/           │
│  │                                                         │
│  └─ utils/                ← UTILITIES                      │
│     ├─ codeGenerator.ts                                    │
│     ├─ progressHelpers.ts                                  │
│     └─ ...                                                 │
│                                                             │
│  ✅ BENEFITS:                                               │
│     • Clear organizational structure                       │
│     • Each module has single responsibility                │
│     • Easy to find what you need                           │
│     • Single entry point (index.ts)                        │
│     • No duplicate services                                │
│     • Consistent naming (PascalCase for classes)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│             Validation Layer (Consolidated)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  services/tournament/validation/TournamentValidator.ts      │
│                                                             │
│  class TournamentValidator {                               │
│    ├─ static validateCapacity()                            │
│    ├─ static validateDrawGeneration()                      │
│    ├─ static validateParticipation()                       │
│    ├─ static validateTeamConfig()                          │
│    ├─ static validateGroups()                              │
│    └─ ... all validators in ONE place                     │
│  }                                                          │
│                                                             │
│  ✅ BENEFITS:                                               │
│     • Single validation entry point                        │
│     • All rules in one place                               │
│     • Easy to update/debug                                 │
│     • Consistent error handling                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│           Naming Standards (Consistent & Clear)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  docs/NAMING_CONVENTIONS.md                                │
│                                                             │
│  Types:                                                     │
│  ├─ Domain types: Tournament, Participant, Standing       │
│  ├─ Mongoose types: TournamentDocument                    │
│  └─ Helper guards: isTeamParticipant()                    │
│                                                             │
│  Files:                                                     │
│  ├─ Classes: PascalCase (TournamentValidator.ts)           │
│  ├─ Functions: camelCase (codeGenerator.ts)                │
│  └─ No V1/V2 versions - always use current                │
│                                                             │
│  Methods:                                                   │
│  ├─ Actions: verb + noun (generateDraw, createMatch)       │
│  ├─ Queries: get/calculate + noun (getStatus, calculateRank)
│  └─ Predicates: is/can + adjective (isValid, canJoin)     │
│                                                             │
│  Variables:                                                 │
│  ├─ Clear names: submitted > generated (drawSubmitted)     │
│  ├─ Timestamps: At suffix (submittedAt, createdAt)         │
│  ├─ Actors: By suffix (submittedBy, createdBy)             │
│  └─ No ambiguous abbreviations                             │
│                                                             │
│  ✅ BENEFITS:                                               │
│     • Everyone follows same convention                     │
│     • Easy to guess correct names                          │
│     • Less confusion in code review                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparison Table

| Aspect | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| **Type Definitions** | 6 locations | 1 location | ✅ 85% reduction |
| **Schema Duplication** | 3-4x | 1x | ✅ 75% reduction |
| **Interface Duplication** | 3x same | 1x only | ✅ 66% reduction |
| **Validation Locations** | 6 places | 1 place | ✅ 83% reduction |
| **Cross-Cutting Concerns Duplication** | 3x same | 1x only | ✅ 66% reduction |
| **Service Entry Points** | 3+ (confusing) | 1 (clear) | ✅ Clear path |
| **Naming Consistency** | ❌ Mixed | ✅ Standard | ✅ Unified |
| **Code Duplication** | 40% | 5% | ✅ 87% reduction |
| **Time to Find Feature** | ⏱️ 30 mins | ⏱️ 5 mins | ✅ 83% faster |
| **New Dev Onboarding** | 2 weeks | 1 week | ✅ 50% faster |

---

## 🚀 Migration Path

```
Current State (Messy)
       ↓
Phase 1: Consolidate Types ← START HERE
       ↓
Phase 2: Consolidate Schemas & Models
       ↓
Phase 3: Reorganize Services
       ↓
Phase 4: Consolidate Validation
       ↓
Phase 5: Standardize Naming
       ↓
Clean State (Maintainable & Scalable) ✅
```

Each phase builds on previous ones. Each phase is testable independently.

---

## ⏱️ Effort Breakdown

| Phase | Hours | Complexity |
|-------|-------|-----------|
| Phase 1: Types | 4-6 | Low |
| Phase 2: Models | 5-7 | Medium |
| Phase 3: Services | 8-10 | High |
| Phase 4: Validation | 4-5 | Medium |
| Phase 5: Naming | 6-8 | Low |
| **Total** | **30-40** | **5 days** |

---

## ✅ Success Criteria (After Refactoring)

- [ ] All types from single location
- [ ] No schema duplication
- [ ] Clear service organization
- [ ] Single validation entry point
- [ ] Consistent naming throughout
- [ ] 100% tests passing
- [ ] Code review approved
- [ ] 0 TypeScript errors (strict mode)
- [ ] Developer velocity ↑ 20%
