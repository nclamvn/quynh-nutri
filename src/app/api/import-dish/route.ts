import { NextResponse } from "next/server";
import { importDish } from "@/lib/dish-import";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || text.trim().length < 4) {
      return NextResponse.json({ error: "Mô tả quá ngắn." }, { status: 400 });
    }
    const dish = await importDish(text);
    return NextResponse.json({ dish });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tách món" }, { status: 500 });
  }
}
