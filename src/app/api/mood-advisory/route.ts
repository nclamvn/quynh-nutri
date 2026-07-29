import { generateText } from "ai";
import { apiUserId } from "@/lib/auth";
import { parseJson, rateLimit, RequestError } from "@/lib/request-security";
import { z } from "zod";

// Warm framing ONLY. By design the client runs the crisis gate + picks the dishes
// deterministically BEFORE calling this — so the raw feeling text never reaches the
// server (no logging/profiling), and a crisis input never hits an LLM. This route
// receives only the mood key + already-chosen dish names and returns one warm
// sentence. It cannot add foods, make claims, or diagnose; on any error it returns
// warmth:null and the client falls back to the rule-based note.
export const runtime = "nodejs";
export const maxDuration = 30;

const MOOD_LABEL: Record<string, string> = {
  stress: "đang thấy căng thẳng",
  tired: "đang mệt",
  sleepless: "đang khó ngủ",
  low: "hôm nay hơi buồn",
  normal: "hôm nay",
};

const SYSTEM = [
  "Bạn viết đúng MỘT câu (tối đa hai câu ngắn) mở đầu ấm áp, bình tĩnh, tiếng Việt,",
  "cho một danh sách món đã được chọn sẵn theo tâm trạng người dùng.",
  "TUYỆT ĐỐI KHÔNG: chẩn đoán/nhận định tâm lý; nói món ăn chữa hay cải thiện tâm trạng;",
  "thêm bất kỳ món nào ngoài danh sách; nêu con số dinh dưỡng; dùng dấu chấm than.",
  "Chỉ thể hiện sự quan tâm và rằng đây là món gọn/quen để đỡ gánh nặng nấu — không phải thuốc.",
].join(" ");

const bodySchema = z.object({
  mood: z.enum(["stress", "tired", "sleepless", "low", "normal"]),
  dishes: z.array(z.object({ name: z.string().trim().min(1).max(120) }).passthrough()).max(6),
}).strict();

export async function POST(req: Request) {
  try {
    const userId = await apiUserId();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!rateLimit(`mood:${userId}`, 30, 60_000)) {
      return Response.json({ error: "Thử lại sau một phút." }, { status: 429 });
    }
    const { mood, dishes } = await parseJson(req, bodySchema);
    // E2E/CI: deterministic warmth, no LLM/key/network.
    if (process.env.E2E_MOCK_AI === "1") {
      return Response.json({ warmth: "Hôm nay chọn mấy món gọn nhẹ, đỡ phải nghĩ nhiều nhé." });
    }
    const label = MOOD_LABEL[mood as string] ?? "hôm nay";
    const list = dishes.map((d) => `- ${d.name}`).join("\n");
    if (!list) return Response.json({ warmth: null });
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      system: SYSTEM,
      prompt: `Người dùng ${label}. Các món đã chọn sẵn:\n${list}\n\nViết câu mở đầu ấm áp, ngắn, giới thiệu mấy món này một cách nhẹ nhàng.`,
    });
    const warmth = (text ?? "").trim();
    return Response.json({ warmth: warmth.length > 0 ? warmth : null });
  } catch (error) {
    if (error instanceof RequestError) {
      return Response.json({ error: error.message, warmth: null }, { status: error.status });
    }
    return Response.json({ warmth: null }); // client falls back to the rule-based note
  }
}
