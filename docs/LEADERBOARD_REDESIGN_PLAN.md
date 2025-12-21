# Modern Leaderboard Redesign Plan

## Overview
Transform `app/leaderboard/page.tsx` with a modern, sleek, and responsive design using a strict 4-color palette.

## Color Palette (STRICT)
- **Primary Dark:** `#323139` - Headers, text, authority elements
- **Secondary Light:** `#ccbcbc` - Borders, subtle backgrounds, metadata
- **White:** `#ffffff` - Clean canvas, cards, active states
- **Accent Cyan:** `#18c3f8` - Highlights, CTAs, active states, win rates

## Design Goals
1. Modern, sleek, smooth aesthetic with premium feel
2. Improved typography using Inter font family + JetBrains Mono for stats
3. Fully responsive across mobile, tablet, and desktop
4. Maintain all existing functionality (tabs, infinite scroll, modals, stats)

---

## Implementation Plan

### 1. Hero Header Redesign
**File:** `app/leaderboard/page.tsx` (lines 77-84)

**Changes:**
- Background: Solid `#323139` (remove gradient)
- Title: White, 2.5rem, bold, tracking-tight
- Subtitle: `#ccbcbc`, 0.9375rem
- Add accent line: `#18c3f8`, 4px thick, 60px wide below title
- Remove rounded corners (keep rectangular)
- Add subtle shadow: `0 4px 20px rgba(50, 49, 57, 0.08)`
- Height: 180px desktop, 140px mobile
- Padding: 48px top, 32px bottom, 24px horizontal (responsive)

### 2. Tab Navigation Redesign
**File:** `app/leaderboard/page.tsx` (lines 89-157)

**Changes:**
- Container background: White
- Bottom border: 2px solid `#ccbcbc` with 30% opacity
- Inactive tabs: `#323139` with 60% opacity, transparent background
- Active tabs: `#323139` full opacity, 3px bottom border in `#18c3f8`
- Hover: `#ccbcbc` with 8% opacity background
- Sticky shadow: `0 2px 16px rgba(50, 49, 57, 0.08)`
- Font: 0.875rem, medium, uppercase, tracking-wide
- Active font: Semibold
- Icon updates:
  - Teams icon: `#323139`
  - Tournaments icon: `#18c3f8`
  - Size: 16px

### 3. Top 3 Featured Section (Player Leaderboard)
**File:** `app/leaderboard/components/PlayerLeaderboard.tsx`

**Rank 1 Card:**
- Background: Gradient white to `rgba(24, 195, 248, 0.06)`
- Border: 2px solid `#18c3f8`
- Height: 160px
- Rank badge: 56px circle, background `#18c3f8`, white crown icon
- Shadow: `0 4px 16px rgba(24, 195, 248, 0.3)`
- Avatar: 64px with 3px `#18c3f8` ring
- Win rate: `#18c3f8`, 1.5rem, bold

**Rank 2 & 3 Cards:**
- Background: White
- Border: 1px solid `#ccbcbc` with 30% opacity
- Height: 140px
- Rank 2 badge: 48px circle, `#ccbcbc` background
- Rank 3 badge: 48px circle, `#18c3f8` 20% opacity background
- Avatar: 56px with 2px `#ccbcbc` ring

**Hover State (All Top 3):**
- Transform: `translateY(-4px)`
- Shadow: `0 8px 24px rgba(50, 49, 57, 0.12)`
- Transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`

### 4. List Layout (Rank 4+)
**File:** `app/leaderboard/components/PlayerLeaderboard.tsx`

**Card Style:**
- Background: White
- Border: 1px solid `#ccbcbc` with 20% opacity
- Left border: 4px solid transparent (changes to `#18c3f8` on hover)
- Padding: 16px 20px
- Margin: 1px 0

**Hover:**
- Border left: `#18c3f8`
- Background: `#ccbcbc` with 3% opacity
- Transform: `translateX(4px)`
- Transition: `all 250ms ease-out`

**Content:**
- Rank badge: 32px, `#323139` with 50% opacity
- Avatar: 48px with 1.5px `#ccbcbc` ring (hover: 2px `#18c3f8`)
- Name: `#323139`, 0.9375rem, semibold
- Stats: `#323139` for wins, 70% opacity for losses
- Win rate: `#18c3f8`, bold

**Streak Badges:**
- Win streak: `#18c3f8` with 15% opacity background, `#18c3f8` text
- Lose streak: `#323139` with 10% opacity background, red text

### 5. Stats Modal Redesign
**File:** `app/leaderboard/components/PlayerLeaderboard.tsx`

**Overlay:**
- Background: `#323139` with 50% opacity
- Backdrop blur: 8px

