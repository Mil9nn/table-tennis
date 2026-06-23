import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, getTierFromPlanId } from "@/lib/razorpay";
import {
  createSubscription,
  updateSubscriptionTier,
  renewSubscription,
  expireSubscription,
  syncSubscriptionWithRazorpay,
} from "@/lib/subscription-helpers";
import { connectDB } from "@/lib/mongodb";
import { Subscription } from "@/models/Subscription";

/**
 * POST /api/subscription/webhook
 * Handle Razorpay webhook events
 *
 * Important: This endpoint must be configured in Razorpay Dashboard
 * Events to listen for:
 * - payment.captured
 * - subscription.activated
 * - subscription.charged
 * - subscription.cancelled
 * - subscription.paused
 * - subscription.resumed
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("❌ Missing x-razorpay-signature header");
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    try {
      const isValid = verifyWebhookSignature(body, signature);
      if (!isValid) {
        console.error("❌ Webhook signature verification failed");
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    } catch (err: any) {
      console.error("❌ Webhook signature verification error:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    

    await connectDB();

    // Handle the event
    switch (event.event) {
      case "subscription.activated": {
        const subscription = event.payload.subscription.entity;
        await handleSubscriptionActivated(subscription);
        break;
      }

      case "subscription.charged": {
        const payment = event.payload.payment.entity;
        const subscription = event.payload.subscription.entity;
        await handleSubscriptionCharged(payment, subscription);
        break;
      }

      case "payment.captured": {
        const payment = event.payload.payment.entity;
        await handlePaymentCaptured(payment);
        break;
      }

      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "subscription.paused": {
        const subscription = event.payload.subscription.entity;
        await handleSubscriptionPaused(subscription);
        break;
      }

      case "subscription.resumed": {
        const subscription = event.payload.subscription.entity;
        await handleSubscriptionResumed(subscription);
        break;
      }

      default:
        
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription activated
 */
async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription.notes?.userId;
  const tier = subscription.notes?.tier as "pro";

  if (!userId || !tier) {
    console.error("❌ Missing userId or tier in subscription notes");
    return;
  }

  

  // Get subscription details from Razorpay
  const razorpaySubscriptionId = subscription.id;
  const customerId = subscription.customer_id;
  const planId = subscription.plan_id;

  // Create or update subscription in database
  await createSubscription(userId, tier, {
    razorpayCustomerId: customerId,
    razorpaySubscriptionId: razorpaySubscriptionId,
    razorpayPlanId: planId,
  });

  
}

/**
 * Handle subscription charged (recurring payment)
 */
async function handleSubscriptionCharged(payment: any, subscription: any) {
  const razorpaySubscriptionId = subscription.id;

  if (!razorpaySubscriptionId) {
    
    return;
  }

  // Find subscription by Razorpay subscription ID
  const dbSubscription = await Subscription.findOne({ razorpaySubscriptionId });

  if (!dbSubscription) {
    console.error(`❌ Subscription not found for Razorpay ID: ${razorpaySubscriptionId}`);
    return;
  }

 

  // Renew the subscription
  await renewSubscription(dbSubscription._id.toString(), {
    amount: payment.amount,
    razorpayPaymentId: payment.id,
    razorpayOrderId: payment.order_id,
    razorpayInvoiceId: payment.invoice_id,
  });

  
}

/**
 * Handle payment captured
 */
async function handlePaymentCaptured(payment: any) {
  // This handles one-time payments or initial subscription payments
  // The subscription.charged event is more specific for recurring payments
 
  
  // If this payment is linked to a subscription, handle it
  if (payment.subscription_id) {
    const dbSubscription = await Subscription.findOne({ 
      razorpaySubscriptionId: payment.subscription_id 
    });

    if (dbSubscription) {
      await renewSubscription(dbSubscription._id.toString(), {
        amount: payment.amount,
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        razorpayInvoiceId: payment.invoice_id,
      });
    }
  }
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(subscription: any) {
  const dbSubscription = await Subscription.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription not found for Razorpay ID: ${subscription.id}`);
    return;
  }

  

  // Expire the subscription (downgrade to free tier)
  await expireSubscription(dbSubscription._id.toString());

 
}

/**
 * Handle subscription paused
 */
async function handleSubscriptionPaused(subscription: any) {
  const dbSubscription = await Subscription.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription not found for Razorpay ID: ${subscription.id}`);
    return;
  }

 

  // Mark subscription as cancelled (will expire at period end)
  dbSubscription.status = "cancelled";
  await dbSubscription.save();

  
}

/**
 * Handle subscription resumed
 */
async function handleSubscriptionResumed(subscription: any) {
  const dbSubscription = await Subscription.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (!dbSubscription) {
    console.error(`❌ Subscription not found for Razorpay ID: ${subscription.id}`);
    return;
  }

  
  // Sync subscription data from Razorpay
  await syncSubscriptionWithRazorpay(dbSubscription._id.toString());

  // Check if tier changed
  const newTier = getTierFromPlanId(subscription.plan_id || "");

  if (newTier !== dbSubscription.tier && newTier !== "free") {
    
    await updateSubscriptionTier(dbSubscription.user.toString(), newTier);
  }

}
