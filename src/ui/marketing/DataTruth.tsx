"use client";

import { useEffect, useRef, useState } from "react";

// A coverage gauge — a ring drawn to the coverage %, the kcal number in the
// middle, tinted + softly lit by tier. "Độ chắc = độ phủ = độ sáng", made visual.
// pathLength=100 normalizes the circle so the arc offset is just (100 − coverage).
// Base state is the FILLED ring (visible with no JS / reduced-motion); .in-view
// only ADDS the draw-in entrance.
function Gauge({
  tier,
  cov,
  value,
  unit,
}: {
  tier: "ok" | "mid" | "low";
  cov: number;
  value: string;
  unit?: string;
}) {
  return (
    <div className={`gauge tier-${tier}`} style={{ "--cov": cov / 100 } as React.CSSProperties}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="g-track" cx="60" cy="60" r="52" pathLength={100} />
        <circle className="g-arc" cx="60" cy="60" r="52" pathLength={100} />
      </svg>
      <div className="g-mid">
        <b>{value}</b>
        {unit ? <i>{unit}</i> : null}
        <span className="g-cov">{cov}%</span>
      </div>
    </div>
  );
}

// The cinematic data-truth section. A client island so the ring draw-in fires when
// the section scrolls into view (it's below the fold). Content is visible by
// default (the class only ADDS an entrance) so nothing hides if JS never runs.
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
          {/* demo ring — fills up while morphing xám → xanh, to show "càng nhiều
              nguyên liệu đối chiếu, con số càng chắc". */}
          <div className="gauge gauge-demo tier-ok" style={{ "--cov": 0.9 } as React.CSSProperties}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="g-track" cx="60" cy="60" r="52" pathLength={100} />
              <circle className="g-arc" cx="60" cy="60" r="52" pathLength={100} />
            </svg>
            <div className="g-mid"><b>540</b><i>kcal</i></div>
          </div>
          <small>Càng nhiều nguyên liệu được đối chiếu, con số càng chắc – vòng đầy dần và sáng từ xám sang xanh.</small>
        </div>
      </div>

      <div className="trust">
        <article style={{ "--i": 0 } as React.CSSProperties}>
          <Gauge tier="ok" cov={92} value="520" unit="kcal" />
          <div><small>Đã đối chiếu</small><h3>Hiện số</h3><p>Độ phủ từ 85% – hiện đúng con số kèm độ phủ.</p></div>
        </article>
        <article style={{ "--i": 1 } as React.CSSProperties}>
          <Gauge tier="mid" cov={72} value="~520" unit="kcal" />
          <div><small>Còn dao động</small><h3>Neo trong khoảng</h3><p>60–85% – số neo, không giả vờ chính xác.</p></div>
        </article>
        <article style={{ "--i": 2 } as React.CSSProperties}>
          <Gauge tier="low" cov={45} value="500–580" />
          <div><small>Chưa đủ chắc</small><h3>Chỉ hiện khoảng</h3><p>Dưới 60% – không đưa ra một con số đơn lẻ.</p></div>
        </article>
      </div>

      <p className="tier-demo">Số minh hoạ – trong app, vòng độ phủ đổi theo dữ liệu thật của từng món.</p>
      <div className="ribbon"><span>corroborated</span><i /><span>anchored range</span><i /><span>honest estimate</span><i /><strong>single source of truth</strong></div>
    </section>
  );
}
