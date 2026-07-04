import DodoPayments from "dodopayments";

export type BillingMode = "monthly" | "yearly" | "lifetime";
export type PlanKey = "pro-subscription" | "pro-lifetime";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  billingProvider: "dodo_payments";
  billingOptions: BillingMode[];
  featureAccess: string[];
  priceDisplay: string;
};

export type DodoEnvironment = "test_mode" | "live_mode";

export type DodoCheckoutRequest = {
  planKey: PlanKey;
  billingMode: BillingMode;
  email: string;
  name?: string | null;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type DodoCheckoutResponse = {
  checkoutUrl: string;
  checkoutId: string | null;
};

export type DodoWebhookResult =
  | { kind: "ignored"; reason: string }
  | {
      entitlementId: string;
      kind: "pending_entitlement";
      providerEventId: string;
      providerCustomerId: string | null;
      providerSubscriptionId: string | null;
      providerPaymentId: string | null;
      providerProductId: string | null;
      providerCheckoutSessionId: string | null;
      customerEmail: string;
      claimedByUserId: string | null;
      planFamily: "pro";
      billingMode: BillingMode;
      status: string;
      startsAt: string | null;
      endsAt: string | null;
      payloadJson: string;
      eventType: string;
    };

export type BillingEnv = {
  DODO_API_KEY?: string;
  DODO_ENVIRONMENT?: string;
  DODO_WEBHOOK_SECRET?: string;
  DODO_PRODUCT_ID_SUBSCRIPTION_MONTHLY?: string;
  DODO_PRODUCT_ID_SUBSCRIPTION_YEARLY?: string;
  DODO_PRODUCT_ID_LIFETIME?: string;
  DODO_PAYMENTS_API_KEY?: string;
  DODO_PAYMENTS_ENVIRONMENT?: string;
  DODO_PAYMENTS_WEBHOOK_KEY?: string;
  DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY?: string;
  DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY?: string;
  DODO_PAYMENTS_PRODUCT_ID_LIFETIME?: string;
};

export type DodoConfiguration = {
  billingReady: boolean;
  webhookReady: boolean;
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "pro-subscription",
    name: "Pro Subscription",
    billingProvider: "dodo_payments",
    billingOptions: ["monthly", "yearly"],
    priceDisplay: "$19/mo or $180/yr",
    featureAccess: [
      "Full glossary access",
      "Bookmarks, notes, and annotations",
      "Share and export tools",
      "Structured learning paths",
    ],
  },
  {
    key: "pro-lifetime",
    name: "Pro Lifetime",
    billingProvider: "dodo_payments",
    billingOptions: ["lifetime"],
    priceDisplay: "$399 once",
    featureAccess: [
      "Full glossary access",
      "Bookmarks, notes, and annotations",
      "Share and export tools",
      "All future core content updates",
    ],
  },
];

const PRODUCT_ID_ENV_BY_MODE: Record<BillingMode, Array<keyof BillingEnv>> = {
  monthly: ["DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_MONTHLY", "DODO_PRODUCT_ID_SUBSCRIPTION_MONTHLY"],
  yearly: ["DODO_PAYMENTS_PRODUCT_ID_SUBSCRIPTION_YEARLY", "DODO_PRODUCT_ID_SUBSCRIPTION_YEARLY"],
  lifetime: ["DODO_PAYMENTS_PRODUCT_ID_LIFETIME", "DODO_PRODUCT_ID_LIFETIME"],
};

const SUBSCRIPTION_EVENT_TYPES = new Set([
  "subscription.active",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.updated",
]);

