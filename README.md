# Table Tennis Scoring Platform

A professional match scoring, shot tracking, and performance analytics system for table tennis players, coaches, and tournament organizers.

## Features

- **Live Match Scoring** - Real-time score tracking with intuitive interface
- **Shot-by-Shot Analysis** - Track 18 different stroke types with coordinate mapping
- **Multiple Match Formats** - Singles, Doubles, Mixed Doubles, and Team Matches
- **Tournament Management** - Group stages, knockout rounds, seeding, and brackets
- **Player Statistics** - Comprehensive career stats, win streaks, and head-to-head records
- **Leaderboards** - Individual, team, and tournament rankings.
- **Player Profiles** - Match history and performance analytics

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** Custom JWT-based authentication
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Charts:** ECharts, Recharts, Plotly
- **Image Storage:** Cloudinary

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

**Required:**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_min_24_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Email Service (ZeptoMail):**
```env
ZEPTOMAIL_SEND_TOKEN=your_send_mail_token_from_zeptomail
ZEPTOMAIL_FROM_EMAIL=noreply@yourdomain.com
ZEPTOMAIL_FROM_NAME=TTPro
```

**Optional:**
```env
# Rate Limiting (requires Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
RATE_LIMIT_ENABLED=true
RATE_LIMIT_BYPASS_KEY=your_bypass_key

# Socket.IO (currently disabled, for future use)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Error Monitoring (GlitchTip/Sentry)
NEXT_PUBLIC_GLITCHTIP_DSN=your_glitchtip_dsn
GLITCHTIP_ENABLED=false
GLITCHTIP_ENVIRONMENT=development

# Server Configuration
HOSTNAME=localhost
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm run start
```

## Project Structure

```
app/
    api/                      # API routes
        auth/                 # Authentication endpoints (login, register, verify, reset password)
        leaderboard/          # Leaderboard APIs (global, individual, team, tournament)
        matches/              # Match management APIs
            individual/       # Individual match operations (score, status, swap, reset)
            team/             # Team match operations (submatch management)
        profile/              # User profile APIs (stats, insights, head-to-head)
        scorer/               # Scorer assignment APIs
        subscription/         # Subscription management (checkout, webhook, portal)
        teams/                # Team management APIs
        tournaments/          # Tournament APIs (creation, bracket, seeding, participants)
        users/                # User search and management
    auth/                     # Authentication pages (login, register, password reset, verify)
    complete-profile/         # Profile completion flow
    contact/                  # Contact page
    leaderboard/              # Rankings and leaderboard pages
    marketing/                # Marketing and landing pages
    match/                    # Match creation pages
    matches/                  # Match list, details, and live scoring
    profile/                  # User profile pages
    pricing/                  # Pricing page
    scorer/                   # Live scoring interface
    subscription/             # Subscription management pages
    teams/                    # Team management pages
    tournaments/              # Tournament management pages
    tournament-matches/       # Tournament match views
    providers/                # React context providers
    # Policy pages: privacy-policy, terms-of-service, refund-policy, shipping-policy

components/
    live-match/              # Live match components
    live-scorer/             # Live scoring components
        common/              # Shared scorer components (ScoreBoard, PlayerCard, etc.)
        individual/          # Individual match scorers (Singles, Doubles)
        team/                # Team match scorers (Swaythling, Custom formats)
    match-details/           # Match detail views (GameHistory, MatchInfo, Lineup)
    match-stats/             # Match statistics components (charts, analysis, insights)
    shot-selector/           # Shot selection UI components
    tournaments/             # Tournament-related components
        statistics/          # Tournament statistics components
    ui/                      # Reusable UI components (shadcn/ui: buttons, dialogs, forms, etc.)
    weaknesses-analysis/     # Performance analysis components (heatmaps, charts, insights)
    skeletons/               # Loading skeleton components
    paywall/                 # Paywall components (BlurredContent, UpgradeModal)

constants/                   # Application constants
hooks/                       # Custom React hooks (auth, matches, socket, subscription)

lib/
    api/                     # API client utilities
    validations/             # Zod validation schemas
    rate-limit/              # Rate limiting utilities (Upstash Redis)
    leaderboard/             # Leaderboard calculation utilities
    middleware/              # Custom middleware
    __tests__/               # Library unit tests

models/                      # MongoDB schemas (Mongoose models)
    shared/                  # Shared model types and interfaces

schemas/                     # Additional validation schemas

services/
    cache/                   # Caching services
    database/                # Database connection and utilities
    match/                   # Match-related business logic
    tournament/              # Tournament services
        core/                # Core tournament logic
            standings/       # Standings calculation services
        repositories/        # Data access layer
        types/               # Tournament type definitions
        utils/               # Tournament utility functions
        validators/          # Tournament validation logic
    validation/              # Validation services
    statsService.ts          # Statistics calculation service
    tournamentService.ts     # Main tournament service

shared/
    match/                   # Shared match utilities (client and server)

socket-server/               # Socket.IO server for real-time features
    handlers/                # Socket event handlers
    routes/                  # Socket routes
    types/                   # Socket type definitions

tests/                       # Test files
types/                       # TypeScript type definitions
public/                      # Static assets
    imgs/                    # Image assets
    svgs/                    # SVG icons and graphics
```

## License

All Rights Reserved. Copyright (c) 2024

This software is proprietary and confidential. No part of this code may be copied, modified, distributed, or used without express written permission.
