// Honesty made visible. Ivory, three columns, thin dividers, big tabular values.
// The three D3 tiers, each in its OWN semantic colour — green / honey / gray.
// Rose is NEVER used here (rose = brand only, never data quality).
const TIERS = [
  {
    tone: "text-[#469b75]", dot: "bg-[#469b75]",
    label: "Đã đối chiếu", value: "540", unit: "kcal",
    note: "Từ 85% khối lượng nguyên liệu trở lên đã có nguồn — hiện đúng con số kèm độ phủ.",
  },
  {
    tone: "text-[#c58a21]", dot: "bg-[#c58a21]",
    label: "Còn dao động", value: "≈ 540", unit: "(500–580)",
    note: "60–85% đã đối chiếu — hiện một giá trị neo trong khoảng, không giả vờ chính xác.",
  },
  {
    tone: "text-[#989195]", dot: "bg-[#989195]",
    label: "Chưa đủ chắc", value: "—", unit: "chưa đủ dữ liệu",
    note: "Dưới 60% — không đưa ra một con số đơn lẻ như sự thật. Thiếu dữ liệu là xám, không phải đỏ.",
  },
];

export function DataTruth() {
  return (
    <section id="du-lieu" className="bg-landing-ivory text-landing-ink">
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
        <h2 className="max-w-2xl text-[clamp(2rem,4.8vw,3.75rem)] font-semibold leading-[1.03] tracking-tight">
          Con số nào cũng phải biết mình <span className="font-display italic">chắc đến đâu.</span>
        </h2>
        <p className="mt-4 max-w-xl text-lg text-landing-ink/60">
          Cùng một chỉ số, cách hiển thị đổi theo độ phủ dữ liệu — để bạn biết tin đến mức nào.
        </p>

        <div className="mt-14 grid gap-px border-t border-landing-ink/12 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.label} className="border-b border-landing-ink/12 py-8 md:border-b-0 md:border-r md:border-landing-ink/12 md:pr-8 md:pl-0 md:[&:first-child]:pr-8 md:[&:last-child]:border-r-0 md:[&:not(:first-child)]:pl-8">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-landing-ink/55">{t.label}</span>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className={`font-display text-6xl tabular-nums ${t.tone}`}>{t.value}</span>
                <span className={`text-sm ${t.tone} opacity-80`}>{t.unit}</span>
              </div>
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-landing-ink/65">{t.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