const SUBSCRIPTION_INACTIVE_EVENT_TYPES = new Set([
  "subscription.cancelled",
  "subscription.expired",
  "subscription.failed",
  "subscription.on_hold",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readNestedString(value: unknown, ...keys: string[]): string | null {
  let current: unknown = value;
  for (const key of keys) {
    if (Array.isArray(current)) {
      const index = Number.parseInt(key, 10);
      current = Number.isNaN(index) ? undefined : current[index];
      continue;
    }
    if (!isRecord(current)) {
      return null;
    }
    current = current[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function normalizeEnvironment(rawValue: string | undefined): DodoEnvironment {
  return rawValue === "live_mode" ? "live_mode" : "test_mode";
}

function readStringValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function resolveApiKey(env: BillingEnv): string {
  const value = readStringValue(env.DODO_PAYMENTS_API_KEY) ?? readStringValue(env.DODO_API_KEY);
  if (!value) {
    throw new Error("Missing billing configuration: DODO_PAYMENTS_API_KEY");
  }
  return value;
}

function resolveWebhookKey(env: BillingEnv): string {
  const value = readStringValue(env.DODO_PAYMENTS_WEBHOOK_KEY) ?? readStringValue(env.DODO_WEBHOOK_SECRET);
  if (!value) {
    throw new Error("Missing billing configuration: DODO_PAYMENTS_WEBHOOK_KEY");
  }
  return value;
}

function hasBillingApiKey(env: BillingEnv): boolean {
  return Boolean(readStringValue(env.DODO_PAYMENTS_API_KEY) ?? readStringValue(env.DODO_API_KEY));
}

function hasProductIds(env: BillingEnv): boolean {
  try {
    resolveProductId("monthly", env);
    resolveProductId("yearly", env);
    resolveProductId("lifetime", env);
    return true;
  } catch {
    return false;
  }
}

function hasWebhookKey(env: BillingEnv): boolean {
  return Boolean(readStringValue(env.DODO_PAYMENTS_WEBHOOK_KEY) ?? readStringValue(env.DODO_WEBHOOK_SECRET));
}

export function resolveDodoConfiguration(env: BillingEnv): DodoConfiguration {
  return {
    billingReady: hasBillingApiKey(env) && hasProductIds(env),
    webhookReady: hasWebhookKey(env),
  };
}

function createDodoClient(env: BillingEnv, fetchImpl: typeof fetch): DodoPayments {
  return new DodoPayments({
    bearerToken: resolveApiKey(env),
    environment: normalizeEnvironment(env.DODO_PAYMENTS_ENVIRONMENT ?? env.DODO_ENVIRONMENT),
    webhookKey: readStringValue(env.DODO_PAYMENTS_WEBHOOK_KEY) ?? readStringValue(env.DODO_WEBHOOK_SECRET),
    fetch: fetchImpl,
  });
}

export function resolveProductId(mode: BillingMode, env: BillingEnv): string {
  for (const envKey of PRODUCT_ID_ENV_BY_MODE[mode]) {
    const value = readStringValue(env[envKey]);
    if (value) {
      return value;
    }
  }
  throw new Error(`Missing billing configuration: ${PRODUCT_ID_ENV_BY_MODE[mode][0]}`);
}

export async function createDodoCheckoutSession(
  input: DodoCheckoutRequest,
  env: BillingEnv,
  fetchImpl: typeof fetch,
): Promise<DodoCheckoutResponse> {
  const client = createDodoClient(env, fetchImpl);
  const checkout = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: resolveProductId(input.billingMode, env),
        quantity: 1,
      },
    ],
    cancel_url: input.cancelUrl,
    return_url: input.successUrl,
    customer: {
      email: input.email,
      name: input.name ?? undefined,
    },
    metadata: input.metadata ?? {},
    confirm: true,
    minimal_address: true,
  });
  const checkoutRecord = checkout as unknown as Record<string, unknown>;

  return {
    checkoutUrl: checkout.checkout_url ?? "",
    checkoutId:
      (typeof checkoutRecord.checkout_id === "string"
        ? (checkoutRecord.checkout_id as string)
        : null) ??
      (typeof checkoutRecord.id === "string"
        ? (checkoutRecord.id as string)
        : null),
  };
}

export function unwrapDodoWebhook(
  bodyText: string,
  headers: Record<string, string>,
  env: BillingEnv,
): unknown {
  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY ?? env.DODO_API_KEY ?? "",
    environment: normalizeEnvironment(env.DODO_PAYMENTS_ENVIRONMENT ?? env.DODO_ENVIRONMENT),
    webhookKey: resolveWebhookKey(env),
  });
  return client.webhooks.unwrap(bodyText, { headers, key: resolveWebhookKey(env) });
}

function resolveBillingMode(eventType: string, eventData: Record<string, unknown>): BillingMode | null {
  const mode =
    readNestedString(eventData, "subscription", "recurring_interval") ??
    readString(eventData, "recurring_interval", "interval");

  if (mode === "monthly" || mode === "yearly") {
    return mode;
  }

  if (eventType === "payment.succeeded") {
    return "lifetime";
  }

  return null;
}

