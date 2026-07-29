"use client";

import Image from "next/image";
import { Blossom } from "@/ui/components/Blossom";
import { useInView } from "./useInView";

const ROWS = [
  { n: "01", title: "Nhớ điều cả nhà thích", desc: "Món bố thích, món con không ăn, khẩu phần của từng người và những lần đổi món đều được ghi nhớ cho tuần sau." },
  { n: "02", title: "Biết ngày nào nên nấu gọn", desc: "Ngày bận thì ưu tiên món nhanh. Cuối tuần có thể dành chỗ cho một bữa cầu kỳ và thong thả hơn." },
  { n: "03", title: "Thành thật về dữ liệu", desc: "Dữ liệu đủ đến đâu, sản phẩm nói rõ đến đó. Ước lượng vẫn là ước lượng, không được trình bày như một con số tuyệt đối." },
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
        <div className="section-label"><span className="round-no">03</span>Càng dùng càng giống nhà mình</div>
        <h2 className="display">Không chỉ nhớ món. <em>Nhớ cả cách gia đình mình sống.</em></h2>
      </div>
      <figure className="memory-photo">
        <div className="memory-photo-media">
          <Image src="/landing/marquee/goi-cuon.jpg" alt="" fill sizes="(max-width: 680px) calc(100vw - 40px), 50vw" />
        </div>
        <figcaption>
          <small>Trí nhớ của nhà mình</small>
          Một lần đổi món hôm nay trở thành gợi ý tốt hơn cho tuần sau.
        </figcaption>
      </figure>
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
