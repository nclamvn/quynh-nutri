import "server-only";

import { requireUserId } from "@/lib/auth";

export class OperatorAccessDenied extends Error {
  constructor() {
    super("Operator access denied.");
    this.name = "OperatorAccessDenied";
  }
}

export function parseOperatorAllowlist(raw: string | undefined): ReadonlySet<string> {
  if (!raw?.trim()) throw new OperatorAccessDenied();
  const entries = raw.split(",").map((entry) => entry.trim());
  if (
    entries.some(
      (entry) =>
        !entry
        || entry.length > 128
        || !/^[A-Za-z0-9_-]+$/.test(entry),
    )
  ) {
    throw new OperatorAccessDenied();
  }
  return new Set(entries);
}

export function isOperatorUserId(
  userId: string,
  rawAllowlist: string | undefined,
): boolean {
  try {
    return parseOperatorAllowlist(rawAllowlist).has(userId);
  } catch {
    return false;
  }
}

export async function requireOperatorUserId(): Promise<string> {
  const userId = await requireUserId();
  if (!isOperatorUserId(userId, process.env.OPS_USER_IDS)) {
    throw new OperatorAccessDenied();
  }
  return userId;
}
