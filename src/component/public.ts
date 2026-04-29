import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import schema from "./schema.js";

const customerValidator = schema.tables.customers.validator;
const subscriptionValidator = schema.tables.subscriptions.validator;
const paymentIntentValidator = schema.tables.payment_intents.validator;
const paymentValidator = schema.tables.payments.validator;
const refundValidator = schema.tables.refunds.validator;

export const getCustomer = query({
  args: { stancerCustomerId: v.string() },
  returns: v.union(customerValidator, v.null()),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .unique();
    if (!customer) return null;
    const { _id, _creationTime, ...data } = customer;
    return data;
  },
});

export const getCustomerByEmail = query({
  args: { email: v.string() },
  returns: v.union(customerValidator, v.null()),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!customer) return null;
    const { _id, _creationTime, ...data } = customer;
    return data;
  },
});

export const getCustomerByUserId = query({
  args: { userId: v.string() },
  returns: v.union(customerValidator, v.null()),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    if (!customer) return null;
    const { _id, _creationTime, ...data } = customer;
    return data;
  },
});

export const getSubscription = query({
  args: { stancerSubscriptionId: v.string() },
  returns: v.union(subscriptionValidator, v.null()),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stancer_subscription_id", (q) =>
        q.eq("stancerSubscriptionId", args.stancerSubscriptionId),
      )
      .unique();
    if (!subscription) return null;
    const { _id, _creationTime, ...data } = subscription;
    return data;
  },
});

export const listSubscriptions = query({
  args: { stancerCustomerId: v.string() },
  returns: v.array(subscriptionValidator),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .collect();
    return subscriptions.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const getSubscriptionByOrgId = query({
  args: { orgId: v.string() },
  returns: v.union(subscriptionValidator, v.null()),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org_id", (q) => q.eq("orgId", args.orgId))
      .first();
    if (!subscription) return null;
    const { _id, _creationTime, ...data } = subscription;
    return data;
  },
});

export const listSubscriptionsByOrgId = query({
  args: { orgId: v.string() },
  returns: v.array(subscriptionValidator),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_org_id", (q) => q.eq("orgId", args.orgId))
      .collect();
    return subscriptions.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listSubscriptionsByUserId = query({
  args: { userId: v.string() },
  returns: v.array(subscriptionValidator),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return subscriptions.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const getPaymentIntent = query({
  args: { stancerPaymentIntentId: v.string() },
  returns: v.union(paymentIntentValidator, v.null()),
  handler: async (ctx, args) => {
    const paymentIntent = await ctx.db
      .query("payment_intents")
      .withIndex("by_stancer_payment_intent_id", (q) =>
        q.eq("stancerPaymentIntentId", args.stancerPaymentIntentId),
      )
      .unique();
    if (!paymentIntent) return null;
    const { _id, _creationTime, ...data } = paymentIntent;
    return data;
  },
});

export const listPaymentIntents = query({
  args: { stancerCustomerId: v.string() },
  returns: v.array(paymentIntentValidator),
  handler: async (ctx, args) => {
    const paymentIntents = await ctx.db
      .query("payment_intents")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .collect();
    return paymentIntents.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const getPayment = query({
  args: { stancerPaymentId: v.string() },
  returns: v.union(paymentValidator, v.null()),
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_stancer_payment_id", (q) =>
        q.eq("stancerPaymentId", args.stancerPaymentId),
      )
      .unique();
    if (!payment) return null;
    const { _id, _creationTime, ...data } = payment;
    return data;
  },
});

export const getPaymentByPaymentIntent = query({
  args: { stancerPaymentIntentId: v.string() },
  returns: v.union(paymentValidator, v.null()),
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_stancer_payment_intent_id", (q) =>
        q.eq("stancerPaymentIntentId", args.stancerPaymentIntentId),
      )
      .first();
    if (!payment) return null;
    const { _id, _creationTime, ...data } = payment;
    return data;
  },
});

export const listPayments = query({
  args: { stancerCustomerId: v.string() },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .collect();
    return payments.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listPaymentsByUserId = query({
  args: { userId: v.string() },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return payments.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listPaymentsByOrgId = query({
  args: { orgId: v.string() },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_org_id", (q) => q.eq("orgId", args.orgId))
      .collect();
    return payments.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listRefundsByPaymentId = query({
  args: { stancerPaymentId: v.string() },
  returns: v.array(refundValidator),
  handler: async (ctx, args) => {
    const refunds = await ctx.db
      .query("refunds")
      .withIndex("by_stancer_payment_id", (q) =>
        q.eq("stancerPaymentId", args.stancerPaymentId),
      )
      .collect();
    return refunds.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listRefundsByPaymentIntentId = query({
  args: { stancerPaymentIntentId: v.string() },
  returns: v.array(refundValidator),
  handler: async (ctx, args) => {
    const refunds = await ctx.db
      .query("refunds")
      .withIndex("by_stancer_payment_intent_id", (q) =>
        q.eq("stancerPaymentIntentId", args.stancerPaymentIntentId),
      )
      .collect();
    return refunds.map(({ _id, _creationTime, ...data }) => data);
  },
});

export const listInvoices = query({
  args: { stancerCustomerId: v.string() },
  returns: v.array(v.any()),
  handler: async () => {
    return [];
  },
});

export const listInvoicesByOrgId = query({
  args: { orgId: v.string() },
  returns: v.array(v.any()),
  handler: async () => {
    return [];
  },
});

export const listInvoicesByUserId = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async () => {
    return [];
  },
});

export const createOrUpdateCustomer = mutation({
  args: {
    stancerCustomerId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_stancer_customer_id", (q) =>
        q.eq("stancerCustomerId", args.stancerCustomerId),
      )
      .unique();

    const metadata = args.metadata;
    const userId =
      metadata && typeof metadata === "object"
        ? (metadata as Record<string, unknown>).userId
        : undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.email !== undefined && { email: args.email }),
        ...(args.name !== undefined && { name: args.name }),
        ...(args.mobile !== undefined && { mobile: args.mobile }),
        ...(args.metadata !== undefined && { metadata: args.metadata }),
        ...(typeof userId === "string" && { userId }),
      });
      return args.stancerCustomerId;
    }

    await ctx.db.insert("customers", {
      stancerCustomerId: args.stancerCustomerId,
      email: args.email,
      name: args.name,
      mobile: args.mobile,
      metadata: args.metadata,
      ...(typeof userId === "string" && { userId }),
    });

    return args.stancerCustomerId;
  },
});

export const updateSubscriptionMetadata = mutation({
  args: {
    stancerSubscriptionId: v.string(),
    metadata: v.any(),
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stancer_subscription_id", (q) =>
        q.eq("stancerSubscriptionId", args.stancerSubscriptionId),
      )
      .unique();

    if (!subscription) {
      throw new Error(
        `Subscription ${args.stancerSubscriptionId} not found in database`,
      );
    }

    await ctx.db.patch(subscription._id, {
      metadata: args.metadata,
      ...(args.orgId !== undefined && { orgId: args.orgId }),
      ...(args.userId !== undefined && { userId: args.userId }),
    });
    return null;
  },
});
