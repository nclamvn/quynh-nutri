import { geocodeAddress } from "@/data/geocode";
import { apiUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/request-security";

// Address → suggested pin. User-triggered (one lookup per explicit action), cached +
// throttled server-side, User-Agent set here (browsers can't). Returns a suggestion
// the household then confirms/drags — never treated as ground truth.
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: Request) {
  const userId = await apiUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`geocode:${userId}`, 30, 60_000)) {
    return Response.json({ error: "Thử lại sau một phút." }, { status: 429 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 4 || q.length > 500) return Response.json({ result: null });
  try {
    const result = await geocodeAddress(q);
    return Response.json({ result });
  } catch {
    return Response.json({ result: null }); // never error the UI — falls back to manual pin
  }
}
