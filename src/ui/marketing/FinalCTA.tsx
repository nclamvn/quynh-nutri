import Link from "next/link";

// The everyday question, then a natural action. Ink field, a subtle geometric halo
// (concentric rings — NOT a 3D blob), big rose capsule CTA + a quiet secondary link.
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-landing-ink text-landing-ivory">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[320, 560, 820].map((d) => (
          <span key={d} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" style={{ width: d, height: d }} />
        ))}
      </div>
      <div className="relative mx-auto max-w-[900px] px-5 py-32 text-center sm:px-8 md:py-40 lg:px-10">
        <h2 className="text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-tight">
          Tối nay <span className="font-display italic text-landing-rose">ăn gì?</span>
        </h2>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="/sign-up" className="rounded-full bg-brand px-8 py-4 text-base font-medium text-white shadow-float transition-colors hover:bg-brand-hover">
            Để Bữa cơm nhà lên tuần đầu tiên
          </Link>
          <Link href="/sign-in" className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
            Tôi đã có tài khoản
          </Link>
        </div>
      </div>
    </section>
  );
}
