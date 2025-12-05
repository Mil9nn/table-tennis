# Hybrid Tournament Format - Usage Examples

This document provides practical examples of implementing hybrid tournaments.

---

## Example 1: World Cup Style (32 Teams → 16)

### Configuration

```typescript
const tournament = {
  name: "Table Tennis World Cup 2024",
  format: "hybrid",
  category: "individual",
  matchType: "singles",
  participants: [...32participants],

  hybridConfig: {
    // Round-robin: 8 groups of 4
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 8,

    // Top 2 from each group advance (16 total)
    qualificationMethod: "top_n_per_group",
    qualifyingPerGroup: 2,

    // Knockout settings
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  },

  rules: {
    pointsForWin: 1,
    setsPerMatch: 5, // Best of 5 for all matches
    pointsPerSet: 11,
  },
};
```

### Match Progression

```
PHASE 1: Round-Robin (48 matches)
├── Group A (4 teams, 6 matches)
├── Group B (4 teams, 6 matches)
├── Group C (4 teams, 6 matches)
├── Group D (4 teams, 6 matches)
├── Group E (4 teams, 6 matches)
├── Group F (4 teams, 6 matches)
├── Group G (4 teams, 6 matches)
└── Group H (4 teams, 6 matches)

QUALIFICATION: Top 2 from each group → 16 qualifiers

PHASE 2: Knockout (15 matches)
├── Round of 16 (8 matches)
├── Quarterfinals (4 matches)
├── Semifinals (2 matches)
└── Finals (1 final + 1 third-place)

TOTAL: 63 matches
```

---

## Example 2: Club Championship (16 Players → 8)

### Configuration

```typescript
const tournament = {
  name: "City Club Championship",
  format: "hybrid",
  category: "individual",
  matchType: "singles",
  participants: [...16participants],

  hybridConfig: {
    // Round-robin: 4 groups of 4
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 4,

    // Top 2 from each group advance (8 total)
    qualificationMethod: "top_n_per_group",
    qualifyingPerGroup: 2,

    // Knockout settings
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  },

  rules: {
    pointsForWin: 1,
    setsPerMatch: 3, // Best of 3 for groups
    pointsPerSet: 11,
  },
};
```

### Implementation Code

```typescript
// Step 1: Create tournament
const newTournament = await Tournament.create(tournament);

// Step 2: Generate round-robin matches
const response = await fetch(
  `/api/tournaments/${newTournament._id}/generate-matches`,
  { method: "POST" }
);

// Step 3: Monitor progress
const statusResponse = await fetch(
  `/api/tournaments/${newTournament._id}/hybrid-status`
);
const status = await statusResponse.json();

console.log(status.roundRobinProgress);
// {
//   useGroups: true,
//   groups: [
//     { groupId: "A", roundsCompleted: 3, roundsTotal: 3, isComplete: true },
//     { groupId: "B", roundsCompleted: 3, roundsTotal: 3, isComplete: true },
//     { groupId: "C", roundsCompleted: 2, roundsTotal: 3, isComplete: false },
//     { groupId: "D", roundsCompleted: 1, roundsTotal: 3, isComplete: false }
//   ],
//   allGroupsComplete: false
// }

// Step 4: When all complete, transition
const transitionResponse = await fetch(
  `/api/tournaments/${newTournament._id}/transition-to-knockout`,
  { method: "POST" }
);

const result = await transitionResponse.json();
console.log(result);
// {
//   message: "Knockout phase created with 8 qualified participants and 7 matches",
//   result: {
//     phase: "knockout",
//     matchesCreated: 7,
//     qualifiedCount: 8
//   }
// }
```

---

## Example 3: Small Tournament (8 Players → 4)

### Configuration

```typescript
const tournament = {
  name: "Weekend Tournament",
  format: "hybrid",
  category: "individual",
  matchType: "singles",
  participants: [...8participants],

  hybridConfig: {
    // Round-robin: Single group (all play all)
    roundRobinUseGroups: false,

    // Top 4 advance
    qualificationMethod: "top_n_overall",
    qualifyingCount: 4,

    // Knockout settings
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: false,
  },

  rules: {
    pointsForWin: 1,
    setsPerMatch: 3,
    pointsPerSet: 11,
  },
};
```

### Match Progression

```
PHASE 1: Round-Robin (28 matches)
└── All players play each other once

QUALIFICATION: Top 4 from overall standings

PHASE 2: Knockout (3 matches)
├── Semifinals (2 matches)
└── Final (1 match)

TOTAL: 31 matches
```

---

## Example 4: Large Tournament with Percentage (24 Players → 8)

### Configuration

```typescript
const tournament = {
  name: "Regional Championship",
  format: "hybrid",
  category: "individual",
  matchType: "singles",
  participants: [...24participants],

  hybridConfig: {
    // Round-robin: 6 groups of 4
    roundRobinUseGroups: true,
    roundRobinNumberOfGroups: 6,

    // Top 33% advance (8 from 24)
    qualificationMethod: "percentage",
    qualifyingPercentage: 33,

    // Knockout settings
    knockoutAllowCustomMatching: false,
    knockoutThirdPlaceMatch: true,
  },

  rules: {
    pointsForWin: 1,
    setsPerMatch: 3,
    pointsPerSet: 11,
  },
};
```

