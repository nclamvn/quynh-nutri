"use client";

import { Blossom } from "@/ui/components/Blossom";
import { useInView } from "./useInView";

const ROWS = [
  { n: "01", title: "Nhớ khẩu vị", desc: "Món cả nhà thích, món con không ăn, phần của từng người và những lần đổi món đều trở thành trí nhớ dùng được." },
  { n: "02", title: "Hiểu nhịp tuần", desc: "Ngày bận thì nấu gọn. Cuối tuần thì thong thả. Kế hoạch được xây quanh đời sống, không bắt đời sống chạy theo thực đơn." },
  { n: "03", title: "Nói thật về dữ liệu", desc: "Mỗi con số dinh dưỡng tự khai độ chắc. Thiếu dữ liệu được nói là thiếu, thay vì biến ước lượng thành một lời khẳng định đẹp mắt." },
];

// Enriched (owner: 03 was too plain) — a low-opacity botanical line-art + a small
// framed dish accent + a staggered row reveal on scroll. Editorial: full-width rows,
// no cards, no icon-per-line.
export function Memory() {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`memory${inView ? " in-view" : ""}`} id="memory">
      <Blossom variant="line" size={280} className="memory-bloom" />
      <div className="memory-head">
        <div className="memory-head-side">
          <div className="section-label"><span className="round-no">03</span>Trí nhớ gia đình</div>
          <figure className="memory-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/marquee/goi-cuon.jpg" alt="" loading="lazy" />
          </figure>
        </div>
        <h2 className="display">Một hệ thống&nbsp;biết<em>nhà mình là ai.</em></h2>
      </div>
      <div className="memory-rows">
        {ROWS.map((r, i) => (
          <article key={r.n} className="memory-row" style={{ "--i": i } as React.CSSProperties}>
            <span className="num">{r.n}</span>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <span>↗</span>
          </article>
        ))}
      </div>
    </section>
  );
}
