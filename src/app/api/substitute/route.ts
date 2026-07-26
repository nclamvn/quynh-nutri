import { NextResponse } from "next/server";
import { substitute } from "@/lib/substitute";
import type { Slot } from "@/domain/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { slot, missingCommodityId, currentDishId } = await req.json();
    if (!slot || !missingCommodityId) {
      return NextResponse.json({ error: "Thiếu slot hoặc nguyên liệu." }, { status: 400 });
    }
    const suggestions = substitute(slot as Slot, missingCommodityId, currentDishId);
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi gợi ý" }, { status: 500 });
  }
}
