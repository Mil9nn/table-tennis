# Marketing Design System

## Overview
This document outlines the design system and architectural decisions for the table tennis platform's marketing pages.

---

## Color Palette

### Brand Colors (Primary)
- **Dark Gray**: `#353535` - Dark backgrounds, primary text
- **Teal (Primary Accent)**: `#3c6e71` - CTAs, highlights, brand accent
- **White**: `#ffffff` - Primary text, light backgrounds
- **Light Gray**: `#d9d9d9` - Secondary text, borders, dividers
- **Dark Blue (Secondary Accent)**: `#284b63` - Hover states, secondary elements

### Utility Classes
Brand colors are available as Tailwind classes:
- Background: `.bg-brand-dark`, `.bg-brand-teal`, `.bg-brand-light-gray`, `.bg-brand-dark-blue`
- Text: `.text-brand-dark`, `.text-brand-teal`, `.text-brand-light-gray`, `.text-brand-dark-blue`
- Borders: `.border-brand-teal`, `.border-brand-dark-blue`, `.border-brand-light-gray`
- Gradients: `.gradient-teal-blue`, `.gradient-teal-blue-text`
- Opacity: `.opacity-teal-5`, `.opacity-teal-10`, `.opacity-dark-blue-5`

### Current Implementation
- **Background**: `bg-black` (dark base, can transition to `#353535`)
- **Cards**: `bg-white/5` with `backdrop-blur-xl` (frosted glass effect)
- **Text Primary**: `text-white`
- **Text Muted**: `text-white/70`
- **Text Subtle**: `text-white/60`
- **Accent Highlights**: Use `#3c6e71` (brand teal) for icons, buttons, highlights
- **Hover States**: Use `#284b63` (dark blue) for interactive elements

### Border & Dividers
- **Cards**: `border-white/10` with `hover:border-white/20` (or brand colors for accent)
- **Subtle Dividers**: `border-white/10`
- **Brand Accent Borders**: Can use `#3c6e71` for prominent elements

---

## Typography

### Heading Hierarchy
```css
.m-h1 = text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight
.m-h2 = text-3xl md:text-4xl font-semibold
.m-h3 = text-lg sm:text-xl font-semibold
```

### Body Text
```css
.m-body = text-[15px] leading-relaxed text-white/70
.m-label = text-xs uppercase tracking-wider text-white/70
```

### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Mono**: 'JetBrains Mono', 'SF Mono', Consolas

---

## Component Patterns

### Card Design
All feature/content cards follow this pattern:
```tsx
<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
  {/* Icon with gradient */}
  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
    <Icon className="w-6 h-6 text-white" />
  </div>
  
  {/* Content */}
  <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
  <p className="text-sm text-white/70 leading-relaxed">{description}</p>
</div>
```

**Key Features:**
- Frosted glass effect with `backdrop-blur-xl`
- Subtle border that intensifies on hover
- Icon with gradient background
- Smooth transitions (`duration-300`)
- Proper spacing with responsive padding

### Button Styles

#### Primary CTA
```tsx
<Link href="/auth/register" className="group px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
  Start Scoring Free
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</Link>
```

**Features:**
- Gradient background
- Icon with smooth translation on hover
- Scale up effect (`hover:scale-105`)
- Blue shadow glow

#### Secondary CTA
```tsx
<Link href="/leaderboard" className="px-8 py-4 rounded-lg border-2 border-white/20 text-white font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-xl">
  View Leaderboard
</Link>
```

**Features:**
- Transparent with border
- Subtle background on hover
- Maintains consistency with theme

---

## Animation Patterns

### Entrance Animations
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, ease: "easeOut" }}
```

### Scroll-triggered Animations
```tsx
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ delay: i * 0.08, duration: 0.5 }}
```

**Delay Multipliers:**
- Features/Cards: `i * 0.08` (80ms between items)
- Steps: `i * 0.1` (100ms between items)
- Trust Points: `i * 0.08` (80ms between items)

### Hover Animations
- Icon scale: `group-hover:scale-110 transition-transform duration-300`
- Button scale: `hover:scale-105`
- Gradient overlay fade: `opacity-0 group-hover:opacity-5 transition-opacity duration-500`

---

## Responsive Behavior

### Breakpoints (Tailwind)
- `sm`: 640px - Tablet and larger
- `md`: 768px - Small laptops
- `lg`: 1024px - Desktop
- `xl`: 1280px - Large desktop

### Section Spacing
```css
py-20 sm:py-32  /* 80px mobile, 128px desktop */
px-4 sm:px-6    /* 16px mobile, 24px desktop */
```

### Grid Layouts
```css
/* Features */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

/* How It Works */
grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4

/* Trust Points */
grid-cols-1 md:grid-cols-2 gap-6

