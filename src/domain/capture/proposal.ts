import { z } from "zod";
import type { ShoppingItem } from "@/domain/shopping";

export const CAPTURE_KINDS = ["receipt", "label", "voice"] as const;
export type CaptureKind = (typeof CAPTURE_KINDS)[number];

export const captureCandidateSchema = z.object({
  rawName: z.string().trim().min(1).max(160),
  quantity: z.number().positive().max(1_000_000).optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  pricePaid: z.number().int().positive().max(1_000_000_000).optional(),
  vendorText: z.string().trim().min(1).max(160).optional(),
  printedDate: z.iso.date().optional(),
}).strict();

export const captureProposalSchema = z.object({
  kind: z.enum(CAPTURE_KINDS),
  candidates: z.array(captureCandidateSchema).max(40),
  notes: z.array(z.string().trim().min(1).max(240)).max(8),
}).strict();

export type CaptureCandidate = z.infer<typeof captureCandidateSchema>;
export type CaptureProposal = z.infer<typeof captureProposalSchema>;

export function normalizeCaptureName(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Conservative client-side match. The model never receives or returns a
 * commodity/household ID. Ambiguous matches intentionally remain unmapped.
 */
export function matchCandidateToShopping(
  rawName: string,
  shopping: ShoppingItem[],
  commodityName: (commodityId: string) => string,
): ShoppingItem | undefined {
  const needle = normalizeCaptureName(rawName);
  if (needle.length < 3) return undefined;
  const matches = shopping.filter((item) => {
    const candidate = normalizeCaptureName(commodityName(item.commodityId));
    return candidate === needle
      || (candidate.length >= 3 && (candidate.includes(needle) || needle.includes(candidate)));
  });
  return matches.length === 1 ? matches[0] : undefined;
}

