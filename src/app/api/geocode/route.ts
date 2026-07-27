import { geocodeAddress } from "@/data/geocode";

// Address → suggested pin. User-triggered (one lookup per explicit action), cached +
// throttled server-side, User-Agent set here (browsers can't). Returns a suggestion
// the household then confirms/drags — never treated as ground truth.
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 4) return Response.json({ result: null });
  try {
    const result = await geocodeAddress(q);
    return Response.json({ result });
  } catch {
    return Response.json({ result: null }); // never error the UI — falls back to manual pin
  }
}
