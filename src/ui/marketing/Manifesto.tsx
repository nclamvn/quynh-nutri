// Emotion → argument. Asymmetric 30/70, section number left, generous whitespace,
// indented explanatory paragraph. No icons, no cards, no gradient background.
export function Manifesto() {
  return (
    <section id="cach-hoat-dong" className="bg-landing-paper text-landing-ink">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-24 sm:px-8 md:grid-cols-[1fr_2.4fr] md:py-32 lg:px-10">
        <div className="text-[13px] font-medium uppercase tracking-[0.16em] text-landing-ink/45">
          01 — Tuyên ngôn
        </div>
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-brand">
            Không phải thêm một app đếm calo.
          </p>
          <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4.5rem)] font-semibold leading-[1.02] tracking-tight">
            Chúng tôi thiết kế một tuần có thể sống được.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-landing-ink/70 md:ml-[22%]">
            Một kế hoạch chỉ có ích khi nó vừa với thời gian, công sức và hoàn cảnh của
            nhà bạn. Bữa cơm nhà bắt đầu từ số người ăn, những ngày bận và khẩu vị thật
            — rồi mới tính đến dinh dưỡng, chứ không bắt cả nhà chạy theo một con số.
          </p>
        </div>
      </div>
    </section>
  );
}
