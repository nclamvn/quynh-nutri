import type { Household } from "@/domain/types";

// P0 — "Bà nội trợ Việt thành thị" default household (INTAKE-SEED §2).
// This is a config instance of B0, NOT hardcoded truth — a real household (B1)
// edits size/members/vendors and overrides it.
export const DEFAULT_HOUSEHOLD: Household = {
  id: "hh_default",
  name: "Hộ mặc định",
  size: 4,
  marketMode: "mixed",
  cookTimeCapMin: 45,
  busyDays: ["Mon", "Wed"],
  lactatingMember: false,
  members: [
    { id: "m1", role: "adult", sex: "F", activity: "moderate" },
    { id: "m2", role: "adult", sex: "M", activity: "moderate" },
    { id: "m3", role: "child", ageBand: "6-10", activity: "moderate" },
    { id: "m4", role: "child", ageBand: "3-5", activity: "moderate" },
  ],
};
