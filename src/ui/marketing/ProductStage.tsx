import Image from "next/image";
import Link from "next/link";
import { LANDING_MEDIA } from "@/data/landing-media";

// The product shown as an editorial object over a real mâm-cơm photo — NOT a
// laptop/browser mockup. The interface frame mirrors the real app (day, số người,
// món + định lượng, a coverage chip, "Xem danh sách chợ"). Frame uses fixed light
// colours so it reads as a true app screenshot regardless of the visitor's theme.
export function ProductStage() {
  const m = LANDING_MEDIA.stage;
  const lines = [
    { name: "Cơm trắng", qty: "480g" },
    { name: "Cá kho tộ", qty: "520g" },
    { name: "Canh cải nấu tôm", qty: "3 phần" },
    { name: "Rau muống xào tỏi", qty: "300g" },
  ];
  return (
    <section className="relative overflow-hidden bg-landing-paper text-landing-ink">
      {/* oversized typographic watermark, < 30% opacity */}
      <div aria-hidden className="pointer-events-none absolute -right-6 top-8 select-none font-display text-[22vw] italic leading-none text-landing-ink/[0.05]">
        bữa tối
      </div>

      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-24 sm:px-8 md:grid-cols-2 md:py-32 lg:px-10">
        {/* photo + overlapping frame */}
        <div className="relative">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[24px] shadow-lg" style={{ rotate: "-2deg" }}>
            <Image src={m.src} alt={m.alt} fill sizes="(max-width:768px) 90vw, 40vw" className="object-cover" style={{ objectPosition: m.cropFocus }} />
          </div>
          {/* interface frame */}
          <div className="absolute -bottom-6 -right-2 w-[78%] max-w-[320px] rounded-[18px] border border-black/10 bg-white p-4 text-[#272327] shadow-lg sm:-right-6" style={{ rotate: "1.5deg" }}>
            <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
              <span className="text-[13px] font-semibold">Thứ Ba · Bữa tối</span>
              <span className="rounded-full bg-[#f6f1f2] px-2 py-0.5 text-[11px] text-[#6e686c]">4 người</span>
            </div>
            <ul className="py-2">
              {lines.map((l) => (
                <li key={l.name} className="flex items-baseline justify-between py-1 text-[13px]">
                  <span>{l.name}</span>
                  <span className="tabular-nums text-[#6e686c]">{l.qty}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-black/10 pt-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#469b75]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#469b75]" /> 82% đã đối chiếu
              </span>
              <Link href="/sign-up" className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-medium text-white">Xem danh sách chợ</Link>
            </div>
          </div>
        </div>

        {/* copy in the third whitespace */}
        <div className="md:pl-6">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-brand">Sản phẩm</p>
          <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
            Một tuần thật, không phải ảnh quảng cáo.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-landing-ink/70">
            Mỗi ngày có món theo mâm, định lượng theo số người, thời gian nấu và độ phủ
            dữ liệu. Đổi một món là danh sách đi chợ tự cập nhật — bạn chỉ việc mang giỏ đi.
          </p>
        </div>
      </div>
    </section>
  );
}
