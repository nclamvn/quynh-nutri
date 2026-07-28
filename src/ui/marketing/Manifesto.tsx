"use client";

import { Blossom } from "@/ui/components/Blossom";
import { useInView } from "./useInView";

// Enriched (owner: 02 was too plain) — an editorial framed dish print + a low-opacity
// botanical line-art + a scroll reveal. Kept editorial: no cards, no icon-per-line.
export function Manifesto() {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`manifesto${inView ? " in-view" : ""}`} id="philosophy">
      <div className="manifesto-side">
        <div className="section-label"><span className="round-no">02</span>Quan điểm thiết kế</div>
        <figure className="manifesto-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/marquee/pho-bo.jpg" alt="" loading="lazy" />
        </figure>
        <Blossom variant="line" size={240} className="manifesto-bloom" />
      </div>
      <div className="manifesto-main">
        <p className="manifesto-lead">Không phải thêm một app đếm calo.</p>
        <h2 className="display">Chúng tôi thiết kế<em>một tuần có thể sống được.</em></h2>
        <div className="manifesto-foot">
          <p>Bữa cơm nhà bắt đầu từ câu hỏi giản dị hơn: tuần này gia đình có bao nhiêu thời gian, ai cần ăn gì và làm sao để người nấu không phải suy nghĩ lại từ đầu mỗi chiều.</p>
          <span className="seal">
            <svg className="seal-ring" viewBox="0 0 120 120" aria-hidden="true">
              <defs><path id="sealPath" d="M60,20 a40,40 0 1,1 -0.01,0" fill="none" /></defs>
              <text><textPath href="#sealPath" startOffset="0" textLength="251" lengthAdjust="spacing">PLAN · COOK · REMEMBER · REPEAT ·</textPath></text>
            </svg>
            <b>Q</b>
          </span>
        </div>
      </div>
    </section>
  );
}
