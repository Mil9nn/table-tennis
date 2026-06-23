# Table Tennis Socket Server

Standalone Socket.IO server for real-time match updates. This server runs separately from the main Next.js application and can be hosted on platforms like Render that support WebSocket connections.

## Features

- Real-time WebSocket connections via Socket.IO
- Match room management (join/leave)
- HTTP API for event emission from Next.js API routes
- CORS configuration for secure cross-origin requests
- Health check endpoint

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SOCKET_API_KEY=your-secret-api-key-here
```

4. Run in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## Production Deployment on Render

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `table-tennis-socket-server` (or your preferred name)
   - **Root Directory**: `socket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 2: Configure Environment Variables

In Render dashboard, add these environment variables:

- `PORT` - Render will provide this automatically, but you can set a default
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://your-app.vercel.app`)
- `SOCKET_API_KEY` (optional) - API key for securing emit endpoints

Example:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
SOCKET_API_KEY=your-secret-api-key-here
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for the build to complete
3. Note the service URL (e.g., `https://your-socket-server.onrender.com`)

### Step 4: Update Next.js App

In your Vercel dashboard (or `.env.local` for local development), set:

```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
SOCKET_SERVER_URL=https://your-socket-server.onrender.com
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Emit Event

```
POST /api/emit/:matchId/:eventName
Headers:
  Content-Type: application/json
  X-API-Key: your-api-key (if SOCKET_API_KEY is set)
Body:
  {
    // Event payload
  }
```

Example:
```bash
curl -X POST https://your-socket-server.onrender.com/api/emit/match123/score:update \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"matchId": "match123", "side1Score": 5, "side2Score": 3}'
```

### Get Viewer Count

```
GET /api/viewers/:matchId
```

Returns the number of connected viewers for a match.

## Socket.IO Events

### Client → Server

- `join:match` - Join a match room
- `leave:match` - Leave a match room
- `ping` - Health check ping

### Server → Client

- `score:update` - Score has been updated
- `shot:recorded` - A shot has been recorded
- `server:change` - Server has changed
- `match:status` - Match status changed
- `game:completed` - A game has been completed
- `match:completed` - Match has been completed
- `match:reset` - Match has been reset
- `viewer:joined` - A viewer joined the match
- `viewer:left` - A viewer left the match
- `pong` - Response to ping

## Security

- CORS is configured to only allow requests from specified origins
- Optional API key authentication for emit endpoints
- All socket connections are validated

## Troubleshooting

### Connection Issues

- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly in your Next.js app
- Check CORS configuration - ensure your app URL is in `ALLOWED_ORIGINS`
- Check Render logs for any errors

### Event Emission Issues

- Verify `SOCKET_SERVER_URL` is set in your Next.js app
- Check API key if authentication is enabled
- Verify the event name is valid
- Check Render logs for API request errors

## Monitoring

Render provides built-in logging. Check the "Logs" tab in your Render dashboard to monitor:
- Socket connections/disconnections
- API requests
- Errors and warnings


