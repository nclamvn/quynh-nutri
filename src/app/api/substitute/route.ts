import { NextResponse } from "next/server";
import { substitute } from "@/lib/substitute";
import type { Slot } from "@/domain/types";
import { apiUserId } from "@/lib/auth";
import { parseJson, rateLimit, RequestError } from "@/lib/request-security";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  slot: z.enum(["MAN", "RAU", "CANH", "COM", "TRANGMIENG"]),
  missingCommodityId: z.string().trim().min(1).max(128),
  currentDishId: z.string().trim().min(1).max(128).optional(),
}).strict();

export async function POST(req: Request) {
  try {
    const userId = await apiUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!rateLimit(`substitute:${userId}`, 60, 60_000)) {
      return NextResponse.json({ error: "Thử lại sau một phút." }, { status: 429 });
    }
    const { slot, missingCommodityId, currentDishId } = await parseJson(req, bodySchema);
    const suggestions = substitute(slot as Slot, missingCommodityId, currentDishId);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const status = e instanceof RequestError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi gợi ý" }, { status });
  }
}
