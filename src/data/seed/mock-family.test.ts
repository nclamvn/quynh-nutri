import { describe, expect, it } from "vitest";
import { dailyNeed } from "./needs";
import { familyConstraints } from "@/domain/constraints";
import { MOCK_FAMILY_LAM_QUYNH, cloneMockFamilyHousehold } from "./mock-family";

describe("mock family Nhà Lâm – Quỳnh", () => {
  it("keeps the five-person household and the requested member context", () => {
    const household = cloneMockFamilyHousehold();

    expect(household.size).toBe(5);
    expect(household.members.map((member) => member.name)).toEqual([
      "Nguyễn Cảnh Lâm",
      "Trần Thị Quỳnh",
      "Cherry",
      "Cốm",
      "Bà nội Cốm",
    ]);
    expect(household.members.find((member) => member.id === "lam")?.dislikes).toEqual(
      expect.arrayContaining(["mắm tôm", "mắm tép"]),
    );
    expect(household.members.find((member) => member.id === "cherry")?.ageBand).toBe("11-14");
    expect(household.members.find((member) => member.id === "com")?.ageBand).toBe("0-2");
    expect(MOCK_FAMILY_LAM_QUYNH.memberContexts.find((context) => context.memberId === "lam"))
      .toMatchObject({ ageYears: 41, heightCm: 173, weightKg: 59 });
  });

  it("keeps preferences soft and does not create medical or allergy constraints", () => {
    const household = cloneMockFamilyHousehold();
    const constraints = familyConstraints(household.members, "2026-08-07T00:00:00.000Z");

    expect(constraints.filter((constraint) => constraint.tier === "hard_safety")).toHaveLength(0);
    expect(constraints.filter((constraint) => constraint.tier === "medical")).toHaveLength(0);
    expect(constraints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberName: "Nguyễn Cảnh Lâm", rule: "mắm tôm", tier: "preference" }),
        expect.objectContaining({ memberName: "Cherry", rule: "sầu riêng", tier: "preference" }),
      ]),
    );
  });

  it("uses the toddler nutrition band for Cốm instead of the adult-child fallback", () => {
    const com = cloneMockFamilyHousehold().members.find((member) => member.id === "com")!;
    expect(dailyNeed(com)).toEqual({ kcal: 1180, proteinG: 20 });
  });
});
