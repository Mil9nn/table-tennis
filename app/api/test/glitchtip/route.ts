/**
 * GlitchTip Test Endpoint
 *
 * Use this endpoint to test your GlitchTip integration
 * DELETE THIS FILE before deploying to production
 *
 * Test routes:
 * - GET /api/test/glitchtip?type=error - Test error logging
 * - GET /api/test/glitchtip?type=warning - Test warning logging
 * - GET /api/test/glitchtip?type=info - Test info logging
 * - GET /api/test/glitchtip?type=exception - Test exception capturing
 */

import { NextRequest, NextResponse } from "next/server";
import { logError, logWarning, logInfo } from "@/lib/error-logger";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const testType = searchParams.get("type") || "error";

  try {
    switch (testType) {
      case "error":
        logError("Test error from GlitchTip test endpoint", {
          tags: {
            test: "true",
            endpoint: "glitchtip-test",
          },
          extra: {
            timestamp: new Date().toISOString(),
            testType: "error",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Error logged successfully",
          type: "error",
          glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
          hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        });

      case "warning":
        logWarning("Test warning from GlitchTip test endpoint", {
          tags: {
            test: "true",
            endpoint: "glitchtip-test",
          },
          extra: {
            timestamp: new Date().toISOString(),
            testType: "warning",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Warning logged successfully",
          type: "warning",
          glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
          hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        });

      case "info":
        logInfo("Test info message from GlitchTip test endpoint", {
          tags: {
            test: "true",
            endpoint: "glitchtip-test",
          },
          extra: {
            timestamp: new Date().toISOString(),
            testType: "info",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Info logged successfully",
          type: "info",
          glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
          hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        });

      case "exception":
        try {
          // Intentionally throw an error
          throw new Error("Test exception from GlitchTip test endpoint");
        } catch (error) {
          logError(error, {
            tags: {
              test: "true",
              endpoint: "glitchtip-test",
            },
            extra: {
              timestamp: new Date().toISOString(),
              testType: "exception",
            },
          });
          return NextResponse.json({
            success: true,
            message: "Exception captured successfully",
            type: "exception",
            glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
            hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
          });
        }

      case "user-context":
        logError("Test error with user context", {
          user: {
            id: "test-user-123",
            email: "test@example.com",
            username: "testuser",
          },
          tags: {
            test: "true",
            endpoint: "glitchtip-test",
            feature: "user-context",
          },
          extra: {
            timestamp: new Date().toISOString(),
            testType: "user-context",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Error with user context logged successfully",
          type: "user-context",
          glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
          hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        });

      case "transaction":
        const transaction = Sentry.startSpan(
          {
            name: "test-transaction",
            op: "test",
          },
          (span) => {
            // Simulate some work
            const start = Date.now();
            while (Date.now() - start < 100) {
              // Wait 100ms
            }
            return span;
          }
        );

        return NextResponse.json({
          success: true,
          message: "Transaction created successfully",
          type: "transaction",
          glitchtipEnabled: process.env.GLITCHTIP_ENABLED === "true",
          hasDSN: !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid test type",
            validTypes: [
              "error",
              "warning",
              "info",
              "exception",
              "user-context",
              "transaction",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in GlitchTip test endpoint:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
