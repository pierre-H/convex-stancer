import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    stancerCustomerId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    metadata: v.optional(v.any()),
    userId: v.optional(v.string()),
  })
    .index("by_stancer_customer_id", ["stancerCustomerId"])
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"]),
  subscriptions: defineTable({
    stancerSubscriptionId: v.string(),
    stancerCustomerId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
  })
    .index("by_stancer_subscription_id", ["stancerSubscriptionId"])
    .index("by_stancer_customer_id", ["stancerCustomerId"])
    .index("by_stancer_payment_intent_id", ["stancerPaymentIntentId"])
    .index("by_org_id", ["orgId"])
    .index("by_user_id", ["userId"]),
  payment_intents: defineTable({
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
  })
    .index("by_stancer_payment_intent_id", ["stancerPaymentIntentId"])
    .index("by_stancer_customer_id", ["stancerCustomerId"])
    .index("by_stancer_payment_id", ["stancerPaymentId"]),
  payments: defineTable({
    stancerPaymentId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    stancerCustomerId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
  })
    .index("by_stancer_payment_id", ["stancerPaymentId"])
    .index("by_stancer_payment_intent_id", ["stancerPaymentIntentId"])
    .index("by_stancer_customer_id", ["stancerCustomerId"])
    .index("by_org_id", ["orgId"])
    .index("by_user_id", ["userId"]),
  refunds: defineTable({
    stancerRefundId: v.string(),
    stancerPaymentId: v.string(),
    stancerPaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.string(),
    created: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_stancer_refund_id", ["stancerRefundId"])
    .index("by_stancer_payment_id", ["stancerPaymentId"])
    .index("by_stancer_payment_intent_id", ["stancerPaymentIntentId"]),
});
