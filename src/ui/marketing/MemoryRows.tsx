// The biggest differentiator: the app has each household's memory. Ink section,
// ivory+rose headline, THREE full-width rows (number / name / desc / arrow) with a
// row-hover→rose tint on desktop. Not three rounded cards. Concrete behaviour copy.
const ROWS = [
  { n: "01", name: "Nhớ khẩu vị", desc: "Món cả nhà chọn lại nhiều lần được ưu tiên; món bị đổi đi thường xuyên sẽ thưa dần." },
  { n: "02", name: "Hiểu nhịp tuần", desc: "Ngày bận thì kế hoạch nghiêng về món nhanh; cuối tuần mới xếp món cầu kỳ hơn." },
  { n: "03", name: "Nói thật về dữ liệu", desc: "Số nào đã đối chiếu thì hiện số; số nào chưa chắc thì nói khoảng, không tô cho đẹp." },
];

export function MemoryRows() {
  return (
    <section className="bg-landing-ink text-landing-ivory">
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
        <h2 className="max-w-3xl text-[clamp(2.2rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-tight">
          Ứng dụng có <span className="font-display italic text-landing-rose">trí nhớ</span> của riêng nhà bạn.
        </h2>
        <div className="mt-12 border-t border-white/12">
          {ROWS.map((r) => (
            <div
              key={r.n}
              className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-2 border-b border-white/12 py-7 transition-colors hover:bg-brand/90 md:grid-cols-[6rem_16rem_1fr_auto] md:items-center md:gap-8 md:px-4"
            >
              <span className="font-display text-2xl italic text-white/40 group-hover:text-white/80">{r.n}</span>
              <h3 className="text-xl font-semibold md:text-2xl">{r.name}</h3>
              <p className="col-span-2 text-base leading-relaxed text-white/65 group-hover:text-white/90 md:col-span-1">{r.desc}</p>
              <span aria-hidden className="hidden text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white md:block">→</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
