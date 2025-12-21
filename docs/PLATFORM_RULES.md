# Table Tennis Platform - Official Rules & Regulations

## Overview

This document outlines all the important rules and regulations governing the Table Tennis Scoring & Tournament Management Platform. These rules ensure fair play, ITTF compliance, and consistent tournament management.

**Last Updated:** December 2024
**Version:** 1.0

---

## Table of Contents

1. [Match & Scoring Rules](#match--scoring-rules)
2. [Standings & Tiebreaker Rules](#standings--tiebreaker-rules)
3. [Tournament Participation Rules](#tournament-participation-rules)
4. [Tournament Organization Rules](#tournament-organization-rules)
5. [Tournament Format Rules](#tournament-format-rules)
6. [Subscription & Access Rules](#subscription--access-rules)
7. [Draw Generation Rules](#draw-generation-rules)
8. [Multi-Scorer Rules](#multi-scorer-rules)

---

## Match & Scoring Rules

### Basic Match Rules

#### Sets Per Match
- **Best of 3**: First to 2 sets wins (default for group stages)
- **Best of 5**: First to 3 sets wins (recommended for knockout stages)
- **Best of 7**: First to 4 sets wins (used for finals)

#### Points Per Set
- **Standard**: First to 11 points
- All sets follow the same point requirement

#### Deuce Setting
- **Standard (Win by 2)**: When both players reach 10-10 (deuce), play continues until one player leads by 2 points
  - At 10-10: Players alternate serves every point
  - Winner must achieve a 2-point lead (11-9 is invalid from deuce, but 12-10, 13-11, etc. are valid)
- **No Deuce**: First to 11 points wins regardless of margin (not ITTF-compliant)

#### Serve Rules (Singles)
- **Normal Play**: Each player serves 2 consecutive points, then alternates
- **During Deuce** (10-10 or higher): Players alternate serves every single point
- Server alternates at the start of each new set

#### Serve Rules (Doubles)
- **Service Rotation**: Each player on a team serves 2 consecutive points
- Rotation order is maintained throughout the match
- **During Deuce**: Serves alternate every point, maintaining the established rotation
- Teams can choose their service order at the start of the match

### Match Status

Matches progress through the following statuses:
- **Scheduled**: Match created but not yet started
- **In Progress**: Match currently being played
- **Completed**: Match finished with a winner
- **Cancelled**: Match cancelled by organizer

### Winner Determination

#### Individual Matches (Singles/Doubles)
- Winner is the first participant to win the required number of sets
- **Best of 3**: First to 2 sets
- **Best of 5**: First to 3 sets
- **Best of 7**: First to 4 sets

#### Team Matches
- Winner is determined by the team that wins the majority of sub-matches
- **Five Singles Format**: First team to win 3 sub-matches
- **Single-Double-Single Format**: Best of 3 or 5 sub-matches

---

## Standings & Tiebreaker Rules

### Match Points System

ITTF-compliant match points allocation:

- **Win**: 2 match points (default)
- **Loss**: 0 match points
- **Draw**: 1 match point each (rare in table tennis)

> Note: Some tournament organizers may customize the points for a win (e.g., 1 point for win, 0 for loss)

### ITTF-Compliant Tiebreaker Order

When two or more participants have equal match points, the following tiebreakers are applied **in order**:

1. **Match Points** - Total match points earned (2 for win, 0 for loss)

2. **Head-to-Head Result**
   - **Two-way tie**: Direct comparison of the match between the two tied participants
   - **Three+ way tie**: Mini-league among all tied participants (only matches between tied participants count)
   - The participant with more points in head-to-head gets higher ranking

3. **Sets Ratio** - Sets won divided by sets lost (higher is better)
   - Calculated as: `setsWon / setsLost`
   - If a participant has won sets but lost none, ratio is Infinity (best possible)
   - If a participant has lost sets but won none, ratio is 0 (worst possible)

4. **Points Ratio** - Points scored divided by points conceded (higher is better)
   - Calculated as: `pointsScored / pointsConceded`
   - Individual game points count (e.g., 11-9 means 11 scored, 9 conceded)

5. **Total Sets Won** - Absolute number of sets won (higher is better)

6. **Total Points Scored** - Final tiebreaker, absolute number of points scored across all games

### Standings Calculation

Standings are recalculated after each completed match and include:

- **Played**: Matches played
- **Won**: Matches won
- **Lost**: Matches lost
- **Drawn**: Matches drawn (rare)
- **Sets Won**: Total sets won
- **Sets Lost**: Total sets lost
- **Sets Diff**: Sets won minus sets lost (Set Difference)
- **Points Scored**: Total game points scored across all sets
- **Points Conceded**: Total game points conceded across all sets
- **Points Diff**: Points scored minus points conceded
- **Match Points**: Total match points earned (2 per win, 1 per draw, 0 per loss)
- **Rank**: Position in standings (1st, 2nd, 3rd, etc.)
- **Form**: Last 5 match results (W/L/D)

### Doubles Standings

In doubles tournaments:
- Both partners share the **same team statistics**
- Team identifier is the first player listed in the pairing
- Partner stats are automatically synced after each match

---

## Tournament Participation Rules

### Joining a Tournament

#### Prerequisites
- User must have a registered account
- Tournament must accept participants
- Tournament draw must NOT be generated yet

#### Capacity Rules
- Cannot join if tournament is at maximum capacity (`maxParticipants`)
- Free tier: Max 16 participants
- Pro tier: Max 50 participants

#### Registration Deadline
- Cannot join after registration deadline has passed
- Organizer sets the deadline when creating tournament

#### Join Code Rules
- Tournament must have `allowJoinByCode` enabled
- Participant must provide the correct 6-character join code
- Join codes are unique per tournament

#### Duplicate Prevention
- A user cannot join the same tournament twice
- System checks for existing participation before allowing join

#### Doubles Requirements
- Doubles/Mixed doubles tournaments require an **even number** of participants
- System validates this before allowing draw generation

### Leaving a Tournament

Participants can leave a tournament ONLY if:
- Tournament draw has NOT been generated yet
- Once draw is generated, participants cannot leave (would invalidate the schedule)

---

## Tournament Organization Rules

### Creation Limits (Subscription-Based)

#### Free Tier
- Can create up to **2 tournaments per year**
- Maximum **16 participants** per tournament
- **Round-robin format only**
- **No multi-scorer feature** (organizer must score all matches)

#### Pro Tier (All payment options: Lifetime, Annual, 3-Month)
- Can create up to **10 tournaments per year**
- Maximum **50 participants** per tournament
- **All formats** available (Round-robin, Knockout, Hybrid)
- **Multi-scorer feature** (up to 3 additional scorers)

### Active Tournament Count

"Active" tournaments are those with status:
- `draft`
- `upcoming`
- `in_progress`

Tournaments with status `completed` or `cancelled` do NOT count toward limits.

### Tournament Status Workflow

```
draft → upcoming → in_progress → completed
  ↓
cancelled (can be cancelled from any status)
```

- **Draft**: Initial creation, can be edited freely
- **Upcoming**: Draw generated, waiting for start date
- **In Progress**: Matches are being played
- **Completed**: All matches finished
- **Cancelled**: Tournament cancelled by organizer

### Minimum Participants

- **Minimum 2 participants** required to generate draw (configurable per tournament)
- Organizer can set custom `minParticipants` (e.g., 4, 8, 16)

### Maximum Participants

- Organizer sets `maxParticipants` when creating tournament
- System enforces this limit during registration
- Free tier: Hard cap at 16
- Pro tier: Hard cap at 50

---

## Tournament Format Rules

### Round-Robin Format

#### Basic Rules
- **Every participant plays every other participant once**
- Matches are organized into rounds for scheduling
- Can be played with or without groups

#### Without Groups
- All participants in single pool
- Total matches: `n × (n-1) / 2` where n = number of participants
- Example: 8 participants = 28 matches

#### With Groups
- **NOT allowed for pure round-robin format**
- Groups only make sense when there's a next phase (use Hybrid format instead)
- Reason: Groups in round-robin are useless without advancement to knockout

#### Standings
- Calculated using ITTF tiebreaker rules (see Standings section)
- Updated after each completed match
- Used to determine final tournament rankings

#### Scheduling
- Uses **Berger Tables** algorithm for fair scheduling
- Ensures balanced distribution of matches across rounds
- Participants alternate home/away positions

### Knockout Format

#### Basic Rules
- **Single elimination**: Lose once and you're out
- Winner advances to next round
- Tournament progresses until one winner remains

#### Bracket Structure
- Must be power of 2 (4, 8, 16, 32, etc.) or use byes
- **Byes**: Participants who automatically advance Round 1 due to uneven numbers
- Byes are distributed to highest-seeded participants

#### Configuration Options
- **Third Place Match**: Optional match between semi-final losers to determine 3rd place
- **Custom Matching**: Allows organizer to manually set Round 1 pairings (Pro tier only)
- **Auto-Generate Bracket**: System creates bracket based on seeding

#### Bracket Progression
- Winners automatically advance to next round
- Matches in later rounds cannot be played until previous round completes
- System validates match progression

#### Seeding Methods
- **Random**: Participants randomly placed in bracket
- **Ranking-Based**: Based on ITTF rankings or custom rankings
- **Points-Based**: Based on rating points
- **Manual**: Organizer manually sets seeding order
- **Registration Order**: First-come-first-served seeding

### Hybrid Format (Round-Robin → Knockout)

#### Overview
Combines fairness of round-robin with excitement of knockout:
1. **Round-Robin Phase**: All participants play in groups or single pool
2. **Qualification**: Top performers advance to knockout
3. **Knockout Phase**: Elimination bracket determines final winner

#### Phase States
- `round_robin`: Currently in round-robin phase
- `transition`: Qualification in progress
- `knockout`: Currently in knockout phase

#### Round-Robin Phase Configuration
- **Use Groups**: Optional, can play with or without groups
- **Number of Groups**: If using groups, how many groups to create
- Group allocation uses **snake seeding** for balance

#### Qualification Methods

Three methods to determine who advances:

1. **Top N Overall**
   - Best N performers across all groups/participants advance
   - Example: Top 8 from 32 participants

2. **Top N Per Group**
   - Top N from each group advance
   - Ensures representation from all groups
   - Example: Top 2 from each of 4 groups = 8 qualifiers

3. **Percentage**
   - Top X% of participants advance
   - Example: Top 50% of 16 participants = 8 qualifiers

#### Qualification Rules
- Minimum 2 qualifiers required (can't have knockout with 1 person)
- Qualifiers must be less than total participants
- If qualifiers is not power of 2, byes are used in knockout round

#### Transition Requirements

To transition from round-robin to knockout:
- All round-robin rounds must be completed
- Standings must be calculated
- Valid qualification configuration
- Organizer initiates transition (POST to `/api/tournaments/:id/transition-to-knockout`)

#### Knockout Phase
- Follows standard knockout rules
- Seeding based on round-robin rankings
- Optional third-place match

---

## Subscription & Access Rules

### Feature Access by Tier

| Feature | Free | Pro |
|---------|------|-----|
| **Match Participation** | Unlimited | Unlimited |
| **Tournaments/Year** | 2 | 10 |
| **Max Participants** | 16 | 50 |
| **Tournament Formats** | Round-robin only | All formats |
| **Multi-Scorer** | Self only (0) | Up to 3 scorers |
| **Match History** | Last 20 matches | Unlimited |
| **Advanced Analytics** | No | Yes |
| **Data Exports** | No | Yes (CSV/PDF) |

### Pro Tier Payment Options

All options include identical features:

- **Lifetime**: $50 (one-time payment, access forever)
- **Annual**: $4.50/year (best value, auto-renews)
- **3-Month**: $2.50/3 months (seasonal, auto-renews)

### Subscription Rules

- Subscriptions auto-renew unless cancelled
- Access continues until end of billing period after cancellation
- Lifetime purchases never expire
- 30-day money-back guarantee for all payment options
- Can upgrade from subscription to Lifetime anytime
- No data loss on downgrade (Pro features become read-only or hidden)

### Tournament Creation with Subscription

When creating a tournament:
- Tournament is tagged with creator's current tier (`createdWithTier`)
- Tournament inherits tier limits:
  - `maxScorersAllowed`: 0 (Free) or 3 (Pro)
  - `maxParticipants`: 16 (Free) or 50 (Pro)
  - Format restrictions: Round-robin only (Free) or All (Pro)

**Important**: If organizer downgrades subscription:
- Existing tournaments created with higher tier **keep their original limits**
- New tournaments follow current tier limits
- This prevents disruption to ongoing tournaments

### Mid-Tournament Upgrades

- Can upgrade subscription during active tournament
- New limits apply immediately
- Example: Upgrade from Free to Pro to add more scorers or participants

---

## Draw Generation Rules

### Prerequisites

Before generating a draw, the following must be validated:

1. **Minimum Participants Met**
   - Tournament must have at least `minParticipants` (default: 2)
   - Organizer can set higher minimums

2. **Doubles Requirements** (if applicable)
   - Doubles/Mixed doubles must have even number of participants
   - System prevents draw generation with odd count

3. **Group Configuration** (if using groups)
   - Must have at least 2 participants per group
   - Example: 4 groups requires minimum 8 participants
   - Groups cannot be used with pure round-robin format

4. **Not Already Generated**
   - Can only generate draw once per tournament
   - Generating draw locks participant list

### Draw Generation Effects

Once draw is generated (`drawGenerated = true`):

- **Participants cannot be added or removed**
- **Tournament configuration cannot be changed**
- **Match schedule is created**
- **Rounds are initialized**
- **Standings are initialized**

### Post-Draw Restrictions

After draw generation, the following operations are **blocked**:
- Adding new participants
- Removing existing participants
- Changing number of groups
- Changing tournament format
- Changing match type (singles/doubles)

### Resetting a Tournament

To allow changes after draw generation:
- Organizer must delete all generated matches
- Set `drawGenerated = false` manually (not exposed in UI by default)
- This is a destructive operation and should be used cautiously

---

## Multi-Scorer Rules

### Overview

Multi-scorer feature allows tournament organizers to designate other users to score matches in their tournament.

### Access Rules

- **Free Tier**: 0 additional scorers (organizer only)
- **Pro Tier**: Up to 3 additional scorers
- **Organizer**: Always has scoring permissions (doesn't count toward limit)

### Scorer Permissions

Scorers can:
- View all matches in the tournament
- Score any match in the tournament
- Update game scores in real-time
- Mark matches as complete

Scorers **cannot**:
- Edit tournament settings
- Add/remove participants
- Generate or modify the draw
- Add/remove other scorers
- Delete the tournament

### Adding Scorers

- Organizer can add scorers via tournament settings
- Maximum 3 scorers for Pro tier (enforced by `maxScorersAllowed`)
- Scorers must be registered users
- Scorers are stored as `ObjectId` references in `tournament.scorers` array

### Removing Scorers

- Organizer can remove scorers anytime
- Removing a scorer doesn't affect completed match results

### Scorer Limits and Upgrades

- Limits are set when tournament is created (`maxScorersAllowed`)
- If organizer downgrades mid-tournament:
  - Existing scorers remain functional
  - Cannot add new scorers beyond downgraded limit
- If organizer upgrades:
  - Can immediately add more scorers up to new limit

---

## Team Tournament Rules

### Team Match Formats

#### Five Singles Format
- 5 players per team
- 5 sub-matches (all singles)
- First team to win 3 sub-matches wins
- Best of 3 or 5 sets per sub-match

#### Single-Double-Single Format
- Minimum 3 players per team
- 3 or 5 sub-matches
- Pattern: Singles → Doubles → Singles (or extended)
- Best of 3 or 5 sets per sub-match

#### Custom Format
- Organizer defines number and type of sub-matches
- Can mix singles and doubles in any order
- Total sub-matches must be odd number (for clear winner)

### Team Winner Determination

- Team that wins majority of sub-matches wins the team match
- Each sub-match is worth 1 point toward team victory
- Individual set scores within sub-matches don't affect team result (only sub-match wins count)

---

## Fair Play & Integrity Rules

### Match Results

- Match results cannot be edited after marked as completed (to prevent tampering)
- Only organizer or assigned scorers can score matches
- All game scores must be valid according to scoring rules

### Walkover/Forfeit

- If a participant doesn't show up, match can be marked as cancelled
- No automatic forfeit mechanism (organizer decides)

### Disputes

- Platform doesn't handle disputes automatically
- Organizers are responsible for dispute resolution
- Match results can be manually adjusted by organizer if needed

### Data Integrity

- Historical data is preserved during phase transitions (Hybrid format)
- Deleting a tournament does NOT delete individual match records (if referenced elsewhere)
- Participants own their match history even after tournaments end

---

## Validation Error Messages

The platform provides clear, actionable error messages for rule violations:

### Common Validation Errors

- `"Tournament is full"` - Maximum participants reached
- `"Registration deadline has passed"` - Cannot join after deadline
- `"Tournament requires at least X participants"` - Not enough participants to start
- `"Doubles tournaments require an even number of participants"` - Odd count in doubles
- `"Cannot modify participants - tournament draw has already been generated"` - Draw locked
- `"Groups cannot be used with round-robin format"` - Invalid format configuration
- `"Only the tournament organizer can perform this action"` - Permission denied
- `"User is already a participant in this tournament"` - Duplicate registration
- `"Invalid join code"` - Wrong join code provided

---

## Additional Rules

### Profile & Statistics

- All users can participate in unlimited matches
- Free tier: View last 20 matches
- Pro tier: Unlimited match history
- Statistics are calculated automatically after each match
- Advanced analytics (weaknesses, shot tracking) require Pro tier

### Privacy

- Tournament organizers can set tournaments as public or private
- Public tournaments appear in browse/search
- Private tournaments require join code or direct invitation

### Data Exports

- Pro tier users can export:
  - Match data (CSV)
  - Statistics reports (PDF)
  - Tournament brackets and results (PDF/CSV)
- Free tier: No export functionality

---

## Updates & Changes

### Rule Changes

- Platform rules may be updated to align with ITTF regulations
- Users are notified of major rule changes
- Existing tournaments continue under rules at time of creation

### Subscription Changes

- Subscription prices may change with 60-day notice (for new purchases)
- Existing subscriptions honor original pricing
- Fair use policy applies to prevent abuse

---

## Summary

This platform implements ITTF-compliant rules for match scoring and standings calculation, while providing flexibility for tournament organization. Key principles:

- **ITTF Compliance**: Scoring, deuce, and tiebreaker rules follow ITTF standards
- **Fairness**: Snake seeding, Berger Tables, and head-to-head tiebreakers ensure fair play
- **Flexibility**: Multiple formats, subscription tiers, and configuration options
- **Data Integrity**: Participant data and match history are preserved
- **Clear Limits**: Subscription tiers have clear, enforced limits
- **Validation**: Comprehensive validation prevents invalid configurations

For questions or clarifications about any rules, please contact support or refer to specific documentation files for each feature.

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** March 2025
