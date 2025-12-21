import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getTierFromPriceId } from "@/lib/stripe";
import {
  createSubscription,
  updateSubscriptionTier,
  renewSubscription,
  expireSubscription,
  syncSubscriptionWithStripe,
} from "@/lib/subscription-helpers";
import { connectDB } from "@/lib/mongodb";
import { Subscription } from "@/models/Subscription";
import Stripe from "stripe";

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events
 *
 * Important: This endpoint must be configured in Stripe Dashboard
 * Events to listen for:
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("❌ Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`✅ Received Stripe webhook: ${event.type}`);

    await connectDB();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
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
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  const tier = session.metadata?.tier as "pro" | "premium";

  if (!userId || !tier) {
    console.error("❌ Missing userId or tier in checkout session metadata");
    return;
  }

  console.log(`✅ Creating ${tier} subscription for user ${userId}`);

  // Get subscription details from Stripe
  const stripeSubscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get the price ID from the subscription
  let stripePriceId = "";
  if (session.line_items && session.line_items.data.length > 0) {
    stripePriceId = session.line_items.data[0]?.price?.id || "";
  }

  // Create or update subscription in database
  // Note: Trial days would need to be fetched from the subscription object separately if needed
  await createSubscription(userId, tier, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: stripeSubscriptionId,
    stripePriceId: stripePriceId,
  });

  console.log(`✅ Subscription created successfully for user ${userId}`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = (invoice as any).subscription as string;

  if (!stripeSubscriptionId) {
    console.log("⚠️  Invoice has no subscription - skipping");
    return;
  }

  // Find subscription by Stripe subscription ID
  const subscription = await Subscription.findOne({ stripeSubscriptionId });

  if (!subscription) {
    console.error(`❌ Subscription not found for Stripe ID: ${stripeSubscriptionId}`);
    return;
  }

  console.log(`✅ Payment succeeded for subscription ${subscription._id}`);

  // Renew the subscription
  await renewSubscription(subscription._id.toString(), {
    amount: (invoice as any).amount_paid,
    stripePaymentIntentId: (invoice as any).payment_intent as string,
    stripeInvoiceId: invoice.id,
  });

  console.log(`✅ Subscription renewed for user ${subscription.user}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = (invoice as any).subscription as string;

  if (!stripeSubscriptionId) {
    console.log("⚠️  Invoice has no subscription - skipping");
    return;
  }

  const subscription = await Subscription.findOne({ stripeSubscriptionId });

  if (!subscription) {
    console.error(`❌ Subscription not found for Stripe ID: ${stripeSubscriptionId}`);
    return;
  }

  console.log(`❌ Payment failed for subscription ${subscription._id}`);

  // Update subscription status to past_due
  subscription.status = "past_due";
  await subscription.save();

  // TODO: Send email notification to user about failed payment
  console.log(`⚠️  Subscription ${subscription._id} marked as past_due`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription) {
    console.error(`❌ Subscription not found for Stripe ID: ${stripeSubscription.id}`);
    return;
  }

  console.log(`✅ Syncing subscription ${subscription._id} from Stripe`);

  // Sync subscription data from Stripe
  await syncSubscriptionWithStripe(subscription._id.toString());

  // Check if tier changed (e.g., upgraded/downgraded)
  const newTier = getTierFromPriceId(stripeSubscription.items.data[0]?.price.id || "");

  if (newTier !== subscription.tier && newTier !== "free") {
    console.log(`✅ Updating subscription tier from ${subscription.tier} to ${newTier}`);
    await updateSubscriptionTier(subscription.user.toString(), newTier);
  }

  console.log(`✅ Subscription ${subscription._id} synced successfully`);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription) {
    console.error(`❌ Subscription not found for Stripe ID: ${stripeSubscription.id}`);
    return;
  }

  console.log(`✅ Expiring subscription ${subscription._id}`);

  // Expire the subscription (downgrade to free tier)
  await expireSubscription(subscription._id.toString());

  console.log(`✅ Subscription ${subscription._id} expired and downgraded to free`);
}
