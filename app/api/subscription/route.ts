import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { withErrorHandling } from "@/lib/api/http";
import { getUserSubscription } from "@/lib/middleware/subscription";
import { getSubscriptionSummary } from "@/lib/subscription-helpers";

/**
 * GET /api/subscription
 * Get current user's subscription details
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { userId } = await requireAuth(req);

  const summary = await getSubscriptionSummary(userId);

  if (!summary) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(summary);
});
