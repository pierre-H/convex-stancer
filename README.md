# convex-stancer

A Convex component for integrating Stancer payments with local Convex sync.

This package is a Stancer-first replacement for the previous Stripe component:

- no webhook registration
- no customer portal
- callback-driven payment status sync

## Install

```bash
npm install convex-stancer
```

## Add to Convex

`convex/convex.config.ts`

```ts
import { defineApp } from "convex/server";
import stancer from "convex-stancer/convex.config.js";

const app = defineApp();
app.use(stancer);

export default app;
```

## Environment variables

Add in Convex Dashboard:

| Variable          | Description                                     |
| ----------------- | ----------------------------------------------- |
| `STANCER_API_KEY` | Stancer secret key (`stest_...` or `sprod_...`) |
| `APP_URL`         | Frontend base URL for `return_url` callbacks    |

## Basic usage

`StancerPayments` is server-only. Instantiate and call it from Convex actions or
other trusted server runtimes, never from browser code, because it uses your
`STANCER_API_KEY`.

`convex/stancer.ts`

```ts
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StancerPayments } from "convex-stancer";
import { v } from "convex/values";

const stancer = new StancerPayments(components.stancer);

export const createPaymentIntent = action({
  args: { amount: v.number() },
  returns: v.object({
    paymentIntentId: v.string(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const customer = await stancer.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    return stancer.createPaymentIntent(ctx, {
      amount: args.amount,
      customerId: customer.customerId,
      returnUrl: `${process.env.APP_URL}/payment/callback`,
      metadata: { userId: identity.subject },
    });
  },
});

export const syncPaymentAfterCallback = action({
  args: { paymentIntentId: v.string() },
  returns: v.object({
    paymentIntentId: v.string(),
    paymentId: v.union(v.string(), v.null()),
    status: v.string(),
    amount: v.number(),
    currency: v.string(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    return stancer.syncPaymentIntentStatus(ctx, {
      paymentIntentId: args.paymentIntentId,
    });
  },
});
```

## Callback flow

1. Backend creates payment intent with `return_url`.
2. Frontend redirects user to returned Stancer `url`.
3. Stancer redirects back to your app callback URL.
4. Frontend calls `syncPaymentAfterCallback(paymentIntentId)`.
5. Action fetches latest Stancer status and upserts Convex tables.

## Public queries

Use `components.stancer.public`:

- `getCustomer`, `getCustomerByEmail`, `getCustomerByUserId`
- `getPaymentIntent`, `listPaymentIntents`
- `getPayment`, `getPaymentByPaymentIntent`, `listPayments`,
  `listPaymentsByUserId`, `listPaymentsByOrgId`
- `getSubscription`, `listSubscriptions`, `listSubscriptionsByUserId`,
  `listSubscriptionsByOrgId`
- `listRefundsByPaymentId`, `listRefundsByPaymentIntentId`

## Notes

- Stancer has no webhook model in this component flow.
- `StancerPayments` must run on the server. Browser runtimes are rejected
  explicitly to avoid leaking `STANCER_API_KEY`.
- Status consistency depends on explicit sync calls (typically after callback).
- If your app cannot recover the `paymentIntentId` from the callback request
  itself, keep a correlation id on your side before redirecting to Stancer so
  the callback page can trigger `syncPaymentAfterCallback` reliably.

## Legal notice

`convex-stancer` is an independent, unofficial, community-maintained package.
It is not an official Stancer product and is not affiliated with, endorsed by,
approved by, sponsored by, or otherwise associated with Stancer, its
affiliates, or its licensors.

The name "Stancer" is used solely for descriptive and nominative purposes to
indicate compatibility with and integration of the Stancer payment platform.
No claim of ownership, partnership, authorization, certification, or exclusive
relationship with Stancer is made by this project.

"Stancer", related brand names, logos, service marks, trademarks, and other
distinctive signs are and remain the property of their respective owners. This
project does not grant any right, title, or interest in or to any Stancer
intellectual property. Any use of third-party names or marks in this repository
is strictly informational.

If you are the owner or representative of the Stancer brand and believe any
reference in this repository is inaccurate or inappropriate, please open an
issue so it can be reviewed and corrected promptly.
