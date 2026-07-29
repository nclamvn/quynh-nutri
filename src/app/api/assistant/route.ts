import { kitchenAgent } from "@/lib/assistant/agent";
import { apiUserId } from "@/lib/auth";
import { parseJson, rateLimit, RequestError } from "@/lib/request-security";
import { z } from "zod";
import { getKitchenAgendaSnapshot } from "@/lib/assistant/kitchen-agenda";
import { getPrepAheadGuideSnapshot } from "@/lib/assistant/prep-ahead";
import { loadOrCreateCurrentWeekPlan } from "@/data/repo/week-plan";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(8_000),
  }).strict()).min(1).max(40),
}).strict();

export async function POST(req: Request) {
  try {
    const userId = await apiUserId();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!rateLimit(`assistant:${userId}`, 20, 60_000)) {
      return Response.json({ error: "Thử lại sau một phút." }, { status: 429 });
    }
    const { messages } = await parseJson(req, bodySchema, 128 * 1024);
    if (
      process.env.NODE_ENV !== "production"
      && process.env.E2E_MOCK_AI === "1"
    ) {
      const latest = messages.at(-1)?.content.toLocaleLowerCase("vi");
      if (latest?.includes("thực đơn nhà tôi")) {
        const { plan, householdDishes } = await loadOrCreateCurrentWeekPlan();
        const first = plan.slots[0];
        const dish = first
          ? householdDishes.find((item) => item.id === first.dishId)
            ?? REPERTOIRE_BY_ID[first.dishId]
          : undefined;
        return new Response(
          dish
            ? `Theo thực đơn đã lưu của gia đình, món đầu tiên là ${dish.vnName}. Tôi chỉ đọc và không tự đổi hoặc lưu thực đơn.`
            : "Thực đơn đã lưu hiện chưa có món. Tôi không tự thêm món.",
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      }
      if (latest?.includes("chuẩn bị") && latest?.includes("ngày mai")) {
        const prep = await getPrepAheadGuideSnapshot();
        const count = "guides" in prep && Array.isArray(prep.guides)
          ? prep.guides.length
          : 0;
        const summary = count > 0
          ? `Theo hướng dẫn đã rà soát, có ${count} món ngày mai hỗ trợ chuẩn bị trước. Tôi chỉ đọc hướng dẫn, không tự sinh bước và không tự sửa việc.`
          : "Theo hướng dẫn đã rà soát, chưa có món ngày mai đủ hỗ trợ chuẩn bị trước. Tôi không tự sinh bước thay thế.";
        return new Response(summary, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      if (latest?.includes("làm gì tiếp") || latest?.includes("việc bếp")) {
        const agenda = await getKitchenAgendaSnapshot();
        const summary = agenda.tasks.length
          ? `Theo dữ liệu bạn đã ghi nhận, hiện có ${agenda.tasks.length} việc bếp đủ căn cứ. Tôi chỉ đọc agenda và không tự đánh dấu hoàn tất.`
          : "Theo dữ liệu bạn đã ghi nhận, chưa có việc bếp nào đủ căn cứ để nhắc. Tôi không tự nghĩ thêm việc.";
        return new Response(summary, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return new Response("Đây là phản hồi AI giả lập trong kiểm thử.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    // Stream the reply token-by-token. Tools still run server-side (numbers from
    // engines, never the model) before the final text streams.
    const result = await kitchenAgent.stream({ messages });
    return result.toTextStreamResponse();
  } catch (e) {
    const status = e instanceof RequestError ? e.status : 500;
    return Response.json({ error: e instanceof Error ? e.message : "Lỗi trợ lý" }, { status });
  }
}
