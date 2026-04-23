# Payton's Art Club — v10 / Pass D-2: Stripe Premium Tier 💳

## What's new

### For kids
- **Lock icons on bonus worlds** when the parent hasn't subscribed. Dino Land, Fairy Garden, Food Friends, and Vehicle Village now show 🔒 Unlock instead of ⭐ Bonus.
- **Kid-friendly upsell screen** when they try to enter a locked world: *"{World name} is a bonus world! Ask a grown-up to unlock."* — with a big button that takes them to the parent dashboard.

### For parents
- **Subscription section on parent dashboard** with three states:
  - **Not subscribed**: "Start free trial" button (7-day trial, then $4.99/month)
  - **Active / Trialing**: Shows status + renewal/trial-end date + "Manage subscription" button (opens Stripe billing portal)
  - **Past due**: Flags payment issue but keeps premium access (Stripe's normal grace period)
- **Automatic status updates** via Stripe webhook — when someone subscribes/cancels/upgrades, the app reflects it within seconds.
- **Success and cancel banners** after returning from Stripe checkout.

### Graceful degradation 🎁
**If you don't configure Stripe, nothing breaks.** The premium gating is silently disabled — all worlds stay free, no upsell screens, no subscription section on the parent dashboard. The app behaves exactly like v9 until you actually set up Stripe. **You can deploy v10 safely today and add Stripe later.**

---

## How to apply

### Step 1: Run the Stripe schema SQL

1. Supabase → SQL Editor → **New query**
2. Paste contents of `supabase/stripe_schema.sql`
3. Click **Run**
4. Should say "Success"

This creates: `parents` table with RLS, `my_entitlement` view, signup trigger, backfills existing users.

### Step 2: Deploy the code (Stripe-free mode)

At this point you can already ship v10. Stripe is not required.

1. Back up v9 folder, unzip v10, copy `.git` over
2. `git add . && git commit -m "v10: stripe premium tier (graceful degradation)" && git push`
3. Vercel will auto-deploy in 2-3 minutes
4. Hard refresh live site

**After this step, everything works exactly like v9.** Free mode, all worlds accessible, no upsells.

### Step 3 (OPTIONAL): Set up Stripe

Do this only if you actually want to start charging for premium. Skip if Payton is the only user.

#### 3a. Create a Stripe account

1. Go to https://stripe.com → Sign up
2. Use test mode initially (toggle in dashboard top-right). Test mode lets you use fake card numbers.

#### 3b. Create the product + price

1. Stripe Dashboard → **Products** → **Add product**
2. Name: "Payton's Art Club Premium"
3. Pricing: Recurring, $4.99 USD, billed monthly
4. Save. Copy the **Price ID** (starts with `price_...`) — you'll need it

#### 3c. Get your API keys

1. Stripe Dashboard → **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)

#### 3d. Add environment variables to Vercel

1. Vercel → your project → Settings → **Environment Variables**
2. Add these:

```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=<from Supabase settings → API → service_role>
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

3. Apply to: Production (and Preview if you want trial there too)
4. Redeploy the project so env vars take effect

#### 3e. Set up the webhook

This is the critical step for subscriptions to actually activate. Without the webhook, users can pay but their `has_premium` flag never flips.

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://your-site.vercel.app/api/stripe/webhook`
3. **Events to listen for** (click "Select events" and add these):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. On the endpoint detail page, find **Signing secret** → Reveal → Copy it (starts with `whsec_...`)
6. Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Redeploy so the webhook handler can verify signatures

#### 3f. Test the full flow

Using Stripe **test mode**:

1. Go to your live parent dashboard
2. Scroll to subscription section → "Start free trial"
3. Stripe Checkout opens
4. Use Stripe test card: **4242 4242 4242 4242**, any future expiry, any CVC, any zip
5. Complete checkout — should redirect back with "🎉 Subscription started!" banner
6. Wait ~5 seconds, refresh the page — subscription section should show "⭐ Premium active"
7. Go to home → premium worlds should no longer say 🔒 Unlock
8. Click a premium world → should load lessons (not the upsell)

If the banner shows but premium doesn't activate: webhook issue. Stripe Dashboard → Developers → Webhooks → click your endpoint → look at recent deliveries. If all 4xx/5xx: check your STRIPE_WEBHOOK_SECRET is correct and redeployed.

#### 3g. Going live

When ready to charge real money:

1. Stripe Dashboard → toggle from Test to Live mode
2. Re-create your product + price in Live mode (test-mode products don't carry over)
3. Replace env vars in Vercel with `pk_live_...` and `sk_live_...` keys
4. Re-create the webhook endpoint in Live mode with a new signing secret
5. Redeploy

---

## Known limitations / rough edges

- **App Store compliance**: If you ever wrap this as an iOS/Android app, Apple/Google require their in-app purchase (30% cut). This Stripe setup only works for the web version. If you plan to publish to app stores, plan separately for IAP.
- **Stripe Tax**: I enabled automatic tax collection. Depending on your jurisdiction, Stripe may charge a small additional fee (~0.5%) for tax handling.
- **No usage-based pricing**: Flat $4.99/month. If you want tiered or usage-based pricing later, Stripe supports it but needs schema changes.
- **Webhook race**: On first subscribe, there's a brief window (~1-5s) between Stripe Checkout redirecting back and the webhook firing. During that window, the parent dashboard may still show "Start free trial." The UI auto-refreshes on focus/visibility change — usually resolves itself.
- **Shared family access**: Premium is stored on the parent row, so all kids under that parent get access together. If two parents share the app (different auth accounts), they each need their own subscription. There's no "family sharing" flow.
- **No proration preview**: If you change the price later, existing subscribers' changes happen through Stripe's standard proration. I don't surface it in-app.
- **No invoicing UI**: Parents see status + portal link. For invoice downloads, they go through the Stripe portal.

---

## What happens if you DON'T set up Stripe

Nothing. Exactly like v9. The `stripeConfigured` flag is derived from `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` being present. If it's empty, `hasEffectivePremium()` returns `true` for everyone, every world is accessible, and the subscription section on the parent dashboard is hidden entirely.

You can deploy v10 today, decide in a month whether to sell access, and flip it on by adding env vars. No code changes.

---

## What's NOT in this pass

- **Pass D-3: Polish** (sticker flicker deep fix, SVG lesson cleanups, multiplayer stress notes)
- **Pass D-4: Final gap audit + packaging**

Both independent from Stripe. Can ship in either order.

---

## Bigger picture

With v10, Payton's Art Club is now a real SaaS product if you want it to be:
- Custom drawing engine + 31 lessons + 15 tools + 16 avatars
- Multi-kid profiles + parent dashboard + math-gated parent zone
- Friend system with codes and shared galleries
- Real-time multiplayer draw-and-guess game
- Voice recording attached to artwork
- Subscription-based premium tier with 7-day trial

That's a shippable product. If you want to share it with other families, the infrastructure is there. If Payton remains the only user, none of this costs you anything — Supabase free tier covers you until thousands of users, and Stripe only charges fees on real transactions.

Good work. Whatever you decide to do with this, you built something real.
