# Stripe Setup Guide - Test Mode vs Production

## Overview
Your app needs different configurations for Stripe **Test Mode** (development/testing) and **Live Mode** (production).

---

## 1. Stripe API Keys Configuration

### Test Mode (Development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Mode Secret Key** (starts with `sk_test_`)
3. Update Supabase secret:
   ```bash
   # In Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   ```

### Production Mode
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (toggle to Live mode)
2. Copy your **Live Mode Secret Key** (starts with `sk_live_`)
3. Update Supabase secret with live key:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

---

## 2. Product & Price IDs

### Current Test Price IDs (in code):
- **Pro**: `price_1SH1jRL8Zm4LqDn4M49yf60W`
- **Ultra Pro**: `price_1SH1jpL8Zm4LqDn4zN9CGBpC`

### For Production:
1. Create products in **Live Mode** Stripe Dashboard
2. Get the live mode price IDs (start with `price_`)
3. Update in these files:
   - `src/pages/Pricing.tsx` (lines 154-157)
   - `src/pages/PricingPlans.tsx` (lines 165-168)

---

## 3. Stripe Webhooks Configuration

### Test Mode Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Supabase secrets:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Live Mode Webhook
1. Toggle Stripe to **Live Mode**
2. Repeat steps above but use Live mode webhook secret
3. Update `STRIPE_WEBHOOK_SECRET` with live secret

---

## 4. Stripe Customer Portal Setup

### Required for subscription management:
1. Go to [Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the portal
3. Configure which actions customers can perform:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
4. Do this for **both Test and Live modes**

---

## 5. Testing Workflow

### Test Mode Testing:
1. Set `STRIPE_SECRET_KEY` to test key
2. Use [Stripe test cards](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Test subscription flow end-to-end
4. Check webhook logs in Stripe Dashboard

### Before Going Live:
- [ ] Switch `STRIPE_SECRET_KEY` to live key
- [ ] Update price IDs to live mode prices
- [ ] Configure live mode webhook
- [ ] Enable live mode Customer Portal
- [ ] Test with real card (small amount)

---

## 6. Environment Detection (Already Fixed)

✅ **Auth redirects** - Now use `window.location.origin`
✅ **Checkout success/cancel URLs** - Now use request origin
✅ **Customer portal return URL** - Already dynamic

This means the same code works in:
- Local development (`http://localhost`)
- Test environment
- Production (`https://chatl.ai`)

---

## 7. Security Checklist

- [ ] Never commit secret keys to git
- [ ] Use Supabase secrets for all keys
- [ ] Verify webhook signatures (already implemented)
- [ ] Test subscription cancellations
- [ ] Test failed payment handling
- [ ] Monitor Stripe Dashboard for issues

---

## 8. Common Issues

### Webhook not receiving events
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Supabase edge function logs

### Wrong environment
- Verify you're using matching keys/products (test with test, live with live)
- Can't mix test keys with live products

### Subscription not updating
- Check webhook events are reaching your endpoint
- Verify user email matches between Supabase and Stripe
- Check edge function logs: `check-subscription`, `stripe-webhook`

---

## Quick Reference

| Component | Test Mode | Live Mode |
|-----------|-----------|-----------|
| API Key | `sk_test_...` | `sk_live_...` |
| Products | Test products | Live products |
| Webhook Secret | `whsec_test_...` | `whsec_live_...` |
| Dashboard | Toggle OFF | Toggle ON |

---

## Supabase Dashboard Links

- [Edge Functions Secrets](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/settings/functions)
- [Edge Function Logs - stripe-webhook](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/stripe-webhook/logs)
- [Edge Function Logs - check-subscription](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/check-subscription/logs)
- [Edge Function Logs - create-checkout](https://supabase.com/dashboard/project/lciaiunzacgvvbvcshdh/functions/create-checkout/logs)
