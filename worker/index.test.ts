import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateCheckout, mockResolveActor, mockUnwrapWebhook } = vi.hoisted(() => ({
  mockResolveActor: vi.fn(),
  mockCreateCheckout: vi.fn(),
  mockUnwrapWebhook: vi.fn(),
}));

vi.mock("./lib/session", async () => ({
  ...(await vi.importActual("./lib/session")),
  resolveAuthenticatedActor: mockResolveActor,
}));

vi.mock("./lib/billing", async () => ({
  ...(await vi.importActual("./lib/billing")),
  createDodoCheckoutSession: mockCreateCheckout,
  unwrapDodoWebhook: mockUnwrapWebhook,
}));

import worker from "./index";

type WorkerEnv = Parameters<typeof worker.fetch>[1];

const actor = {
  userId: "user_123",
  email: "learner@example.com",
  displayName: "Learner",
  provider: "clerk" as const,
};

type MockDbResult = {
  first?: unknown;
  all?: unknown;
  runResult?: unknown;
};

function createMockD1Db(result: MockDbResult = {}) {
  const allResult = result.all ?? { results: [] };
  const firstResult = result.first ?? null;
  const runResult = result.runResult ?? {};

  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        all: vi.fn(async () => allResult),
        first: vi.fn(async () => firstResult),
        run: vi.fn(async () => runResult),
      })),
    })),
    batch: vi.fn(async () => undefined),
  } as unknown as D1Database;
}

function makeRequest(pathname: string, init: RequestInit = {}) {
  return new Request(`https://app.example.com${pathname}`, {
    headers: { accept: "application/json", ...(init as RequestInit).headers },
    ...init,
  }) as Parameters<typeof worker.fetch>[0];
}

function makeEnv(overrides: Record<string, string | D1Database> = {}): WorkerEnv {
  return {
    ASSETS: {
      fetch: async () => new Response(null, { status: 404 }),
    },
    ...overrides,
  } as WorkerEnv;
}

describe("worker auth+billing surface", () => {
  beforeEach(() => {
    mockResolveActor.mockReset().mockResolvedValue(null);
    mockCreateCheckout.mockReset().mockResolvedValue({
      checkoutUrl: "https://pay.dodopayments.com/session/checkout_123",
      checkoutId: "checkout_123",
    });
    mockUnwrapWebhook.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for checkout when user is not authenticated", async () => {
    const db = createMockD1Db();
    const response = await worker.fetch(
      makeRequest("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planKey: "pro-subscription",
          billingMode: "monthly",
          successUrl: "https://app.example.com/account?ok=1",
          cancelUrl: "https://app.example.com/pricing?ok=0",
        }),
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
        DODO_PAYMENTS_API_KEY: "dodo_test_key",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
        DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
        DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
      }),
    );

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("Authenticated session required.");
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it("returns 400 when checkout payload is not valid JSON", async () => {
    const db = createMockD1Db();
    const response = await worker.fetch(
      makeRequest("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
        DODO_PAYMENTS_API_KEY: "dodo_test_key",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
        DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
        DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
      }),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Invalid JSON body.");
  });

  it("calls dodo checkout when checkout request is valid and actor is signed in", async () => {
    mockResolveActor.mockResolvedValue(actor);

    const db = createMockD1Db();
    const response = await worker.fetch(
      makeRequest("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planKey: "pro-subscription",
          billingMode: "lifetime",
          successUrl: "https://app.example.com/account?ok=1",
          cancelUrl: "https://app.example.com/pricing?ok=0",
        }),
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
        DODO_PAYMENTS_API_KEY: "dodo_test_key",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
        DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
        DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
      }),
    );

    const payload = (await response.json()) as {
      checkout?: { checkoutUrl: string; checkoutId: string | null };
      error?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.checkout?.checkoutUrl).toBe("https://pay.dodopayments.com/session/checkout_123");
    expect(payload.checkout?.checkoutId).toBe("checkout_123");
    expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        planKey: "pro-subscription",
        billingMode: "lifetime",
        email: "learner@example.com",
      }),
      expect.anything(),
      expect.any(Function),
    );
  });

  it("returns 401 when Dodo webhook signature fails", async () => {
    mockUnwrapWebhook.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const response = await worker.fetch(
      makeRequest("/api/billing/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "payment.succeeded" }),
      }),
      makeEnv({
        DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
      }),
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Invalid webhook signature.");
  });

  it("persists webhook result and accepts duplicate events idempotently", async () => {
    const db = createMockD1Db();
    const batchSpy = vi.spyOn(db, "batch");

    mockUnwrapWebhook.mockReturnValue({
      id: "evt_1",
      type: "payment.succeeded",
      data: {
        payment_id: "pay_1",
        customer: {
          email: "learner@example.com",
          customer_id: "cust_1",
        },
      },
    });

    const webhookPayload = JSON.stringify({
      id: "evt_1",
      type: "payment.succeeded",
      data: {
        payment_id: "pay_1",
        customer_email: "learner@example.com",
      },
    });

    const request = makeRequest("/api/billing/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: webhookPayload,
    });

    const firstResponse = await worker.fetch(request.clone() as Parameters<typeof worker.fetch>[0], makeEnv({
      DB: db,
      DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
    }));

    const secondResponse = await worker.fetch(request, makeEnv({
      DB: db,
      DODO_PAYMENTS_WEBHOOK_KEY: "webhook_key",
    }));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(batchSpy).toHaveBeenCalledTimes(2);
    const body = (await firstResponse.json()) as { ok: boolean; persisted: boolean };
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
  });

  it("returns 402 for paid study endpoints when entitlement is missing", async () => {
    mockResolveActor.mockResolvedValue(actor);

    const db = createMockD1Db({ all: { results: [] } });
    const response = await worker.fetch(
      makeRequest("/api/bookmarks", {
        method: "GET",
        headers: { accept: "application/json" },
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
      }),
    );

    expect(response.status).toBe(402);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("An active entitlement is required for this feature.");
  });

  it("returns 401 for paid study endpoints without actor", async () => {
    const db = createMockD1Db();
    const response = await worker.fetch(
      makeRequest("/api/bookmarks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ termSlug: "transformers" }),
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
      }),
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("Authenticated session required.");
  });

  it("returns entitlement list for signed-in users", async () => {
    mockResolveActor.mockResolvedValue(actor);

    const entitlements = [
      {
        id: "subscription:active_1",
        planFamily: "pro",
        billingMode: "monthly",
        status: "active",
        startsAt: "2026-01-01T00:00:00Z",
        endsAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    const db = createMockD1Db({ all: { results: entitlements } });
    const response = await worker.fetch(
      makeRequest("/api/entitlements", { method: "GET" }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { entitlements: typeof entitlements };
    expect(payload.entitlements).toEqual(entitlements);
  });

  it("claims pending entitlements for a signed-in actor", async () => {
    mockResolveActor.mockResolvedValue(actor);

    const db = createMockD1Db({ all: { results: [] } });
    const response = await worker.fetch(
      makeRequest("/api/entitlements/claim", {
        method: "POST",
      }),
      makeEnv({
        DB: db,
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_SECRET_KEY: "sk_test",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; claimedCount: number };
    expect(payload.ok).toBe(true);
    expect(payload.claimedCount).toBe(0);
  });
});
