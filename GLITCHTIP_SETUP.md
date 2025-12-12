# GlitchTip Error Monitoring Setup Guide

## What is GlitchTip?

GlitchTip is an open-source error tracking tool that helps you monitor and debug errors in production. It's compatible with Sentry's SDK, making it easy to integrate.

**Benefits:**
- ✅ Free and open-source
- ✅ Self-hostable or cloud-hosted
- ✅ Sentry-compatible (uses same SDK)
- ✅ Privacy-focused (you own your data)
- ✅ Track errors, performance, and user sessions

---

## Setup Instructions

### Step 1: Get Your GlitchTip DSN

**Option A: Use GlitchTip Cloud (Recommended for Quick Start)**

1. Go to https://app.glitchtip.com/
2. Sign up for a free account
3. Create a new project for your table tennis app
4. Go to **Settings → Projects → [Your Project] → Client Keys (DSN)**
5. Copy the DSN (looks like: `https://xxxxx@app.glitchtip.com/xxxx`)

**Option B: Self-Host GlitchTip (For Full Control)**

1. Follow the official self-hosting guide: https://glitchtip.com/documentation/install
2. Deploy GlitchTip using Docker:
   ```bash
   docker run -d -p 8000:8000 glitchtip/glitchtip
   ```
3. Create a project and get the DSN from project settings

### Step 2: Configure Environment Variables

1. Open your `.env` or `.env.local` file
2. Add your GlitchTip DSN:

```env
# GlitchTip Error Monitoring
NEXT_PUBLIC_GLITCHTIP_DSN=https://your-dsn-here@app.glitchtip.com/xxxx
GLITCHTIP_ENVIRONMENT=development
GLITCHTIP_ENABLED=true
```

**Environment Settings:**

- `NEXT_PUBLIC_GLITCHTIP_DSN`: Your GlitchTip project DSN (required)
- `GLITCHTIP_ENVIRONMENT`: Current environment (development/staging/production)
- `GLITCHTIP_ENABLED`: Enable/disable error tracking (true/false)

**For Production:**

```env
NEXT_PUBLIC_GLITCHTIP_DSN=https://your-dsn-here@app.glitchtip.com/xxxx
GLITCHTIP_ENVIRONMENT=production
GLITCHTIP_ENABLED=true
```

### Step 3: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test error logging by visiting:
   ```
   http://localhost:3000/api/test/glitchtip?type=error
   http://localhost:3000/api/test/glitchtip?type=warning
   http://localhost:3000/api/test/glitchtip?type=exception
   http://localhost:3000/api/test/glitchtip?type=user-context
   ```

3. Check your GlitchTip dashboard to see the errors appear

4. You should see console logs indicating GlitchTip is enabled:
   ```
   [GlitchTip] Client-side error tracking enabled
   [GlitchTip] Server-side error tracking enabled
   [GlitchTip] Edge runtime error tracking enabled
   ```

### Step 4: Remove Test Endpoint (Before Production)

**IMPORTANT:** Delete the test endpoint before deploying to production:

```bash
rm app/api/test/glitchtip/route.ts
```

---

## Usage Guide

### Basic Error Logging

```typescript
import { logError } from "@/lib/error-logger";

try {
  await riskyOperation();
} catch (error) {
  logError(error);
}
```

### Error with Context

```typescript
import { logError } from "@/lib/error-logger";

try {
  await processMatch(matchId);
} catch (error) {
  logError(error, {
    user: { id: userId, email: userEmail },
    tags: { feature: "match-scoring", matchType: "singles" },
    extra: { matchId, tournamentId, score: currentScore }
  });
}
```

### Warning Logging

```typescript
import { logWarning } from "@/lib/error-logger";

logWarning("Tournament has no participants", {
  tags: { feature: "tournament-management" },
  extra: { tournamentId, status: tournament.status }
});
```

### Info Logging (Important Events)

```typescript
import { logInfo } from "@/lib/error-logger";

logInfo("Tournament completed successfully", {
  tags: { feature: "tournament-lifecycle" },
  extra: { tournamentId, winnerUserId, totalMatches }
});
```

### Automatic Error Wrapping

```typescript
import { withErrorLogging } from "@/lib/error-logger";

const processMatch = withErrorLogging(
  async (matchId: string) => {
    // Your code here
    // Errors are automatically logged to GlitchTip
  },
  { tags: { feature: "match-processing" } }
);
```

---

## Example: Update API Routes

Replace `console.error()` calls with `logError()` for better error tracking:

