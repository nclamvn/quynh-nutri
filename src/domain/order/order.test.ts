import { describe, it, expect } from "vitest";
import { splitOrders, orderMessage, channelCapability, channelCarriesOrder, bestChannel } from "./index";
import type { Supplier } from "@/domain/types";
import type { ShoppingItem } from "@/domain/shopping";

const item = (commodityId: string, qty: number, unit = "g"): ShoppingItem => ({
  commodityId,
  qtyTotal: qty,
  unit,
  vendor: "x",
  trip: 1,
  kind: "fresh",
  checked: false,
});

const GROUPS: Record<string, string> = {
  com_ghe: "hải sản",
  com_rau_muong: "rau",
  com_muoi: "gia vị",
};
const group = (id: string) => GROUPS[id];

const choBaTu: Supplier = {
  id: "s_cho", householdId: "hh1", name: "Chợ bà Tư", type: "cho",
  channels: [{ kind: "zalo_chat", value: "0912345678" }],
  handles: ["rau", "hải sản", "thịt"],
};
const sieuThi: Supplier = {
  id: "s_bhx", householdId: "hh1", name: "Bách Hoá Xanh", type: "sieu_thi",
  channels: [{ kind: "their_app_web", value: "https://bachhoaxanh.com" }],
  handles: ["gia vị", "ngũ cốc"],
};

describe("channel capability — the L-1 honesty gate", () => {
  it("push/call channels carry the order; their_* only open the shop's own surface", () => {
    expect(channelCapability("zalo_chat")).toBe("push");
    expect(channelCapability("phone_sms")).toBe("push");
    expect(channelCapability("hotline")).toBe("call");
    expect(channelCapability("their_zalo_oa")).toBe("open");
    expect(channelCapability("their_app_web")).toBe("open");
    expect(channelCarriesOrder("zalo_chat")).toBe(true);
    expect(channelCarriesOrder("their_app_web")).toBe(false);
  });

  it("bestChannel prefers a carrying channel over an open-only one", () => {
    const mixed: Supplier = {
      id: "m", name: "m", type: "sieu_thi",
      channels: [{ kind: "their_app_web", value: "u" }, { kind: "hotline", value: "1900" }],
    };
    expect(bestChannel(mixed)?.kind).toBe("hotline");
    expect(bestChannel(sieuThi)?.kind).toBe("their_app_web"); // only option
  });
});

describe("splitOrders", () => {
  const items = [item("com_ghe", 800), item("com_rau_muong", 300), item("com_muoi", 40)];

  it("routes each item to the first supplier that handles its group", () => {
    const { orders } = splitOrders(items, [choBaTu, sieuThi], group);
    const cho = orders.find((o) => o.supplier.id === "s_cho")!;
    const bhx = orders.find((o) => o.supplier.id === "s_bhx")!;
    expect(cho.lines.map((l) => l.commodityId).sort()).toEqual(["com_ghe", "com_rau_muong"]);
    expect(bhx.lines.map((l) => l.commodityId)).toEqual(["com_muoi"]);
  });

  it("carries the grossed-up qty straight through as qtyGross (no re-derivation)", () => {
    const { orders } = splitOrders([item("com_ghe", 800)], [choBaTu], group);
    expect(orders[0].lines[0]).toMatchObject({ commodityId: "com_ghe", qtyGross: 800, unit: "g" });
  });

  it("flags an open-only supplier as canCarry=false and a chat supplier as true", () => {
    const { orders } = splitOrders(items, [choBaTu, sieuThi], group);
    expect(orders.find((o) => o.supplier.id === "s_cho")!.canCarry).toBe(true);
    expect(orders.find((o) => o.supplier.id === "s_bhx")!.canCarry).toBe(false);
  });

  it("surfaces items no supplier handles instead of dropping them", () => {
    const { orders, unmatched } = splitOrders([item("com_ghe", 800), item("com_unknown", 100)], [choBaTu], group);
    expect(orders[0].lines.map((l) => l.commodityId)).toEqual(["com_ghe"]);
    expect(unmatched.map((l) => l.commodityId)).toEqual(["com_unknown"]);
  });

  it("omits suppliers with no matching items", () => {
    const { orders } = splitOrders([item("com_muoi", 40)], [choBaTu, sieuThi], group);
    expect(orders.map((o) => o.supplier.id)).toEqual(["s_bhx"]);
  });
});

describe("orderMessage", () => {
  it("lists gram MUA and carries a note, with no fabricated prices", () => {
    const { orders } = splitOrders([item("com_ghe", 800), item("com_rau_muong", 300)], [choBaTu], group);
    const msg = orderMessage(orders[0], (id) => ({ com_ghe: "Ghẹ", com_rau_muong: "Rau muống" }[id] ?? id), {
      note: "Giao chiều nay giúp em nhé.",
    });
    expect(msg).toContain("• Ghẹ: 800g");
    expect(msg).toContain("• Rau muống: 300g");
    expect(msg).toContain("Giao chiều nay giúp em nhé.");
    expect(msg).not.toMatch(/\d[\d.]*\s*(đ|vnd|₫)/i); // no price
  });
});
