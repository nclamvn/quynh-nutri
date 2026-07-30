import { apiUserId } from "@/lib/auth";
import {
  captureTextBodySchema,
  extractCaptureFromImage,
  extractCaptureFromText,
  mockCaptureProposal,
} from "@/lib/capture/extract";
import { parseJson, rateLimit, RequestError } from "@/lib/request-security";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  try {
    const userId = await apiUserId();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!rateLimit(`capture:${userId}`, 12, 60_000)) {
      return Response.json({ error: "Thử lại sau một phút." }, { status: 429 });
    }

    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.startsWith("application/json")) {
      const input = await parseJson(req, captureTextBodySchema, 8 * 1024);
      const proposal =
        process.env.NODE_ENV !== "production" && process.env.E2E_MOCK_AI === "1"
          ? mockCaptureProposal(input.kind, input.transcript)
          : await extractCaptureFromText(input.kind, input.transcript);
      return Response.json({ proposal });
    }

    const declared = Number(req.headers.get("content-length") ?? 0);
    if (!Number.isFinite(declared) || declared <= 0) {
      throw new RequestError("Thiếu kích thước ảnh.", 411);
    }
    if (declared > MAX_BODY_BYTES) throw new RequestError("Ảnh quá lớn.", 413);
    if (!contentType.startsWith("multipart/form-data")) {
      throw new RequestError("Định dạng yêu cầu không hợp lệ.", 415);
    }
    const form = await req.formData();
    const kind = form.get("kind");
    const file = form.get("image");
    if (kind !== "receipt" && kind !== "label") {
      throw new RequestError("Nguồn ảnh không hợp lệ.", 400);
    }
    if (!(file instanceof File)) throw new RequestError("Chưa có ảnh.", 400);
    if (!IMAGE_TYPES.has(file.type)) {
      throw new RequestError("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.", 415);
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw new RequestError("Ảnh phải nhỏ hơn 5 MB.", 413);
    }

    const proposal =
      process.env.NODE_ENV !== "production" && process.env.E2E_MOCK_AI === "1"
        ? mockCaptureProposal(kind)
        : await extractCaptureFromImage(
            kind,
            new Uint8Array(await file.arrayBuffer()),
            file.type,
            file.name.slice(0, 160),
          );
    return Response.json({ proposal });
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500;
    const message = error instanceof RequestError
      ? error.message
      : "Chưa đọc được nguồn này. Hãy thử ảnh rõ hơn hoặc nhập bằng tay.";
    return Response.json({ error: message }, { status });
  }
}
