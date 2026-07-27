import Link from "next/link";
import { LANDING_MEDIA } from "@/data/landing-media";

// Full-bleed real VN photo + directional dark overlay (keeps texture, no full blur),
// slow zoom drift. Hook = serif-italic opener + huge Inter keyword + rose serif-italic
// close. Primary rose CTA + secondary underlined link. One soft-pulsing status dot.
export function Hero() {
  const m = LANDING_MEDIA.hero;
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-landing-ink" style={{ minHeight: "max(820px, 100svh)" }}>
      {/* media */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.src}
          alt={m.alt}
          fetchPriority="high"
          className="animate-hero-drift h-full w-full object-cover"
          style={{ objectPosition: m.cropFocus }}
        />
        {/* directional overlay — dark at the bottom where the copy sits */}
        <div className="absolute inset-0 bg-gradient-to-t from-landing-ink/92 via-landing-ink/45 to-landing-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-landing-ink/55 to-transparent" />
      </div>

      {/* copy */}
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pb-28">
        <div className="max-w-3xl">
          <p className="font-display text-xl italic text-white/85 sm:text-2xl">Mỗi bữa cơm</p>
          <h1 className="mt-1 text-[clamp(3.4rem,11vw,9rem)] font-semibold leading-[0.92] tracking-tight text-white">
            đều có một
            <br />
            <span className="font-display italic text-landing-rose">lý do.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Một hệ thống lập bữa cho gia đình Việt, biết xoay món, cân lượng, gộp chợ và
            nói thật độ chắc của từng con số.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-brand px-7 py-3.5 text-[15px] font-medium text-white shadow-float transition-colors hover:bg-brand-hover"
            >
              Lập tuần đầu tiên
            </Link>
            <Link href="/overview" className="text-[15px] font-medium text-white underline-offset-4 hover:underline">
              Mở ứng dụng
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 text-[12px] text-white/70">
            <span className="animate-soft-pulse inline-block h-2 w-2 rounded-full bg-accent" />
            Số liệu tự khai độ chắc — không phán con số chính xác giả.
          </div>
        </div>
      </div>
    </section>
  );
}
