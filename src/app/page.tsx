import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_MEDIA } from "@/data/landing-media";
import { Manifesto } from "@/ui/marketing/Manifesto";
import { Memory } from "@/ui/marketing/Memory";
import { FinalCTA } from "@/ui/marketing/FinalCTA";
import { DataTruth } from "@/ui/marketing/DataTruth";
import { LandingResourceHints } from "@/ui/marketing/LandingResourceHints";
import { FlowerLogo } from "@/ui/components/FlowerLogo";
import "@/ui/marketing/landing.css";

// Public editorial landing (blueprint §5 order LOCKED), ported from the owner's
// approved mock. Server component – static markup + CSS motion, scoped under `.lp`.
// Real photos are local (see landing-media.ts); CTAs go to real Clerk routes.
export const metadata: Metadata = {
  title: "Bữa cơm nhà – Một tuần vừa với nhịp sống nhà mình",
  description:
    "Bữa cơm nhà sắp thực đơn theo khẩu vị, số người và quỹ thời gian của gia đình Việt. Từ món ăn, định lượng đến danh sách đi chợ, nối lại gọn gàng cho cả tuần.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Ăn Ngon · Q's Kitchen",
    title: "Ăn Ngon · Bữa cơm nhà",
    description:
      "Sắp thực đơn, cân lượng và gộp danh sách đi chợ theo nhịp sống thật của gia đình Việt.",
    images: [
      {
        url: "/landing/hero.webp",
        width: 2400,
        height: 1920,
        alt: LANDING_MEDIA.hero.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ăn Ngon · Bữa cơm nhà",
    description:
      "Sắp thực đơn, cân lượng và gộp danh sách đi chợ theo nhịp sống thật của gia đình Việt.",
    images: ["/landing/hero.webp"],
  },
};

const hero = LANDING_MEDIA.hero;
const stage = LANDING_MEDIA.stage;

const VALUE_STRIP = [
  "Xoay món theo ngày bận",
  "Định lượng có nguồn",
  "Gộp danh sách đi chợ",
  "Nói thật độ chắc",
];

export default function LandingPage() {
  return (
    <main className="lp">
      <LandingResourceHints heroSrc={hero.src} />
      <div className="grain-layer" aria-hidden />

      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark" data-landing-brand-mark>
            <FlowerLogo size={35} />
          </span>
          <span>Bữa cơm nhà<small>Ăn Ngon · Q&apos;s Kitchen</small></span>
        </Link>
        <div className="nav-links">
          <a href="#philosophy">Cách dùng</a>
          <a href="#data">Dữ liệu</a>
          <Link href="/sign-in">Đăng nhập</Link>
        </div>
        <Link className="nav-cta" href="/sign-up">Bắt đầu một tuần <span>↗</span></Link>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-bg" style={{ backgroundImage: `url('${hero.src}')` }} />
        <div className="hero-folio" aria-label="Minh họa một tuần được sắp theo nhịp gia đình">
          <div className="hero-folio-mark"><FlowerLogo size={24} /></div>
          <div>
            <small>Tuần mẫu · Nhà mình</small>
            <strong>2 ngày bận đã được ưu tiên món nhanh</strong>
          </div>
          <span>Đã gộp chợ</span>
        </div>
        <div className="proof"><b>92</b><span>% đã đối chiếu<small>minh họa dữ liệu</small></span></div>
        <a className="hero-credit" href={hero.sourceUrl} target="_blank" rel="noopener">Ảnh: {hero.author} / Unsplash ↗</a>
        <div className="media-caption"><i className="dot" />Kế hoạch đang thích nghi theo tuần này</div>
        <div className="rail"><span>Cuộn xuống xem một tuần được sắp</span><i /></div>
        <div className="hero-copy">
          <p className="eyebrow">Thực đơn tuần cho gia đình Việt</p>
          <h1><span className="soft">Mỗi bữa cơm</span><span className="strong">đều có một</span><span className="accent">lý do.</span></h1>
          <div className="hero-intro">
            <p>Một hệ thống lập bữa cho gia đình Việt, biết xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.</p>
            <div className="actions">
              <Link className="btn" href="/sign-up">Lập tuần đầu tiên <span>→</span></Link>
              <Link className="text-link app-entry" href="/overview">
                <span className="app-entry-signal" aria-hidden="true" />
                <span>Mở ứng dụng</span>
                <span className="app-entry-arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div className="orbital"><span>7 ngày được sắp sẵn</span><span>Khẩu phần theo số người</span><span>Danh sách chợ tự gộp</span></div>
        </div>
      </header>

      {/* VALUE STRIP – the landing's single, restrained marquee. */}
      <div className="ticker" aria-label={VALUE_STRIP.join(" · ")}>
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <div className="ticker-group" key={copy} aria-hidden={copy === 1}>
              {VALUE_STRIP.map((value) => <span key={value}>{value}<b>✦</b></span>)}
            </div>
          ))}
        </div>
      </div>

      {/* MANIFESTO – enriched (client island for reveal) */}
      <Manifesto />

      {/* PRODUCT STAGE */}
      <section className="stage" id="product">
        <div className="stage-inner">
          <div className="stage-media">
            <div className="photo" style={{ backgroundImage: `linear-gradient(180deg,transparent 55%,rgba(20,14,16,.72)), url('${stage.src}')` }}>
              <a className="photo-credit" href={stage.sourceUrl} target="_blank" rel="noopener">Ảnh: {stage.author} / Unsplash ↗</a>
              <div className="photo-note"><small>Thứ tư / 18:30</small>Canh khổ qua · thịt kho · rau luộc</div>
            </div>
            <div className="app">
              <div className="app-top"><span><FlowerLogo size={18} /> Tuần của nhà mình</span><b>21 – 27.07</b><i>•••</i></div>
              <div className="days"><span>T2</span><span>T3</span><span className="on">T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
              <div className="meal-head"><div><small>Bữa tối · 4 người</small><h3>Đủ món, vừa thời gian.</h3></div><span className="pill">● Đã đối chiếu 92%</span></div>
              <div className="meal-list">
                <div className="meal-row"><span className="index">01</span><div><h4>Canh khổ qua nhồi thịt</h4><p>650 g · đã tính phần hao hụt</p></div><b>≈ 28′</b></div>
                <div className="meal-row"><span className="index">02</span><div><h4>Thịt kho trứng</h4><p>720 g · món đã chuẩn bị từ trước</p></div><b>có sẵn</b></div>
                <div className="meal-row"><span className="index">03</span><div><h4>Rau luộc theo mùa</h4><p>480 g · có thể đổi theo chợ gần nhà</p></div><b>≈ 12′</b></div>
              </div>
              <div className="app-foot"><span>Bớt 18 phút trong bếp so với kế hoạch ban đầu</span><Link className="foot-cta" href="/sign-up">Xem danh sách đi chợ</Link></div>
            </div>
          </div>
          <div className="stage-copy">
            <small>Kế hoạch luôn đi cùng đời sống</small>
            <h2>Một món thay đổi, cả tuần tự sắp lại.</h2>
            <p>Con không ăn khổ qua? Chiều nay có thêm người dùng bữa? Chợ gần nhà vừa hết một nguyên liệu? Chỉ cần đổi một lần – khẩu phần, dinh dưỡng và danh sách đi chợ sẽ được cân lại để cả tuần vẫn liền mạch.</p>
            <Link href="/sign-up">Tạo hồ sơ gia đình →</Link>
          </div>
        </div>
      </section>

      {/* MEMORY – enriched (client island for reveal) */}
      <Memory />

      {/* DATA TRUTH – cinematic (client island for scroll reveal) */}
      <DataTruth />

      {/* QUOTE – brand statement */}
      <section className="quote">
        <blockquote>Ăn ngon không bắt đầu từ ý chí. Nó bắt đầu từ một kế hoạch đủ thực tế để cả nhà cùng theo.</blockquote>
        <div className="quote-meta"><span>Tinh thần Ăn Ngon</span><span>Cho gia đình Việt</span></div>
      </section>

      {/* FINAL CTA – "Tối nay ăn gì?" climax (Step 2: tương phản khổ) */}
      <FinalCTA />

      {/* FOOTER */}
      <footer>
        <div><span className="footer-mark"><FlowerLogo size={30} /></span><p>Bữa cơm nhà<small>Được xây quanh nhịp sống của gia đình Việt.</small></p></div>
        <p>Một sản phẩm của Q&apos;s Kitchen · © 2026 · ảnh qua Unsplash ({hero.author}, {stage.author})</p>
        <div><a href="#philosophy">Cách dùng</a><a href="#data">Dữ liệu dinh dưỡng</a><Link href="/sign-in">Đăng nhập</Link></div>
      </footer>
    </main>
  );
}
