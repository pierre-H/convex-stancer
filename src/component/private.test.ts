import { test, expect } from "vitest";
import { anyApi } from "convex/server";
import { initConvexTest } from "./setup.test.js";

test("upsertPaymentIntentFromStancer stores intent without payment id", async () => {
  const t = initConvexTest();

  await expect(
    t.mutation(anyApi.private.upsertPaymentIntentFromStancer, {
      stancerPaymentIntentId: "pi_test_null_payment",
      amount: 1999,
      currency: "eur",
      status: "require_payment_method",
      url: "https://payment.stancer.com/pi_test_null_payment",
      created: 1710000000,
    }),
  ).resolves.toBeNull();

  const paymentIntent = await t.query(anyApi.public.getPaymentIntent, {
    stancerPaymentIntentId: "pi_test_null_payment",
  });

  expect(paymentIntent).toEqual(
    expect.objectContaining({
      stancerPaymentIntentId: "pi_test_null_payment",
      amount: 1999,
      currency: "eur",
      status: "require_payment_method",
    }),
  );
  expect(paymentIntent).not.toHaveProperty("stancerPaymentId");
});
