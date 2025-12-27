# Razorpay Implementation Guide

This guide will help you set up Razorpay payments for your table tennis application.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Access to your Razorpay Dashboard
3. Your application's environment variables file (`.env.local`)

## Step 1: Get Your Razorpay API Keys

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. You'll see two keys:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (starts with `...`)

   **Important:** Use test keys (`rzp_test_`) for development, and live keys (`rzp_live_`) for production.

4. Click **Generate Test Keys** if you haven't already

## Step 2: Create Plans in Razorpay

### For Testing (₹2/month and ₹2/year):

1. Go to **Settings** → **Plans** in your Razorpay Dashboard
2. Click **+ Create Plan**
3. Create **Pro Monthly** plan:
   - **Plan Name:** Pro Monthly
   - **Description:** Pro subscription - Monthly billing
   - **Billing Period:** Monthly
   - **Amount:** ₹2.00 (200 paise)
   - Click **Create Plan**
   - **Copy the Plan ID** (starts with `plan_`)

4. Create **Pro Yearly** plan:
   - **Plan Name:** Pro Yearly
   - **Description:** Pro subscription - Yearly billing
   - **Billing Period:** Yearly
   - **Amount:** ₹2.00 (200 paise)
   - Click **Create Plan**
   - **Copy the Plan ID** (starts with `plan_`)

### For Production (₹69/month and ₹350/year):

When ready for production, create plans with:
- **Pro Monthly:** ₹69.00 per month
- **Pro Yearly:** ₹350.00 per year

## Step 3: Set Up Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx  # Your Razorpay Key ID
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx  # Your Razorpay Key Secret

# Razorpay Plan IDs (from Step 2)
RAZORPAY_PLAN_PRO_MONTHLY=plan_xxxxxxxxxxxxx  # Pro Monthly Plan ID
RAZORPAY_PLAN_PRO_YEARLY=plan_xxxxxxxxxxxxx   # Pro Yearly Plan ID

# Razorpay Webhook Secret (see Step 4)
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxx
```

## Step 4: Set Up Webhooks

Webhooks allow Razorpay to notify your application about subscription events (payments, cancellations, etc.).

### Local Development (using Razorpay CLI or ngrok):

1. Install [ngrok](https://ngrok.com/) or use Razorpay's webhook testing tool
2. Expose your local server:
   ```bash
   ngrok http 3000
   ```
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Production:

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click **+ New Webhook**
3. **Webhook URL:** `https://yourdomain.com/api/subscription/webhook`
4. **Events to send:** Select these events:
   - `subscription.activated`
   - `subscription.charged`
   - `payment.captured`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
5. Click **Create Webhook**
6. Copy the **Webhook Secret** and add it to your environment variables

## Step 5: Update Code for Production Prices

When ready to go live, update the prices in:

1. **`lib/razorpay.ts`** - Update `SUBSCRIPTION_PRICES`:
   ```typescript
   export const SUBSCRIPTION_PRICES = {
     free: 0,
     pro_monthly: 6900, // ₹69/month (6900 paise)
     pro_yearly: 35000, // ₹350/year (35000 paise)
   };
   ```

2. **`app/subscription/page.tsx`** - Update displayed prices
3. **`app/pricing/page.tsx`** - Update displayed prices
4. **`components/paywall/LockedContent.tsx`** - Update displayed prices

## Step 6: Test the Integration

### Test Cards (Razorpay Test Mode):

Use these test card numbers:
- **Success:** `4111 1111 1111 1111`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

Use any:
- **Expiry:** Future date (e.g., 12/25)
- **CVV:** Any 3 digits (e.g., 123)
- **Name:** Any name

### Testing Flow:

1. Start your development server
2. Navigate to `/pricing` or `/subscription`
3. Click "Subscribe Monthly" or "Subscribe Yearly"
4. You'll be redirected to Razorpay Checkout
5. Use test card `4111 1111 1111 1111`
6. Complete the payment
7. You'll be redirected back to `/subscription/success`
8. Check your Razorpay Dashboard → **Subscriptions** to see the subscription
9. Check your database to verify the subscription was created

## Step 7: Handle Currency (INR)

Razorpay uses INR (Indian Rupees) by default. Make sure:

1. All amounts are in paise (smallest currency unit)
   - ₹1 = 100 paise
   - ₹69 = 6900 paise
   - ₹350 = 35000 paise

2. Currency is set to "INR" in all payment operations

## Step 8: Production Checklist

Before going live:

- [ ] Switch to live API keys (`rzp_live_`)
- [ ] Create production plans with real prices (₹69/month, ₹350/year)
- [ ] Set up production webhook endpoint
- [ ] Update all price displays in the UI
- [ ] Test with real payment method (use small amount first)
- [ ] Set up email notifications for failed payments
- [ ] Test subscription cancellation flow
- [ ] Test subscription renewal flow
- [ ] Verify webhook signature verification is working
- [ ] Test subscription pause/resume functionality

## Differences from Stripe

### Key Differences:

1. **Currency:** Razorpay uses INR (Indian Rupees) and amounts in paise
2. **Customer Portal:** Razorpay doesn't have a built-in customer portal like Stripe. Users manage subscriptions through your application UI
3. **Webhook Events:** Razorpay uses different event names (e.g., `subscription.activated` instead of `checkout.session.completed`)
4. **Plans vs Prices:** Razorpay uses "Plans" instead of "Prices"
5. **Payment Links:** Razorpay uses payment links for checkout instead of checkout sessions

### Migration Notes:

- All Stripe-specific fields have been replaced with Razorpay equivalents
- `stripeCustomerId` → `razorpayCustomerId`
- `stripeSubscriptionId` → `razorpaySubscriptionId`
- `stripePriceId` → `razorpayPlanId`
- `stripePaymentIntentId` → `razorpayPaymentId`

## Troubleshooting

### Common Issues:

1. **"Razorpay is not configured" error:**
   - Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env.local`
   - Restart your development server after adding env variables

2. **Webhook signature verification fails:**
   - Ensure `RAZORPAY_WEBHOOK_SECRET` matches the webhook secret from Razorpay Dashboard
   - Verify the webhook URL is accessible and returning 200 status

3. **Plan ID not found:**
   - Verify the Plan IDs in `.env.local` match the ones in Razorpay Dashboard
   - Ensure you're using test Plan IDs in test mode and live Plan IDs in production

4. **Payment succeeds but subscription not created:**
   - Check webhook logs in Razorpay Dashboard
   - Verify webhook endpoint is accessible
   - Check server logs for errors
   - Ensure webhook events are properly configured

5. **Amount mismatch:**
   - Remember Razorpay uses paise (smallest currency unit)
   - ₹69 = 6900 paise, not 69

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Subscriptions Guide](https://razorpay.com/docs/payments/subscriptions/)
- [Razorpay Webhooks Guide](https://razorpay.com/docs/webhooks/)
- [Razorpay Testing Guide](https://razorpay.com/docs/payments/test-cards/)

## Support

If you encounter issues:

1. Check Razorpay Dashboard → **Logs** for errors
2. Check your application logs
3. Verify all environment variables are set correctly
4. Ensure webhook endpoint is accessible and returning 200 status
5. Contact Razorpay support at support@razorpay.com

