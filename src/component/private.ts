import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

function extractLinkingFields(metadata: unknown): {
  orgId: string | undefined;
  userId: string | undefined;
} {
  if (!metadata || typeof metadata !== "object") {
    return { orgId: undefined, userId: undefined };
  }
  const value = metadata as Record<string, unknown>;
  return {
    orgId: typeof value.orgId === "string" ? value.orgId : undefined,
    userId: typeof value.userId === "string" ? value.userId : undefined,
  };
}

export const upsertCustomerFromStancer = mutation({
  args: {
    stancerCustomerId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .unique();

    const { userId } = extractLinkingFields(args.metadata);

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.email !== undefined && { email: args.email }),
        ...(args.name !== undefined && { name: args.name }),
        ...(args.mobile !== undefined && { mobile: args.mobile }),
        ...(args.metadata !== undefined && { metadata: args.metadata }),
        ...(userId !== undefined && { userId }),
      });
      return null;
    }

    await ctx.db.insert("customers", {
      stancerCustomerId: args.stancerCustomerId,
      email: args.email,
      name: args.name,
      mobile: args.mobile,
      metadata: args.metadata,
      userId,
    });
    return null;
  },
});

export const upsertSubscriptionFromStancer = mutation({
  args: {
    stancerSubscriptionId: v.string(),
    stancerCustomerId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stancer_subscription_id", (q) =>
        q.eq("stancerSubscriptionId", args.stancerSubscriptionId),
      )
      .unique();

    const { orgId, userId } = extractLinkingFields(args.metadata);

    if (existing) {
      await ctx.db.patch(existing._id, {
        stancerCustomerId: args.stancerCustomerId,
        ...(args.stancerPaymentIntentId !== undefined && {
          stancerPaymentIntentId: args.stancerPaymentIntentId,
        }),
        status: args.status,
        created: args.created,
        ...(args.metadata !== undefined && { metadata: args.metadata }),
        ...(orgId !== undefined && { orgId }),
        ...(userId !== undefined && { userId }),
      });
      return null;
    }

    await ctx.db.insert("subscriptions", {
      stancerSubscriptionId: args.stancerSubscriptionId,
      stancerCustomerId: args.stancerCustomerId,
      stancerPaymentIntentId: args.stancerPaymentIntentId,
      status: args.status,
      created: args.created,
      metadata: args.metadata,
      orgId,
      userId,
    });
    return null;
  },
});

export const upsertPaymentIntentFromStancer = mutation({
  args: {
    stancerPaymentIntentId: v.string(),
    stancerCustomerId: v.optional(v.string()),
    stancerPaymentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    url: v.string(),
    returnUrl: v.optional(v.string()),
    created: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payment_intents")
      .withIndex("by_stancer_payment_intent_id", (q) =>
        q.eq("stancerPaymentIntentId", args.stancerPaymentIntentId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.stancerCustomerId !== undefined && {
          stancerCustomerId: args.stancerCustomerId,
        }),
        ...(args.stancerPaymentId !== undefined && {
          stancerPaymentId: args.stancerPaymentId,
        }),
        amount: args.amount,
        currency: args.currency,
        status: args.status,
        url: args.url,
        ...(args.returnUrl !== undefined && { returnUrl: args.returnUrl }),
        created: args.created,
        ...(args.metadata !== undefined && { metadata: args.metadata }),
      });
      return null;
    }

    await ctx.db.insert("payment_intents", {
      stancerPaymentIntentId: args.stancerPaymentIntentId,
      stancerCustomerId: args.stancerCustomerId,
      stancerPaymentId: args.stancerPaymentId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      url: args.url,
      returnUrl: args.returnUrl,
      created: args.created,
      metadata: args.metadata,
    });
    return null;
  },
});

export const upsertPaymentFromStancer = mutation({
  args: {
    stancerPaymentId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    stancerCustomerId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_stancer_payment_id", (q) =>
        q.eq("stancerPaymentId", args.stancerPaymentId),
      )
      .unique();

    const { orgId, userId } = extractLinkingFields(args.metadata);

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.stancerPaymentIntentId !== undefined && {
          stancerPaymentIntentId: args.stancerPaymentIntentId,
        }),
        ...(args.stancerCustomerId !== undefined && {
          stancerCustomerId: args.stancerCustomerId,
        }),
        amount: args.amount,
        currency: args.currency,
        status: args.status,
        created: args.created,
        ...(args.metadata !== undefined && { metadata: args.metadata }),
        ...(orgId !== undefined && { orgId }),
        ...(userId !== undefined && { userId }),
      });
      return null;
    }

    await ctx.db.insert("payments", {
      stancerPaymentId: args.stancerPaymentId,
      stancerPaymentIntentId: args.stancerPaymentIntentId,
      stancerCustomerId: args.stancerCustomerId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      created: args.created,
      metadata: args.metadata,
      orgId,
      userId,
    });
    return null;
  },
});

export const upsertRefundFromStancer = mutation({
  args: {
    stancerRefundId: v.string(),
    stancerPaymentId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("refunds")
      .withIndex("by_stancer_refund_id", (q) =>
        q.eq("stancerRefundId", args.stancerRefundId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stancerPaymentId: args.stancerPaymentId,
        ...(args.stancerPaymentIntentId !== undefined && {
          stancerPaymentIntentId: args.stancerPaymentIntentId,
        }),
        amount: args.amount,
        ...(args.currency !== undefined && { currency: args.currency }),
        status: args.status,
        created: args.created,
        ...(args.metadata !== undefined && { metadata: args.metadata }),
      });
      return null;
    }

    await ctx.db.insert("refunds", {
      stancerRefundId: args.stancerRefundId,
      stancerPaymentId: args.stancerPaymentId,
      stancerPaymentIntentId: args.stancerPaymentIntentId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      created: args.created,
      metadata: args.metadata,
    });
    return null;
  },
});
