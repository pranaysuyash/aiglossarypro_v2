import { createClerkClient, verifyToken } from "@clerk/backend";
import type { AuthenticatedActor, EntitlementRow } from "./study";

export type SessionSummary = {
  authenticated: boolean;
  configured: boolean;
  provider: "clerk";
  user: { id: string; email: string; displayName: string | null } | null;
  entitlements: EntitlementRow[];
};

export type SessionEnv = {
  CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_JWT_KEY?: string;
  CLERK_AUTHORIZED_PARTIES?: string;
};

function extractSessionToken(request: Request): string | null {
  const authorization = request.headers.get("authorization")?.trim();
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [rawKey, ...rawValueParts] = cookiePart.trim().split("=");
    if (rawKey === "__session") {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return null;
}

function resolveAuthorizedParties(request: Request, env: SessionEnv): string[] {
  const configured = env.CLERK_AUTHORIZED_PARTIES
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured?.length) {
    return configured;
  }

  const origin = new URL(request.url).origin;
  return [origin];
}

function resolveConfigured(env: SessionEnv): boolean {
  return Boolean(env.CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);
}

function resolvePrimaryEmail(user: {
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
}): string | null {
  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }
  return user.emailAddresses[0]?.emailAddress ?? null;
}

function resolveDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string | null {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || null;
}

export async function resolveAuthenticatedActor(
  request: Request,
  env: SessionEnv,
): Promise<AuthenticatedActor | null> {
  if (!resolveConfigured(env)) {
    return null;
  }

  const token = extractSessionToken(request);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      jwtKey: env.CLERK_JWT_KEY,
      authorizedParties: resolveAuthorizedParties(request, env),
      clockSkewInMs: 5000,
    });

    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId || !env.CLERK_SECRET_KEY) {
      return null;
    }

    const clerkClient = createClerkClient({
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      secretKey: env.CLERK_SECRET_KEY,
    });

    const user = await clerkClient.users.getUser(userId);
    const email = resolvePrimaryEmail(user);
    if (!email) {
      return null;
    }

    return {
      userId,
      email,
      displayName: resolveDisplayName(user),
      provider: "clerk",
    };
  } catch {
    return null;
  }
}

export function buildSessionSummary(
  configured: boolean,
  actor: AuthenticatedActor | null,
  entitlements: EntitlementRow[],
): SessionSummary {
  return {
    authenticated: Boolean(actor),
    configured,
    provider: "clerk",
    user: actor
      ? {
          id: actor.userId,
          email: actor.email,
          displayName: actor.displayName,
        }
      : null,
    entitlements,
  };
}

function isExpiredByBoundary(rawAt: string | null, comparator: (value: number, now: number) => boolean, now: number): boolean {
  if (!rawAt) {
    return false;
  }

  const parsed = Date.parse(rawAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return comparator(parsed, now);
}

export function isEntitlementActive(entitlement: EntitlementRow, now = new Date()): boolean {
  const normalizedStatus = entitlement.status.trim().toLowerCase();
  if (normalizedStatus !== "active" && normalizedStatus !== "trialing") {
    return false;
  }

  const nowMs = now.getTime();
  if (isExpiredByBoundary(entitlement.startsAt, (startAt, boundary) => boundary < startAt, nowMs)) {
    return false;
  }
  if (isExpiredByBoundary(entitlement.endsAt, (endAt, boundary) => boundary > endAt, nowMs)) {
    return false;
  }

  return true;
}

export function resolveActiveEntitlement(
  entitlements: EntitlementRow[],
  now = new Date(),
): EntitlementRow | null {
  const active = entitlements.filter((entitlement) => isEntitlementActive(entitlement, now));
  if (!active.length) {
    return null;
  }

  const activeByCreatedAt = [...active].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || "") || 0;
    const rightTime = Date.parse(right.createdAt || "") || 0;
    if (leftTime === rightTime) {
      return (right.updatedAt || "").localeCompare(left.updatedAt || "");
    }
    return rightTime - leftTime;
  });

  return activeByCreatedAt[0];
}

export { extractSessionToken, resolveConfigured };
