// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc.)
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is separate from the Node.js server config in sentry.server.config.ts.
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
    tracesSampleRate: GLITCHTIP_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });

  console.log("[GlitchTip] Edge runtime error tracking enabled");
} else {
  console.log("[GlitchTip] Edge runtime error tracking disabled");
}
