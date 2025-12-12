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
JWT_SECRET=your_jwt_secret_key_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
    api/          # API routes
    auth/         # Authentication pages
    match/        # Match creation
    matches/      # Match list, details, live scoring
    tournaments/  # Tournament management
    teams/        # Team management
    leaderboard/  # Rankings
    profile/      # User profiles

components/       # React components
models/           # MongoDB schemas
services/         # Business logic
hooks/            # Custom React hooks
lib/              # Utilities
types/            # TypeScript definitions
```

## License

MIT
