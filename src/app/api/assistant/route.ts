import { kitchenAgent } from "@/lib/assistant/agent";
import { apiUserId } from "@/lib/auth";
import { parseJson, rateLimit, RequestError } from "@/lib/request-security";
import { z } from "zod";
import { getDailyHousekeeperBriefSnapshot } from "@/lib/assistant/kitchen-agenda";
import { getPrepAheadGuideSnapshot } from "@/lib/assistant/prep-ahead";
import { loadOrCreateCurrentWeekPlan } from "@/data/repo/week-plan";
import { REPERTOIRE_BY_ID } from "@/data/seed/repertoire";
import { isWeekPlanProposalRequest } from "@/domain/assistant/week-plan-proposal";
import { createAssistantWeekPlanProposal } from "@/lib/assistant/week-plan-proposal";
import { getHouseholdMealMemorySnapshot } from "@/lib/assistant/meal-memory";

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
    const latest = messages.at(-1);
    const latestMessage = latest?.content ?? "";
    if (
      latest?.role === "user"
      && isWeekPlanProposalRequest(latestMessage)
    ) {
      const proposal = await createAssistantWeekPlanProposal();
      return Response.json(
        proposal
          ? {
              type: "week-plan-proposal",
              message:
                "Tôi đã chuẩn bị một phương án mới. Hãy xem toàn bộ phần thay đổi bên dưới. Chưa có gì được áp dụng.",
              proposal,
            }
          : {
              type: "proposal-unavailable",
              message:
                "Tôi chưa tìm được phương án khác vẫn giữ đủ các ràng buộc của gia đình. Thực đơn hiện tại không thay đổi.",
            },
      );
    }
    if (
      process.env.NODE_ENV !== "production"
      && process.env.E2E_MOCK_AI === "1"
    ) {
      const latest = latestMessage.toLocaleLowerCase("vi");
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
        const brief = await getDailyHousekeeperBriefSnapshot();
        const activeStations = brief.stations.filter((station) => station.tasks.length > 0);
        const summary = brief.tasks.length
          ? `Theo dữ liệu bạn đã ghi nhận, hiện có ${brief.tasks.length} việc bếp tại ${activeStations.length} trạm đủ căn cứ. Tôi chỉ đọc bản tin và không tự đánh dấu hoàn tất.`
          : "Theo dữ liệu bạn đã ghi nhận, chưa có việc bếp nào đủ căn cứ để nhắc. Tôi không tự nghĩ thêm việc.";
        return new Response(summary, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      if (
        latest?.includes("nhà mình thích")
        || latest?.includes("món nào nên lặp")
        || latest?.includes("phản hồi sau bữa")
      ) {
        const memory = await getHouseholdMealMemorySnapshot();
        const summary = memory.totalFeedbackCount > 0
          ? `Theo ${memory.totalFeedbackCount} phản hồi gia đình đã xác nhận, tôi chỉ đọc số đếm trong trí nhớ bữa cơm và không tự tạo, sửa hoặc xoá phản hồi.`
          : "Gia đình chưa có phản hồi bữa cơm đã xác nhận. Tôi không suy đoán sở thích từ lượt xem, món thừa hoặc thực đơn.";
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
