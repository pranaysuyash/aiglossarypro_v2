import { describe, expect, it } from "vitest";
import { buildSessionSummary, extractSessionToken, resolveConfigured } from "./session";

describe("extractSessionToken", () => {
  it("reads bearer tokens first", () => {
    const request = new Request("https://example.com/api/auth/session", {
      headers: {
        authorization: "Bearer session_token_123",
      },
    });

    expect(extractSessionToken(request)).toBe("session_token_123");
  });

  it("falls back to the __session cookie", () => {
    const request = new Request("https://example.com/api/auth/session", {
      headers: {
        cookie: "foo=bar; __session=session_cookie_token; theme=dark",
      },
    });

    expect(extractSessionToken(request)).toBe("session_cookie_token");
  });
});

describe("resolveConfigured", () => {
  it("requires a publishable key plus one server verification key", () => {
    expect(resolveConfigured({})).toBe(false);
    expect(resolveConfigured({ CLERK_PUBLISHABLE_KEY: "pk_test" })).toBe(false);
    expect(resolveConfigured({ CLERK_PUBLISHABLE_KEY: "pk_test", CLERK_SECRET_KEY: "sk_test" })).toBe(true);
    expect(resolveConfigured({ CLERK_PUBLISHABLE_KEY: "pk_test", CLERK_JWT_KEY: "jwt_test" })).toBe(false);
  });
});

describe("buildSessionSummary", () => {
  it("reports pre-auth mode when no actor is present", () => {
    expect(buildSessionSummary(false, null, [])).toEqual({
      authenticated: false,
      configured: false,
      provider: "clerk",
      user: null,
      entitlements: [],
    });
  });
});
