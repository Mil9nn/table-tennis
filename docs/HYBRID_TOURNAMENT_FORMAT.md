# Hybrid Tournament Format (Round-Robin → Knockout)

## Overview

The hybrid tournament format combines the fairness and comprehensiveness of round-robin with the excitement of knockout elimination. This format consists of two distinct phases:

1. **Round-Robin Phase**: All participants play each other (or within groups) to establish rankings
2. **Knockout Phase**: Top performers from round-robin advance to single-elimination bracket

This format is ideal for:
- **Fairness**: Everyone gets multiple matches to prove themselves
- **Excitement**: Best players face off in dramatic elimination rounds
- **Efficiency**: Eliminates lower performers to focus on top contenders
- **Real-world tournaments**: Commonly used in World Cup, Olympics, and major sports leagues

---

## Architecture

### Database Schema Extensions

#### Tournament Model

```typescript
interface ITournament {
  // ... existing fields ...

  format: "round_robin" | "knockout" | "hybrid";

  // Hybrid format configuration
  hybridConfig?: {
    // Round-robin phase settings
    roundRobinUseGroups: boolean;
    roundRobinNumberOfGroups?: number;

    // Qualification settings
    qualificationMethod: "top_n_overall" | "top_n_per_group" | "percentage";
    qualifyingCount?: number;
    qualifyingPercentage?: number;
    qualifyingPerGroup?: number;

    // Knockout phase settings
    knockoutAllowCustomMatching: boolean;
    knockoutThirdPlaceMatch: boolean;
  };

  // Phase tracking
  currentPhase?: "round_robin" | "knockout" | "transition";
  phaseTransitionDate?: Date;
  qualifiedParticipants?: ObjectId[];
}
```

---

## Services Architecture

### Core Services

```
services/tournament/core/
├── phaseManagementService.ts      # Phase lifecycle management
├── qualificationService.ts         # Participant qualification logic
├── hybridMatchGenerationService.ts # Match generation orchestration
└── matchGenerationService.ts       # Updated to support hybrid
```

### Service Responsibilities

#### 1. Phase Management Service (`phaseManagementService.ts`)

Manages tournament phase lifecycle and transitions.

**Key Functions:**

- `initializeHybridTournament(tournament)` - Initialize hybrid tournament
- `isRoundRobinPhaseComplete(tournament)` - Check if RR phase is done
- `isKnockoutPhaseComplete(tournament)` - Check if KO phase is done
- `canTransitionToKnockout(tournament)` - Validate transition readiness
- `markTransitionPhase(tournament)` - Start transition
- `completeTransitionToKnockout(tournament)` - Finish transition
- `getPhaseInfo(tournament)` - Get current phase status
- `validateHybridConfig(tournament)` - Validate configuration

#### 2. Qualification Service (`qualificationService.ts`)

Determines which participants advance from round-robin to knockout.

**Qualification Methods:**

1. **Top N Overall** (`top_n_overall`)
   - Takes top N participants based on overall standings
   - Example: Top 8 from 16 participants
   - Use case: Single group tournaments or when you want best overall performers

2. **Top N Per Group** (`top_n_per_group`)
   - Takes top N from each group
   - Example: Top 2 from each of 4 groups = 8 qualifiers
   - Use case: Ensure representation from all groups

3. **Percentage** (`percentage`)
   - Takes top X% of all participants
   - Example: Top 50% from 16 participants = 8 qualifiers
   - Use case: When you want proportional qualification

**Key Functions:**

- `determineQualifiedParticipants(tournament)` - Run qualification logic
- `applyQualificationResults(tournament, result)` - Apply results
- `isParticipantQualified(tournament, participantId)` - Check qualification
- `getQualificationSummary(tournament)` - Get summary
- `validateQualificationConfig(tournament)` - Validate config

#### 3. Hybrid Match Generation Service (`hybridMatchGenerationService.ts`)

Orchestrates the complete hybrid tournament flow.

**Key Functions:**

- `generateHybridRoundRobinPhase(tournament, options)` - Generate RR matches
- `transitionToKnockoutPhase(tournament, options)` - Perform phase transition
- `generateCompleteHybridTournament(tournament, options)` - Full setup
- `getHybridTournamentStatus(tournament)` - Get status

---

## API Endpoints

### 1. Generate Hybrid Tournament

```http
POST /api/tournaments/:id/generate-matches
```

Generates the initial round-robin phase matches.

**Request Body:** (none needed, uses tournament configuration)

**Response:**
```json
{
  "message": "Round-robin phase created with 3 groups and 18 matches",
  "phase": "round_robin",
  "matchesCreated": 18,
  "groupsCreated": 3
}
```

### 2. Check Transition Status

