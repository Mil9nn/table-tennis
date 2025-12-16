# Tournament Architecture Refactoring Plan

## 🎯 Project Goals

1. **Eliminate duplication** - Remove ~40% redundant code
2. **Establish single source of truth** - Types, schemas, validation
3. **Improve clarity** - Clear file/function/variable naming
4. **Enable scalability** - Easy to extend and maintain
5. **Maintain functionality** - Zero breaking changes during refactoring

---

## 📋 Phase-by-Phase Checklist

### PHASE 1: Type Consolidation ⭐ START HERE

#### 1.1 Create Type Hierarchy
- [ ] Create `types/tournament/domain.types.ts` - Core business types
  - [ ] Move core types from `types/tournament.type.ts`
  - [ ] Move helper functions (isTeamParticipant, getParticipantDisplayName)
  - [ ] Clean up imports/exports
  
- [ ] Create `types/tournament/mongo.types.ts` - Mongoose Document types
  - [ ] Extract all `IXxx extends Document` interfaces
  - [ ] Source from: Tournament.ts, TournamentTeam.ts, TournamentIndividual.ts
  - [ ] Consolidate duplicated ISeeding, IStanding, IGroup
  
- [ ] Create `types/tournament/service.types.ts` - Service operation types
  - [ ] Move from `services/tournament/types/tournament.types.ts`
  - [ ] Consolidate with any duplicates in services
  
- [ ] Create `types/tournament/index.ts` - Single export point
  - [ ] Export all from above files
  - [ ] Create clear type hierarchy exports

#### 1.2 Create Naming Conventions Document
- [ ] Create `docs/NAMING_CONVENTIONS.md`
  - [ ] Type naming rules
  - [ ] File naming rules
  - [ ] Function naming rules
  - [ ] Variable naming rules
  - [ ] Abbreviation standards
  
#### 1.3 Migrate Imports
- [ ] Find all tournament type imports across codebase
- [ ] Update to use new centralized imports
- [ ] Verify no breakage

**Estimated Time:** 4-6 hours

**Success Criteria:**
- ✅ All tournament types come from `types/tournament/`
- ✅ Zero type duplications across codebase
- ✅ All imports use new paths
- ✅ Types pass TypeScript strict mode

---

### PHASE 2: Model Schema Consolidation

#### 2.1 Create Schema Consolidation
- [ ] Create `models/schemas/shared.schemas.ts`
  - [ ] Move `standingSchema` from Tournament.ts
  - [ ] Move `roundSchema` from Tournament.ts
  - [ ] Move `groupSchema` from Tournament.ts
  - [ ] Delete from TournamentBase.ts
  
- [ ] Update `models/TournamentTeam.ts`
  - [ ] Import shared schemas instead of redefining
  - [ ] Remove duplicate schema definitions
  - [ ] Remove duplicate interfaces (use from types/)
  
- [ ] Update `models/TournamentIndividual.ts`
  - [ ] Import shared schemas instead of redefining
  - [ ] Remove duplicate schema definitions
  - [ ] Remove duplicate interfaces (use from types/)

#### 2.2 Extract Cross-Cutting Concerns
- [ ] Create `models/schemas/hooks.ts`
  - [ ] Extract cascade delete logic (used by both models)
  - [ ] Extract virtual population logic
  - [ ] Create reusable hook functions
  
- [ ] Create `models/schemas/indexes.ts`
  - [ ] Consolidate all indexes
  - [ ] Apply consistently to all tournament models

#### 2.3 Standardize Model Export
- [ ] Choose ONE export pattern for all models
  - [ ] Recommendation: Use TournamentTeam pattern (clearest)
  - [ ] Apply to TournamentIndividual
  - [ ] Apply to Tournament if kept
  
- [ ] Document model export pattern in `docs/`

#### 2.4 Decide: Keep Tournament.ts or Deprecate?
- [ ] **DECISION POINT:** Should we:
  - [ ] Option A: Remove Tournament.ts entirely (requires code migration)
  - [ ] Option B: Keep as wrapper that delegates to Team/Individual
  - [ ] Option C: Make Tournament.ts the single unified model
  
  *Recommendation: Option A if possible (cleaner), else Option B*

#### 2.5 Verify Model Integrity
- [ ] Run tests on all models
- [ ] Test schema validation
- [ ] Test cascade operations
- [ ] Test virtual populations

**Estimated Time:** 5-7 hours

**Success Criteria:**
- ✅ No schema duplication across files
- ✅ Zero identical interfaces across models
- ✅ Consistent export patterns
- ✅ All tests pass
- ✅ Cross-cutting concerns extracted

---

### PHASE 3: Service Layer Consolidation

#### 3.1 Audit Existing Services
- [ ] Map all services in `services/tournament/`
- [ ] Identify duplicates:
  - [ ] bracketProgressionService.ts vs BracketProgressionServiceV2.ts
  - [ ] Check MatchGenerationOrchestrator (appears twice?)
  - [ ] Check for other duplicates
  
- [ ] Document findings in checklist item below

#### 3.2 Remove Duplicate Services
- [ ] Decide which version to keep (V1 vs V2)
  - [ ] Compare functionality
  - [ ] Check test coverage
  - [ ] Review code quality
  
