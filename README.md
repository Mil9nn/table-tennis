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
- **Authentication:** NextAuth.js
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

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
