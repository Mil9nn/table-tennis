# Quick Setup Guide

## Local Testing

### 1. Install Socket Server Dependencies

```bash
cd socket-server
npm install
```

### 2. Create `.env` file

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit `.env` and set:
```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SOCKET_API_KEY=your-secret-key-here
```

### 3. Start Socket Server

```bash
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Update Next.js `.env.local`

Add to your Next.js app's `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_SERVER_URL=http://localhost:3001
SOCKET_API_KEY=your-secret-key-here
```

### 5. Test Connection

1. Start your Next.js app: `npm run dev`
2. Open browser console and check for socket connection logs
3. Visit a match page and verify socket connection works

## Render Deployment

### Step 1: Push to GitHub

Make sure all changes are committed and pushed:

```bash
git add .
git commit -m "Migrate socket server to standalone service"
git push
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `table-tennis-socket-server`
   - **Root Directory**: `socket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables in Render

In Render dashboard, add:

- `ALLOWED_ORIGINS` = `https://your-app.vercel.app` (your Vercel URL)
- `SOCKET_API_KEY` = Generate a secure random string (e.g., `openssl rand -hex 32`)
- `PORT` = Leave empty (Render provides this automatically)

### Step 4: Deploy

Click **"Create Web Service"** and wait for deployment.

Note the service URL (e.g., `https://table-tennis-socket-server.onrender.com`)

### Step 5: Update Vercel Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

Add:
- `NEXT_PUBLIC_SOCKET_URL` = `https://your-socket-server.onrender.com`
- `SOCKET_SERVER_URL` = `https://your-socket-server.onrender.com`
- `SOCKET_API_KEY` = Same key you set in Render

### Step 6: Redeploy Next.js App

Trigger a new deployment in Vercel (or push a commit) to apply the new environment variables.

## Verification

1. Check socket server health: `https://your-socket-server.onrender.com/health`
2. Test socket connection in browser console
3. Verify real-time updates work when scoring matches