**Content:**
- Background: White
- Border: 2px solid `#ccbcbc` with 20% opacity
- Border radius: 24px
- Shadow: `0 24px 48px rgba(50, 49, 57, 0.2)`

**Header:**
- Background gradient: White to `#ccbcbc` 5% opacity
- Border bottom: 1px solid `#ccbcbc` with 20% opacity
- Avatar: 80px with 3px `#18c3f8` ring
- Name: `#323139`, 1.5rem, bold
- Username: `#ccbcbc`, 0.875rem
- Win rate: `#18c3f8`, 2.5rem, bold

**Stats Cards:**
- Background: White
- Border: 1px solid `#ccbcbc` with 25% opacity
- Border radius: 16px
- Hover: `#18c3f8` border with 30% opacity
- Values: `#323139`, 2rem, bold, monospace
- Labels: `#ccbcbc`, 0.75rem, uppercase

### 6. Team Leaderboard Redesign
**File:** `app/leaderboard/components/TeamLeaderboard.tsx`

**Table Container:**
- Background: White
- Border: 1px solid `#ccbcbc` with 25% opacity
- Border radius: 20px
- Shadow: `0 4px 16px rgba(50, 49, 57, 0.06)`

**Header:**
- Background: `#ccbcbc` with 8% opacity
- Border bottom: 2px solid `#ccbcbc` with 30% opacity
- Text: `#323139`, 0.6875rem, semibold, uppercase, 70% opacity

**Rows:**
- Normal: White background
- Top 3: `#18c3f8` with 4% opacity, 3px left border in `#18c3f8`
- Hover: `#ccbcbc` with 5% opacity, 3px `#18c3f8` left border, `translateX(2px)`
- Border bottom: 1px solid `#ccbcbc` with 15% opacity

**Win Rate Badge:**
- Background: `#18c3f8` with 12% opacity
- Border: 1px solid `#18c3f8` with 30% opacity
- Text: `#18c3f8`, bold

**Expand Button:**
- Hover background: `#18c3f8` with 10% opacity
- Icon color: `#323139` with 60% opacity (hover: `#18c3f8`)

### 7. Tournament Leaderboard Redesign
**File:** `app/leaderboard/components/TournamentLeaderboard.tsx`

**Similar to Team Leaderboard with:**
- Rank 1: 4px `#18c3f8` left border, `#18c3f8` 5% opacity background
- Rank 2-3: 3px `#ccbcbc` left border
- Tournaments Won: `#18c3f8`, bold
- Other stats: `#323139` with varying opacity

### 8. Loading & Empty States
**Files:** `app/leaderboard/components/shared/LeaderboardLoading.tsx`, `LeaderboardEmpty.tsx`

**Loading:**
- Spinner color: `#18c3f8`
- Size: 32px
- Text: `#ccbcbc`, 0.875rem

**Empty State:**
- Icon: `#ccbcbc` with 50% opacity, 64px
- Message: `#323139`, 1.125rem, semibold
- Subtext: `#ccbcbc`, 0.875rem

**Infinite Scroll:**
- Loading spinner: `#18c3f8`, 24px
- Text: `#ccbcbc`, 0.875rem
- End message: `#ccbcbc` with 70% opacity, italic

### 9. Global Styles
**File:** `app/globals.css`

Add design tokens:
```css
@theme {
  --color-lb-primary-dark: #323139;
  --color-lb-secondary-light: #ccbcbc;
  --color-lb-accent: #18c3f8;
  --color-lb-white: #ffffff;
  --color-lb-border-light: rgba(204, 188, 188, 0.2);
  --color-lb-bg-subtle: rgba(204, 188, 188, 0.03);
  --color-lb-accent-subtle: rgba(24, 195, 248, 0.04);
  --shadow-lb-sm: 0 2px 8px rgba(50, 49, 57, 0.04);
  --shadow-lb-md: 0 4px 16px rgba(50, 49, 57, 0.08);
  --shadow-lb-lg: 0 8px 24px rgba(50, 49, 57, 0.12);
}
```

Add custom scrollbar for modals:
```css
.leaderboard-modal-content::-webkit-scrollbar {
  width: 8px;
}
.leaderboard-modal-content::-webkit-scrollbar-track {
  background: rgba(204, 188, 188, 0.05);
  border-radius: 4px;
}
.leaderboard-modal-content::-webkit-scrollbar-thumb {
  background: rgba(50, 49, 57, 0.2);
  border-radius: 4px;
}
```

### 10. Responsive Design
Apply across all components:

**Mobile (< 640px):**
- Hero height: 120px, title 1.875rem
- Tab padding: 12px 16px, font 0.8125rem
- Top 3: Single column stack
- Avatar sizes: -8px
- Card padding: 12px 16px
- Modal: 95vw width, 90vh height
- Tables: Horizontal scroll, min-width 800px

