import http from "node:http";

const port = 8787;
const now = () => new Date().toISOString();
const mockAuthenticated = process.env.AIGLOSSARY_DEV_AUTH === "1";
const mockPremium = process.env.AIGLOSSARY_DEV_PREMIUM !== "0";

function json(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function emptyCollection(name) {
  return { [name]: [] };
}

const plans = {
  plans: [
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
  ],
};

function buildSession() {
  if (!mockAuthenticated) {
    return {
      session: {
        authenticated: false,
        configured: false,
        provider: "clerk",
        user: null,
        entitlements: [],
      },
    };
  }

  const timestamp = now();
  return {
    session: {
      authenticated: true,
      configured: false,
      provider: "clerk",
      user: {
        id: "dev-user-arjun",
        email: "arjun.dev@example.test",
        displayName: "Arjun",
      },
      entitlements: mockPremium
        ? [
            {
              id: "dev-entitlement-pro-lifetime",
              planFamily: "pro",
              billingMode: "lifetime",
              status: "active",
              startsAt: null,
              endsAt: null,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ]
        : [],
    },
  };
}

const health = {
  ok: true,
  service: "aiglossary-v2-dev-api",
  date: now(),
  capabilities: {
    clerkConfigured: false,
    d1Configured: true,
    dodoBillingConfigured: false,
    dodoWebhookConfigured: false,
  },
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:8787");

  if (request.method === "GET" && url.pathname === "/api/health") {
    json(response, 200, { ...health, date: now() });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/plans") {
    json(response, 200, plans);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    json(response, 200, buildSession());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bookmarks") {
    json(response, 200, emptyCollection("bookmarks"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/notes") {
    json(response, 200, emptyCollection("notes"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/annotations") {
    json(response, 200, emptyCollection("annotations"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/share-links") {
    json(response, 200, emptyCollection("shareLinks"));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/exports") {
    json(response, 200, emptyCollection("exportJobs"));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/billing/checkout") {
    json(response, 401, { error: "Auth required for dev stub checkout." });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/billing/webhook") {
    json(response, 401, { error: "Webhook auth required for dev stub." });
    return;
  }

  if (request.method === "POST" && url.pathname.startsWith("/api/")) {
    json(response, 401, { error: "Auth required for dev stub." });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/shared/")) {
    json(response, 404, { error: "Shared link not found in dev stub." });
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    json(response, 404, { error: "Not found in dev stub." });
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  const mode = mockAuthenticated ? `mock authenticated${mockPremium ? " Pro" : ""}` : "logged out";
  console.log(`AIGlossary dev API stub listening at http://127.0.0.1:${port} (${mode})`);
});
