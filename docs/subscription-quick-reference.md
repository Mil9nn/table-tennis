# Subscription Model - Quick Reference

## At a Glance

| Tier | Price/Year | Best For | Key Limits |
|------|-----------|----------|------------|
| **Free** | $0 | Casual players | 2 tournaments/yr, 16 participants, no analytics |
| **Pro** | $49 | Serious players & organizers | 10 tournaments/yr, 50 participants, full analytics |
| **Premium** | $149 | Clubs & professionals | Unlimited everything + branding |
| **Enterprise** | Custom | Organizations & leagues | White-label + API access |

---

## Quick Decision Guide

### Choose FREE if you:
- Play casually and join others' tournaments
- Want to organize 1-2 small tournaments per year
- Don't need advanced statistics

### Choose PRO if you:
- Want detailed analytics and insights
- Organize regular tournaments (5-10 per year)
- Need to delegate scoring to others (up to 3 scorers)
- Want to export your data

### Choose PREMIUM if you:
- Run a club or organize many tournaments
- Need custom branding
- Want unlimited participants
- Need more scorers (up to 10)
- Want priority support

### Choose ENTERPRISE if you:
- Represent an organization or league
- Need API access or white-labeling
- Require custom features
- Need SLA guarantees

---

## Feature Quick Reference

### Analytics & Stats
| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Basic stats (W/L, sets) | ✅ | ✅ | ✅ |
| Match history | 20 | Unlimited | Unlimited |
| Weaknesses analysis | ❌ | ✅ | ✅ |
| Shot effectiveness | ❌ | ✅ | ✅ |
| AI insights | ❌ | ✅ | ✅ |
| Opponent patterns | ❌ | ❌ | ✅ |
| Data exports (PDF/CSV) | ❌ | ✅ | ✅ |

### Tournament Organizing
| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Tournaments/year | 2 | 10 | Unlimited |
| Max participants | 16 | 50 | Unlimited |
| Formats | Round-robin | All | All |
| Scorers | 0 (self only) | 3 | 10 |
| Custom branding | ❌ | ❌ | ✅ |
| Export brackets/results | ❌ | ✅ | ✅ |

---

## Implementation Phases

### Phase 1: Backend (Week 1)
- Database models (Subscription, Payment)
- Stripe integration
- User/Tournament model updates

### Phase 2: API (Week 2)
- Subscription endpoints
- Feature gating
- Export endpoints (PDF/CSV)

### Phase 3: Frontend (Week 3)
- Pricing page
- Subscription dashboard
- Upgrade modals & gates
- Stripe checkout flow

### Phase 4: Migration (Week 4)
- Set all existing users to Free tier
- Stripe products setup

### Phase 5: Launch (Week 5)
- Testing & security audit
- Beta launch
- Full release

---

## Key Files to Create

**Backend (11 files):**
- models/Subscription.ts
- models/Payment.ts
- lib/stripe.ts
- lib/middleware/subscription.ts
- lib/subscription-helpers.ts
- app/api/subscription/* (6 route files)

**Frontend (12 files):**
- components/subscription/* (5 components)
- stores/useSubscriptionStore.ts
- app/pricing/page.tsx
- app/subscription/* (3 pages)
- lib/subscription-client.ts

**Modified (11 files):**
- models/User.ts, Tournament.ts
- app/api/tournaments/*, profile/*
- components/tournaments/*, profile/*, ui/Navbar.tsx

---

## Revenue Projections

**Conservative Estimate (100 users):**
- 90 Free = $0
- 7 Pro ($49) = $343
- 3 Premium ($149) = $447
- **Total: $790/year**

**Moderate Estimate (500 users):**
- 425 Free = $0
- 50 Pro ($49) = $2,450
- 25 Premium ($149) = $3,725
- **Total: $6,175/year**

**Optimistic Estimate (1000 users):**
- 850 Free = $0
- 100 Pro ($49) = $4,900
- 50 Premium ($149) = $7,450
- **Total: $12,350/year**

*Assumes 5% Pro conversion, 5% Premium conversion*

---

## Next Steps

1. ✅ Plan approved
2. ⏳ Set up Stripe account
3. ⏳ Get Stripe API keys
4. ⏳ Start Phase 1 implementation
5. ⏳ Test with beta users
6. ⏳ Launch!

---

**Questions?** See `/docs/subscription-model.md` for full details.
