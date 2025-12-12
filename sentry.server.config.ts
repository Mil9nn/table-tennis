// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
    tracesSampleRate: GLITCHTIP_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Filter out errors that aren't useful
    beforeSend(event, hint) {
      // You can modify the event here or return null to drop it
      const error = hint.originalException;

      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);

        // Ignore common non-actionable errors
        if (
          message.includes("ECONNREFUSED") ||
          message.includes("ETIMEDOUT")
        ) {
          // Still log these to console for debugging
          console.error("[Server Error]", message);
          return null;
        }
      }

      return event;
    },
  });

  console.log("[GlitchTip] Server-side error tracking enabled");
} else {
  console.log("[GlitchTip] Server-side error tracking disabled");
}