```http
GET /api/tournaments/:id/transition-to-knockout
```

Check if tournament can transition to knockout phase.

**Response:**
```json
{
  "canTransition": true,
  "currentPhase": "round_robin",
  "roundRobinComplete": true,
  "knockoutComplete": false,
  "qualifiedCount": 0
}
```

### 3. Transition to Knockout Phase

```http
POST /api/tournaments/:id/transition-to-knockout
```

Transitions tournament from round-robin to knockout phase.

**Response:**
```json
{
  "message": "Knockout phase created with 8 qualified participants and 7 matches",
  "warnings": ["Qualified count (8) is already a power of 2. No byes needed."],
  "tournament": { ... },
  "result": {
    "phase": "knockout",
    "matchesCreated": 7,
    "qualifiedCount": 8
  }
}
```

### 4. Get Hybrid Status

```http
GET /api/tournaments/:id/hybrid-status
```

Get comprehensive hybrid tournament status.

**Response:**
```json
{
  "isHybrid": true,
  "format": "hybrid",
  "currentPhase": "round_robin",
  "phaseTransitionDate": null,
  "roundRobinComplete": false,
  "knockoutComplete": false,
  "qualifiedCount": 0,
  "totalParticipants": 16,
  "hybridConfig": {
    "roundRobinUseGroups": true,
    "roundRobinNumberOfGroups": 4,
    "qualificationMethod": "top_n_per_group",
    "qualifyingPerGroup": 2,
    "knockoutAllowCustomMatching": false,
    "knockoutThirdPlaceMatch": true
  },
  "canTransition": false,
  "nextAction": "Complete round-robin matches",
  "roundRobinProgress": {
    "useGroups": true,
    "groups": [
      {
        "groupId": "A",
        "groupName": "Group A",
        "participantCount": 4,
        "roundsTotal": 3,
        "roundsCompleted": 1,
        "isComplete": false
      }
    ],
    "allGroupsComplete": false
  }
}
```

---

## Usage Flow

### Creating a Hybrid Tournament

#### Step 1: Create Tournament with Hybrid Configuration

```javascript
const tournament = await Tournament.create({
  name: "World Championship 2024",
  format: "hybrid",
  category: "individual",
  matchType: "singles",
  startDate: new Date("2024-12-20"),
  organizer: organizerId,
  participants: participantIds, // 16 participants

  // Hybrid configuration
  hybridConfig: {
    // Round-robin phase: 4 groups
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 4,

    // Qualification: Top 2 from each group (8 total)
    qualificationMethod: "top_n_per_group",
    qualifyingPerGroup: 2,

    // Knockout phase: Standard bracket
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  },

  rules: {
    pointsForWin: 1,
    pointsForLoss: 0,
    setsPerMatch: 3,
    pointsPerSet: 11,
    tiebreakRules: [
      "points",
      "head_to_head",
      "sets_ratio",
      "points_ratio",
      "sets_won",
    ],
  },
});
```

#### Step 2: Generate Round-Robin Phase

```javascript
// Call API endpoint
POST /api/tournaments/:id/generate-matches

// Or use service directly
import { generateHybridRoundRobinPhase } from "@/services/tournament";

const result = await generateHybridRoundRobinPhase(tournament, {
  scorerId: user.id,
  courtsAvailable: 4,
  matchDuration: 30,
  startDate: new Date("2024-12-20T09:00:00"),
});

// Result: 4 groups with 6 matches each = 24 total matches
```

#### Step 3: Play Round-Robin Matches

Players complete their round-robin matches. After each match:

1. Match result is recorded
2. Standings are updated automatically
3. Progress is tracked

Monitor progress:
```javascript
GET /api/tournaments/:id/hybrid-status
```

#### Step 4: Transition to Knockout Phase

Once all round-robin matches are complete:

```javascript
// Check if ready to transition
GET /api/tournaments/:id/transition-to-knockout

// Perform transition
POST /api/tournaments/:id/transition-to-knockout

// This will:
// 1. Calculate final standings
// 2. Determine qualified participants (top 2 from each group = 8)
// 3. Generate knockout bracket with 8 participants
// 4. Create knockout matches
```

#### Step 5: Play Knockout Matches

Players compete in elimination bracket:

```
Quarterfinals (4 matches)
    ↓
Semifinals (2 matches)
    ↓
Final (1 match)
```

If `thirdPlaceMatch: true`, there will also be a 3rd place playoff.

---

## Example Configurations

### Configuration 1: Small Tournament (8 participants)