**Tablet (640px - 1024px):**
- Maintain desktop layout with adjusted spacing
- Stats grid: 3 cols → 2 cols

### 11. Typography System
Apply throughout all components:

**Fonts:**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Stats/Numbers: `'JetBrains Mono', 'SF Mono', Consolas, monospace`

**Scale:**
- Hero: 2.5rem (40px), bold, tracking-tight
- Section heading: 1.5rem (24px), semibold
- Player names: 0.9375rem (15px), semibold
- Stats primary: 1.5rem (24px), bold, monospace
- Body: 0.875rem (14px), medium
- Metadata: 0.75rem (12px), regular
- Labels: 0.6875rem (11px), medium, uppercase

### 12. Animations
Apply to all interactive elements:

**Timing:**
- Fast: 150ms
- Normal: 250ms
- Slow: 300ms

**Easing:**
- Smooth: `cubic-bezier(0.4, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.34, 1.56, 0.64, 1)` (for streak badges)

**Effects:**
- Card hover: `translateY(-4px)` over 300ms
- List hover: `translateX(4px)` over 250ms
- Tab transition: All properties over 250ms
- Modal: Scale 0.95→1 + opacity 0→1 over 300ms
- Progress bars: Width animation 500ms ease-out
- Stagger list items: 30ms delay per item

---

## Critical Files to Modify

1. **`app/leaderboard/page.tsx`**
   - Hero header (lines 77-84)
   - Tab navigation (lines 89-157)
   - Tab panel infinite scroll indicator (lines 260-276)

2. **`app/leaderboard/components/PlayerLeaderboard.tsx`**
   - Top 3 featured section
   - Rank 4+ list layout
   - Rank medals/badges
   - Stats modal
   - Streak badges
   - All card interactions

3. **`app/leaderboard/components/TeamLeaderboard.tsx`**
   - Table container and styling
   - Row styles (normal, top 3, hover)
   - Team logo
   - Win rate badges
   - Expand button
   - Expandable player stats section

4. **`app/leaderboard/components/TournamentLeaderboard.tsx`**
   - Table styling
   - Rank highlights
   - Tournament stats colors
   - Responsive behavior

5. **`app/leaderboard/components/shared/LeaderboardLoading.tsx`**
   - Spinner color and size
   - Loading text styling

6. **`app/leaderboard/components/shared/LeaderboardEmpty.tsx`**
   - Icon styling
   - Message and subtext colors
   - Container spacing

7. **`app/globals.css`**
   - New color variables
   - Design tokens
   - Custom scrollbar styles
   - Shadow definitions

---

## Implementation Sequence

**Phase 1: Foundation (30 min)**
1. Update `globals.css` with design tokens and scrollbar styles
2. Redesign hero header in `page.tsx`
3. Redesign tab navigation in `page.tsx`

**Phase 2: Core Components (60 min)**
4. Update loading and empty states
5. Redesign rank badges and medals in PlayerLeaderboard
6. Update avatar components with new ring styles
7. Redesign streak badges

**Phase 3: Layout Sections (60 min)**
8. Redesign top 3 featured cards in PlayerLeaderboard
9. Redesign rank 4+ list items in PlayerLeaderboard
10. Update infinite scroll indicator

**Phase 4: Advanced Features (60 min)**
11. Redesign stats modal in PlayerLeaderboard
12. Update team leaderboard table
13. Update tournament leaderboard table

**Phase 5: Polish (30 min)**
14. Add all animations and transitions
15. Implement responsive breakpoints
16. Test across mobile, tablet, desktop
17. Accessibility check (contrast, touch targets, keyboard nav)

---

## Design Validation Checklist

Before completing, ensure:
- [ ] All colors use only the 4 specified colors
- [ ] Typography follows the defined scale
- [ ] All transitions are 300ms or less
- [ ] Mobile: 44px minimum touch targets
- [ ] Loading states use accent cyan
- [ ] All shadows use primary dark with opacity
- [ ] Win streaks use cyan, lose streaks use red-tinted dark
- [ ] Modal uses primary dark overlay with backdrop blur
- [ ] Tables overflow properly on mobile
- [ ] Accessibility: WCAG 2.1 AA contrast ratios met

---

## Expected Outcome

A modern, sophisticated leaderboard with:
- ✅ Strict 4-color palette creating visual depth through opacity variations
- ✅ Clear visual hierarchy through typography and spacing
- ✅ Smooth, premium interactions with thoughtful animations
- ✅ Full responsiveness across all device sizes
- ✅ All existing functionality preserved
- ✅ Professional, cohesive brand identity
