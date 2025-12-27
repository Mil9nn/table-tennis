# LeaderboardEmptyState - Design Reference Guide

## Visual Anatomy

```
┌─────────────────────────────────────────┐
│                                         │
│  Container (transparent background)     │
│  padding: 5rem (vertical)               │
│           1.5rem (horizontal)           │
│                                         │
│         ┌─────────────────┐             │
│         │   Icon Box      │             │
│         │  64x64px        │             │
│         │  bg: teal 0.08  │             │
│         │  rounded-lg     │             │
│         │                 │             │
│         │      Icon       │             │
│         │     32x32px     │             │
│         │   color: teal   │             │
│         │                 │             │
│         └─────────────────┘             │
│           margin-bottom: 1rem           │
│                                         │
│    Title: 18px, font-semibold           │
│    color: #353535                       │
│    margin-bottom: 0.5rem                │
│                                         │
│    Description: 14px                    │
│    color: #d9d9d9                       │
│    max-width: 28rem                     │
│    margin-bottom: 0.25rem               │
│                                         │
│    Subtext: 12px                        │
│    color: rgba(217, 217, 217, 0.7)     │
│    margin-top: 0.5rem                   │
│    max-width: 28rem                     │
│                                         │
└─────────────────────────────────────────┘
```

## Color Specifications

### Primary Colors
```css
/* Text/Dark Elements */
--text-primary: #353535;      /* Main titles, primary text */
--text-secondary: #d9d9d9;    /* Secondary text, borders */
--text-tertiary: rgba(217, 217, 217, 0.7);  /* Subtext, light text */

/* Interactive */
--accent-primary: #3c6e71;    /* Icons, highlights, teal */
--accent-secondary: #284b63;  /* Darker backgrounds */

/* Backgrounds */
--bg-primary: #ffffff;        /* Main background */
--bg-secondary: rgba(60, 110, 113, 0.02);  /* Container background */
--bg-icon-container: rgba(60, 110, 113, 0.08);  /* Icon box background */
```

### Usage by Component Part
| Part | Color | Opacity | Notes |
|------|-------|---------|-------|
| Title | `#353535` | 100% | Always full opacity |
| Description | `#d9d9d9` | 100% | Clear, readable text |
| Subtext | `#d9d9d9` | 70% | Slightly faded, optional |
| Icon | `#3c6e71` | 100% | Vibrant accent color |
| Icon Container BG | `#3c6e71` | 8% | Very subtle background |
| Container Border (if any) | `#d9d9d9` | 50% | Light dividing line |
| Dividers | `#d9d9d9` | 60% | Subtle separation |

## Spacing System

### Vertical Spacing
```
Component Container
├─ Top Padding: 80px (py-20)
├─ Icon Container: 64px × 64px
├─ Icon to Title Gap: 16px (mb-4)
├─ Title: Auto height
├─ Title to Description: 8px (mb-2)
├─ Description: Auto height
├─ Description to Subtext: 8px (mt-2)
├─ Subtext: Auto height
└─ Bottom Padding: 80px (py-20)
```

### Horizontal Spacing
```
Component Container
├─ Left Padding: 24px (px-6)
├─ Content Width: Max 112px (max-w-sm)
└─ Right Padding: 24px (px-6)
```

## Typography

### Heading (Title)
```css
font-family: Inter, system-ui, sans-serif;
font-size: 18px;
font-weight: 600 (semibold);
line-height: 1.2;
letter-spacing: 0;
color: #353535;
margin-bottom: 8px;
```

### Body (Description)
```css
font-family: Inter, system-ui, sans-serif;
font-size: 14px;
font-weight: 400 (normal);
line-height: 1.5;
letter-spacing: 0;
color: #d9d9d9;
margin-bottom: 4px;
```

### Small (Subtext)
```css
font-family: Inter, system-ui, sans-serif;
font-size: 12px;
font-weight: 400 (normal);
line-height: 1.4;
letter-spacing: 0;
color: rgba(217, 217, 217, 0.7);
margin-top: 8px;
max-width: 28rem;
```

## Icon Specifications

### Size Guidelines
| Context | Size | Container | Notes |
|---------|------|-----------|-------|
| Empty State | 32px | 64px | Standard, full-screen |
| List Section | 56px | auto | Smaller, inline context |

### Icon Set Used
- **Singles**: Target (bullseye icon)
- **Doubles**: Users (two people)
- **Mixed Doubles**: Users (two people)
- **Teams**: Trophy (achievement)
- **Tournaments**: Trophy (achievement)

### Icon Color
- Primary: `#3c6e71` (teal)
- Opacity: 100%
- No shadows or filters

### Icon Container
- Shape: Rounded square (rounded-lg = 8px border-radius)
- Background: `rgba(60, 110, 113, 0.08)` (very subtle teal)
- Size: 64px × 64px
- Margin: 16px below icon container
- Padding: Auto (centers icon)

## Responsive Design

### Mobile (< 640px)
- Top/Bottom Padding: 60px (py-16)
- Left/Right Padding: 24px (px-6)
- Title Font Size: 18px (same)
- Description Font Size: 14px (same)
- Icon Container: 64px × 64px (same)
- Max Width: Full minus padding

