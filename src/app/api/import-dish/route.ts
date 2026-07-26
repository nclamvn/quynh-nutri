import { NextResponse } from "next/server";
import { importDish } from "@/lib/dish-import";

export const runtime = "nodejs";

/** Fetch a recipe page and reduce it to plain text for the extractor. */
async function fetchRecipeText(url: string): Promise<string> {
  const u = new URL(url); // throws on malformed → 400 below
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Chỉ hỗ trợ http(s).");
  const res = await fetch(u, { headers: { "user-agent": "QsKitchen-recipe-import/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`Không tải được trang (${res.status}).`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000); // enough context for the extractor, bounded
}

export async function POST(req: Request) {
  try {
    const { text, url } = await req.json();
    let input: string;
    if (typeof url === "string" && url.trim()) {
      input = await fetchRecipeText(url.trim());
      if (input.length < 20) return NextResponse.json({ error: "Trang không có nội dung công thức đọc được." }, { status: 400 });
    } else if (typeof text === "string" && text.trim().length >= 4) {
      input = text;
    } else {
      return NextResponse.json({ error: "Nhập mô tả món hoặc dán link công thức." }, { status: 400 });
    }
    const dish = await importDish(input);
    return NextResponse.json({ dish });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tách món" }, { status: 500 });
  }
}
