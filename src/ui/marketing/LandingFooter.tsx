import Link from "next/link";
import { FlowerLogo } from "@/ui/components/FlowerLogo";
import { LANDING_CREDITS } from "@/data/landing-media";

// Minimal — logo + one line, copyright, three links, media credits. No newsletter
// or social (no real channel yet). Media credited even though Unsplash doesn't require it.
export function LandingFooter() {
  return (
    <footer className="bg-landing-ink text-landing-ivory/70">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-start">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-landing-ivory">
              <FlowerLogo size={22} className="text-landing-rose" />
              <span className="text-[15px] font-semibold">Bữa cơm nhà</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">Một tuần ăn ngon, vừa sức và có căn cứ — cho gia đình Việt.</p>
          </div>
          <nav className="flex gap-10 text-sm">
            <a href="#cach-hoat-dong" className="hover:text-landing-ivory">Cách hoạt động</a>
            <a href="#du-lieu" className="hover:text-landing-ivory">Dữ liệu</a>
            <Link href="/sign-in" className="hover:text-landing-ivory">Đăng nhập</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-landing-ivory/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Bữa cơm nhà</span>
          <span>
            Ảnh:{" "}
            {LANDING_CREDITS.map((c, i) => (
              <span key={c.id}>
                {i > 0 && " · "}
                <a href={c.sourceUrl} target="_blank" rel="noopener" className="underline-offset-2 hover:text-landing-ivory hover:underline">{c.author}</a>
              </span>
            ))}{" "}
            trên Unsplash
          </span>
        </div>
      </div>
    </footer>
  );
}
