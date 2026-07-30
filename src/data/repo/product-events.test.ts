import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { requireUserId } = vi.hoisted(() => ({
  requireUserId: vi.fn(async () => "e2e-user"),
}));
vi.mock("@/lib/auth", () => ({
  isE2EMode: () => true,
  requireUserId,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("Product event E2E adapter must not access Neon");
  },
}));
vi.mock("@/data/repo/household", () => ({
  currentHouseholdId: async () => "household-a",
}));

import {
  recordProductEvent,
  resetE2EProductEventsForTests,
} from "./product-events";

describe("product event repository E2E adapter", () => {
  beforeEach(() => {
    resetE2EProductEventsForTests();
    requireUserId.mockClear();
  });

  it("records once and makes the same retry key idempotent", async () => {
    const event = {
      name: "onboarding_started" as const,
      dedupeKey: "onboarding_started:v1",
      properties: {},
    };
    await expect(recordProductEvent(event)).resolves.toEqual({ recorded: true });
    await expect(recordProductEvent(event)).resolves.toEqual({ recorded: false });
    expect(requireUserId).toHaveBeenCalledTimes(2);
  });
});

