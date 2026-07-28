import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_MEDIA } from "@/data/landing-media";
import { Manifesto } from "@/ui/marketing/Manifesto";
import { Memory } from "@/ui/marketing/Memory";
import { FinalCTA } from "@/ui/marketing/FinalCTA";
import { DataTruth } from "@/ui/marketing/DataTruth";
import "@/ui/marketing/landing.css";

// Public editorial landing (blueprint §5 order LOCKED), ported from the owner's
// approved mock. Server component – static markup + CSS motion, scoped under `.lp`.
// Real photos are local (see landing-media.ts); CTAs go to real Clerk routes.
export const metadata: Metadata = {
  title: "Bữa cơm nhà – Một tuần ăn ngon, vừa sức và có căn cứ",
  description:
    "Hệ thống lập bữa cho gia đình Việt: xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.",
};

const hero = LANDING_MEDIA.hero;
const stage = LANDING_MEDIA.stage;

// Self-hosted Vietnamese-dish squares for the hero marquee (credits in
// public/landing/marquee/CREDITS.md). Decorative – visualises "49 món nền".
const MARQUEE = [
  "pho-bo", "banh-mi", "goi-cuon", "cha-gio", "bun-bo-hue", "bun", "bun-chay",
].map((f) => `/landing/marquee/${f}.jpg`);

export default function LandingPage() {
  return (
    <main className="lp">
      <div className="grain-layer" aria-hidden />

      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">Q</span>
          <span>Bữa cơm nhà<small>meal system for real families</small></span>
        </Link>
        <div className="nav-links">
          <a href="#philosophy">Cách hoạt động</a>
          <a href="#data">Dữ liệu</a>
          <Link href="/overview">Mở ứng dụng</Link>
        </div>
        <Link className="nav-cta" href="/sign-up">Bắt đầu một tuần <span>↗</span></Link>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-bg" style={{ backgroundImage: `url('${hero.src}')` }} />
        <div className="hero-marquee" aria-hidden>
          {/* Repeat enough copies that one half of the track is wider than any
             viewport → translateX(-50%) loops seamlessly with no gap at wide screens. */}
          <div className="hero-marquee-track">
            {Array.from({ length: 8 }).flatMap(() => MARQUEE).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </div>
        <div className="proof"><b>92</b><span>% độ phủ<small>dữ liệu có căn cứ</small></span></div>
        <a className="hero-credit" href={hero.sourceUrl} target="_blank" rel="noopener">Ảnh: {hero.author} / Unsplash ↗</a>
        <div className="media-caption"><i className="dot" />Kế hoạch đang thích nghi theo tuần này</div>
        <div className="rail"><span>SCROLL TO SET THE TABLE</span><i /></div>
        <div className="hero-copy">
          <p className="eyebrow"><span className="round-no">01</span>Meal planning, nhưng dành cho nhà mình</p>
          <h1><span className="soft">Mỗi bữa cơm</span><span className="strong">đều có</span><span className="accent">một lý do.</span></h1>
          <div className="hero-intro">
            <p>Một hệ thống lập bữa cho gia đình Việt, biết xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.</p>
            <div className="actions">
              <Link className="btn" href="/sign-up">Lập tuần đầu tiên <span>→</span></Link>
              <Link className="text-link" href="/overview">Mở ứng dụng ↗</Link>
            </div>
          </div>
          <div className="orbital"><span>7 ngày</span><span>49 món nền</span><span>1 danh sách chợ</span></div>
        </div>
      </header>

      {/* TICKER */}
      <div className="ticker"><div className="ticker-track">
        <span>XOAY MÓN THÔNG MINH</span><b>✦</b><span>ĐỊNH LƯỢNG CÓ NGUỒN</span><b>✦</b><span>ĐI CHỢ MỘT LẦN, DÙNG CẢ TUẦN</span><b>✦</b><span>KHÔNG PHÁN SỐ CHÍNH XÁC GIẢ</span><b>✦</b>
        <span>XOAY MÓN THÔNG MINH</span><b>✦</b><span>ĐỊNH LƯỢNG CÓ NGUỒN</span><b>✦</b><span>ĐI CHỢ MỘT LẦN, DÙNG CẢ TUẦN</span><b>✦</b><span>KHÔNG PHÁN SỐ CHÍNH XÁC GIẢ</span><b>✦</b>
      </div></div>

      {/* MANIFESTO — enriched (client island for reveal) */}
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
              <div className="app-top"><span>Tuần của nhà mình</span><b>21 – 27.07</b><i>•••</i></div>
              <div className="days"><span>T2</span><span>T3</span><span className="on">T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
              <div className="meal-head"><div><small>Bữa tối · 4 người</small><h3>Một mâm cơm vừa sức.</h3></div><span className="pill">Độ phủ 92%</span></div>
              <div className="meal-list">
                <div className="meal-row"><span className="index">01</span><div><h4>Canh khổ qua nhồi thịt</h4><p>650 g · đã tính phần hao hụt</p></div><b>≈ 28′</b></div>
                <div className="meal-row"><span className="index">02</span><div><h4>Thịt kho trứng</h4><p>720 g · món nền gia đình</p></div><b>có sẵn</b></div>
                <div className="meal-row"><span className="index">03</span><div><h4>Rau luộc theo mùa</h4><p>480 g · đổi theo chợ gần nhà</p></div><b>≈ 12′</b></div>
              </div>
              <div className="app-foot"><span>Nhẹ hơn 18 phút so với kế hoạch gốc</span><Link className="foot-cta" href="/sign-up">Xem danh sách chợ</Link></div>
            </div>
          </div>
          <div className="stage-copy">
            <small>A living meal system</small>
            <h2>Kế hoạch không đứng yên sau khi được tạo.</h2>
            <p>Đổi một món, thiếu một nguyên liệu hay có thêm người ăn – cả định lượng, dinh dưỡng và danh sách chợ được nối lại thành một hệ thống nhất quán.</p>
            <Link href="/sign-up">Tạo hồ sơ gia đình →</Link>
          </div>
        </div>
      </section>

      {/* MEMORY — enriched (client island for reveal) */}
      <Memory />

      {/* DATA TRUTH – cinematic (client island for scroll reveal) */}
      <DataTruth />

      {/* QUOTE */}
      <section className="quote">
        <blockquote>Ăn ngon không bắt đầu từ ý chí. Nó bắt đầu từ một kế hoạch đủ thực tế để cả nhà cùng theo.</blockquote>
        <div className="quote-meta"><span>Q&apos;s Kitchen principle</span><span>Made for Vietnamese homes</span></div>
      </section>

      {/* FINAL CTA — "Tối nay ăn gì?" climax (Step 2: tương phản khổ) */}
      <FinalCTA />

      {/* FOOTER */}
      <footer>
        <div><span className="footer-mark">Q</span><p>Bữa cơm nhà<small>Kế hoạch bữa cơm gia đình Việt.</small></p></div>
        <p>© 2026 Q&apos;s Kitchen · ảnh qua Unsplash ({hero.author}, {stage.author})</p>
        <div><a href="#product">Sản phẩm</a><a href="#data">Dữ liệu</a><Link href="/sign-in">Đăng nhập</Link></div>
      </footer>
    </main>
  );
}
