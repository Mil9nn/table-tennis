# Environment Variables Setup

This document outlines all environment variables needed for the Table Tennis Platform, including the new subscription features.

## Required Variables

### Database
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```
MongoDB connection string. Must start with `mongodb://` or `mongodb+srv://`.

### Authentication
```env
JWT_SECRET=your-secret-key-at-least-24-characters-long
```
Secret key for signing JWT tokens. Must be at least 24 characters.

**Generate a secure secret:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Cloudinary (Image Storage)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get these from your [Cloudinary Dashboard](https://cloudinary.com/console).

---

## Optional Variables

### Stripe (Subscription Features)

**Note:** Stripe is optional. The platform works without it, but subscription features won't be available.

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Stripe Product Price IDs (get these after creating products in Stripe)
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

**How to get Stripe keys:**

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Go to [Dashboard > Developers > API keys](https://dashboard.stripe.com/test/apikeys)
3. Copy the "Secret key" and "Publishable key"
4. For webhook secret:
   - Go to [Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - Add endpoint URL: `https://yourdomain.com/api/subscription/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the "Signing secret"

**How to get Price IDs:**

1. Go to [Dashboard > Products](https://dashboard.stripe.com/test/products)
2. Create two products:
   - **Pro Plan**: $49/year
   - **Premium Plan**: $149/year
3. Copy the Price ID for each (looks like `price_...`)

### Upstash Redis (Rate Limiting)
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RATE_LIMIT_ENABLED=true
```

Get these from your [Upstash Console](https://console.upstash.com/).

### Socket.IO (Real-time Features)
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Error Monitoring (GlitchTip/Sentry)
```env
NEXT_PUBLIC_GLITCHTIP_DSN=https://...
GLITCHTIP_ENVIRONMENT=development
GLITCHTIP_ENABLED=false
```

### Server Configuration
```env
NODE_ENV=development # or production
HOSTNAME=localhost
PORT=3000
```

---

## Example .env.local File

Create a `.env.local` file in the project root:

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/table-tennis
JWT_SECRET=your-super-secret-key-at-least-24-characters-long
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (optional - for subscriptions)
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_123...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_PRICE_PRO_YEARLY=price_1ABC...
STRIPE_PRICE_PREMIUM_YEARLY=price_1DEF...

# Upstash Redis (optional)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
RATE_LIMIT_ENABLED=true

# Environment
NODE_ENV=development
```

---

## Testing the Configuration

After setting up your environment variables, test the configuration:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

If there are any missing or invalid environment variables, you'll see clear error messages indicating what needs to be fixed.

---

## Production Deployment

For production (Vercel, etc.):

1. Add all environment variables to your hosting platform
2. Use production Stripe keys (starts with `sk_live_` and `pk_live_`)
3. Set `NODE_ENV=production`
4. Update webhook URL to your production domain

---

## Security Notes

- Never commit `.env.local` to version control (it's in `.gitignore`)
- Never share your secret keys publicly
- Rotate JWT_SECRET regularly
- Use test mode Stripe keys for development
- Use production Stripe keys only in production environment