```javascript
{
  format: "hybrid",
  hybridConfig: {
    // Round-robin: Single group
    roundRobinUseGroups: false,

    // Qualification: Top 4 advance
    qualificationMethod: "top_n_overall",
    qualifyingCount: 4,

    // Knockout: Simple semifinals
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  }
}

// Flow:
// 1. Round-robin: All 8 play each other (28 matches)
// 2. Top 4 qualify for knockout
// 3. Semifinals (2 matches)
// 4. Final + 3rd place (2 matches)
// Total: 32 matches
```

### Configuration 2: Medium Tournament (16 participants)

```javascript
{
  format: "hybrid",
  hybridConfig: {
    // Round-robin: 4 groups of 4
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 4,

    // Qualification: Top 2 from each group
    qualificationMethod: "top_n_per_group",
    qualifyingPerGroup: 2,

    // Knockout: Standard bracket
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  }
}

// Flow:
// 1. Round-robin: 4 groups, 6 matches per group (24 matches)
// 2. Top 2 from each group = 8 qualifiers
// 3. Quarterfinals (4 matches)
// 4. Semifinals (2 matches)
// 5. Final + 3rd place (2 matches)
// Total: 32 matches
```

### Configuration 3: Large Tournament (32 participants)

```javascript
{
  format: "hybrid",
  hybridConfig: {
    // Round-robin: 8 groups of 4
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 8,

    // Qualification: Top 2 from each group
    qualificationMethod: "top_n_per_group",
    qualifyingPerGroup: 2,

    // Knockout: Full bracket
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  }
}

// Flow:
// 1. Round-robin: 8 groups, 6 matches per group (48 matches)
// 2. Top 2 from each group = 16 qualifiers
// 3. Round of 16 (8 matches)
// 4. Quarterfinals (4 matches)
// 5. Semifinals (2 matches)
// 6. Final + 3rd place (2 matches)
// Total: 64 matches
```

### Configuration 4: Percentage-Based Qualification

```javascript
{
  format: "hybrid",
  hybridConfig: {
    // Round-robin: 3 groups
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 3,

    // Qualification: Top 50% overall
    qualificationMethod: "percentage",
    qualifyingPercentage: 50,

    // Knockout: Standard bracket
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: false,
  }
}

// With 12 participants:
// 1. Round-robin: 3 groups of 4 (18 matches)
// 2. Top 50% = 6 qualifiers → rounded up to 8 (next power of 2)
// 3. Knockout with byes for top seeds
```

---

## Qualification Methods Explained

### 1. Top N Overall

Takes the top N participants based on overall standings across all groups.

**Advantages:**
- Simple and fair
- Best overall performers advance
- No group bias

**Disadvantages:**
- Weaker groups might have no representation
- All groups must complete before calculating

**Use When:**
- Single group tournaments
- You want absolute best performers
- Group strength doesn't matter

**Example:**
16 participants → Top 8 advance

### 2. Top N Per Group

Takes the top N from each group separately.

**Advantages:**
- Ensures representation from all groups
- Groups can be different skill levels
- More balanced bracket

**Disadvantages:**
- Weaker group winners might advance over stronger group runners-up
- Requires equal group sizes (approximately)

**Use When:**
- Multiple groups with potentially different skill levels
- You want geographic/division representation
- Fairness across groups is important

**Example:**
4 groups of 4 → Top 2 from each = 8 qualifiers

### 3. Percentage

Takes top X% of all participants.

**Advantages:**
- Scales automatically with participant count
- Easy to configure
- Proportional qualification

**Disadvantages:**
- May not result in power-of-2 (byes needed)
- Less predictable qualifier count

**Use When:**
- Flexible on exact qualifier count
- Want proportional advancement
- Tournament size varies

**Example:**
16 participants, 50% → 8 qualifiers
20 participants, 50% → 10 qualifiers → 16 with byes

---

## Phase Management

### Phase States

1. **round_robin**
   - Initial state after generation
   - Participants playing round-robin matches
   - Can view standings in real-time
   - Cannot start knockout matches yet

2. **transition**
   - Temporary state during phase change
   - Qualification is being calculated
   - Knockout bracket is being generated
   - Matches being created

3. **knockout**
   - Qualified participants determined
   - Knockout bracket generated
   - Elimination matches in progress
   - Round-robin data still available

### Transition Requirements

Tournament can only transition when:

1. ✅ All round-robin matches completed
2. ✅ Standings calculated for all participants
3. ✅ Valid hybrid configuration
4. ✅ At least 2 participants qualify
5. ✅ Organizer initiates transition

### Automatic vs Manual Transition

**Manual (Recommended):**
- Organizer calls `/transition-to-knockout` when ready
- Allows review of standings before knockout
- Can adjust configuration if needed

**Automatic (Future Feature):**
- Tournament automatically transitions when round-robin complete
- Seamless experience
- Less control for organizer

---

