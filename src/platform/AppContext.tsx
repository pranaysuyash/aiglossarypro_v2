import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EntitlementRecord } from "../types";
import { useWorkerRequest } from "./workerApi";

export type AppPlan = {
  key: "pro-subscription" | "pro-lifetime";
  name: string;
  billingProvider: "dodo_payments";
  billingOptions: Array<"monthly" | "yearly" | "lifetime">;
  featureAccess: string[];
  priceDisplay: string;
};

export type SessionSummary = {
  authenticated: boolean;
  configured: boolean;
  provider: "clerk";
  user: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  entitlements: EntitlementRecord[];
};

export type ServiceCapabilities = {
  clerkConfigured: boolean;
  d1Configured: boolean;
  dodoBillingConfigured: boolean;
  dodoWebhookConfigured: boolean;
};

export type ServiceHealth = {
  ok: boolean;
  service: string;
  date: string;
  capabilities: ServiceCapabilities;
};

export type AppStateSource = "worker" | "unavailable";

type AppContextValue = {
  plans: AppPlan[];
  session: SessionSummary | null;
  serviceHealth: ServiceHealth | null;
  activeEntitlement: EntitlementRecord | null;
  hasActiveMembership: boolean;
  isLoading: boolean;
  error: string | null;
  source: AppStateSource;
  fallbackReason: string | null;
};

const AppContext = createContext<AppContextValue | null>(null);

const LOCAL_FALLBACK_PLANS: AppPlan[] = [
  {
    key: "pro-subscription",
    name: "Pro Subscription",
    billingProvider: "dodo_payments",
    billingOptions: ["monthly", "yearly"],
    featureAccess: [
      "Full glossary access",
      "Saved terms and personal notebook",
      "Annotations, share links, and exports",
    ],
    priceDisplay: "Membership pricing via Dodo",
  },
  {
    key: "pro-lifetime",
    name: "Pro Lifetime",
    billingProvider: "dodo_payments",
    billingOptions: ["lifetime"],
    featureAccess: [
      "Everything in Pro",
      "Permanent access to purchased coverage",
      "No recurring billing",
    ],
    priceDisplay: "Lifetime access via Dodo",
  },
];

function joinLoadErrors(results: PromiseSettledResult<unknown>[]): string | null {
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => (result.reason instanceof Error ? result.reason.message : "App state load failed"));

  return errors.length ? errors.join(" | ") : null;
}

function isActiveMembership(entitlement: EntitlementRecord, now = new Date()): boolean {
  const status = entitlement.status.trim().toLowerCase();
  if (status !== "active" && status !== "trialing") {
    return false;
  }

  if (entitlement.startsAt) {
    const startsAt = Date.parse(entitlement.startsAt);
    if (!Number.isNaN(startsAt) && startsAt > now.getTime()) {
      return false;
    }
  }

  if (entitlement.endsAt) {
    const endsAt = Date.parse(entitlement.endsAt);
    if (!Number.isNaN(endsAt) && endsAt < now.getTime()) {
      return false;
    }
  }

  return true;
}

function resolveActiveEntitlement(entitlements: EntitlementRecord[]): EntitlementRecord | null {
  const activeEntitlements = entitlements.filter((entitlement) => isActiveMembership(entitlement));
  if (!activeEntitlements.length) {
    return null;
  }

  const sorted = [...activeEntitlements].sort((left, right) => {
    const rightCreated = Date.parse(right.createdAt || "");
    const leftCreated = Date.parse(left.createdAt || "");

    if (!Number.isNaN(rightCreated) && !Number.isNaN(leftCreated)) {
      return rightCreated - leftCreated;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });

  return sorted[0];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const apiRequest = useWorkerRequest();
  const [plans, setPlans] = useState<AppPlan[]>(LOCAL_FALLBACK_PLANS);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<AppStateSource>("worker");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAppState() {
      const results = await Promise.allSettled([
        apiRequest<{ plans: AppPlan[] }>("/api/plans"),
        apiRequest<{ session: SessionSummary }>("/api/auth/session"),
        apiRequest<ServiceHealth>("/api/health"),
      ]);

      if (isCancelled) {
        return;
      }

      const [plansResult, sessionResult, healthResult] = results;
      const loadError = joinLoadErrors(results);

      if (plansResult.status === "fulfilled") {
        setPlans(plansResult.value.plans);
      } else {
        setPlans(LOCAL_FALLBACK_PLANS);
      }

      if (sessionResult.status === "fulfilled") {
        setSession(sessionResult.value.session);
      } else {
        setSession(null);
      }

      if (healthResult.status === "fulfilled") {
        setServiceHealth(healthResult.value);
      } else {
        setServiceHealth(null);
      }

      if (loadError) {
        setError(loadError);
        setSource("unavailable");
        setFallbackReason(loadError);
      } else {
        setError(null);
        setSource("worker");
        setFallbackReason(null);
      }

      setIsLoading(false);
    }

    function refreshOnVisibility() {
      if (document.visibilityState === "visible") {
        setIsLoading(true);
        void loadAppState();
      }
    }

    function refreshOnFocus() {
      setIsLoading(true);
      void loadAppState();
    }

    void loadAppState();

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      isCancelled = true;
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [apiRequest]);

  const value = useMemo<AppContextValue>(() => {
    const activeEntitlement = session ? resolveActiveEntitlement(session.entitlements) : null;
    return {
      plans,
      session,
      serviceHealth,
      activeEntitlement,
      hasActiveMembership: Boolean(activeEntitlement),
      isLoading,
      error,
      source,
      fallbackReason,
    };
  },
    [error, fallbackReason, isLoading, plans, session, serviceHealth, source],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return context;
}
