"use client";

import { useEffect, useRef, useState } from "react";

// Step 1 – the cinematic data-truth section. A client island only so the reveal +
// the "confidence grows" demo fire when the section scrolls INTO view (it's below
// the fold). If JS never runs, everything is visible by default (no hidden content).
export function DataTruth() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`truth${inView ? " in-view" : ""}`} id="data">
      <div className="truth-top"><span>04 / Provenance as a product feature</span><span>Không trang trí bằng sự chắc chắn giả</span></div>

      <div className="truth-grid">
        <div>
          <p className="manifesto-lead">Dữ liệu biết tự nghi ngờ</p>
          <h2 className="display">Con số nào cũng phải biết<em>mình chắc đến đâu.</em></h2>
        </div>
        <div className="confidence">
          <span className="conf-chip"><b>540 kcal</b><i className="tier-dot" /></span>
          <small>Càng nhiều nguyên liệu được đối chiếu, con số càng chắc – chip sáng dần từ xám sang xanh.</small>
        </div>
      </div>

      <div className="trust">
        <article style={{ "--i": 0 } as React.CSSProperties}>
          <span className="tier-chip tier-ok"><b>520 kcal</b><i className="tier-dot" /><span className="cov">92%</span></span>
          <div><small>Đã đối chiếu</small><h3>Hiện số</h3><p>Độ phủ từ 85% – hiện đúng con số kèm độ phủ.</p></div>
        </article>
        <article style={{ "--i": 1 } as React.CSSProperties}>
          <span className="tier-chip tier-mid"><b>~520 kcal</b><i className="tier-dot" /><span className="cov">72%</span></span>
          <div><small>Còn dao động</small><h3>Neo trong khoảng</h3><p>60–85% – số neo, không giả vờ chính xác.</p></div>
        </article>
        <article style={{ "--i": 2 } as React.CSSProperties}>
          <span className="tier-chip tier-low"><b>500–580</b><i className="tier-dot" /><span className="cov">45%</span></span>
          <div><small>Chưa đủ chắc</small><h3>Chỉ hiện khoảng</h3><p>Dưới 60% – không đưa ra một con số đơn lẻ.</p></div>
        </article>
      </div>

      <p className="tier-demo">Số minh hoạ – trong app, con số đổi hình theo độ phủ dữ liệu thật.</p>
      <div className="ribbon"><span>corroborated</span><i /><span>anchored range</span><i /><span>honest estimate</span><i /><strong>single source of truth</strong></div>
    </section>
  );
}