### Qualification Calculation

```javascript
// 24 participants * 33% = 7.92 → rounds up to 8
// Next power of 2 = 8 (perfect fit, no byes needed)
```

---

## Example 5: React Component Integration

### Tournament Creation Form

```typescript
"use client";

import { useState } from "react";

export default function CreateHybridTournament() {
  const [config, setConfig] = useState({
    name: "",
    format: "hybrid",
    hybridConfig: {
      roundRobinUseGroups: true,
      roundRobinNumberOfGroups: 4,
      qualificationMethod: "top_n_per_group",
      qualifyingPerGroup: 2,
      knockoutAllowCustomMatching: false,
      knockoutThirdPlaceMatch: true,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      const tournament = await response.json();
      // Redirect to tournament page
      window.location.href = `/tournaments/${tournament._id}`;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Hybrid Tournament</h2>

      {/* Name */}
      <input
        type="text"
        value={config.name}
        onChange={(e) => setConfig({ ...config, name: e.target.value })}
        placeholder="Tournament Name"
      />

      {/* Round-Robin Settings */}
      <fieldset>
        <legend>Round-Robin Phase</legend>

        <label>
          <input
            type="checkbox"
            checked={config.hybridConfig.roundRobinUseGroups}
            onChange={(e) =>
              setConfig({
                ...config,
                hybridConfig: {
                  ...config.hybridConfig,
                  roundRobinUseGroups: e.target.checked,
                },
              })
            }
          />
          Use Groups
        </label>

        {config.hybridConfig.roundRobinUseGroups && (
          <input
            type="number"
            value={config.hybridConfig.roundRobinNumberOfGroups}
            onChange={(e) =>
              setConfig({
                ...config,
                hybridConfig: {
                  ...config.hybridConfig,
                  roundRobinNumberOfGroups: parseInt(e.target.value),
                },
              })
            }
            min={2}
            max={8}
          />
        )}
      </fieldset>

      {/* Qualification Settings */}
      <fieldset>
        <legend>Qualification</legend>

        <select
          value={config.hybridConfig.qualificationMethod}
          onChange={(e) =>
            setConfig({
              ...config,
              hybridConfig: {
                ...config.hybridConfig,
                qualificationMethod: e.target.value as any,
              },
            })
          }
        >
          <option value="top_n_overall">Top N Overall</option>
          <option value="top_n_per_group">Top N Per Group</option>
          <option value="percentage">Percentage</option>
        </select>

        {config.hybridConfig.qualificationMethod === "top_n_per_group" && (
          <input
            type="number"
            value={config.hybridConfig.qualifyingPerGroup}
            onChange={(e) =>
              setConfig({
                ...config,
                hybridConfig: {
                  ...config.hybridConfig,
                  qualifyingPerGroup: parseInt(e.target.value),
                },
              })
            }
            min={1}
          />
        )}
      </fieldset>

      {/* Knockout Settings */}
      <fieldset>
        <legend>Knockout Phase</legend>

        <label>
          <input
            type="checkbox"
            checked={config.hybridConfig.knockoutThirdPlaceMatch}
            onChange={(e) =>
              setConfig({
                ...config,
                hybridConfig: {
                  ...config.hybridConfig,
                  knockoutThirdPlaceMatch: e.target.checked,
                },
              })
            }
          />
          Third Place Match
        </label>
      </fieldset>

      <button type="submit">Create Tournament</button>
    </form>
  );
}
```

### Hybrid Status Display Component

