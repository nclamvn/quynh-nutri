import "server-only";
import { DEFAULT_HOUSEHOLD } from "@/data/seed/household";

// Auth stub (R-AUTH-1). v1 is single-household; this is the seam where Supabase
// Auth slots in for multi-household (Q's product). Returns the active household
// id for the current request — today always the default.
export async function currentHouseholdId(): Promise<string> {
  // TODO(multi-household): resolve from Supabase session → household membership.
  return DEFAULT_HOUSEHOLD.id;
}
