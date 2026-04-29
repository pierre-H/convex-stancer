/**
 * Benji's Store - Stancer Integration
 *
 * This file demonstrates how to use the convex-stancer component
 * for handling payments with Clerk authentication.
 */

import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { StancerPayments } from "../../src/client/index.js";
import { v } from "convex/values";

const stancerClient = new StancerPayments(components.stancer, {});

function amountFromPriceId(priceId: string, quantity = 1): number {
  const lower = priceId.toLowerCase();
  if (lower.includes("team")) return 2500 * quantity;
  if (lower.includes("subscription")) return 1500 * quantity;
  if (lower.includes("premium")) return 3999 * quantity;
  return 1999 * quantity;
}

// Validate required environment variables
function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error(
      "APP_URL environment variable is not set. Add it in your Convex dashboard.",
    );
  }
  return url;
}

function buildCallbackUrl(source: "store" | "team", orgId?: string): string {
  const url = new URL("/payment/callback", getAppUrl());
  url.searchParams.set("source", source);
  if (orgId) {
    url.searchParams.set("org", orgId);
  }
  return url.toString();
}

// ============================================================================
// CUSTOMER MANAGEMENT (Customer Creation)
// ============================================================================

/**
 * Create or get a Stancer customer for the current user.
 */
export const getOrCreateCustomer = action({
  args: {},
  returns: v.object({
    customerId: v.string(),
    isNew: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await stancerClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });
  },
});

// ============================================================================
// PAYMENT INTENTS
// ============================================================================

/**
 * Create a payment intent for a recurring-style product.
 */
export const createSubscriptionCheckout = action({
  args: {
    priceId: v.string(),
    quantity: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const customerResult = await stancerClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    const paymentIntent = await stancerClient.createPaymentIntent(ctx, {
      amount: amountFromPriceId(args.priceId, args.quantity ?? 1),
      customerId: customerResult.customerId,
      returnUrl: buildCallbackUrl("store"),
      metadata: {
        userId: identity.subject,
        productType: "hat_subscription",
        priceId: args.priceId,
      },
    });

    return { sessionId: paymentIntent.paymentIntentId, url: paymentIntent.url };
  },
});

/**
 * Create a payment intent for a team purchase.
 */
export const createTeamSubscriptionCheckout = action({
  args: {
    priceId: v.string(),
    orgId: v.string(),
    quantity: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const customerResult = await stancerClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    const paymentIntent = await stancerClient.createPaymentIntent(ctx, {
      amount: amountFromPriceId(args.priceId, args.quantity ?? 1),
      customerId: customerResult.customerId,
      returnUrl: buildCallbackUrl("team", args.orgId),
      metadata: {
        userId: identity.subject,
        orgId: args.orgId,
        productType: "team_subscription",
        priceId: args.priceId,
      },
    });

    return { sessionId: paymentIntent.paymentIntentId, url: paymentIntent.url };
  },
});

/**
 * Create a payment intent for a one-time payment.
 */
export const createPaymentCheckout = action({
  args: {
    priceId: v.string(),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const customerResult = await stancerClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    const paymentIntent = await stancerClient.createPaymentIntent(ctx, {
      amount: amountFromPriceId(args.priceId),
      customerId: customerResult.customerId,
      returnUrl: buildCallbackUrl("store"),
      metadata: {
        userId: identity.subject,
        productType: "hat",
        priceId: args.priceId,
      },
    });

    return { sessionId: paymentIntent.paymentIntentId, url: paymentIntent.url };
  },
});

