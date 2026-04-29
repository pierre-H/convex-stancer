import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { StancerPayments } from "./index.js";
import { components } from "./setup.test.js";

describe("StancerPayments client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("creates client with component", () => {
    const client = new StancerPayments(components.stancer, {
      STANCER_API_KEY: "stest_123",
    });
    expect(client).toBeDefined();
    expect(client.component).toBeDefined();
  });

  test("throws when api key is missing", () => {
    const original = process.env.STANCER_API_KEY;
    delete process.env.STANCER_API_KEY;

    const client = new StancerPayments(components.stancer);
    expect(() => client.apiKey).toThrow(
      "STANCER_API_KEY environment variable is not set",
    );

    if (original) process.env.STANCER_API_KEY = original;
  });

  test("createPaymentIntent stores intent via internal mutation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "pi_test_123",
        customer: "cust_test_123",
        amount: 1999,
        currency: "eur",
        status: "require_payment_method",
        url: "https://payment.stancer.com/pi_test_123",
        created: 1710000000,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = {
      runAction: vi.fn(),
      runQuery: vi.fn(),
      runMutation: vi.fn().mockResolvedValue(null),
    };

    const client = new StancerPayments(components.stancer, {
      STANCER_API_KEY: "stest_123",
      STANCER_API_BASE_URL: "https://api.stancer.com/v2",
    });

    const result = await client.createPaymentIntent(ctx, {
      amount: 1999,
      customerId: "cust_test_123",
      returnUrl: "https://app.example.com/payment/callback",
      metadata: { userId: "user_123" },
    });

    expect(result.paymentIntentId).toBe("pi_test_123");
    expect(result.url).toContain("stancer.com");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ctx.runMutation).toHaveBeenCalledWith(
      components.stancer.private.upsertPaymentIntentFromStancer,
      expect.objectContaining({
        stancerPaymentIntentId: "pi_test_123",
        stancerCustomerId: "cust_test_123",
        amount: 1999,
      }),
    );
  });

  test("syncPaymentIntentStatus fetches payment and upserts both", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pi_test_456",
          customer: "cust_test_456",
          payment: "paym_test_456",
          amount: 5000,
          currency: "eur",
          status: "captured",
          url: "https://payment.stancer.com/pi_test_456",
          created: 1710000000,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "paym_test_456",
          payment_intent: "pi_test_456",
          customer: "cust_test_456",
          amount: 5000,
          currency: "eur",
          status: "captured",
          created: 1710000002,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const ctx = {
      runAction: vi.fn(),
      runQuery: vi.fn(),
      runMutation: vi.fn().mockResolvedValue(null),
    };

    const client = new StancerPayments(components.stancer, {
      STANCER_API_KEY: "stest_123",
    });

    const result = await client.syncPaymentIntentStatus(ctx, {
      paymentIntentId: "pi_test_456",
    });

    expect(result.status).toBe("captured");
    expect(result.paymentId).toBe("paym_test_456");
    expect(ctx.runMutation).toHaveBeenCalledWith(
      components.stancer.private.upsertPaymentIntentFromStancer,
      expect.any(Object),
    );
    expect(ctx.runMutation).toHaveBeenCalledWith(
      components.stancer.private.upsertPaymentFromStancer,
      expect.objectContaining({
        stancerPaymentId: "paym_test_456",
        stancerPaymentIntentId: "pi_test_456",
      }),
    );
  });
});
