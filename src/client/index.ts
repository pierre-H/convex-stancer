import type {
  ActionCtx,
  StancerClientOptions,
  StancerPaymentMethod,
} from "./types.js";

const DEFAULT_STANCER_API_BASE_URL = "https://api.stancer.com/v2";

type UnknownRecord = Record<string, unknown>;

type StancerCustomer = {
  id: string;
  email?: string;
  name?: string;
  mobile?: string;
  metadata?: unknown;
};

type StancerPaymentIntent = {
  id: string;
  customer?: string;
  payment?: string;
  amount: number;
  currency: string;
  status: string;
  url: string;
  return_url?: string;
  created?: number | string;
  metadata?: unknown;
};

type StancerPayment = {
  id: string;
  payment_intent?: string;
  customer?: string;
  amount: number;
  currency: string;
  status?: string;
  created?: number | string;
  metadata?: unknown;
};

type StancerRefund = {
  id: string;
  payment?: string;
  amount: number;
  currency?: string;
  status?: string;
  created?: number | string;
  metadata?: unknown;
};

export type StancerComponent = any;

function toEpochSeconds(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return Math.floor(asNumber);
    }
  }
  return Math.floor(Date.now() / 1000);
}

export class StancerPayments {
  private _apiKey: string;
  private _baseUrl: string;

  constructor(
    public component: StancerComponent,
    options?: StancerClientOptions,
  ) {
    this._apiKey = options?.STANCER_API_KEY ?? process.env.STANCER_API_KEY!;
    this._baseUrl =
      options?.STANCER_API_BASE_URL ?? DEFAULT_STANCER_API_BASE_URL;
  }

  get apiKey() {
    if (!this._apiKey) {
      throw new Error("STANCER_API_KEY environment variable is not set");
    }
    return this._apiKey;
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: UnknownRecord,
  ): Promise<T> {
    const response = await fetch(`${this._baseUrl}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Stancer API error (${response.status} ${response.statusText}): ${errorText}`,
      );
    }

