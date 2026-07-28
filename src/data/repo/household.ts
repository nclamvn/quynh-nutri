import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";
import type { Household, PantryItem, DietRestriction, Allergen, Activity, MemberRole, DayName, HealthProfile, Member, MemberState, Supplier, SupplierChannel, SupplierType, Order, OrderLine, OrderStatus, ChannelKind, PurchaseRecord, PurchaseLine, OnTime } from "@/domain/types";

const HH_ID = DEFAULT_HOUSEHOLD.id; // template / unauth fallback

// Resolve the signed-in user's household — creating one from the seed template
// on first sign-in (multi-tenant). Unauth (e.g. sign-in page) → the template id.
async function currentHouseholdId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) return HH_ID;
  const db = getDb();
  const existing = await db.household.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const t = DEFAULT_HOUSEHOLD;
  // "Bắt đầu trống": a brand-new household declares its OWN family — no generic
  // template members, size 0 until they add people (portions follow member count).
  const created = await db.household.create({
    data: {
      userId,
      name: t.name,
      size: 0,
      marketMode: t.marketMode,
      cookTimeCapMin: t.cookTimeCapMin,
      busyDays: t.busyDays,
      lactatingMember: t.lactatingMember,
      restrictions: [],
      favorites: [],
      notes: [],
      pantry: [],
      members: { create: [] },
    },
    select: { id: true },
  });
  return created.id;
}

export interface HouseholdState {
  household: Household;
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
  suppliers: Supplier[];
  orders: Order[];
  purchases: PurchaseRecord[];
}

export async function loadHouseholdState(): Promise<HouseholdState> {
  const db = getDb();
  const id = await currentHouseholdId();
  const row = await db.household.findUnique({
    where: { id },
    include: { members: { include: { states: true } }, suppliers: true, orders: true, purchases: true },
  });
  if (!row) return { household: DEFAULT_HOUSEHOLD, favorites: [], notes: [], pantry: [], suppliers: [], orders: [], purchases: [] };

  const household: Household = {
    id: row.id,
    name: row.name,
    size: row.size,
    marketMode: row.marketMode as Household["marketMode"],
    cookTimeCapMin: row.cookTimeCapMin,
    busyDays: row.busyDays as DayName[],
    lactatingMember: row.lactatingMember,
    restrictions: (row.restrictions as DietRestriction[]) ?? [],
    members: row.members.map((m) => ({
      id: m.id,
      name: m.name ?? undefined,
      role: m.role as MemberRole,
      sex: (m.sex as "M" | "F" | null) ?? undefined,
      ageBand: m.ageBand ?? undefined,
      activity: m.activity as Activity,
      allergies: (m.allergies as Allergen[]) ?? [],
      habits: m.habits ?? [],
      conditions: m.conditions ?? [],
      dislikes: m.dislikes ?? [],
      healthProfile: (m.healthProfile as unknown as HealthProfile) ?? undefined,
      states: m.states.map((s) => ({
        id: s.id,
        kind: s.kind as MemberState["kind"],
        value: s.value,
        validFrom: s.validFrom.toISOString(),
        validUntil: s.validUntil ? s.validUntil.toISOString() : undefined,
      })),
    })),
  };
  return {
    household,
    favorites: row.favorites ?? [],
    notes: (row.notes as unknown as { id: number; text: string }[]) ?? [],
    pantry: (row.pantry as unknown as PantryItem[]) ?? [],
    suppliers: row.suppliers.map(rowToSupplier),
    orders: row.orders.map(rowToOrder),
    purchases: row.purchases.map(rowToPurchase),
  };
}

type PurchaseRow = {
  id: string; date: Date; orderRef: string | null; supplierId: string | null;
  lines: unknown; onTime: string | null; note: string | null;
};
function rowToPurchase(r: PurchaseRow): PurchaseRecord {
  return {
    id: r.id,
    date: r.date.toISOString(),
    orderRef: r.orderRef ?? undefined,
    supplierId: r.supplierId ?? undefined,
    lines: (r.lines as PurchaseLine[]) ?? [],
    onTime: (r.onTime as OnTime | null) ?? undefined,
    note: r.note ?? undefined,
  };
}

