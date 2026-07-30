import "server-only";

import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import { isE2EMode, requireUserId } from "@/lib/auth";
import { currentHouseholdId } from "@/data/repo/household";
import type {
  DeleteKitchenSessionResult,
  KitchenSessionKind,
  PersistedKitchenSession,
  SaveKitchenSessionResult,
} from "@/domain/kitchen-execution/persisted-session";

type SessionRow = {
  id: string;
  kind: string;
  scopeKey: string;
  payload: unknown;
  version: number;
  updatedAt: Date;
};

const toSession = <T>(row: SessionRow): PersistedKitchenSession<T> => ({
  id: row.id,
  kind: row.kind as KitchenSessionKind,
  scopeKey: row.scopeKey,
  payload: structuredClone(row.payload) as T,
  version: row.version,
  updatedAt: row.updatedAt.toISOString(),
});

const e2eSessions = new Map<string, SessionRow>();
const sessionKey = (
  householdId: string,
  kind: KitchenSessionKind,
  scopeKey: string,
) => `${householdId}:${kind}:${scopeKey}`;

export async function loadKitchenSession<T>(
  kind: KitchenSessionKind,
  scopeKey: string,
): Promise<PersistedKitchenSession<T> | undefined> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (isE2EMode()) {
    const row = e2eSessions.get(sessionKey(householdId, kind, scopeKey));
    return row ? toSession<T>(row) : undefined;
  }
  const row = await getDb().kitchenSession.findUnique({
    where: { householdId_kind_scopeKey: { householdId, kind, scopeKey } },
  });
  return row ? toSession<T>(row) : undefined;
}

export async function saveKitchenSession<T>(
  kind: KitchenSessionKind,
  scopeKey: string,
  payload: T,
  expectedVersion: number | null,
): Promise<SaveKitchenSessionResult<T>> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (isE2EMode()) {
    const key = sessionKey(householdId, kind, scopeKey);
    const current = e2eSessions.get(key);
    if (current && current.version !== expectedVersion) {
      return { ok: false, kind: "conflict", canonical: toSession<T>(current) };
    }
    if (!current && expectedVersion !== null) {
      throw new Error("KITCHEN_SESSION_MISSING");
    }
    const row: SessionRow = {
      id: current?.id ?? `ks_${crypto.randomUUID()}`,
      kind,
      scopeKey,
      payload: structuredClone(payload),
      version: current ? current.version + 1 : 1,
      updatedAt: new Date(),
    };
    e2eSessions.set(key, row);
    return { ok: true, session: toSession<T>(row) };
  }

  return getDb().$transaction(async (tx) => {
    const current = await tx.kitchenSession.findUnique({
      where: { householdId_kind_scopeKey: { householdId, kind, scopeKey } },
    });
    if (current && current.version !== expectedVersion) {
      return {
        ok: false as const,
        kind: "conflict" as const,
        canonical: toSession<T>(current),
      };
    }
    if (!current) {
      if (expectedVersion !== null) throw new Error("KITCHEN_SESSION_MISSING");
      try {
        const created = await tx.kitchenSession.create({
          data: {
            householdId,
            kind,
            scopeKey,
            payload: payload as Prisma.InputJsonValue,
          },
        });
        return { ok: true as const, session: toSession<T>(created) };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === "P2002"
        ) {
          const canonical = await tx.kitchenSession.findUniqueOrThrow({
            where: {
              householdId_kind_scopeKey: { householdId, kind, scopeKey },
            },
          });
          return {
            ok: false as const,
            kind: "conflict" as const,
            canonical: toSession<T>(canonical),
          };
        }
        throw error;
      }
    }
    const updated = await tx.kitchenSession.updateMany({
      where: { id: current.id, householdId, version: expectedVersion! },
      data: {
        payload: payload as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      const canonical = await tx.kitchenSession.findUniqueOrThrow({
        where: { id: current.id },
      });
      return {
        ok: false as const,
        kind: "conflict" as const,
        canonical: toSession<T>(canonical),
      };
    }
    const saved = await tx.kitchenSession.findUniqueOrThrow({
      where: { id: current.id },
    });
    return { ok: true as const, session: toSession<T>(saved) };
  });
}

export async function deleteKitchenSession<T>(
  kind: KitchenSessionKind,
  scopeKey: string,
  expectedVersion: number,
): Promise<DeleteKitchenSessionResult<T>> {
  await requireUserId();
  const householdId = await currentHouseholdId();
  if (isE2EMode()) {
    const key = sessionKey(householdId, kind, scopeKey);
    const current = e2eSessions.get(key);
    if (!current) return { ok: true };
    if (current.version !== expectedVersion) {
      return { ok: false, kind: "conflict", canonical: toSession<T>(current) };
    }
    e2eSessions.delete(key);
    return { ok: true };
  }
  return getDb().$transaction(async (tx) => {
    const current = await tx.kitchenSession.findUnique({
      where: { householdId_kind_scopeKey: { householdId, kind, scopeKey } },
    });
    if (!current) return { ok: true as const };
    if (current.version !== expectedVersion) {
      return {
        ok: false as const,
        kind: "conflict" as const,
        canonical: toSession<T>(current),
      };
    }
    const deleted = await tx.kitchenSession.deleteMany({
      where: { id: current.id, householdId, version: expectedVersion },
    });
    if (deleted.count === 1) return { ok: true as const };
    const canonical = await tx.kitchenSession.findUniqueOrThrow({
      where: { id: current.id },
    });
    return {
      ok: false as const,
      kind: "conflict" as const,
      canonical: toSession<T>(canonical),
    };
  });
}

export function resetE2EKitchenSessionsForTests(): void {
  e2eSessions.clear();
}
