import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { getUserSubscription } from "@/lib/middleware/subscription";
import { withErrorHandling } from "@/lib/api/http";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { userId } = await requireAuth(req);
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return NextResponse.json({
      subscription: null,
      message: "No subscription found",
    });
  }

  return NextResponse.json({
    subscription: {
      _id: subscription._id,
      tier: subscription.tier,
      status: subscription.status,
      features: subscription.features,
      endDate: subscription.endDate,
      isActive: subscription.isActive(),
    },
  });
});

