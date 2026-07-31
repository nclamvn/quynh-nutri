import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { requireUserId } = vi.hoisted(() => ({
  requireUserId: vi.fn(async () => "user_owner"),
}));
vi.mock("@/lib/auth", () => ({ requireUserId }));

import {
  isOperatorUserId,
  OperatorAccessDenied,
  parseOperatorAllowlist,
  requireOperatorUserId,
} from "./operator-auth";

describe("operator authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPS_USER_IDS", "user_owner,user_backup");
  });

  it("parses exact server-side IDs", () => {
    expect(parseOperatorAllowlist(" user_a, user_b ")).toEqual(
      new Set(["user_a", "user_b"]),
    );
    expect(isOperatorUserId("user", "user_owner")).toBe(false);
  });

  it("fails closed for missing or malformed configuration", () => {
    expect(() => parseOperatorAllowlist(undefined)).toThrow(OperatorAccessDenied);
    expect(() => parseOperatorAllowlist("user_a,,user_b")).toThrow(OperatorAccessDenied);
    expect(isOperatorUserId("user_owner", "user_owner,$invalid")).toBe(false);
  });

  it("requires authentication before checking operator membership", async () => {
    await expect(requireOperatorUserId()).resolves.toBe("user_owner");
    expect(requireUserId).toHaveBeenCalledOnce();
  });

  it("rejects an authenticated family user outside the allowlist", async () => {
    requireUserId.mockResolvedValueOnce("user_family");
    await expect(requireOperatorUserId()).rejects.toBeInstanceOf(OperatorAccessDenied);
  });
});
