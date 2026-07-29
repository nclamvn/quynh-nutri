import { NextResponse } from "next/server";
import { importDish } from "@/lib/dish-import";
import { apiUserId } from "@/lib/auth";
import { fetchBoundedText, parseJson, rateLimit, RequestError } from "@/lib/request-security";
import { z } from "zod";

export const runtime = "nodejs";

/** Fetch a recipe page and reduce it to plain text for the extractor. */
async function fetchRecipeText(url: string): Promise<string> {
  const html = await fetchBoundedText(url);
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000); // enough context for the extractor, bounded
}

const bodySchema = z.object({
  text: z.string().trim().max(12_000).optional(),
  url: z.string().trim().max(2_000).optional(),
}).strict().refine((value) => Boolean(value.text || value.url));

export async function POST(req: Request) {
  try {
    const userId = await apiUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!rateLimit(`import:${userId}`, 10, 60_000)) {
      return NextResponse.json({ error: "Thử lại sau một phút." }, { status: 429 });
    }
    const { text, url } = await parseJson(req, bodySchema, 16 * 1024);
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
    const status = e instanceof RequestError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tách món" }, { status });
  }
}
