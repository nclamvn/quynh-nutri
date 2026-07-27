import Link from "next/link";
import { FlowerLogo } from "@/ui/components/FlowerLogo";

// Absolute over the hero; light text on the dark media. One capsule CTA only —
// no second primary, no hamburger on desktop, no white bar, no AI badge.
export function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-white">
          <FlowerLogo size={26} className="text-white" />
          <span className="text-[15px] font-semibold tracking-tight">Bữa cơm nhà</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] text-white/80 md:flex">
          <a href="#cach-hoat-dong" className="transition-colors hover:text-white">Cách hoạt động</a>
          <a href="#du-lieu" className="transition-colors hover:text-white">Dữ liệu</a>
          <Link href="/sign-in" className="transition-colors hover:text-white">Đăng nhập</Link>
        </nav>

        <Link
          href="/sign-up"
          className="glass rounded-full border border-white/30 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:border-white/60"
        >
          Bắt đầu một tuần
        </Link>
      </div>
    </header>
  );
}
