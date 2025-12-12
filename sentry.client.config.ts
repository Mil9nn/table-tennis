// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const GLITCHTIP_DSN = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;
const GLITCHTIP_ENABLED = process.env.GLITCHTIP_ENABLED === "true";
const GLITCHTIP_ENVIRONMENT = process.env.GLITCHTIP_ENVIRONMENT || "development";

if (GLITCHTIP_DSN && GLITCHTIP_ENABLED) {
  Sentry.init({
    dsn: GLITCHTIP_DSN,

    // Environment (development, staging, production)
    environment: GLITCHTIP_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    // Percentage of transactions to capture (0.0 to 1.0)
    // In production, you might want to lower this to reduce volume
    tracesSampleRate: GLITCHTIP_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: GLITCHTIP_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out errors that aren't useful
    beforeSend(event, hint) {
      // Filter out specific errors
      const error = hint.originalException;

      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);

        // Ignore common non-actionable errors
        if (
          message.includes("ResizeObserver loop") ||
          message.includes("Non-Error promise rejection") ||
          message.includes("Load failed") // Often network issues
        ) {
          return null;
        }
      }

      return event;
    },
  });

  console.log("[GlitchTip] Client-side error tracking enabled");
} else {
  console.log("[GlitchTip] Client-side error tracking disabled");
}
