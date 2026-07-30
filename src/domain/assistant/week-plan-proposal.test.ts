import { describe, expect, it } from "vitest";
import type { PlannedSlot } from "@/domain/types";
import {
  isWeekPlanProposalRequest,
  weekPlanProposalChanges,
} from "./week-plan-proposal";

const slot = (
  day: number,
  kind: PlannedSlot["slot"],
  dishId: string,
  locked = false,
): PlannedSlot => ({ day, slot: kind, dishId, locked });

describe("assistant week plan proposal contract", () => {
  it("classifies change requests without intercepting read-only questions", () => {
    expect(isWeekPlanProposalRequest("Lên thực đơn tuần cho nhà mình")).toBe(true);
    expect(isWeekPlanProposalRequest("Tối ưu menu tuần này")).toBe(true);
    expect(isWeekPlanProposalRequest("Đổi cả tuần")).toBe(true);
    expect(isWeekPlanProposalRequest("Thực đơn nhà tôi là gì?")).toBe(false);
    expect(isWeekPlanProposalRequest("Bữa Thứ 2 đủ chất chưa?")).toBe(false);
  });

  it("returns a complete stable before/after diff", () => {
    const before = [
      slot(0, "COM", "rice", true),
      slot(0, "MAN", "pork"),
      slot(0, "RAU", "greens"),
    ];
    const after = [
      slot(0, "COM", "rice", true),
      slot(0, "MAN", "fish"),
      slot(0, "CANH", "soup"),
    ];
    expect(weekPlanProposalChanges(before, after)).toEqual([
      {
        day: 0,
        slot: "CANH",
        beforeDishId: null,
        afterDishId: "soup",
      },
      {
        day: 0,
        slot: "MAN",
        beforeDishId: "pork",
        afterDishId: "fish",
      },
      {
        day: 0,
        slot: "RAU",
        beforeDishId: "greens",
        afterDishId: null,
      },
    ]);
  });

  it("produces no change for equivalent slots", () => {
    const current = [slot(2, "MAN", "fish")];
    expect(weekPlanProposalChanges(current, structuredClone(current))).toEqual([]);
  });
});
