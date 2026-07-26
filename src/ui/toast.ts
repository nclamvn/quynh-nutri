export type ToastTone = "info" | "error";

/** Fire-and-forget toast. Listened for by <Toaster/> in the app shell. */
export function toast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("qk-toast", { detail: { message, tone } }));
}
