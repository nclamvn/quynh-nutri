import "server-only";
import { auth } from "@clerk/nextjs/server";

/**
 * The E2E bypass is deliberately available only in a non-production process.
 * In this mode the repository is also forced onto its in-memory adapter, so an
 * auth-bypassed browser can never fall through to Neon.
 */
export function isE2EMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.E2E_BYPASS_AUTH === "1";
}

/** Authenticate at the resource boundary. Never fall back to a shared household. */
export async function requireUserId(): Promise<string> {
  if (isE2EMode()) return "e2e-user";
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/** Route-handler variant with the correct HTTP semantics. */
export async function apiUserId(): Promise<string | null> {
  if (isE2EMode()) return "e2e-user";
  const { userId } = await auth();
  return userId;
}
