export type KitchenSessionKind = "cooking" | "meal-run";

export interface PersistedKitchenSession<T> {
  id: string;
  kind: KitchenSessionKind;
  scopeKey: string;
  payload: T;
  version: number;
  updatedAt: string;
}

export type SaveKitchenSessionResult<T> =
  | { ok: true; session: PersistedKitchenSession<T> }
  | {
      ok: false;
      kind: "conflict";
      canonical: PersistedKitchenSession<T>;
    };

export type DeleteKitchenSessionResult<T> =
  | { ok: true }
  | {
      ok: false;
      kind: "conflict";
      canonical: PersistedKitchenSession<T>;
    };
