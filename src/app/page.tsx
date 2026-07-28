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
  title: "Ăn Ngon · Bữa cơm nhà – Một tuần vừa với nhịp sống nhà mình",
  description:
    "Bữa cơm nhà sắp thực đơn theo khẩu vị, số người và quỹ thời gian của gia đình Việt. Từ món ăn, định lượng đến danh sách đi chợ, nối lại gọn gàng cho cả tuần.",
};

const hero = LANDING_MEDIA.hero;
const stage = LANDING_MEDIA.stage;

// Self-hosted Vietnamese-dish squares for the hero marquee (credits in
// public/landing/marquee/CREDITS.md). Decorative – visualises "49 món nền".
const MARQUEE = [
  "pho-bo", "banh-mi", "goi-cuon", "cha-gio", "bun-bo-hue", "bun", "bun-chay",
].map((f) => `/landing/marquee/${f}.jpg`);
// Far layer reuses the same verified dishes, rotated so it never twins the near
// row. 8 copies each → half the track is wider than any viewport, so the
// translateX(-50%) loop is seamless. Different speeds per layer = parallax depth.
const MARQUEE_FAR = [...MARQUEE.slice(3), ...MARQUEE.slice(0, 3)];
const marqueeImgs = (arr: string[]) =>
  Array.from({ length: 8 }).flatMap(() => arr);

export default function LandingPage() {
  return (
    <main className="lp">
      <div className="grain-layer" aria-hidden />

      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Ăn Ngon<small>Bữa cơm nhà</small></span>
        </Link>
        <div className="nav-links">
          <a href="#philosophy">Cách dùng</a>
          <a href="#data">Dữ liệu dinh dưỡng</a>
          <Link href="/overview">Mở ứng dụng</Link>
        </div>
        <Link className="nav-cta" href="/sign-up">Lên thực đơn tuần này <span>↗</span></Link>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-bg" style={{ backgroundImage: `url('${hero.src}')` }} />
        {/* "Bàn tiệc trôi qua" — two parallax layers (far drifts slow + small +
           soft; near drifts faster, varied sizes, staggered) so it reads as a
           table being laid, not a conveyor belt. Transform-only motion (GPU). */}
        <div className="hero-marquee" aria-hidden>
          <div className="mq-layer mq-far">
            {marqueeImgs(MARQUEE_FAR).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>
          <div className="mq-layer mq-near">
            {marqueeImgs(MARQUEE).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </div>
        <div className="proof"><b>92</b><span>% đã đối chiếu<small>dữ liệu có căn cứ</small></span></div>
        <a className="hero-credit" href={hero.sourceUrl} target="_blank" rel="noopener">Ảnh: {hero.author} / Unsplash ↗</a>
        <div className="media-caption"><i className="dot" />Kế hoạch đang thích nghi theo tuần này</div>
        <div className="rail"><span>Cuộn xuống xem một tuần được sắp</span><i /></div>
        <div className="hero-copy">
          <p className="eyebrow">Thực đơn tuần cho gia đình Việt</p>
          <h1><span className="soft">Mỗi chiều, bớt một lần</span><span className="strong">phải nghĩ:</span><span className="accent">tối nay ăn gì?</span></h1>
          <div className="hero-intro">
            <p>Bữa cơm nhà sắp thực đơn theo khẩu vị, số người và quỹ thời gian của gia đình. Từ món ăn, định lượng đến danh sách đi chợ, mọi thứ được nối lại gọn gàng cho cả tuần.</p>
            <div className="actions">
              <Link className="btn" href="/sign-up">Lên thực đơn tuần này <span>→</span></Link>
              <Link className="text-link" href="#product">Xem một tuần mẫu ↓</Link>
            </div>
          </div>
          <div className="orbital"><span>7 ngày được sắp sẵn</span><span>Khẩu phần theo số người</span><span>Danh sách chợ tự gộp</span></div>
        </div>
      </header>

      {/* VALUE STRIP — four plain values, static + readable (no running caps) */}
      <div className="ticker"><div className="ticker-track ticker-static">
        <span>Xếp món theo ngày bận</span><b>·</b><span>Tự cân khẩu phần</span><b>·</b><span>Gộp danh sách đi chợ</span><b>·</b><span>Nói rõ mức dữ liệu</span>
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
              <div className="meal-head"><div><small>Bữa tối · 4 người</small><h3>Đủ món, vừa thời gian.</h3></div><span className="pill">Đã đối chiếu 92%</span></div>
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

      {/* MEMORY — enriched (client island for reveal) */}
      <Memory />

      {/* DATA TRUTH – cinematic (client island for scroll reveal) */}
      <DataTruth />

      {/* QUOTE — brand statement */}
      <section className="quote">
        <blockquote>Bữa cơm nhà không cần hoàn hảo. Chỉ cần đủ hợp với nhịp sống để cả nhà vẫn muốn ngồi lại cùng nhau.</blockquote>
        <div className="quote-meta"><span>Tinh thần Ăn Ngon</span><span>Cho gia đình Việt</span></div>
      </section>

      {/* FINAL CTA — "Tối nay ăn gì?" climax (Step 2: tương phản khổ) */}
      <FinalCTA />

      {/* FOOTER */}
      <footer>
        <div><span className="footer-mark">A</span><p>Ăn Ngon<small>Bữa cơm nhà được xây quanh nhịp sống của gia đình Việt.</small></p></div>
        <p>Một sản phẩm của Q&apos;s Kitchen · © 2026 · ảnh qua Unsplash ({hero.author}, {stage.author})</p>
        <div><a href="#philosophy">Cách dùng</a><a href="#data">Dữ liệu dinh dưỡng</a><Link href="/sign-in">Đăng nhập</Link></div>
      </footer>
    </main>
  );
}