/** Append a purchase record for the current household. */
export async function savePurchase(input: Omit<PurchaseRecord, "id">): Promise<PurchaseRecord> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  const row = await db.purchaseRecord.create({
    data: {
      householdId,
      date: input.date ? new Date(input.date) : new Date(),
      orderRef: input.orderRef ?? null,
      supplierId: input.supplierId ?? null,
      lines: (input.lines ?? []) as never,
      onTime: input.onTime ?? null,
      note: input.note ?? null,
    },
  });
  return rowToPurchase(row as PurchaseRow);
}

// ── Phase 2 — Supplier & Order persistence (household-owned) ────────────────
type SupplierRow = {
  id: string; householdId: string; name: string; type: string;
  channels: unknown; hours: string | null; shipFee: string | null; shipArea: string | null; handles: string[];
  address: string | null; lat: number | null; lng: number | null; storeLocatorUrl: string | null;
  note: string | null; sources: string[]; needsVerify: boolean;
};
function rowToSupplier(r: SupplierRow): Supplier {
  return {
    id: r.id,
    householdId: r.householdId,
    name: r.name,
    type: r.type as SupplierType,
    channels: (r.channels as SupplierChannel[]) ?? [],
    hours: r.hours ?? undefined,
    shipFee: r.shipFee ?? undefined,
    shipArea: r.shipArea ?? undefined,
    handles: r.handles ?? [],
    address: r.address ?? undefined,
    location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
    storeLocatorUrl: r.storeLocatorUrl ?? undefined,
    note: r.note ?? undefined,
    sources: r.sources?.length ? r.sources : undefined,
    needsVerify: r.needsVerify || undefined,
  };
}
type OrderRow = {
  id: string; supplierId: string; weekRef: string; lines: unknown;
  status: string; channelUsed: string | null; sentAt: Date | null; note: string | null;
};
function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    supplierId: r.supplierId,
    weekRef: r.weekRef,
    lines: (r.lines as OrderLine[]) ?? [],
    status: r.status as OrderStatus,
    channelUsed: (r.channelUsed as ChannelKind | null) ?? undefined,
    sentAt: r.sentAt?.toISOString(),
    note: r.note ?? undefined,
  };
}

/** Create or update a household supplier. Scoped to the current household so a
 *  user can only touch their own. Registry seeds are code, never written here. */
export async function saveSupplier(input: Omit<Supplier, "householdId" | "seed">): Promise<Supplier> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  const data = {
    name: input.name,
    type: input.type,
    channels: (input.channels ?? []) as never,
    hours: input.hours ?? null,
    shipFee: input.shipFee ?? null,
    shipArea: input.shipArea ?? null,
    handles: input.handles ?? [],
    address: input.address ?? null,
    lat: input.location?.lat ?? null,
    lng: input.location?.lng ?? null,
    storeLocatorUrl: input.storeLocatorUrl ?? null,
    note: input.note ?? null,
    sources: input.sources ?? [],
    needsVerify: input.needsVerify ?? false,
  };
  // Guard update to this household; create attaches to it.
  const existing = input.id ? await db.supplier.findFirst({ where: { id: input.id, householdId }, select: { id: true } }) : null;
  const row = existing
    ? await db.supplier.update({ where: { id: existing.id }, data })
    : await db.supplier.create({ data: { ...data, householdId } });
  return rowToSupplier(row as SupplierRow);
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.supplier.deleteMany({ where: { id, householdId } });
}

/** Upsert the order record for (supplier, week). Status transitions are the
 *  caller's job (the store enforces the honest ladder); this only persists. */
