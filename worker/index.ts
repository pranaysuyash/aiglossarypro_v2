type AssetBinding = {
  fetch: (request: Request) => Promise<Response>;
};

import {
  PLAN_DEFINITIONS,
  createDodoCheckoutSession,
  derivePendingEntitlementFromWebhook,
  unwrapDodoWebhook,
  resolveDodoConfiguration,
  type BillingEnv,
  type BillingMode,
  type PlanKey,
} from "./lib/billing";
import {
  buildSessionSummary,
  resolveAuthenticatedActor,
  resolveConfigured,
  resolveActiveEntitlement,
  type SessionEnv,
} from "./lib/session";
import {
  addBookmark,
  type AuthenticatedActor,
  type EntitlementRow,
  claimPendingEntitlements,
  createExportJob,
  createShareLink,
  deleteAnnotation,
  deleteNote,
  getShareLinkByToken,
  listAnnotations,
  listBookmarks,
  listEntitlements,
  listExportJobs,
  listNotes,
  listShareLinks,
  removeBookmark,
  upsertUser,
  upsertAnnotation,
  upsertNote,
} from "./lib/study";

type Env = {
  ASSETS: AssetBinding;
  DB?: D1Database;
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_JWT_KEY?: string;
  CLERK_AUTHORIZED_PARTIES?: string;
} & BillingEnv & SessionEnv;

