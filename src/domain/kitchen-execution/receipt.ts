import type { ReceiveShoppingItemInput } from "@/domain/types";

export type ReceiptValidationIssue =
  | "PURCHASE_TIME_IN_FUTURE"
  | "STORAGE_REQUIRED"
  | "BEST_BEFORE_MUST_FOLLOW_PURCHASE";

export function validateReceiptBusinessRules(
  input: ReceiveShoppingItemInput,
  nowMs = Date.now(),
): ReceiptValidationIssue[] {
  const issues: ReceiptValidationIssue[] = [];
  const boughtAt = new Date(input.boughtAt).getTime();
  if (boughtAt > nowMs + 5 * 60_000) issues.push("PURCHASE_TIME_IN_FUTURE");
  if (input.addToPantry && !input.storageLocation) issues.push("STORAGE_REQUIRED");
  if (input.bestBefore && new Date(input.bestBefore).getTime() <= boughtAt) {
    issues.push("BEST_BEFORE_MUST_FOLLOW_PURCHASE");
  }
  return issues;
}