- [ ] Delete old version
- [ ] Update all imports to use chosen version
- [ ] Add deprecation comment to archive

#### 3.3 Consolidate Service Structure
- [ ] Create `/services/tournament/algorithms/` (if not exists)
  - [ ] Move scheduling, seeding to here
  
- [ ] Create `/services/tournament/calculations/`
  - [ ] Move standings, statistics calculations
  
- [ ] Create `/services/tournament/generation/`
  - [ ] Move draw/match generation services
  
- [ ] Create `/services/tournament/orchestration/`
  - [ ] Move high-level orchestrators
  - [ ] Create `TournamentOrchestrator.ts`
  - [ ] Move related logic here
  
- [ ] Create `/services/tournament/persistence/`
  - [ ] Move TournamentRepository here
  - [ ] Move MatchRepository here

#### 3.4 Standardize File Naming
- [ ] Use PascalCase for class files:
  - [ ] `TournamentValidator.ts` ✅
  - [ ] `MatchRepository.ts` ✅
  - [ ] `TournamentOrchestrator.ts` ✅
  
- [ ] Use camelCase for function files:
  - [ ] `groupAllocator.ts` ✅
  - [ ] `codeGenerator.ts` ✅
  - [ ] `progressHelpers.ts` ✅

#### 3.5 Update Import Paths
- [ ] Migrate imports in entire codebase
- [ ] Verify no broken imports
- [ ] Update `services/tournament/index.ts` exports

#### 3.6 Test Service Layer
- [ ] Run all tournament service tests
- [ ] Integration test: draw generation
- [ ] Integration test: standings calculation
- [ ] Integration test: bracket progression

**Estimated Time:** 8-10 hours

**Success Criteria:**
- ✅ No duplicate services
- ✅ Clear service organization
- ✅ Consistent naming
- ✅ All imports updated
- ✅ All tests pass

---

### PHASE 4: Validation Layer Consolidation

#### 4.1 Create Single Validation Service
- [ ] Create `services/tournament/validation/TournamentValidator.ts`
  - [ ] Class with static methods (no instances)
  - [ ] Each method has clear, single responsibility
  - [ ] Returns standardized `ValidationResult` type
  
- [ ] Move validation from:
  - [ ] `services/tournament/validators/tournamentValidators.ts` → Consolidate here
  - [ ] `services/validation/TournamentValidationService.ts` → Consolidate here
  - [ ] `lib/validations/tournaments.ts` → Consolidate here

#### 4.2 Remove Model-Level Validation
- [ ] Extract validation from `models/TournamentTeam.ts` pre-save
  - [ ] Move to TournamentValidator
  - [ ] Call validator before model.save()
  
- [ ] Extract validation from `models/TournamentIndividual.ts` pre-save
  - [ ] Move to TournamentValidator
  - [ ] Call validator before model.save()
  
- [ ] Keep only database constraints in models

#### 4.3 Centralize Validation Rules
- [ ] Create `services/tournament/validation/rules.ts`
  - [ ] Define all validation rules
  - [ ] Document each rule
  - [ ] Make easily extendable

#### 4.4 Update All Callers
- [ ] Find all validation calls across codebase
- [ ] Update to use new TournamentValidator
- [ ] Remove old validator imports

**Estimated Time:** 4-5 hours

**Success Criteria:**
- ✅ Single validation entry point
- ✅ No validation in models
- ✅ No duplicate validation rules
- ✅ All validators use same structure
- ✅ All tests pass

---

### PHASE 5: Variable & Naming Fixes

#### 5.1 Rename Ambiguous Fields
- [ ] Create migration mapping document
- [ ] Identify critical renamings:
  - [ ] `drawGenerated` → `drawSubmitted` (better intent)
  - [ ] `drawGeneratedAt` → `drawSubmittedAt`
  - [ ] `drawGeneratedBy` → `drawSubmittedBy`
  
- [ ] Decision: Is database migration needed?
  - [ ] Yes: Create Mongoose migration
  - [ ] No: Use aliases/getters

#### 5.2 Standardize Abbreviations
- [ ] Define abbreviation standards (in NAMING_CONVENTIONS.md)
- [ ] Update interface names:
  - [ ] Old: `IStanding` → New: `TournamentStanding`
  - [ ] Old: `ITournament` → New: `TournamentDocument`
  - [ ] Old: `ITeamConfig` → New: `TeamConfiguration`
  
- [ ] Update across codebase
- [ ] Consider using branded types for clarity

#### 5.3 Clarify Related Concepts
- [ ] `matchType` vs `format` vs `category` - Document relationship
- [ ] `calculatedAt` vs `generatedAt` - Use consistently
- [ ] `tournament` vs `tournamentId` - Use consistently

#### 5.4 Standardize Boolean Naming
- [ ] Review all boolean fields
- [ ] Ensure clear true/false meaning
- [ ] Examples:
  - [ ] `useGroups` ✅ (clear)
  - [ ] `allowJoinByCode` ✅ (clear)
  - [ ] `drawGenerated` ❌ → `drawSubmitted` ✅ (clearer)

