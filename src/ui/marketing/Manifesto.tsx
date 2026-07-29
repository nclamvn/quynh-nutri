"use client";

import Image from "next/image";
import { Blossom } from "@/ui/components/Blossom";
import { useInView } from "./useInView";

// Enriched (owner: 02 was too plain) — an editorial framed dish print + a low-opacity
// botanical line-art + a scroll reveal. Kept editorial: no cards, no icon-per-line.
export function Manifesto() {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`manifesto${inView ? " in-view" : ""}`} id="philosophy">
      <Blossom variant="line" size={260} className="manifesto-bloom" />
      <div className="manifesto-head">
        <div className="section-label"><span className="round-no">02</span>Quan điểm sản phẩm</div>
        <div className="manifesto-main">
          <p className="manifesto-lead">Không phải thêm một app đếm calo</p>
          <h2 className="display">Một tuần có thể <em>sống được.</em></h2>
        </div>
      </div>
      <div className="manifesto-story">
        <figure className="manifesto-photo">
          <div className="manifesto-photo-media">
            <Image src="/landing/marquee/pho-bo.jpg" alt="" fill sizes="(max-width: 680px) calc(100vw - 40px), 58vw" />
          </div>
          <figcaption>Món quen không cần lặp lại theo một cách cứng nhắc.</figcaption>
        </figure>
        <div className="manifesto-foot">
          <p>Có hôm chỉ đủ hai mươi phút để nấu. Có ngày trong tủ đã sẵn món từ tối trước. Có cuối tuần cả nhà muốn ngồi ăn thong thả hơn. Bữa cơm nhà bắt đầu từ những điều rất thật ấy – để sắp một tuần đủ ngon, đủ cân đối mà người nấu không phải xoay xở lại từ đầu mỗi chiều.</p>
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
