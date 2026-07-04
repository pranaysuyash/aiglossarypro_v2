import { describe, expect, it, vi } from "vitest";
import { getShareLinkByToken } from "./study";

describe("getShareLinkByToken", () => {
  it("returns an unlisted share when the token is valid and still active", async () => {
    const first = vi.fn(async () => ({
      id: "share_123",
      userId: "user_123",
      resourceType: "term",
      resourceId: "transformer",
      token: "token123",
      visibility: "unlisted",
      expiresAt: "2099-01-01T00:00:00.000Z",
      createdAt: "2026-06-29T00:00:00.000Z",
    }));

    const db = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first,
        })),
      })),
    } as unknown as D1Database;

    await expect(getShareLinkByToken(db, "token123")).resolves.toMatchObject({
      resourceType: "term",
      resourceId: "transformer",
      visibility: "unlisted",
    });
  });

  it("hides private shares from public resolution", async () => {
    const db = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => ({
            id: "share_private",
            userId: "user_123",
            resourceType: "term",
            resourceId: "transformer",
            token: "token-private",
            visibility: "private",
            expiresAt: null,
            createdAt: "2026-06-29T00:00:00.000Z",
          })),
        })),
      })),
    } as unknown as D1Database;

    await expect(getShareLinkByToken(db, "token-private")).resolves.toBeNull();
  });

  it("hides expired shares from public resolution", async () => {
    const db = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => ({
            id: "share_expired",
            userId: "user_123",
            resourceType: "term",
            resourceId: "transformer",
            token: "token-expired",
            visibility: "unlisted",
            expiresAt: "2000-01-01T00:00:00.000Z",
            createdAt: "2026-06-29T00:00:00.000Z",
          })),
        })),
      })),
    } as unknown as D1Database;

    await expect(getShareLinkByToken(db, "token-expired")).resolves.toBeNull();
  });
});
