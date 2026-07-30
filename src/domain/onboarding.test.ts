import { describe, expect, it } from "vitest";
import { onboardingInputSchema } from "./onboarding";

const valid = {
  requestId: "de305d54-75b4-431b-adb2-eb6b9e546014",
  adults: 2,
  children: 1,
  restrictions: ["no_pork"] as const,
  busyDays: ["Mon", "Wed"] as const,
  marketMode: "mixed" as const,
};

describe("household onboarding input", () => {
  it("accepts a minimum truthful household profile", () => {
    expect(onboardingInputSchema.parse(valid)).toMatchObject({
      adults: 2,
      children: 1,
    });
  });

  it("rejects empty, oversized and duplicate declarations", () => {
    expect(() => onboardingInputSchema.parse({
      ...valid,
      adults: 0,
      children: 0,
    })).toThrow("HOUSEHOLD_MUST_HAVE_MEMBER");
    expect(() => onboardingInputSchema.parse({
      ...valid,
      adults: 10,
      children: 3,
    })).toThrow("HOUSEHOLD_TOO_LARGE");
    expect(() => onboardingInputSchema.parse({
      ...valid,
      busyDays: ["Mon", "Mon"],
    })).toThrow("DUPLICATE_BUSY_DAY");
  });

  it("rejects extra identity or health fields", () => {
    expect(() => onboardingInputSchema.parse({
      ...valid,
      memberNames: ["A"],
      conditions: ["private"],
    })).toThrow();
  });
});