export const syncPaymentAfterCallback = action({
  args: {
    paymentIntentId: v.string(),
  },
  returns: v.object({
    paymentIntentId: v.string(),
    paymentId: v.union(v.string(), v.null()),
    status: v.string(),
    amount: v.number(),
    currency: v.string(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    return stancerClient.syncPaymentIntentStatus(ctx, {
      paymentIntentId: args.paymentIntentId,
    });
  },
});

// ============================================================================
// SEAT-BASED PRICING (#5 - Quantity/Seats UI)
// ============================================================================

/**
 * Update the seat count for a subscription.
 * Call this when users are added/removed from an organization.
 */
export const updateSeats = action({
  args: {
    subscriptionId: v.string(),
    seatCount: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    throw new Error(
      "Seat updates are not supported in this Stancer example integration.",
    );
  },
});

// ============================================================================
// ORGANIZATION-BASED LOOKUPS (#4 - Team Billing)
// ============================================================================

/**
 * Get subscription for an organization.
 */
export const getOrgSubscription = query({
  args: {
    orgId: v.string(),
  },
  returns: v.union(
    v.object({
      stancerSubscriptionId: v.string(),
      stancerCustomerId: v.string(),
      stancerPaymentIntentId: v.optional(v.string()),
      status: v.string(),
      created: v.number(),
      metadata: v.optional(v.any()),
      userId: v.optional(v.string()),
      orgId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.stancer.public.getSubscriptionByOrgId,
      {
        orgId: args.orgId,
      },
    );
  },
});

/**
 * Get all payments for an organization.
 */
export const getOrgPayments = query({
  args: {
    orgId: v.string(),
  },
  returns: v.array(
    v.object({
      stancerPaymentId: v.string(),
      stancerPaymentIntentId: v.optional(v.string()),
      stancerCustomerId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      status: v.string(),
      created: v.number(),
      metadata: v.optional(v.any()),
      userId: v.optional(v.string()),
      orgId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.stancer.public.listPaymentsByOrgId, {
      orgId: args.orgId,
    });
  },
});

/**
 * Get placeholder invoice-like rows for team billing history.
 * Stancer does not provide Stripe-style invoices in this component.
 */
export const getOrgInvoices = query({
  args: {
    orgId: v.string(),
  },
  returns: v.array(
    v.object({
      stancerInvoiceId: v.string(),
      stancerCustomerId: v.string(),
      stancerSubscriptionId: v.optional(v.string()),
      status: v.string(),
      amountDue: v.number(),
      amountPaid: v.number(),
      created: v.number(),
      orgId: v.optional(v.string()),
      userId: v.optional(v.string()),
    }),
  ),
  handler: async (_ctx, _args) => {
    return [];
  },
});

/**
 * Link subscription to an organization (for team billing).
 */
export const linkSubscriptionToOrg = mutation({
  args: {
    subscriptionId: v.string(),
    orgId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      components.stancer.public.updateSubscriptionMetadata,
      {
        stancerSubscriptionId: args.subscriptionId,
        orgId: args.orgId,
        userId: args.userId,
        metadata: {
          linkedAt: new Date().toISOString(),
        },
      },
    );
    return null;
  },
});

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Get subscription information by subscription ID.
 */
export const getSubscriptionInfo = query({
  args: {
    subscriptionId: v.string(),
  },
  returns: v.union(
    v.object({
      stancerSubscriptionId: v.string(),
      stancerCustomerId: v.string(),
      stancerPaymentIntentId: v.optional(v.string()),
      status: v.string(),
      created: v.number(),
      metadata: v.optional(v.any()),
      userId: v.optional(v.string()),
      orgId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.stancer.public.getSubscription, {
      stancerSubscriptionId: args.subscriptionId,
    });
  },
});

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Cancel a subscription either immediately or at period end.
 */
export const cancelSubscription = action({
  args: {
    subscriptionId: v.string(),
    immediately: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    throw new Error(
      "Subscription cancellation is not supported in this Stancer example integration.",
    );
  },
});

/**
 * Reactivate a subscription that was set to cancel at period end.
 */
export const reactivateSubscription = action({
  args: {
    subscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    throw new Error(
      "Subscription reactivation is not supported in this Stancer example integration.",
    );
  },
});

// ============================================================================
// CUSTOMER PORTAL (#6 - Manage Billing)
// ============================================================================

/**
 * Customer portal is not available on Stancer.
 */
export const getCustomerPortalUrl = action({
  args: {},
  returns: v.union(
    v.object({
      url: v.string(),
    }),
    v.null(),
  ),
  handler: async () => {
    return null;
  },
});

// ============================================================================
// CUSTOMER DATA
// ============================================================================

/**
 * Get customer data including subscriptions and invoices.
 */
export const getCustomerData = query({
  args: {
    customerId: v.string(),
  },
  returns: v.object({
    customer: v.union(
      v.object({
        stancerCustomerId: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        metadata: v.optional(v.any()),
      }),
      v.null(),
    ),
    subscriptions: v.array(
      v.object({
        stancerSubscriptionId: v.string(),
        stancerCustomerId: v.string(),
        stancerPaymentIntentId: v.optional(v.string()),
        status: v.string(),
        created: v.number(),
        metadata: v.optional(v.any()),
        userId: v.optional(v.string()),
        orgId: v.optional(v.string()),
      }),
    ),
    invoices: v.array(
      v.object({
        stancerInvoiceId: v.string(),
        stancerCustomerId: v.string(),
        stancerSubscriptionId: v.optional(v.string()),
        status: v.string(),
        amountDue: v.number(),
        amountPaid: v.number(),
        created: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const customer = await ctx.runQuery(components.stancer.public.getCustomer, {
      stancerCustomerId: args.customerId,
    });
    const subscriptions = await ctx.runQuery(
      components.stancer.public.listSubscriptions,
      { stancerCustomerId: args.customerId },
    );
    const invoices = await ctx.runQuery(
      components.stancer.public.listInvoices,
      {
        stancerCustomerId: args.customerId,
      },
    );

    return {
      customer,
      subscriptions,
      invoices,
    };
  },
});

// ============================================================================
// USER-SPECIFIC QUERIES (for profile page)
// ============================================================================

/**
 * Get all subscriptions for the current authenticated user.
 * Uses the userId stored in subscription metadata for lookup.
 */
export const getUserSubscriptions = query({
  args: {},
  returns: v.array(
    v.object({
      stancerSubscriptionId: v.string(),
      stancerCustomerId: v.string(),
      stancerPaymentIntentId: v.optional(v.string()),
      status: v.string(),
      created: v.number(),
      metadata: v.optional(v.any()),
      userId: v.optional(v.string()),
      orgId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.runQuery(
      components.stancer.public.listSubscriptionsByUserId,
      { userId: identity.subject },
    );
  },
});

/**
 * Get all one-time payments for the current authenticated user.
 */
export const getUserPayments = query({
  args: {},
  returns: v.array(
    v.object({
      stancerPaymentId: v.string(),
      stancerPaymentIntentId: v.optional(v.string()),
      stancerCustomerId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      status: v.string(),
      created: v.number(),
      metadata: v.optional(v.any()),
      userId: v.optional(v.string()),
      orgId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.runQuery(components.stancer.public.listPaymentsByUserId, {
      userId: identity.subject,
    });
  },
});

/**
 * Check if user has any subscriptions with past_due status (#9 - Failed Payment)
 */
export const getFailedPaymentSubscriptions = query({
  args: {},
  returns: v.array(
    v.object({
      stancerSubscriptionId: v.string(),
      stancerCustomerId: v.string(),
      status: v.string(),
      created: v.number(),
    }),
  ),
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const subscriptions = await ctx.runQuery(
      components.stancer.public.listSubscriptionsByUserId,
      { userId: identity.subject },
    );

    return subscriptions
      .filter(
        (sub: { status: string }) =>
          sub.status === "past_due" || sub.status === "unpaid",
      )
      .map((sub: any) => ({
        stancerSubscriptionId: sub.stancerSubscriptionId,
        stancerCustomerId: sub.stancerCustomerId,
        status: sub.status,
        created: sub.created,
      }));
  },
});
