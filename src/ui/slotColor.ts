import type { Slot } from "@/domain/types";

/**
 * A decorative identity colour per meal slot, reusing the chart tokens. Used ONLY
 * as a label/edge accent on the slot tag to help scan the mâm — deliberately kept
 * away from any nutrition number so it never reads as a provenance/confidence
 * signal (those stay green/amber/gray on the ProvenanceChip).
 */
export const SLOT_COLOR: Record<Slot, string> = {
  COM: "var(--chart-fat)", // rice → warm gold
  MAN: "var(--chart-carb)", // main protein → coral
  RAU: "var(--chart-fiber)", // veg → green
  CANH: "var(--chart-protein)", // soup → blue
  TRANGMIENG: "var(--chart-fruit)", // dessert → lilac
};
