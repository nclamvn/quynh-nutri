/**
 * Ambient aurora — soft colour blobs drifting slowly behind the whole app for a
 * premium "đắt tiền" depth. Fixed, non-interactive, behind everything. Opacity is
 * low so card/body text keeps WCAG-AA contrast in both themes. The drift keyframes
 * are frozen by the global prefers-reduced-motion rule.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span
        className="absolute -left-[12%] -top-[10%] h-[46vmax] w-[46vmax] rounded-full blur-[90px] opacity-[0.16] dark:opacity-[0.22]"
        style={{ background: "radial-gradient(circle, var(--brand), transparent 62%)", animation: "drift-a 34s ease-in-out infinite" }}
      />
      <span
        className="absolute -right-[14%] top-[8%] h-[42vmax] w-[42vmax] rounded-full blur-[90px] opacity-[0.14] dark:opacity-[0.2]"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 62%)", animation: "drift-b 40s ease-in-out infinite" }}
      />
      <span
        className="absolute bottom-[-16%] left-[24%] h-[40vmax] w-[40vmax] rounded-full blur-[100px] opacity-[0.12] dark:opacity-[0.18]"
        style={{ background: "radial-gradient(circle, var(--chart-fruit), transparent 62%)", animation: "drift-c 46s ease-in-out infinite" }}
      />
      <span
        className="absolute bottom-[6%] right-[10%] h-[30vmax] w-[30vmax] rounded-full blur-[90px] opacity-[0.10] dark:opacity-[0.16]"
        style={{ background: "radial-gradient(circle, var(--amber), transparent 62%)", animation: "drift-a 38s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
