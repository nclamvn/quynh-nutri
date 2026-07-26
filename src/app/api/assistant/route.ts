import { kitchenAgent } from "@/lib/assistant/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Thiếu tin nhắn." }, { status: 400 });
    }
    const result = await kitchenAgent.generate({ messages });
    // Surface which tools ran (transparency: numbers came from engines, not the model).
    const toolsUsed = result.steps.flatMap((s) => s.toolCalls?.map((c) => c.toolName) ?? []);
    return Response.json({ text: result.text, toolsUsed });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Lỗi trợ lý" }, { status: 500 });
  }
}
