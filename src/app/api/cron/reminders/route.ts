import { timingSafeEqual } from "node:crypto";
import { dispatchHousekeeperReminders } from "@/lib/reminders/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sameSecret = (provided: string, expected: string): boolean => {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!provided || !sameSecret(provided, secret)) {
    return Response.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const summary = await dispatchHousekeeperReminders();
  return Response.json({ ok: true, summary });
}
