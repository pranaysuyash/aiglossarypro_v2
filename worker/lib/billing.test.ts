import { describe, expect, it, vi } from "vitest";
import {
  createDodoCheckoutSession,
  derivePendingEntitlementFromWebhook,
  resolveDodoConfiguration,
  resolveProductId,
} from "./billing";

describe("resolveProductId", () => {
  it("maps each billing mode to the configured Dodo product id", () => {
    const env = {
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
      DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
    };

    expect(resolveProductId("monthly", env)).toBe("prod_monthly");
    expect(resolveProductId("yearly", env)).toBe("prod_yearly");
    expect(resolveProductId("lifetime", env)).toBe("prod_lifetime");
  });
});

describe("resolveDodoConfiguration", () => {
  it("is ready when all required billing variables are configured", () => {
    const env = {
      DODO_PAYMENTS_API_KEY: "dodo_test_key",
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
      DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
      DODO_PAYMENTS_WEBHOOK_KEY: "wh_123",
    };
    expect(resolveDodoConfiguration(env)).toEqual({
      billingReady: true,
      webhookReady: true,
    });
  });

  it("does not throw and marks billing as not ready when API key is missing", () => {
    const env = {
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
      DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
      DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
    };

    expect(resolveDodoConfiguration(env)).toEqual({
      billingReady: false,
      webhookReady: false,
    });
  });

  it("respects legacy variable names for compatibility checks", () => {
    const env = {
      DODO_API_KEY: "dodo_test_key",
      DODO_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "legacy_monthly",
      DODO_PRODUCT_ID_SUBSCRIPTION_YEARLY: "legacy_yearly",
      DODO_PRODUCT_ID_LIFETIME: "legacy_lifetime",
      DODO_WEBHOOK_SECRET: "legacy_webhook_secret",
    };
    expect(resolveDodoConfiguration(env)).toEqual({
      billingReady: true,
      webhookReady: true,
    });
  });
});

describe("createDodoCheckoutSession", () => {
  it("creates a hosted checkout session using the official Dodo base URL", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          checkout_url: "https://pay.dodopayments.com/session/test_123",
          checkout_id: "test_123",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const result = await createDodoCheckoutSession(
      {
        planKey: "pro-subscription",
        billingMode: "monthly",
        email: "learner@example.com",
        successUrl: "https://aiglossary.app/account?checkout=success",
        cancelUrl: "https://aiglossary.app/pricing?checkout=cancelled",
        metadata: {
          user_id: "user_123",
        },
      },
      {
        DODO_PAYMENTS_API_KEY: "dodo_test_key",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY: "prod_monthly",
        DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY: "prod_yearly",
        DODO_PAYMENTS_PRODUCT_ID_LIFETIME: "prod_lifetime",
      },
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.checkoutUrl).toBe("https://pay.dodopayments.com/session/test_123");
    expect(result.checkoutId).toBe("test_123");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const firstCallUrl = (fetchImpl.mock.calls as unknown[][])[0]?.[0];
    expect(firstCallUrl).toBe("https://test.dodopayments.com/checkouts");
  });
});

describe("derivePendingEntitlementFromWebhook", () => {
  it("creates a directly claimable lifetime entitlement when checkout metadata includes a user id", () => {
    const result = derivePendingEntitlementFromWebhook({
      id: "evt_payment_1",
      type: "payment.succeeded",
      data: {
        payment_id: "pay_123",
        product_id: "prod_lifetime",
        metadata: {
          user_id: "user_123",
        },
        customer: {
          email: "learner@example.com",
          customer_id: "cust_123",
        },
      },
    });

    expect(result.kind).toBe("pending_entitlement");
    if (result.kind !== "pending_entitlement") {
      return;
    }
    expect(result.billingMode).toBe("lifetime");
    expect(result.claimedByUserId).toBe("user_123");
    expect(result.customerEmail).toBe("learner@example.com");
    expect(result.entitlementId).toBe("payment:pay_123");
  });

  it("creates a subscription pending entitlement from subscription activity", () => {
    const result = derivePendingEntitlementFromWebhook({
      id: "evt_sub_1",
      type: "subscription.active",
      data: {
        status: "active",
        customer_id: "cust_456",
        customer: {
          email: "subscriber@example.com",
        },
        subscription: {
          subscription_id: "sub_456",
          recurring_interval: "yearly",
          current_period_start: "2026-06-29T00:00:00Z",
          current_period_end: "2027-06-29T00:00:00Z",
        },
      },
    });

    expect(result.kind).toBe("pending_entitlement");
    if (result.kind !== "pending_entitlement") {
      return;
    }
    expect(result.billingMode).toBe("yearly");
    expect(result.entitlementId).toBe("subscription:sub_456");
    expect(result.providerSubscriptionId).toBe("sub_456");
    expect(result.customerEmail).toBe("subscriber@example.com");
  });
});
