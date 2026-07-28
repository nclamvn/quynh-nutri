"use client";

import Link from "next/link";
import { useInView } from "./useInView";

// Step 2 — "tương phản khổ". The most emotional line of the whole product
// ("Tối nay ăn gì?") gets a near-full-viewport screen of its own: giant type,
// ~70% of the screen deliberately left EMPTY, the block anchored low-left (not
// rigidly centered), and ONE slow reveal on enter — this is the climax, so it
// gets time. Hard rule: nothing added beyond eyebrow + question + one CTA.
// A low threshold because the section is tall; content is visible by default
// (the class only ADDS the entrance) so nothing hides if JS never runs.
export function FinalCTA() {
  const { ref, inView } = useInView<HTMLElement>(0.15);
  return (
    <section ref={ref} className={`final${inView ? " in-view" : ""}`} id="cta">
      <figure className="final-dish" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/marquee/bun.jpg" alt="" loading="lazy" />
      </figure>
      <div className="final-inner">
        <p className="final-eyebrow">Tuần mới, nhẹ đầu hơn</p>
        <h2 className="display final-q">Tối nay <em>ăn gì?</em></h2>
        <p className="final-desc">Mình bắt đầu từ đó. Cho Bữa cơm nhà biết số người, khẩu vị và những ngày bạn thường bận – phần còn lại sẽ được sắp thành một tuần rõ ràng, vừa sức và dễ thay đổi.</p>
        <div className="final-actions">
          <Link className="btn" href="/sign-up">Lên thực đơn tuần đầu tiên <span>↗</span></Link>
          <Link href="/sign-in">Tôi đã có tài khoản</Link>
        </div>
      </div>
    </section>
  );
}