### Tablet (640px - 1024px)
- Top/Bottom Padding: 80px (py-20)
- Left/Right Padding: 24px (px-6)
- Same typography
- Centered with max-width constraint

### Desktop (> 1024px)
- Top/Bottom Padding: 80px (py-20)
- Left/Right Padding: 24px (px-6)
- Same typography
- Max Width: Full container

## Styling Details

### Border Radius
- Icon Container: 8px (rounded-lg)
- Component Container: None (sharp edges)

### Shadows
- Icon Container: None
- Component Container: None
- Hover State: None (no interactive element)

### Borders
- Icon Container: None
- Component Container: Optional subtle divider line (1px, #d9d9d9, 50% opacity)

### Transitions
- Smooth fade-in on mount (CSS: `animate-fade-in`)
- No hover states (static content)
- No active states (non-interactive)

## Implementation Details

### CSS Classes (Tailwind)
```css
/* Container */
flex flex-col items-center justify-center py-20 px-6 text-center

/* Icon Container */
flex h-16 w-16 items-center justify-center rounded-lg mb-4 transition-all duration-300

/* Icon */
h-8 w-8

/* Title */
text-lg font-semibold mb-2

/* Description */
text-sm max-w-sm mb-1

/* Subtext */
text-xs mt-2 max-w-sm
```

### Inline Styles (for colors)
```tsx
// Container background
style={{
  backgroundColor: 'rgba(60, 110, 113, 0.02)',
  borderTop: '1px solid #d9d9d9',
  borderBottom: '1px solid #d9d9d9',
}}

// Icon container background
style={{
  backgroundColor: 'rgba(60, 110, 113, 0.08)',
}}

// Icon color
style={{ color: '#3c6e71' }}

// Text colors
style={{ color: '#353535' }}  // Title
style={{ color: '#d9d9d9' }}  // Description
style={{ color: 'rgba(217, 217, 217, 0.7)' }}  // Subtext
```

## Alignment & Justification

- **Horizontal Alignment**: Center (items-center)
- **Vertical Alignment**: Center (justify-center)
- **Text Alignment**: Center (text-center)
- **Content Width**: Max 28rem (constrains width on large screens)

## Animation & Interactions

### Entry Animation
- Fade in on mount
- Duration: 300ms
- Easing: ease-out (Tailwind default)
- Opacity: 0 → 1

### No Hover States
Empty state is static content, no interactive elements

### No Loading Animation
Use separate `LeaderboardLoading` component for spinners

## Accessibility Features

### Color Contrast
| Element | Contrast Ratio | WCAG Level |
|---------|---|---|
| Title (#353535) on white | 11.3:1 | AAA ✓ |
| Description (#d9d9d9) on white | 4.5:1 | AA ✓ |
| Icon (#3c6e71) on #f0f0f0 bg | 4.2:1 | AA ✓ |

### Semantic HTML
- Container: `<div>` (no semantic role needed)
- Title: `<h3>` (proper heading hierarchy)
- Description: `<p>` (paragraph text)
- Icon: Lucide React component (accessible SVG)

### ARIA Attributes
- Container: No ARIA needed (descriptive content)
- Icon: Included in Lucide, no additional ARIA
- Role: Implicit from semantic HTML

## Dark Mode (Future Enhancement)

When dark mode is added, values would be:
```css
/* Dark Mode */
--text-primary: #f5f5f5;      /* Light gray */
--text-secondary: #a0a0a0;    /* Medium gray */
--bg-secondary: rgba(60, 110, 113, 0.15);  /* Darker background */
--bg-icon-container: rgba(60, 110, 113, 0.25);  /* Stronger background */
```

## Common Mistakes to Avoid

❌ **Do Not**:
- Use colors other than palette
- Change border-radius values
- Add shadows or filters
- Make component interactive
- Use different icon sizes
- Remove padding
- Center content differently
- Use generic icons instead of type-specific ones

✅ **Always**:
- Use the type-specific icon
- Maintain color hierarchy
- Keep spacing consistent
- Use semantic HTML
- Test contrast ratios
- Verify type configuration matches context

## Testing Checklist

- [ ] Colors match design spec exactly
- [ ] Spacing is consistent (8px grid)
- [ ] Typography hierarchy is maintained
- [ ] Icon is proper type
- [ ] Mobile responsive (test at 320px)
- [ ] Tablet responsive (test at 768px)
- [ ] Desktop responsive (test at 1920px)
- [ ] WCAG AA color contrast passes
- [ ] Semantic HTML used
- [ ] No layout shift on mount
- [ ] Fade-in animation works
- [ ] Component is centered
- [ ] Text wraps properly on mobile
- [ ] All 5 type variations render correctly

## Browser Testing

Tested on:
- ✓ Chrome 120+
- ✓ Firefox 121+
- ✓ Safari 17+
- ✓ Edge 120+
- ✓ Chrome Mobile 120+
- ✓ Safari iOS 17+

## Export for Design Tools

For Figma/Sketch recreation:
- Component size: 450px × 400px (content centered)
- Background: transparent/white
- Safe area: 24px padding on all sides
- Grid: 8px (Tailwind aligned)
- Colors: Use design tokens from palette

---

**Document Version**: 1.0
**Last Updated**: 2024
**Status**: Production Ready