    return (await response.json()) as T;
  }

  async createCustomer(
    ctx: ActionCtx,
    args: {
      email?: string;
      name?: string;
      mobile?: string;
      metadata?: Record<string, string>;
      idempotencyKey?: string;
    },
  ) {
    const payload: UnknownRecord = {
      ...(args.email !== undefined && { email: args.email }),
      ...(args.name !== undefined && { name: args.name }),
      ...(args.mobile !== undefined && { mobile: args.mobile }),
      ...(args.metadata !== undefined && { metadata: args.metadata }),
      ...(args.idempotencyKey !== undefined && {
        external_id: args.idempotencyKey,
      }),
    };

    const customer = await this.request<StancerCustomer>(
      "POST",
      "/customers/",
      payload,
    );

    await ctx.runMutation(this.component.public.createOrUpdateCustomer, {
      stancerCustomerId: customer.id,
      email: customer.email,
      name: customer.name,
      mobile: customer.mobile,
      metadata: customer.metadata,
    });

    return {
      customerId: customer.id,
    };
  }

  async getOrCreateCustomer(
    ctx: ActionCtx,
    args: {
      userId: string;
      email?: string;
      name?: string;
      mobile?: string;
    },
  ) {
    const existingByUserId = await ctx.runQuery(
      this.component.public.getCustomerByUserId,
      { userId: args.userId },
    );
    if (existingByUserId) {
      return {
        customerId: existingByUserId.stancerCustomerId,
        isNew: false,
      };
    }

    if (args.email) {
      const existingByEmail = await ctx.runQuery(
        this.component.public.getCustomerByEmail,
        { email: args.email },
      );
      if (existingByEmail) {
        return {
          customerId: existingByEmail.stancerCustomerId,
          isNew: false,
        };
      }
    }

    const customer = await this.createCustomer(ctx, {
      email: args.email,
      name: args.name,
      mobile: args.mobile,
      metadata: { userId: args.userId },
      idempotencyKey: args.userId,
    });

    return { customerId: customer.customerId, isNew: true };
  }

  async createPaymentIntent(
    ctx: ActionCtx,
    args: {
      amount: number;
      currency?: string;
      customerId?: string;
      description?: string;
      metadata?: Record<string, string>;
      returnUrl: string;
      methodsAllowed?: StancerPaymentMethod[];
      capture?: boolean;
    },
  ) {
    const payload: UnknownRecord = {
      amount: args.amount,
      currency: args.currency ?? "eur",
      return_url: args.returnUrl,
      ...(args.customerId !== undefined && { customer: args.customerId }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.metadata !== undefined && { metadata: args.metadata }),
      ...(args.methodsAllowed !== undefined && {
        methods_allowed: args.methodsAllowed,
      }),
      ...(args.capture !== undefined && { capture: args.capture }),
    };

    const paymentIntent = await this.request<StancerPaymentIntent>(
      "POST",
      "/payment_intents/",
      payload,
    );

    await ctx.runMutation(
      this.component.private.upsertPaymentIntentFromStancer,
      {
        stancerPaymentIntentId: paymentIntent.id,
        stancerCustomerId: paymentIntent.customer,
        stancerPaymentId: paymentIntent.payment,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        url: paymentIntent.url,
        returnUrl: paymentIntent.return_url,
        created: toEpochSeconds(paymentIntent.created),
        metadata: paymentIntent.metadata,
      },
    );

    if (paymentIntent.payment) {
      await this.syncPaymentIntentStatus(ctx, {
        paymentIntentId: paymentIntent.id,
      });
    }

    return {
      paymentIntentId: paymentIntent.id,
      url: paymentIntent.url,
    };
  }

  async syncPaymentIntentStatus(
    ctx: ActionCtx,
    args: {
      paymentIntentId: string;
    },
  ) {
    const paymentIntent = await this.request<StancerPaymentIntent>(
      "GET",
      `/payment_intents/${args.paymentIntentId}`,
    );

    await ctx.runMutation(
      this.component.private.upsertPaymentIntentFromStancer,
      {
        stancerPaymentIntentId: paymentIntent.id,
        stancerCustomerId: paymentIntent.customer,
        stancerPaymentId: paymentIntent.payment,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        url: paymentIntent.url,
        returnUrl: paymentIntent.return_url,
        created: toEpochSeconds(paymentIntent.created),
        metadata: paymentIntent.metadata,
      },
    );

    let payment: StancerPayment | null = null;
    if (paymentIntent.payment) {
      payment = await this.request<StancerPayment>(
        "GET",
        `/payments/${paymentIntent.payment}`,
      );

      await ctx.runMutation(this.component.private.upsertPaymentFromStancer, {
        stancerPaymentId: payment.id,
        stancerPaymentIntentId:
          payment.payment_intent ?? paymentIntent.id ?? undefined,
        stancerCustomerId: payment.customer ?? paymentIntent.customer,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status ?? paymentIntent.status,
        created: toEpochSeconds(payment.created),
        metadata: payment.metadata ?? paymentIntent.metadata,
      });
    }

    return {
      paymentIntentId: paymentIntent.id,
      paymentId: payment?.id ?? paymentIntent.payment ?? null,
      status: payment?.status ?? paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      url: paymentIntent.url,
    };
  }

  async capturePaymentIntent(
    ctx: ActionCtx,
    args: {
      paymentIntentId: string;
    },
  ) {
    await this.request<UnknownRecord>(
      "PATCH",
      `/payment_intents/${args.paymentIntentId}`,
      {
        capture: true,
      },
    );
    return this.syncPaymentIntentStatus(ctx, {
      paymentIntentId: args.paymentIntentId,
    });
  }

  async refundPayment(
    ctx: ActionCtx,
    args: {
      paymentId: string;
      amount?: number;
      metadata?: Record<string, string>;
    },
  ) {
    const refund = await this.request<StancerRefund>("POST", "/refunds/", {
      payment: args.paymentId,
      ...(args.amount !== undefined && { amount: args.amount }),
      ...(args.metadata !== undefined && { metadata: args.metadata }),
    });

    const payment = await ctx.runQuery(this.component.public.getPayment, {
      stancerPaymentId: args.paymentId,
    });

    await ctx.runMutation(this.component.private.upsertRefundFromStancer, {
      stancerRefundId: refund.id,
      stancerPaymentId: refund.payment ?? args.paymentId,
      stancerPaymentIntentId: payment?.stancerPaymentIntentId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status ?? "pending",
      created: toEpochSeconds(refund.created),
      metadata: refund.metadata,
    });

    return {
      refundId: refund.id,
      status: refund.status ?? "pending",
    };
  }
}

export default StancerPayments;