/* Trust Indicators (Hero) */
flex-wrap items-center justify-center gap-8
```

---

## Component Structure

### Marketing Page (`/marketing`)
```
page.tsx
├── MarketingNavbar
├── Hero
├── Features
├── HowItWorks
├── Trust
├── FinalCTA
└── MarketingFooter
```

### Component Responsibilities

**MarketingNavbar**
- Sticky header with brand logo
- Navigation links to sections
- Responsive mobile menu
- Auth CTAs (Login, Get Started)

**Hero**
- Full-screen hero with background animation
- Main headline with gradient text
- Badge (positioning statement)
- Trust indicators (18+ shot types, 3 formats, 100+ data points)
- Scroll indicator

**Features**
- 6-card grid showcasing main features
- Staggered entrance animations
- Icon gradients matching theme
- Hover state with gradient overlay

**HowItWorks**
- 4-step process card layout
- Step badges with gradient backgrounds
- Icons with color coding
- Connector lines (desktop only)
- Responsive grid (1/2/4 columns)

**Trust**
- 4 trust/credibility points
- 2-column responsive grid
- Icons with gradients
- Security, compliance, reliability, community messaging

**FinalCTA**
- Call-to-action section with background gradient
- Primary and secondary buttons
- Trust indicators (no credit card, guarantee, cancel anytime)
- Minimal design to focus on conversion

**MarketingFooter**
- 4-column footer grid
- Social links (Twitter, GitHub, Email)
- Navigation sections (Product, Company, Legal)
- Copyright and brand messaging

---

## CSS Classes (Tailwind)

### Container & Layout
```
.marketing           /* Parent wrapper class */
max-w-7xl mx-auto    /* Content constraint */
px-4 sm:px-6         /* Horizontal padding */
py-20 sm:py-32       /* Vertical padding */
```

### Glass Morphism
```
bg-white/5                    /* 5% white overlay */
backdrop-blur-xl              /* Blur effect */
border border-white/10        /* Subtle border */
hover:border-white/20         /* Intensify on hover */
hover:bg-white/10             /* Slightly more opaque on hover */
```

### Gradients
```
bg-gradient-to-r from-X to-Y
bg-gradient-to-br from-X to-Y
bg-clip-text text-transparent  /* Text gradient */
```

### Interactive States
```
hover:scale-105               /* Scale up on hover */
hover:shadow-2xl              /* Large shadow */
hover:shadow-blue-500/50      /* Colored shadow */
group-hover:translate-x-1     /* Move with parent hover */
transition-all duration-300   /* Smooth transitions */
```

---

## Performance Considerations

1. **Animations**
   - Use `will-change` for frequently animated elements
   - GPU-accelerated properties: `transform`, `opacity`
   - Avoid animating `width`, `height`, `top`, `left`

2. **Images**
   - Lazy load images in scroll sections
   - Use Next.js Image component for optimization
   - WebP with fallbacks

3. **Typography**
   - System fonts with fallbacks (avoid custom web fonts initially)
   - Proper font sizing with responsive scales
   - Adequate contrast ratios (WCAG AA minimum)

---

## Accessibility

1. **Color Contrast**
   - Text on white/light: Use `text-[#145 0 0]` (dark)
   - Text on dark: Use `text-white` or lighter variants
   - WCAG AA compliance: 4.5:1 for body text

2. **Interactive Elements**
   - All buttons and links have clear hover states
   - Focus states for keyboard navigation
   - Semantic HTML (`<button>`, `<a>`, `<section>`)

3. **Motion**
   - Respect `prefers-reduced-motion` media query (optional)
   - Animations have purpose (entrance, feedback)
   - No auto-playing videos or animations

---

## Next Steps / Expansion

1. **Additional Pages**
   - `/pricing` - Pricing table with tier comparison
   - `/features` - Detailed feature breakdown
   - `/blog` - Blog listing and articles
   - `/docs` - Documentation/guides

2. **Interactivity**
   - Feature comparison tool
   - Tournament format simulator
   - Pricing calculator (users per tier)

3. **Social Proof**
   - User testimonials section
   - Case studies with metrics
   - Review aggregator (Trustpilot, G2)

4. **SEO**
   - Structured data (Schema.org)
   - Open Graph meta tags
   - Sitemap and robots.txt

---

## File Structure
```
marketing/
├── page.tsx                    # Main page
├── HowItWorks.tsx             # Reusable component
├── Trust.tsx                  # Reusable component
├── FinalCTA.tsx               # Reusable component
├── DESIGN_SYSTEM.md           # This file
└── components/
    ├── Hero.tsx               # Hero section
    ├── Features.tsx           # Feature grid
    ├── MarketingNavbar.tsx    # Navigation
    └── MarketingFooter.tsx    # Footer
```

---

**Last Updated:** December 24, 2025
**Version:** 1.0
