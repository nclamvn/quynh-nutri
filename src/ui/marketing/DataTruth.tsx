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
      <div className="truth-top"><span>05 · Dữ liệu dinh dưỡng</span><span>Minh bạch thay vì chính xác giả</span></div>

      <div className="truth-grid">
        <div>
          <p className="manifesto-lead">Biết đến đâu, nói rõ đến đó</p>
          <h2 className="display">Con số nào cũng nói rõ <em>mình chắc đến đâu.</em></h2>
          <p>Một con số dinh dưỡng chỉ thực sự hữu ích khi bạn biết nó được tính từ đâu và còn bao nhiêu phần chưa chắc chắn.</p>
        </div>
        <div className="confidence">
          {/* demo ring — fills up while morphing xám → xanh, to show "càng nhiều
              nguyên liệu đối chiếu, mức đối chiếu càng cao". */}
          <div className="gauge gauge-demo tier-ok" style={{ "--cov": 0.9 } as React.CSSProperties}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="g-track" cx="60" cy="60" r="52" pathLength={100} />
              <circle className="g-arc" cx="60" cy="60" r="52" pathLength={100} />
            </svg>
            <div className="g-mid"><b>540</b><i>kcal</i></div>
          </div>
          <small>Càng nhiều nguyên liệu được đối chiếu, mức đối chiếu càng cao – vòng đầy dần và sáng từ xám sang xanh.</small>
        </div>
      </div>

      <div className="trust">
        <article style={{ "--i": 0 } as React.CSSProperties}>
          <Gauge tier="ok" cov={92} value="520" unit="kcal" />
          <div><small>Đủ dữ liệu</small><h3>Đã đối chiếu tốt</h3><p>Hiện một giá trị ước tính, kèm mức dữ liệu đã được kiểm tra.</p></div>
        </article>
        <article style={{ "--i": 1 } as React.CSSProperties}>
          <Gauge tier="mid" cov={72} value="500–550" />
          <div><small>Còn sai số</small><h3>Còn một phần chưa chắc</h3><p>Hiện một khoảng hợp lý, thay vì tạo cảm giác chính xác tuyệt đối.</p></div>
        </article>
        <article style={{ "--i": 2 } as React.CSSProperties}>
          <Gauge tier="low" cov={45} value="480–580" />
          <div><small>Thiếu dữ liệu</small><h3>Chưa đủ căn cứ</h3><p>Chỉ hiện một khoảng rộng, hoặc báo chưa đủ dữ liệu để kết luận.</p></div>
        </article>
      </div>

      <p className="tier-demo">Các con số trên chỉ để minh hoạ. Trong ứng dụng, mức đối chiếu thay đổi theo dữ liệu thực tế của từng món và nguyên liệu.</p>
      <div className="ribbon"><span>đã đối chiếu</span><i /><span>còn sai số</span><i /><span>chưa đủ dữ liệu</span><i /><strong>nói thật độ chắc</strong></div>
    </section>
  );
}