```typescript
"use client";

import { useEffect, useState } from "react";

export default function HybridStatus({ tournamentId }: { tournamentId: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/hybrid-status`);
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    };

    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  if (loading) return <div>Loading...</div>;
  if (!status?.isHybrid) return <div>Not a hybrid tournament</div>;

  const handleTransition = async () => {
    if (!confirm("Ready to transition to knockout phase?")) return;

    const response = await fetch(
      `/api/tournaments/${tournamentId}/transition-to-knockout`,
      { method: "POST" }
    );

    if (response.ok) {
      alert("Successfully transitioned to knockout phase!");
      window.location.reload();
    }
  };

  return (
    <div className="hybrid-status">
      <h3>Tournament Status</h3>

      {/* Current Phase */}
      <div className="phase-indicator">
        <span className={status.currentPhase === "round_robin" ? "active" : ""}>
          Round-Robin
        </span>
        <span className={status.currentPhase === "knockout" ? "active" : ""}>
          Knockout
        </span>
      </div>

      {/* Round-Robin Progress */}
      {status.currentPhase === "round_robin" && (
        <div className="progress">
          <h4>Round-Robin Progress</h4>

          {status.roundRobinProgress.useGroups ? (
            <div className="groups">
              {status.roundRobinProgress.groups.map((group: any) => (
                <div key={group.groupId} className="group">
                  <span>{group.groupName}</span>
                  <progress
                    value={group.roundsCompleted}
                    max={group.roundsTotal}
                  />
                  <span>
                    {group.roundsCompleted}/{group.roundsTotal} rounds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <progress
              value={status.roundRobinProgress.roundsCompleted}
              max={status.roundRobinProgress.roundsTotal}
            />
          )}

          {/* Transition Button */}
          {status.canTransition && (
            <button onClick={handleTransition} className="transition-btn">
              Transition to Knockout Phase
            </button>
          )}
        </div>
      )}

      {/* Qualification Summary */}
      {status.qualificationSummary && (
        <div className="qualification">
          <h4>Qualification</h4>
          <p>
            {status.qualificationSummary.qualifiedCount} of{" "}
            {status.qualificationSummary.totalParticipants} qualified
          </p>
          <p>Method: {status.qualificationSummary.method}</p>
        </div>
      )}

      {/* Knockout Progress */}
      {status.currentPhase === "knockout" && status.knockoutProgress && (
        <div className="knockout-progress">
          <h4>Knockout Progress</h4>
          <p>
            Round {status.knockoutProgress.currentRound} of{" "}
            {status.knockoutProgress.totalRounds}
          </p>
          <progress
            value={status.knockoutProgress.roundsCompleted}
            max={status.knockoutProgress.totalRounds}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Example 6: Backend Service Usage

### Direct Service Calls

```typescript
import {
  generateHybridRoundRobinPhase,
  transitionToKnockoutPhase,
  getHybridTournamentStatus,
} from "@/services/tournament";
import Tournament from "@/models/Tournament";

async function manageTournament(tournamentId: string, userId: string) {
  // Get tournament
  const tournament = await Tournament.findById(tournamentId);

  // Check status
  const status = getHybridTournamentStatus(tournament);
  console.log(`Current phase: ${status.currentPhase}`);
  console.log(`Can transition: ${status.canTransition}`);

  if (status.currentPhase === "round_robin" && status.canTransition) {
    // Transition to knockout
    const result = await transitionToKnockoutPhase(tournament, {
      scorerId: userId,
    });

    console.log(result.message);
    console.log(`Created ${result.matchesCreated} knockout matches`);

    // Save tournament
    await tournament.save();
  }
}
```

---

## Example 7: Custom UI for Organizers

### Organizer Dashboard Component

```typescript
export default function OrganizerDashboard({ tournamentId }: { tournamentId: string }) {
  const [status, setStatus] = useState<any>(null);

  const actions = {
    generateMatches: async () => {
      await fetch(`/api/tournaments/${tournamentId}/generate-matches`, {
        method: "POST",
      });
    },

    transitionToKnockout: async () => {
      await fetch(`/api/tournaments/${tournamentId}/transition-to-knockout`, {
        method: "POST",
      });
    },

    viewStandings: () => {
      window.location.href = `/tournaments/${tournamentId}/leaderboard`;
    },

    viewBracket: () => {
      window.location.href = `/tournaments/${tournamentId}/bracket`;
    },
  };

  return (
    <div className="organizer-dashboard">
      <h2>Organizer Controls</h2>

      {!status?.drawGenerated && (
        <button onClick={actions.generateMatches}>Generate Matches</button>
      )}

      {status?.currentPhase === "round_robin" && (
        <>
          <button onClick={actions.viewStandings}>View Standings</button>

          {status.canTransition && (
            <button onClick={actions.transitionToKnockout}>
              Start Knockout Phase
            </button>
          )}
        </>
      )}

      {status?.currentPhase === "knockout" && (
        <button onClick={actions.viewBracket}>View Bracket</button>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Validate Configuration

```typescript
import { validateHybridConfig } from "@/services/tournament";

const validation = validateHybridConfig(tournament);

if (!validation.isValid) {
  console.error("Invalid configuration:", validation.errors);
  return;
}
```

### 2. Monitor Phase Completion

```typescript
// Poll for completion
const checkCompletion = setInterval(async () => {
  const status = await getHybridTournamentStatus(tournament);

  if (status.roundRobinComplete && status.currentPhase === "round_robin") {
    clearInterval(checkCompletion);
    notifyOrganizer("Round-robin complete! Ready to transition.");
  }
}, 60000); // Check every minute
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await transitionToKnockoutPhase(tournament, options);

  if (!result.success) {
    // Show user-friendly error
    alert(`Cannot transition: ${result.errors?.join(", ")}`);
    return;
  }

  // Success
  if (result.warnings?.length) {
    console.warn("Warnings:", result.warnings);
  }
} catch (error) {
  console.error("Unexpected error:", error);
  alert("Something went wrong. Please try again.");
}
```

---

## Summary

These examples demonstrate:

✅ **Various Tournament Sizes**: 8 to 32+ participants
✅ **Different Qualification Methods**: Overall, per-group, percentage
✅ **API Integration**: Proper endpoint usage
✅ **React Components**: Real-world UI examples
✅ **Service Usage**: Direct service calls
✅ **Error Handling**: Validation and error management
✅ **Best Practices**: Production-ready patterns

Use these examples as templates for your hybrid tournament implementations!
