# Benji's Store - Example App

Example frontend app using `convex-stancer` + Clerk authentication.

## What it demonstrates

- One-time and recurring-style payment intents
- Customer creation/linking
- Callback-based payment status sync
- User and team views backed by Convex queries

## Quick setup

1. Install dependencies: `npm install`
2. Configure Clerk in `.env.local`
3. Configure product IDs in `.env.local`:

```env
VITE_STANCER_ONE_TIME_PRODUCT_ID=product_one_time
VITE_STANCER_SUBSCRIPTION_PRODUCT_ID=product_subscription
```

4. Set Convex environment variables:

```env
STANCER_API_KEY=stest_...
APP_URL=http://localhost:5173
```

5. Start development: `npm run dev`

## Important

Stancer integration in this example does not use webhooks. The frontend is
expected to call a backend sync action after redirect/callback.

## Callback flow in this example

1. The frontend creates a payment intent through Convex.
2. Before redirecting to Stancer, the frontend stores the returned
   `paymentIntentId` in `sessionStorage`.
3. Stancer redirects the browser to `/payment/callback`.
4. The callback page calls the backend `syncPaymentAfterCallback` action.
5. Convex fetches the latest Stancer state and updates local tables.
6. The callback page redirects back to the relevant app page with a real
   payment result (`success`, `pending`, or `error`).

## Limitation

The example callback flow assumes the user returns in the same browser session,
because the example stores the `paymentIntentId` locally before leaving for the
hosted payment page. If you need a cross-device or cross-session callback flow,
you should add a server-side correlation mechanism instead of relying on
browser storage.

## Manual test checklist

### One-time checkout

1. Sign in.
2. Start a one-time purchase from the store page.
3. Complete the hosted Stancer payment flow.
4. Confirm the browser lands on `/payment/callback` before returning to the app.
5. Confirm the app shows a `Payment confirmed` or `Payment submitted` notice.
6. Confirm the new payment appears in the profile order history.

### Team checkout

1. Sign in.
2. Open the team billing page.
3. Start a team subscription checkout.
4. Complete the hosted Stancer payment flow.
5. Confirm the callback returns to the team page.
6. Confirm the resulting payment appears in the organization-backed payment views.

### Callback retry path

1. Start a checkout flow.
2. Force the callback sync to fail temporarily, for example by stopping the local backend.
3. Confirm the callback page stays visible and shows the retry controls.
4. Restore the backend.
5. Click `Retry confirmation`.
6. Confirm the app redirects back with the final payment notice.

### Missing callback context

1. Open `/payment/callback` directly in a fresh browser session.
2. Confirm the page explains that the callback is missing payment context.
3. Confirm `Return to app` sends you back to the relevant app page with an error notice.
