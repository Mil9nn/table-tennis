# Stripe Implementation Guide

This guide will help you set up Stripe payments for your table tennis application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard
3. Your application's environment variables file (`.env.local`)

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

   **Important:** Use test keys (`pk_test_` and `sk_test_`) for development, and live keys (`pk_live_` and `sk_live_`) for production.

## Step 2: Create Products and Prices in Stripe

### For Testing (₹2/month and ₹2/year):

1. Go to **Products** in your Stripe Dashboard
2. Click **+ Add product**
3. Create **Pro Monthly** product:
   - **Name:** Pro Monthly
   - **Description:** Pro subscription - Monthly billing
   - **Pricing model:** Recurring
   - **Price:** ₹2.00
   - **Billing period:** Monthly
   - Click **Save**
   - **Copy the Price ID** (starts with `price_`)

4. Create **Pro Yearly** product:
   - **Name:** Pro Yearly
   - **Description:** Pro subscription - Yearly billing
   - **Pricing model:** Recurring
   - **Price:** ₹2.00
   - **Billing period:** Yearly
   - Click **Save**
   - **Copy the Price ID** (starts with `price_`)

### For Production (₹69/month and ₹350/year):

When ready for production, create products with:
- **Pro Monthly:** ₹69.00 per month
- **Pro Yearly:** ₹350.00 per year

## Step 3: Set Up Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Your Stripe Secret Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # Your Stripe Publishable Key

# Stripe Price IDs (from Step 2)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx  # Pro Monthly Price ID
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx   # Pro Yearly Price ID

# Stripe Webhook Secret (see Step 4)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your application about subscription events (payments, cancellations, etc.).

### Local Development (using Stripe CLI):

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

### Production:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add endpoint**
3. **Endpoint URL:** `https://yourdomain.com/api/subscription/webhook`
4. **Events to send:** Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Click on the endpoint and copy the **Signing secret** (starts with `whsec_`)
7. Add it to your production environment variables

## Step 5: Update Code for Production Prices

When ready to go live, update the prices in:

1. **`lib/stripe.ts`** - Update `SUBSCRIPTION_PRICES`:
   ```typescript
   export const SUBSCRIPTION_PRICES = {
     free: 0,
     pro_monthly: 6900, // ₹69/month
     pro_yearly: 35000, // ₹350/year
   };
   ```

2. **`app/subscription/page.tsx`** - Update displayed prices
3. **`app/pricing/page.tsx`** - Update displayed prices
4. **`components/paywall/LockedContent.tsx`** - Update displayed prices

## Step 6: Test the Integration

### Test Cards (Stripe Test Mode):

Use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

Use any:
- **Expiry:** Future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Testing Flow:

1. Start your development server
2. Navigate to `/pricing` or `/subscription`
3. Click "Subscribe Monthly" or "Subscribe Yearly"
4. You'll be redirected to Stripe Checkout
5. Use test card `4242 4242 4242 4242`
6. Complete the payment
7. You'll be redirected back to `/subscription/success`
8. Check your Stripe Dashboard → **Customers** to see the subscription
9. Check your database to verify the subscription was created

## Step 7: Handle Currency (INR)

Stripe supports INR (Indian Rupees). Make sure:

1. Your Stripe account is set to accept INR
2. In Stripe Dashboard → **Settings** → **Business settings** → **Customer billing**, ensure INR is enabled
3. When creating prices, select **INR** as the currency

## Step 8: Production Checklist

Before going live:

- [ ] Switch to live API keys (`pk_live_` and `sk_live_`)
- [ ] Create production products with real prices (₹69/month, ₹350/year)
- [ ] Set up production webhook endpoint
- [ ] Update all price displays in the UI
- [ ] Test with real payment method (use small amount first)
- [ ] Set up email notifications for failed payments
- [ ] Configure customer portal for subscription management
- [ ] Test subscription cancellation flow
- [ ] Test subscription renewal flow

## Troubleshooting

### Common Issues:

1. **"Stripe is not configured" error:**
   - Check that `STRIPE_SECRET_KEY` is set in `.env.local`
   - Restart your development server after adding env variables

2. **Webhook signature verification fails:**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
   - For local development, use the secret from `stripe listen` command

3. **Price ID not found:**
   - Verify the Price IDs in `.env.local` match the ones in Stripe Dashboard
   - Ensure you're using test Price IDs in test mode and live Price IDs in production

4. **Payment succeeds but subscription not created:**
   - Check webhook logs in Stripe Dashboard
   - Verify webhook endpoint is accessible
   - Check server logs for errors

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Support

If you encounter issues:
1. Check Stripe Dashboard → **Developers** → **Logs** for errors
2. Check your application logs
3. Verify all environment variables are set correctly
4. Ensure webhook endpoint is accessible and returning 200 status