**Before:**
```typescript
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // ... process data
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

**After:**
```typescript
import { logError } from "@/lib/error-logger";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // ... process data
  } catch (error) {
    logError(error, {
      tags: { endpoint: "create-tournament", method: "POST" },
      extra: { requestBody: data }
    });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

---

## Configuration Files

### Files Created

1. **sentry.client.config.ts** - Client-side error tracking
2. **sentry.server.config.ts** - Server-side error tracking
3. **sentry.edge.config.ts** - Edge runtime error tracking
4. **instrumentation.ts** - Initializes error tracking on server startup
5. **lib/error-logger.ts** - Utility functions for easy error logging

### Configuration Customization

Edit the `sentry.*.config.ts` files to customize:

- **Sample Rates**: Adjust `tracesSampleRate` (currently 1.0 in dev, 0.1 in prod)
- **Session Replay**: Configure `replaysSessionSampleRate`
- **Error Filtering**: Modify `beforeSend()` to filter out unwanted errors
- **Debug Mode**: Set `debug: true` for troubleshooting

---

## GlitchTip Dashboard Features

### 1. **Error Tracking**
- View all errors with stack traces
- Group similar errors together
- See error frequency and trends
- Filter by environment, tags, user

### 2. **Performance Monitoring**
- Track API response times
- Monitor slow database queries
- Identify performance bottlenecks

### 3. **User Context**
- See which users are affected by errors
- Filter errors by user ID or email
- Track user sessions

### 4. **Alerts**
- Get notified via email when errors occur
- Set up alert rules for specific error types
- Configure Slack/Discord webhooks

---

## Best Practices

### 1. **Tag Your Errors**
Use consistent tags to organize errors:

```typescript
logError(error, {
  tags: {
    feature: "tournament-management", // What feature
    operation: "create",              // What action
    userRole: "organizer",            // Who
  }
});
```

### 2. **Add Useful Context**
Include data that helps debug:

```typescript
logError(error, {
  extra: {
    tournamentId: "123",
    participantCount: 8,
    currentPhase: "knockout",
    // Don't include sensitive data like passwords!
  }
});
```

### 3. **Set User Context**
Track which users encounter errors:

```typescript
logError(error, {
  user: {
    id: user.id,
    email: user.email, // Only if not sensitive
    username: user.username
  }
});
```

### 4. **Use Appropriate Log Levels**
- **Error**: Unexpected failures that need attention
- **Warning**: Potential issues that should be monitored
- **Info**: Important events (user registered, tournament completed)

### 5. **Don't Log Sensitive Data**
Never include:
- Passwords
- API keys
- Credit card numbers
- Personal identifying information (unless necessary)

---

## Troubleshooting

### Errors Not Appearing in GlitchTip?

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_GLITCHTIP_DSN
   ```

2. **Check GLITCHTIP_ENABLED is true:**
   ```bash
   echo $GLITCHTIP_ENABLED
   ```

3. **Check console for initialization messages:**
   Look for `[GlitchTip] ... error tracking enabled`

4. **Test with the test endpoint:**
   ```
   http://localhost:3000/api/test/glitchtip?type=error
   ```

5. **Check GlitchTip project settings:**
   - Verify DSN is correct
   - Check project is not disabled
   - Review any rate limits

### DSN Format Issues?

Valid DSN format:
```
https://public_key@glitchtip-host.com/project_id
```

Example:
```
https://a1b2c3d4e5f6@app.glitchtip.com/123
```

### Next.js Build Errors?

If you see Sentry plugin errors during build:

1. The Sentry webpack plugin is optional - errors won't affect functionality
2. To disable source map upload warnings, set `silent: true` in `next.config.ts`
3. Remove `org` and `project` settings if not using source maps

---

## Production Checklist

Before deploying to production:

- [ ] Set `GLITCHTIP_ENVIRONMENT=production` in production environment
- [ ] Verify DSN is set in production environment variables
- [ ] Delete test endpoint: `app/api/test/glitchtip/route.ts`
- [ ] Test error tracking works in production
- [ ] Set up alerts in GlitchTip dashboard
- [ ] Configure error notification channels (email, Slack, etc.)
- [ ] Review and adjust sample rates in config files
- [ ] Set up error assignment and triage workflows

---

## Cost & Limits

### GlitchTip Cloud (Free Tier)
- 1,000 events/month free
- Unlimited projects
- 30 days data retention
- Upgrade for more events and features

### Self-Hosted
- No limits
- Full control
- Requires server infrastructure
- Free forever

---

## Next Steps

1. ✅ GlitchTip is now configured
2. 🔄 Replace `console.error()` calls with `logError()` in your API routes
3. 📊 Monitor errors in GlitchTip dashboard
4. 🔔 Set up alerts for critical errors
5. 🧪 Write tests that verify error handling

---

## Resources

- **GlitchTip Documentation**: https://glitchtip.com/documentation
- **GlitchTip Cloud**: https://app.glitchtip.com/
- **Sentry SDK Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **GitHub Issues**: https://gitlab.com/glitchtip/glitchtip-backend

---

## Support

If you need help:
1. Check GlitchTip documentation
2. Review the error-logger.ts utility for examples
3. Test with the test endpoint first
4. Check browser console and server logs for errors

