# Convex Functions - Stancer Integration

This directory contains backend functions for the Benji's Store example using
`convex-stancer`.

## Files

- `convex.config.ts` installs the component.
- `http.ts` keeps an empty HTTP router (no webhook route required).
- `stripe.ts` contains example actions/queries for payment intents and callback
  sync.

## Environment variables

Set these in Convex Dashboard:

```env
STANCER_API_KEY=stest_...
APP_URL=http://localhost:5173
```

## Notes

- This example uses **payment intent + callback sync** (no webhook).
- Stancer customer portal / Stripe-style billing features are not used.