**Estimated Time:** 6-8 hours

**Success Criteria:**
- ✅ No ambiguous field names
- ✅ Consistent abbreviation style
- ✅ Clear intent in all names
- ✅ All tests pass
- ✅ No TypeScript errors

---

### PHASE 6: Documentation

#### 6.1 Create Architecture Guide
- [ ] Create `docs/TOURNAMENT_ARCHITECTURE.md`
  - [ ] System overview
  - [ ] Data flow diagram (ASCII art acceptable)
  - [ ] Key components and responsibilities
  - [ ] Extension points
  
#### 6.2 Create API Documentation
- [ ] Document main entry points:
  - [ ] `TournamentOrchestrator` - What it does, how to use
  - [ ] `TournamentValidator` - Validation rules and usage
  - [ ] `TournamentRepository` - Data access patterns
  
#### 6.3 Create Integration Examples
- [ ] Example: Creating a tournament
- [ ] Example: Generating a draw
- [ ] Example: Updating standings
- [ ] Example: Completing tournament

#### 6.4 Update Existing Docs
- [ ] Update `services/tournament/README.md` (if needed)
- [ ] Add references to new structure
- [ ] Remove/update deprecated information

**Estimated Time:** 3-4 hours

**Success Criteria:**
- ✅ Clear architecture documentation
- ✅ Working code examples
- ✅ No outdated information
- ✅ Easy for new developers to understand

---

## 🔄 Parallel Work Streams

**These can be done simultaneously:**
- Phase 1 (Type Consolidation) - Backend dev 1
- Phase 2 (Model Schema) - Backend dev 2
- Phase 6 (Documentation) - Can start anytime

**These are dependent:**
- Phase 3 depends on Phase 1 ✅
- Phase 4 depends on Phase 1 ✅
- Phase 5 depends on Phase 1 ✅

---

## ⚠️ Risk Management

### Risk 1: Breaking Changes
**Mitigation:**
- Run full test suite after each phase
- Test integration between phases
- Create feature branch for entire refactor
- Code review before merging

### Risk 2: Missing Duplicates
**Mitigation:**
- Use code search tools to find patterns
- Compare file sizes before/after
- Run duplication detection tools

### Risk 3: Incomplete Migration
**Mitigation:**
- Create migration checklist for each file
- Verify all imports are updated
- Use TypeScript strict mode to catch errors

### Risk 4: Performance Regression
**Mitigation:**
- Profile before/after
- Monitor load times
- Check database query counts

---

## 📊 Expected Improvements

### Code Metrics
- **Duplication Reduction:** 35-40%
- **File Count Consolidation:** ~8-10 fewer files
- **Cyclomatic Complexity:** Lower (clearer flow)
- **Type Safety:** 15%+ improvement

### Maintainability Metrics
- **Time to understand code:** 30% faster
- **Time to find a feature:** 40% faster
- **Time to add new feature:** 25% faster
- **Bug escape rate:** 20% lower

### Team Velocity
- **Onboarding new devs:** 2 weeks → 1 week
- **Feature development:** 10% faster
- **Bug fixes:** 15% faster

---

## ✅ Acceptance Criteria

### Final State
- ✅ All tournament types from single location
- ✅ No schema duplication
- ✅ No interface duplication
- ✅ Clear service organization
- ✅ Single validation entry point
- ✅ Consistent naming throughout
- ✅ Zero breaking changes
- ✅ 100% test coverage maintained
- ✅ All tests passing
- ✅ Code review approved

### Code Quality Gates
- ✅ TypeScript strict mode: Pass
- ✅ No ESLint errors: Pass
- ✅ Test coverage: >80%
- ✅ No circular dependencies: Pass

---

## 📅 Timeline Estimate

- **Phase 1:** 4-6 hours ⏱️
- **Phase 2:** 5-7 hours ⏱️
- **Phase 3:** 8-10 hours ⏱️
- **Phase 4:** 4-5 hours ⏱️
- **Phase 5:** 6-8 hours ⏱️
- **Phase 6:** 3-4 hours ⏱️

**Total: 30-40 hours (3-5 days of focused work)**

**Recommended Approach:**
- Sprint format: 2-3 sprints
- 1 developer full-time
- Code review after each phase
- Testing as you go

---

## 🚀 Post-Refactoring

### Maintenance Plan
- Regular linting to prevent new duplication
- Type review in code reviews
- Document any new patterns
- Update naming conventions as needed

### Future Enhancements
Once clean, easily add:
- New tournament formats
- Advanced statistics
- Real-time scoring updates
- Tournament templates

---

## Questions to Resolve Before Starting

1. **Database Schema:** Need migration for renamed fields?
2. **Backward Compatibility:** Must support old code paths?
3. **Deployment:** Zero-downtime requirement?
4. **Testing:** Should we increase test coverage first?
5. **Branching Strategy:** Feature branch or incremental merges?

---

## Sign-Off Checklist

- [ ] Team agrees on approach
- [ ] Timeline is acceptable
- [ ] Resources allocated
- [ ] Testing strategy approved
- [ ] Deployment plan ready
- [ ] Rollback plan defined