function json(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

function paymentRequired(message: string): Response {
  return json({ error: message }, { status: 402 });
}

function serverMisconfigured(message: string): Response {
  return json({ error: message }, { status: 503 });
}

function unauthorized(message: string): Response {
  return json({ error: message }, { status: 401 });
}

function isBillingMode(value: string): value is BillingMode {
  return value === "monthly" || value === "yearly" || value === "lifetime";
}

function isPlanKey(value: string): value is PlanKey {
  return value === "pro-subscription" || value === "pro-lifetime";
}

async function persistPendingEntitlement(
  env: Env,
  result: Extract<ReturnType<typeof derivePendingEntitlementFromWebhook>, { kind: "pending_entitlement" }>,
) {
  if (!env.DB) {
    throw new Error("D1 binding is not configured for billing persistence.");
  }

  const statements = [
    env.DB.prepare(
      `INSERT INTO billing_events (
        id,
        billing_provider,
        event_type,
        status,
        payload_json
      ) VALUES (?, 'dodo_payments', ?, 'received', ?)
       ON CONFLICT(billing_provider, id) DO UPDATE SET
         event_type = excluded.event_type,
         status = excluded.status,
         payload_json = excluded.payload_json,
         processed_at = CURRENT_TIMESTAMP`
    ).bind(result.providerEventId, result.eventType, result.payloadJson),
  ];

  if (result.claimedByUserId) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO entitlements (
           id,
           user_id,
           plan_family,
           billing_mode,
           status,
           billing_provider,
           provider_customer_id,
           provider_subscription_id,
           provider_checkout_session_id,
           provider_product_id,
           starts_at,
           ends_at
         ) VALUES (?, ?, ?, ?, ?, 'dodo_payments', ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           user_id = excluded.user_id,
           plan_family = excluded.plan_family,
           billing_mode = excluded.billing_mode,
           status = excluded.status,
           provider_customer_id = excluded.provider_customer_id,
           provider_subscription_id = excluded.provider_subscription_id,
           provider_checkout_session_id = excluded.provider_checkout_session_id,
           provider_product_id = excluded.provider_product_id,
           starts_at = excluded.starts_at,
           ends_at = excluded.ends_at,
           updated_at = CURRENT_TIMESTAMP`,
      ).bind(
        result.entitlementId,
        result.claimedByUserId,
        result.planFamily,
        result.billingMode,
        result.status,
        result.providerCustomerId,
        result.providerSubscriptionId,
        result.providerCheckoutSessionId,
        result.providerProductId,
        result.startsAt,
        result.endsAt,
      ),
    );
  } else {
    statements.push(
      env.DB.prepare(
        `INSERT INTO pending_entitlements (
           id,
           customer_email,
           billing_provider,
           plan_family,
           billing_mode,
           status,
           provider_customer_id,
           provider_subscription_id,
           provider_payment_id,
           provider_product_id,
           provider_event_id,
           starts_at,
           ends_at,
           payload_json
         ) VALUES (?, ?, 'dodo_payments', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(provider_event_id) DO UPDATE SET
           id = excluded.id,
           customer_email = excluded.customer_email,
           status = excluded.status,
           provider_customer_id = excluded.provider_customer_id,
           provider_subscription_id = excluded.provider_subscription_id,
           provider_payment_id = excluded.provider_payment_id,
           provider_product_id = excluded.provider_product_id,
           starts_at = excluded.starts_at,
           ends_at = excluded.ends_at,
           payload_json = excluded.payload_json,
           updated_at = CURRENT_TIMESTAMP`,
      ).bind(
        result.entitlementId,
        result.customerEmail,
        result.planFamily,
        result.billingMode,
        result.status,
        result.providerCustomerId,
        result.providerSubscriptionId,
        result.providerPaymentId,
        result.providerProductId,
        result.providerEventId,
        result.startsAt,
        result.endsAt,
        result.payloadJson,
      ),
    );
  }

  await env.DB.batch(statements);

  return { persisted: true };
}

function requireDatabase(env: Env): D1Database | Response {
  if (!env.DB) {
    return serverMisconfigured("D1 binding is not configured.");
  }
  return env.DB;
}

async function requireActor(request: Request, env: Env, db?: D1Database): Promise<AuthenticatedActor | Response> {
  const actor = await resolveAuthenticatedActor(request, env);
  if (!actor) {
    return unauthorized("Authenticated session required.");
  }
  if (db) {
    await upsertUser(db, actor);
  }
  return actor;
}

async function requirePaidActor(
  request: Request,
  env: Env,
  db?: D1Database,
): Promise<[AuthenticatedActor, EntitlementRow[]] | Response> {
  if (!db) {
    return serverMisconfigured("D1 binding is not configured.");
  }

  const actor = await requireActor(request, env, db);
  if (actor instanceof Response) {
    return actor;
  }

  const entitlements = await listEntitlements(db, actor);
  const activeEntitlement = resolveActiveEntitlement(entitlements);
  if (!activeEntitlement) {
    return paymentRequired("An active entitlement is required for this feature.");
  }

  return [actor, entitlements] as const;
}

async function serveSpa(request: Request, env: Env): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const url = new URL(request.url);
  const fallbackRequest = new Request(`${url.origin}/index.html`, request);
  return env.ASSETS.fetch(fallbackRequest);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const dodoConfig = resolveDodoConfiguration(env);
      return json({
        ok: true,
        service: "aiglossary-v2",
        date: new Date().toISOString(),
        capabilities: {
          clerkConfigured: resolveConfigured(env),
          d1Configured: Boolean(env.DB),
          dodoBillingConfigured: dodoConfig.billingReady,
          dodoWebhookConfigured: dodoConfig.webhookReady,
        },
      });
    }

    if (url.pathname === "/api/plans") {
      return json({ plans: PLAN_DEFINITIONS });
    }

    if (url.pathname === "/api/auth/session") {
      const actor = await resolveAuthenticatedActor(request, env);
      let entitlements: Awaited<ReturnType<typeof listEntitlements>> = [];

      if (actor && env.DB) {
        await upsertUser(env.DB, actor);
        await claimPendingEntitlements(env.DB, actor);
        entitlements = await listEntitlements(env.DB, actor);
      }

      return json({
        session: buildSessionSummary(resolveConfigured(env), actor, entitlements),
      });
    }

    if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
      const body = await readJsonBody<{
        planKey?: string;
        billingMode?: string;
        successUrl?: string;
        cancelUrl?: string;
      }>(request);
      if (!body) {
        return badRequest("Invalid JSON body.");
      }

      if (!body.planKey || !isPlanKey(body.planKey)) {
        return badRequest("A valid planKey is required.");
      }
      if (!body.billingMode || !isBillingMode(body.billingMode)) {
        return badRequest("A valid billingMode is required.");
      }
      if (!body.successUrl?.trim() || !body.cancelUrl?.trim()) {
        return badRequest("Both successUrl and cancelUrl are required.");
      }

      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }

      const actor = await requireActor(request, env, db);
      if (actor instanceof Response) {
        return actor;
      }

      const dodoConfig = resolveDodoConfiguration(env);
      if (!dodoConfig.billingReady) {
        return serverMisconfigured("Dodo checkout is not configured.");
      }

      try {
        const checkout = await createDodoCheckoutSession(
          {
            planKey: body.planKey,
            billingMode: body.billingMode,
            email: actor.email,
            name: actor.displayName,
            successUrl: body.successUrl.trim(),
            cancelUrl: body.cancelUrl.trim(),
            metadata: {
              user_id: actor.userId,
              plan_key: body.planKey,
              billing_mode: body.billingMode,
            },
          },
          env,
          fetch,
        );

        return json({ checkout });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Checkout session creation failed.";
        const status = message.startsWith("Missing billing configuration") ? 503 : 502;
        return json({ error: message }, { status });
      }
    }

    if (url.pathname === "/api/billing/webhook" && request.method === "POST") {
      if (!env.DODO_PAYMENTS_WEBHOOK_KEY && !env.DODO_WEBHOOK_SECRET) {
        return serverMisconfigured("Dodo webhook key is not configured.");
      }

      const bodyText = await request.text();
      const headerRecord = Object.fromEntries(request.headers.entries());

      let payload: unknown;
      try {
        payload = unwrapDodoWebhook(bodyText, headerRecord, env);
      } catch {
        return json({ error: "Invalid webhook signature." }, { status: 401 });
      }

      const result = derivePendingEntitlementFromWebhook(payload);
      if (result.kind === "ignored") {
        return json({ ok: true, ignored: true, reason: result.reason });
      }

      let persistence;
      try {
        persistence = await persistPendingEntitlement(env, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Billing persistence failed.";
        return serverMisconfigured(message);
      }

      return json({
        ok: true,
        persisted: persistence.persisted,
        providerEventId: result.providerEventId,
        customerEmail: result.customerEmail,
        status: result.status,
        billingMode: result.billingMode,
      });
    }

    if (url.pathname === "/api/entitlements/claim" && request.method === "POST") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const actor = await requireActor(request, env, db);
      if (actor instanceof Response) {
        return actor;
      }

      const claimResult = await claimPendingEntitlements(db, actor);
      return json({ ok: true, claimedCount: claimResult.claimedCount });
    }

    if (url.pathname === "/api/entitlements" && request.method === "GET") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const actor = await requireActor(request, env, db);
      if (actor instanceof Response) {
        return actor;
      }

      return json({ entitlements: await listEntitlements(db, actor) });
    }

    if (url.pathname === "/api/bookmarks") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const paidActorResult = await requirePaidActor(request, env, db);
      if (paidActorResult instanceof Response) {
        return paidActorResult;
      }

      const [actor] = paidActorResult;

      if (request.method === "GET") {
        return json({ bookmarks: await listBookmarks(db, actor) });
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{ termSlug?: string }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.termSlug?.trim()) {
          return badRequest("termSlug is required.");
        }
        await addBookmark(db, actor, body.termSlug.trim());
        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        const body = await readJsonBody<{ termSlug?: string }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.termSlug?.trim()) {
          return badRequest("termSlug is required.");
        }
        await removeBookmark(db, actor, body.termSlug.trim());
        return json({ ok: true });
      }
    }

    if (url.pathname === "/api/notes") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const paidActorResult = await requirePaidActor(request, env, db);
      if (paidActorResult instanceof Response) {
        return paidActorResult;
      }

      const [actor] = paidActorResult;

      if (request.method === "GET") {
        return json({ notes: await listNotes(db, actor) });
      }

      if (request.method === "PUT") {
        const body = await readJsonBody<{
          termSlug?: string;
          title?: string | null;
          bodyMarkdown?: string;
          visibility?: string | null;
        }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.termSlug?.trim()) {
          return badRequest("termSlug is required.");
        }
        if (typeof body.bodyMarkdown !== "string") {
          return badRequest("bodyMarkdown is required.");
        }
        await upsertNote(db, actor, {
          termSlug: body.termSlug.trim(),
          title: body.title ?? null,
          bodyMarkdown: body.bodyMarkdown,
          visibility: body.visibility ?? "private",
        });
        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        const body = await readJsonBody<{ termSlug?: string }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.termSlug?.trim()) {
          return badRequest("termSlug is required.");
        }
        await deleteNote(db, actor, body.termSlug.trim());
        return json({ ok: true });
      }
    }

    if (url.pathname === "/api/annotations") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const paidActorResult = await requirePaidActor(request, env, db);
      if (paidActorResult instanceof Response) {
        return paidActorResult;
      }

      const [actor] = paidActorResult;

      if (request.method === "GET") {
        const termSlug = url.searchParams.get("termSlug")?.trim();
        return json({ annotations: await listAnnotations(db, actor, termSlug) });
      }

      if (request.method === "PUT") {
        const body = await readJsonBody<{
          annotationId?: string | null;
          termSlug?: string;
          blockId?: string;
          selectedText?: string | null;
          noteBody?: string | null;
        }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.termSlug?.trim() || !body.blockId?.trim()) {
          return badRequest("termSlug and blockId are required.");
        }
        const annotationId = await upsertAnnotation(db, actor, {
          annotationId: body.annotationId ?? null,
          termSlug: body.termSlug.trim(),
          blockId: body.blockId.trim(),
          selectedText: body.selectedText ?? null,
          noteBody: body.noteBody ?? null,
        });
        return json({ ok: true, annotationId });
      }

      if (request.method === "DELETE") {
        const body = await readJsonBody<{ annotationId?: string }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.annotationId?.trim()) {
          return badRequest("annotationId is required.");
        }
        await deleteAnnotation(db, actor, body.annotationId.trim());
        return json({ ok: true });
      }
    }

    if (url.pathname === "/api/share-links") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const paidActorResult = await requirePaidActor(request, env, db);
      if (paidActorResult instanceof Response) {
        return paidActorResult;
      }

      const [actor] = paidActorResult;

      if (request.method === "GET") {
        return json({ shareLinks: await listShareLinks(db, actor) });
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{
          resourceType?: string;
          resourceId?: string;
          visibility?: string | null;
          expiresAt?: string | null;
        }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        if (!body.resourceType?.trim() || !body.resourceId?.trim()) {
          return badRequest("resourceType and resourceId are required.");
        }
        const shareLink = await createShareLink(db, actor, {
          resourceType: body.resourceType.trim(),
          resourceId: body.resourceId.trim(),
          visibility: body.visibility ?? "private",
          expiresAt: body.expiresAt ?? null,
        });
        return json({ shareLink });
      }
    }

    if (url.pathname.startsWith("/api/shared/") && request.method === "GET") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }

      const token = decodeURIComponent(url.pathname.replace("/api/shared/", "")).trim();
      if (!token) {
        return badRequest("share token is required.");
      }

      const shareLink = await getShareLinkByToken(db, token);
      if (!shareLink) {
        return json({ error: "Shared resource not found." }, { status: 404 });
      }

      return json({
        shared: {
          resourceType: shareLink.resourceType,
          resourceId: shareLink.resourceId,
          visibility: shareLink.visibility,
          expiresAt: shareLink.expiresAt,
          createdAt: shareLink.createdAt,
        },
      });
    }

    if (url.pathname === "/api/exports") {
      const db = requireDatabase(env);
      if (db instanceof Response) {
        return db;
      }
      const paidActorResult = await requirePaidActor(request, env, db);
      if (paidActorResult instanceof Response) {
        return paidActorResult;
      }

      const [actor] = paidActorResult;

      if (request.method === "GET") {
        return json({ exportJobs: await listExportJobs(db, actor) });
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{ exportType?: string }>(request);
        if (!body) {
          return badRequest("Invalid JSON body.");
        }
        const exportType = body.exportType?.trim() || "study-json";
        const exportJob = await createExportJob(db, actor, exportType);
        const [bookmarks, notes, annotations] = await Promise.all([
          listBookmarks(db, actor),
          listNotes(db, actor),
          listAnnotations(db, actor),
        ]);
        return json({
          exportJob,
          payload: {
            exportedAt: new Date().toISOString(),
            user: {
              id: actor.userId,
              email: actor.email,
            },
            bookmarks,
            notes,
            annotations,
          },
        });
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not implemented yet" }, { status: 501 });
    }

    return serveSpa(request, env);
  },
};
