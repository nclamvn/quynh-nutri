import { z } from "zod";

export const ONBOARDING_RESTRICTIONS = [
  "vegetarian",
  "pescatarian",
  "no_pork",
  "no_beef",
] as const;

export const ONBOARDING_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const onboardingInputSchema = z.object({
  requestId: z.string().uuid(),
  adults: z.number().int().min(0).max(12),
  children: z.number().int().min(0).max(12),
  restrictions: z.array(z.enum(ONBOARDING_RESTRICTIONS)).max(4),
  busyDays: z.array(z.enum(ONBOARDING_DAYS)).max(7),
  marketMode: z.enum(["traditional", "mixed", "supermarket"]),
}).strict().superRefine((value, ctx) => {
  if (value.adults + value.children < 1) {
    ctx.addIssue({
      code: "custom",
      path: ["adults"],
      message: "HOUSEHOLD_MUST_HAVE_MEMBER",
    });
  }
  if (value.adults + value.children > 12) {
    ctx.addIssue({
      code: "custom",
      path: ["children"],
      message: "HOUSEHOLD_TOO_LARGE",
    });
  }
  if (new Set(value.restrictions).size !== value.restrictions.length) {
    ctx.addIssue({
      code: "custom",
      path: ["restrictions"],
      message: "DUPLICATE_RESTRICTION",
    });
  }
  if (new Set(value.busyDays).size !== value.busyDays.length) {
    ctx.addIssue({
      code: "custom",
      path: ["busyDays"],
      message: "DUPLICATE_BUSY_DAY",
    });
  }
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export type OnboardingResult = {
  status: "completed" | "already-complete";
  memberCount: number;
};

