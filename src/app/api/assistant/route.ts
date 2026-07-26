import { kitchenAgent } from "@/lib/assistant/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Thiếu tin nhắn." }, { status: 400 });
    }
    // Stream the reply token-by-token. Tools still run server-side (numbers from
    // engines, never the model) before the final text streams.
    const result = await kitchenAgent.stream({ messages });
    return result.toTextStreamResponse();
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Lỗi trợ lý" }, { status: 500 });
  }
}
