// Emotional beat before the final CTA. Rose field, huge Lora italic, one giant
// low-opacity quotation mark. No fake customer portrait or press logos.
export function BrandQuote() {
  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <span aria-hidden className="pointer-events-none absolute -left-4 -top-16 select-none font-display text-[26rem] leading-none text-white/10">“</span>
      <div className="mx-auto max-w-[1000px] px-5 py-28 sm:px-8 md:py-36 lg:px-10">
        <blockquote className="font-display text-[clamp(1.9rem,4.6vw,3.4rem)] italic leading-[1.2]">
          Ăn ngon không bắt đầu từ ý chí. Nó bắt đầu từ một kế hoạch đủ thực tế để cả nhà cùng theo.
        </blockquote>
      </div>
    </section>
  );
}
