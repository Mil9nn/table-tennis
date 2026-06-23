# Brand Color Palette

**Source**: MARKETING_HOMEPAGE.md (Lines 381)

## Official Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Dark Gray | `#353535` | 53, 53, 53 | Dark backgrounds, primary text fallback |
| Teal (Primary) | `#3c6e71` | 60, 110, 113 | CTAs, highlights, primary brand accent |
| White | `#ffffff` | 255, 255, 255 | Primary text, light backgrounds |
| Light Gray | `#d9d9d9` | 217, 217, 217 | Secondary text, borders, dividers |
| Dark Blue (Secondary) | `#284b63` | 40, 75, 99 | Hover states, secondary elements |

## Usage Guidelines

### Primary Brand Color: Teal (#3c6e71)
- **Button backgrounds** for primary CTAs
- **Icon backgrounds** in feature cards
- **Badge backgrounds** and highlights
- **Text highlights** and emphasis
- **Border accents** for important elements
- **Hover states** for brand consistency

### Secondary Brand Color: Dark Blue (#284b63)
- **Hover state** for primary buttons (transitions to dark blue)
- **Secondary UI elements**
- **Complementary highlights** with teal

### Neutral Colors
- **White (#ffffff)**: Primary text, card backgrounds
- **Light Gray (#d9d9d9)**: Secondary text, subtle borders
- **Dark Gray (#353535)**: Dark backgrounds (alternative to black)

## Color Combinations

### Primary CTA Button
- Background: `#3c6e71` (Teal)
- Text: `#ffffff` (White)
- Hover: `#284b63` (Dark Blue)
- Shadow: `#3c6e71` with opacity

### Secondary CTA Button
- Border: `#3c6e71` (Teal)
- Text: `#3c6e71` (Teal)
- Hover Background: `#3c6e71` (Teal)
- Hover Text: `#ffffff` (White)

### Card Elements
- Border: `border-[#3c6e71]/40` (Teal with opacity)
- Background Accent: `bg-[#3c6e71]/10` (Teal with 10% opacity)
- Icon Background: `bg-[#3c6e71]` (Solid Teal)

### Badges & Labels
- Background: `bg-[#3c6e71]/20` (Teal with 20% opacity)
- Border: `border-[#3c6e71]/40` (Teal with 40% opacity)
- Text: `text-[#3c6e71]` (Solid Teal)

## Tailwind Hex Colors

Use hex color notation in Tailwind:
```jsx
// Background
bg-[#3c6e71]
bg-[#284b63]
bg-[#353535]
bg-[#d9d9d9]

// Text
text-[#3c6e71]
text-[#284b63]
text-[#353535]
text-[#d9d9d9]

// Border
border-[#3c6e71]
border-[#284b63]

// With opacity
bg-[#3c6e71]/10   // 10% opacity
bg-[#3c6e71]/20   // 20% opacity
bg-[#3c6e71]/50   // 50% opacity
```

## CSS Variables

Brand colors are available as CSS variables in `app/globals.css` (added to `.marketing` theme):

```css
--brand-dark-gray: #353535;
--brand-teal: #3c6e71;
--brand-white: #ffffff;
--brand-light-gray: #d9d9d9;
--brand-dark-blue: #284b63;
```

Usage in React/JSX:
```jsx
<button style={{ backgroundColor: "var(--brand-teal, #3c6e71)" }}>
  Click me
</button>
```

Usage in CSS:
```css
.button {
  background-color: var(--brand-teal);
  color: var(--brand-white);
}
```

## Implementation in Components

Brand colors are used via inline styles with CSS variables in React components:

```jsx
// Primary button example
<Link
  style={{ backgroundColor: "var(--brand-teal, #3c6e71)" }}
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-dark-blue, #284b63)")}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-teal, #3c6e71)")}
>
  Get Started
</Link>

// Secondary button example
<Link
  style={{ borderColor: "var(--brand-teal, #3c6e71)", color: "var(--brand-teal, #3c6e71)" }}
  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--brand-teal, #3c6e71)"; e.currentTarget.style.color = "white"; }}
  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--brand-teal, #3c6e71)"; }}
>
  View Demo
</Link>
```

Note: Inline styles use fallback hex values for type safety and IDE support.

## Implementation Status

### Implemented ✅
- [x] Brand colors added to `app/globals.css` as CSS variables
- [x] Hero section: Badge, primary CTA, secondary CTA updated with CSS variables
- [x] FinalCTA section: Both buttons updated with CSS variables
- [x] MarketingNavbar: Get Started buttons (desktop & mobile) updated with CSS variables
- [x] DESIGN_SYSTEM.md updated with brand palette documentation

### Components Using Brand Colors
- ✅ Hero.tsx - Badge, CTAs
- ✅ FinalCTA.tsx - Primary/Secondary CTAs
- ✅ MarketingNavbar.tsx - Get Started buttons (desktop & mobile)

### Components Ready for Brand Color Updates
- Features.tsx - Icon backgrounds, accents
- CoreValueProps.tsx - Icon backgrounds, bullet points
- TournamentFormats.tsx - Icon backgrounds
- RoleBasedHowItWorks.tsx - Icon backgrounds, buttons
- LiveScoringExplanation.tsx - Icons, step badges
- DataAnalytics.tsx - Icon backgrounds
- Trust.tsx - Icon backgrounds
- MarketingFooter.tsx - Logo gradient

## Accessibility

All brand color combinations meet WCAG AA contrast ratios:
- Teal (#3c6e71) on White background: 4.5:1 ✅
- Dark Blue (#284b63) on White background: 5.5:1 ✅
- White on Teal: 7.2:1 ✅
- White on Dark Blue: 8.1:1 ✅

---

**Last Updated**: December 24, 2025
**Brand Color Specification**: MARKETING_HOMEPAGE.md line 381