## Data Persistence

### Round-Robin Phase Data

After transition, round-robin data is **preserved**:

- `tournament.rounds` - All round-robin rounds
- `tournament.groups` - Group configurations
- `tournament.standings` - Final round-robin standings
- All match documents - Full match history

This allows:
- Historical analysis
- Viewing how qualification was determined
- Appeals and verification
- Statistical analysis

### Knockout Phase Data

Added during transition:

- `tournament.bracket` - Knockout bracket structure
- `tournament.qualifiedParticipants` - Who advanced
- `tournament.phaseTransitionDate` - When transition occurred
- New match documents for knockout rounds

---

## Edge Cases & Validation

### Handling Non-Power-of-2 Qualifiers

If qualified count is not a power of 2, the system automatically:

1. Calculates next power of 2
2. Adds byes to reach that number
3. Gives byes to top seeds
4. Warns organizer about byes

**Example:**
- 6 qualifiers → 8-bracket → 2 byes for seeds 1-2
- 10 qualifiers → 16-bracket → 6 byes for seeds 1-6

### Incomplete Round-Robin

If organizer tries to transition with incomplete round-robin:

```json
{
  "error": "Cannot transition to knockout phase",
  "details": ["Round-robin phase is not complete"]
}
```

### Invalid Qualification Configuration

System validates before applying:

```javascript
// Too many qualifiers
{
  qualifyingCount: 15,  // With 16 participants
  // Error: "Cannot qualify all participants (must eliminate at least one)"
}

// Too few qualifiers
{
  qualifyingCount: 1,  // Not enough for a bracket
  // Error: "Must qualify at least 2 participants"
}

// Group mismatch
{
  qualificationMethod: "top_n_per_group",
  roundRobinUseGroups: false,
  // Error: "Groups must be enabled for top_n_per_group qualification"
}
```

---

## Testing

### Unit Tests

Test each service independently:

```javascript
// Phase Management
describe("phaseManagementService", () => {
  test("validates hybrid config");
  test("checks round-robin completion");
  test("transitions phases correctly");
});

// Qualification
describe("qualificationService", () => {
  test("top_n_overall selects correct participants");
  test("top_n_per_group handles multiple groups");
  test("percentage calculates correctly");
});
```

### Integration Tests

Test complete flows:

```javascript
describe("Hybrid Tournament Flow", () => {
  test("creates hybrid tournament");
  test("generates round-robin matches");
  test("calculates standings after matches");
  test("transitions to knockout phase");
  test("generates knockout bracket");
  test("completes tournament");
});
```

---

## Future Enhancements

### Planned Features

1. **Multiple Knockout Rounds**
   - Round of 16 → Quarterfinals → Semifinals → Final
   - Better for large tournaments

2. **Consolation Brackets**
   - Eliminated players continue in lower bracket
   - More matches for everyone

3. **Custom Seeding for Knockout**
   - Manual bracket arrangement
   - Regional separation
   - Prevent rematches

4. **Auto-Transition**
   - Automatically move to knockout when ready
   - Configurable delay for review

5. **Multiple Qualification Phases**
   - Round-robin → Round of 16 → Quarterfinals
   - Phased elimination

6. **Hybrid-Hybrid**
   - Multiple round-robin + knockout cycles
   - Complex multi-stage tournaments

---

## Best Practices

### Configuration Tips

1. **Group Size**: 3-5 participants per group optimal
   - Too small (2): Limited matches
   - Too large (6+): Too many group matches

2. **Qualification Rate**: 25-50% is ideal
   - Too high (>75%): Knockout loses meaning
   - Too low (<25%): Too many eliminated early

3. **Match Format**: Use best-of-3 for groups, best-of-5 for knockout
   - Groups: Speed and efficiency
   - Knockout: Drama and fairness

4. **Seeding**: Use ranking-based seeding
   - Spreads strong players across groups
   - Creates balanced groups

### Organizer Guidelines

1. **Communication**: Inform participants about format upfront
2. **Scheduling**: Allow time between phases for rest
3. **Verification**: Review standings before transitioning
4. **Flexibility**: Be ready to adjust if issues arise
5. **Documentation**: Keep records of all phases

---

## Summary

The hybrid tournament format provides:

✅ **Modular Architecture**: Clean separation of concerns
✅ **Scalable Design**: Works from 8 to 100+ participants
✅ **Flexible Configuration**: Multiple qualification methods
✅ **Robust Validation**: Comprehensive error checking
✅ **Data Persistence**: Full historical data retained
✅ **Phase Management**: Clear lifecycle and transitions
✅ **API-First**: RESTful endpoints for all operations

This implementation is production-ready and fully integrates with your existing round-robin and knockout systems.
