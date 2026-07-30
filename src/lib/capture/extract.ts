import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import {
  captureProposalSchema,
  type CaptureKind,
  type CaptureProposal,
} from "@/domain/capture/proposal";

const MODEL = "anthropic/claude-sonnet-4.6";
const extractionSchema = captureProposalSchema.omit({ kind: true });

const SYSTEM = `Bạn chỉ chép lại dữ liệu nhìn thấy hoặc nghe thấy từ hóa đơn, nhãn hàng hay lời nói tiếng Việt.
Không suy đoán tên hàng, số lượng, đơn vị, giá, nơi mua hoặc ngày nếu nguồn không thể hiện rõ.
printedDate chỉ là ngày được in/đọc từ nhãn, chuẩn YYYY-MM-DD; không tự tính hạn dùng hay thời gian bảo quản.
pricePaid là tổng giá của đúng dòng hàng bằng VND, không phải đơn giá, chỉ điền khi nguồn thể hiện rõ.
Mọi trường không chắc chắn phải bỏ trống. Không trả về ID nội bộ, hướng dẫn an toàn hay hành động.`;

function finalizeCapture(
  kind: CaptureKind,
  extracted: z.infer<typeof extractionSchema>,
): CaptureProposal {
  return captureProposalSchema.parse({
    ...extracted,
    kind,
    // A date on a receipt or in a general voice note is not a package label
    // date. Never route it into the pantry best-before field.
    candidates: extracted.candidates.map((candidate) =>
      kind === "label"
        ? candidate
        : { ...candidate, printedDate: undefined }),
  });
}

export async function extractCaptureFromText(
  kind: CaptureKind,
  transcript: string,
): Promise<CaptureProposal> {
  const { object } = await generateObject({
    model: MODEL,
    schema: extractionSchema,
    system: SYSTEM,
    prompt: `Nguồn: ${kind}. Chép dữ liệu sau:\n${transcript}`,
  });
  return finalizeCapture(kind, object);
}

export async function extractCaptureFromImage(
  kind: Exclude<CaptureKind, "voice">,
  image: Uint8Array,
  mediaType: string,
  filename: string,
): Promise<CaptureProposal> {
  const { object } = await generateObject({
    model: MODEL,
    schema: extractionSchema,
    system: SYSTEM,
    messages: [{
      role: "user",
      content: [
        {
          type: "text",
          text: kind === "receipt"
            ? "Chép từng dòng hàng nhìn thấy trên hóa đơn. Bỏ qua tổng cộng nếu không thuộc một dòng hàng."
            : "Chép tên hàng và ngày in trên nhãn nếu nhìn rõ. Không tự tính hay diễn giải hạn dùng.",
        },
        {
          type: "file",
          data: { type: "data", data: image },
          mediaType,
          filename,
        },
      ],
    }],
  });
  return finalizeCapture(kind, object);
}

export function mockCaptureProposal(
  kind: CaptureKind,
  transcript = "",
): CaptureProposal {
  if (kind === "voice") {
    const quantity = Number(transcript.match(/\b(\d+(?:[.,]\d+)?)\b/)?.[1]?.replace(",", "."));
    return {
      kind,
      candidates: [{
        rawName: transcript.replace(/\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l)?\b/gi, "").trim() || "Bí xanh",
        ...(Number.isFinite(quantity) && quantity > 0 ? { quantity } : {}),
        ...(transcript.match(/\b(kg|ml|g|l)\b/i)?.[1] ? { unit: transcript.match(/\b(kg|ml|g|l)\b/i)![1] } : {}),
      }],
      notes: ["Bản đọc giả lập dùng trong kiểm thử."],
    };
  }
  return {
    kind,
    candidates: [{
      rawName: "Bí xanh",
      quantity: 310,
      unit: "g",
      ...(kind === "receipt" ? { pricePaid: 18_000 } : { printedDate: "2026-08-05" }),
    }],
    notes: ["Bản đọc giả lập dùng trong kiểm thử."],
  };
}

export const captureTextBodySchema = z.object({
  kind: z.literal("voice"),
  transcript: z.string().trim().min(2).max(2_000),
}).strict();
