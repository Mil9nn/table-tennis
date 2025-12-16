# Multi-Scorer Feature Plan

## Overview

Allow tournament admins (creators) to add multiple scorers who can score any match within the tournament.

---

## Design Decisions ✅

| Decision | Choice |
|----------|--------|
| Invitation flow | **Auto-accept** - User is immediately active when added |
| Scoring scope | **Any scorer can score any match** - No per-match assignment |
| Scorer limit | **10 scorers max** per tournament (reasonable for most events) |
| Removal behavior | **Matches remain scored** - Removing a scorer doesn't affect their scored matches |

---

## Terminology

| Role | Description |
|------|-------------|
| **Admin** | Tournament creator. Full control over tournament settings, scorers, and matches. Can also score. |
| **Scorer** | User added by admin. Can score any match in the tournament. |

---

## Current State

- Tournament has `organizer` field (the creator)
- Each match has single `scorer` field  
- When draw is generated, `organizer` becomes `scorer` for all matches
- Only that specific scorer can update match scores

---

## Proposed Changes

### 1. Database Schema Changes

#### Tournament Model (`models/Tournament.ts`)

```typescript
// Add to Tournament schema
scorers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}],
```

Simple array of User ObjectIds. Admin (organizer) is implicitly a scorer and doesn't need to be in this array.

#### Match Models - No Changes Needed

The `scorer` field on matches will track WHO scored a specific match (for history/audit).
Permission to score is determined by tournament's scorer list, not match's scorer field.

---

### 2. Permission Logic Changes

#### Current Logic
```typescript
if (match.scorer?.toString() !== auth.userId) {
  return { error: "Forbidden" };
}
```

#### New Logic
```typescript
// lib/tournament-permissions.ts

export async function canScoreTournamentMatch(
  userId: string, 
  tournamentId: string
): Promise<boolean> {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) return false;
  
  // Admin (organizer) can always score
  if (tournament.organizer.toString() === userId) return true;
  
  // Check if user is in scorers array
  return tournament.scorers?.some(
    scorerId => scorerId.toString() === userId
  ) ?? false;
}
```

**Files to update:**
- `app/api/matches/individual/[id]/score/route.ts`
- `app/api/matches/individual/[id]/status/route.ts`
- `app/api/matches/individual/[id]/reset/route.ts`
- `app/api/matches/team/[id]/submatch/[subMatchId]/score/route.ts`
- `app/api/matches/team/[id]/submatch/[subMatchId]/status/route.ts`
- `app/api/matches/team/[id]/submatch/[subMatchId]/reset/route.ts`
- `app/api/matches/team/[id]/submatch/[subMatchId]/server-config/route.ts`

---

### 3. API Endpoints

#### Add Scorer
```
POST /api/tournaments/[id]/scorers
Body: { userId: string }
Response: { message: "Scorer added", tournament: {...} }
Access: Admin only
Validation: Max 10 scorers, user exists, not already a scorer
```

#### Remove Scorer
```
DELETE /api/tournaments/[id]/scorers/[userId]
Response: { message: "Scorer removed", tournament: {...} }
Access: Admin only
```

#### List Scorers (included in tournament GET)
```
GET /api/tournaments/[id]
Response includes: { ..., organizer: {...}, scorers: [...] }
```

---

### 4. UI Components

#### A. Manage Scorers Dialog (`ManageScorersDialog.tsx`)

**Location:** Tournament detail page dropdown, accessible by admin only

**Features:**
- Search and add users as scorers
- List current scorers
- Remove scorers (with confirmation)
- Show admin badge for organizer
- Show count: "3/10 scorers"

**UI Mockup:**
```
┌─────────────────────────────────────────┐
│ Manage Scorers                      [X] │
├─────────────────────────────────────────┤
│                                         │
│ Admin                                   │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 John Doe (You)         [Admin]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Scorers (2/10)                          │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Jane Smith              [Remove] │ │
│ ├─────────────────────────────────────┤ │
│ │ 👤 Bob Wilson              [Remove] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Add Scorer                              │
│ [🔍 Search users...              ] [Add]│
│                                         │
└─────────────────────────────────────────┘
```

#### B. Tournament Page Updates

- Add "Manage Scorers" option in admin dropdown menu
- Show small scorers indicator on tournament header (e.g., "👥 3 scorers")

#### C. Match Scoring Updates

- When a scorer scores a match, update match.scorer to their userId
- This tracks who actually scored each match

---

### 5. Match Generation Update

Keep current behavior - admin is set as default scorer on all matches.
When any authorized scorer scores, the match.scorer field gets updated to them.

```typescript
// In score route, after successful score update:
match.scorer = auth.userId; // Track who scored this match
await match.save();
```

---

## Implementation Phases

### Phase 1: Schema & Permissions (Backend)
- [ ] Add `scorers` array to Tournament schema
- [ ] Add `scorers` to Tournament TypeScript types
- [ ] Create `canScoreTournamentMatch()` helper function
- [ ] Update all match scoring endpoints to use new permission logic
- [ ] Update match.scorer when someone scores

### Phase 2: API Endpoints
- [ ] Create `POST /api/tournaments/[id]/scorers` endpoint
- [ ] Create `DELETE /api/tournaments/[id]/scorers/[userId]` endpoint
- [ ] Update tournament population to include scorers

### Phase 3: UI Components
- [ ] Create `ManageScorersDialog` component
- [ ] Add user search/autocomplete for adding scorers
- [ ] Add "Manage Scorers" to tournament dropdown menu
- [ ] Show scorers count on tournament page

### Phase 4: Testing & Polish
- [ ] Test scoring permissions with multiple users
- [ ] Test edge cases (remove scorer, max limit, etc.)
- [ ] Add loading states and error handling

---

## File Changes Summary

| File | Change Type |
|------|-------------|
| `models/Tournament.ts` | Add `scorers` array field |
| `types/tournament.type.ts` | Add scorers to Tournament interface |
| `lib/tournament-permissions.ts` | **New** - permission helper |
| `app/api/tournaments/[id]/scorers/route.ts` | **New** - add scorer endpoint |
| `app/api/tournaments/[id]/scorers/[userId]/route.ts` | **New** - remove scorer endpoint |
| `app/api/matches/individual/[id]/score/route.ts` | Update permission check |
| `app/api/matches/individual/[id]/status/route.ts` | Update permission check |
| `app/api/matches/team/[id]/submatch/*/route.ts` | Update permission checks |
| `components/tournaments/ManageScorersDialog.tsx` | **New** - UI component |
| `app/tournaments/[id]/page.tsx` | Add manage scorers menu item |

---

## Next Steps

Ready to implement! Start with Phase 1?