export async function saveOrder(order: Omit<Order, "id"> & { id?: string }): Promise<Order> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  const supplier = await db.supplier.findFirst({ where: { id: order.supplierId, householdId }, select: { id: true } });
  if (!supplier) throw new Error("supplier not in household");
  const data = {
    weekRef: order.weekRef,
    lines: (order.lines ?? []) as never,
    status: order.status,
    channelUsed: order.channelUsed ?? null,
    sentAt: order.sentAt ? new Date(order.sentAt) : null,
    note: order.note ?? null,
  };
  const existing = await db.order.findFirst({
    where: { householdId, supplierId: order.supplierId, weekRef: order.weekRef },
    select: { id: true },
  });
  const row = existing
    ? await db.order.update({ where: { id: existing.id }, data })
    : await db.order.create({ data: { ...data, householdId, supplierId: order.supplierId } });
  return rowToOrder(row as OrderRow);
}

/** Persist any subset of the mutable household-row state. */
export type StatePatch = Partial<{
  size: number;
  marketMode: string;
  busyDays: string[];
  lactatingMember: boolean;
  restrictions: string[];
  favorites: string[];
  notes: { id: number; text: string }[];
  pantry: PantryItem[];
}>;

export async function saveHouseholdState(patch: StatePatch): Promise<void> {
  const db = getDb();
  const id = await currentHouseholdId();
  const data: Record<string, unknown> = {};
  for (const k of ["size", "marketMode", "busyDays", "lactatingMember", "restrictions", "favorites", "notes", "pantry"] as const) {
    if (patch[k] !== undefined) data[k] = patch[k];
  }
  if (Object.keys(data).length === 0) return;
  await db.household.update({ where: { id }, data: data as never });
}

/** Persist a member's health profile (T1). Scoped to the current household so a
 *  user can't touch another household's member. */
export async function saveMemberHealthProfile(memberId: string, profile: HealthProfile | null): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.updateMany({
    where: { id: memberId, householdId },
    data: { healthProfile: (profile ?? undefined) as never },
  });
}

/** Persist a member's allergen list. Scoped to the current household. */
export async function saveMemberAllergies(memberId: string, allergies: Allergen[]): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.updateMany({ where: { id: memberId, householdId }, data: { allergies } });
}

// ─── "Không gian gia đình sống" — Member base-layer CRUD + dynamic states ───
type MemberBase = Pick<Member, "name" | "role" | "sex" | "ageBand" | "allergies" | "habits" | "conditions" | "dislikes">;

/** Create or update a member's BASE layer. Scoped to the current household. */
export async function saveMember(input: MemberBase & { id?: string }): Promise<string> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  const data = {
    name: input.name ?? null,
    role: input.role,
    sex: input.sex ?? null,
    ageBand: input.ageBand ?? null,
    allergies: input.allergies ?? [],
    habits: input.habits ?? [],
    conditions: input.conditions ?? [],
    dislikes: input.dislikes ?? [],
  };
  if (input.id) {
    await db.member.updateMany({ where: { id: input.id, householdId }, data });
    return input.id;
  }
  const created = await db.member.create({ data: { householdId, activity: "moderate", ...data } });
  return created.id;
}

/** Remove a member (and, via cascade, their states). Scoped to the household. */
export async function deleteMember(memberId: string): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.member.deleteMany({ where: { id: memberId, householdId } });
}

/** Add a dynamic state to a member. `validUntil` (ISO) makes it self-expire; a
 *  day-scoped state simply stops mattering after. Ownership checked via the join. */
export async function addMemberState(memberId: string, state: Omit<MemberState, "id">): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  const owned = await db.member.findFirst({ where: { id: memberId, householdId }, select: { id: true } });
  if (!owned) return;
  await db.memberState.create({
    data: {
      memberId,
      kind: state.kind,
      value: state.value,
      validFrom: new Date(state.validFrom),
      validUntil: state.validUntil ? new Date(state.validUntil) : null,
    },
  });
}

/** Remove a dynamic state early (e.g. "khỏi rồi"). Scoped to the household. */
export async function deleteMemberState(stateId: string): Promise<void> {
  const db = getDb();
  const householdId = await currentHouseholdId();
  await db.memberState.deleteMany({ where: { id: stateId, member: { householdId } } });
}