function resolveStatus(eventType: string, eventData: Record<string, unknown>): string {
  if (SUBSCRIPTION_EVENT_TYPES.has(eventType)) {
    return readString(eventData, "status") ?? "active";
  }
  if (SUBSCRIPTION_INACTIVE_EVENT_TYPES.has(eventType)) {
    return readString(eventData, "status") ?? eventType.replace("subscription.", "");
  }
  if (eventType === "payment.succeeded") {
    return "active";
  }
  return readString(eventData, "status") ?? "ignored";
}

function resolveEntitlementId(
  eventType: string,
  payload: Record<string, unknown>,
  eventData: Record<string, unknown>,
): string | null {
  const subscriptionId =
    readNestedString(eventData, "subscription", "subscription_id") ??
    readString(eventData, "subscription_id");
  if (subscriptionId) {
    return `subscription:${subscriptionId}`;
  }

  const paymentId = readString(eventData, "payment_id");
  if (paymentId) {
    return `payment:${paymentId}`;
  }

  const checkoutSessionId =
    readString(eventData, "checkout_session_id") ??
    readNestedString(eventData, "payment", "checkout_session_id");
  if (checkoutSessionId) {
    return `checkout:${checkoutSessionId}`;
  }

  const providerEventId = readString(payload, "id", "event_id");
  if (providerEventId) {
    return `event:${providerEventId}`;
  }

  return eventType ? `event:${eventType}:unknown` : null;
}

export function derivePendingEntitlementFromWebhook(payload: unknown): DodoWebhookResult {
  if (!isRecord(payload)) {
    return { kind: "ignored", reason: "Webhook payload is not an object." };
  }

  const eventType = readString(payload, "type", "event_type");
  const eventData = isRecord(payload.data) ? payload.data : null;
  if (!eventType || !eventData) {
    return { kind: "ignored", reason: "Missing event type or data payload." };
  }

  if (
    eventType !== "payment.succeeded" &&
    !SUBSCRIPTION_EVENT_TYPES.has(eventType) &&
    !SUBSCRIPTION_INACTIVE_EVENT_TYPES.has(eventType)
  ) {
    return { kind: "ignored", reason: `Unhandled billing event type: ${eventType}` };
  }

  const billingMode = resolveBillingMode(eventType, eventData);
  const customerEmail =
    readNestedString(eventData, "customer", "email") ??
    readString(eventData, "customer_email", "email");

  if (!billingMode || !customerEmail) {
    return { kind: "ignored", reason: "Billing mode or customer email could not be resolved." };
  }

  const entitlementId = resolveEntitlementId(eventType, payload, eventData);
  if (!entitlementId) {
    return { kind: "ignored", reason: "Logical entitlement identity could not be resolved." };
  }

  return {
    entitlementId,
    kind: "pending_entitlement",
    providerEventId:
      readString(payload, "id", "event_id") ??
      `${eventType}:${readString(eventData, "payment_id", "subscription_id") ?? "unknown"}`,
    providerCustomerId:
      readNestedString(eventData, "customer", "customer_id") ??
      readString(eventData, "customer_id"),
    providerSubscriptionId:
      readNestedString(eventData, "subscription", "subscription_id") ??
      readString(eventData, "subscription_id"),
    providerPaymentId: readString(eventData, "payment_id"),
    providerProductId:
      readNestedString(eventData, "product_cart", "0", "product_id") ??
      readString(eventData, "product_id"),
    providerCheckoutSessionId:
      readString(eventData, "checkout_session_id") ??
      readNestedString(eventData, "payment", "checkout_session_id"),
    customerEmail,
    claimedByUserId:
      readNestedString(eventData, "metadata", "user_id") ?? readNestedString(payload, "metadata", "user_id"),
    planFamily: "pro",
    billingMode,
    status: resolveStatus(eventType, eventData),
    startsAt:
      readNestedString(eventData, "subscription", "current_period_start") ??
      readString(eventData, "current_period_start", "starts_at"),
    endsAt:
      readNestedString(eventData, "subscription", "current_period_end") ??
      readString(eventData, "current_period_end", "ends_at"),
    payloadJson: JSON.stringify(payload),
    eventType,
  };
}
