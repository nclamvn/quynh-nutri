import type { Metadata } from "next";
import Link from "next/link";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Bữa cơm nhà — Một tuần ăn ngon, có căn cứ",
  description:
    "Kế hoạch bữa cơm gia đình Việt: xoay món thông minh, định lượng có nguồn và đi chợ gọn trong một nhịp sống thật.",
};

const householdMemory = [
  {
    number: "01",
    title: "Nhớ khẩu vị",
    copy: "Món cả nhà thích, món con không ăn, phần của từng người và những lần đổi món đều trở thành trí nhớ dùng được.",
  },
  {
    number: "02",
    title: "Hiểu nhịp tuần",
    copy: "Ngày bận thì nấu gọn. Cuối tuần thì thong thả. Kế hoạch được xây quanh đời sống, không bắt đời sống chạy theo thực đơn.",
  },
  {
    number: "03",
    title: "Nói thật về dữ liệu",
    copy: "Mỗi con số dinh dưỡng tự khai độ chắc. Thiếu dữ liệu được nói là thiếu, thay vì biến ước lượng thành một lời khẳng định đẹp mắt.",
  },
];

const trustLevels = [
  { label: "Đã đối chiếu", value: "Dùng số", note: "Độ phủ từ 85%" },
  { label: "Còn dao động", value: "Neo khoảng", note: "Độ phủ 60–85%" },
  { label: "Chưa đủ chắc", value: "Chỉ hiện khoảng", note: "Độ phủ dưới 60%" },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.navShell}>
        <Link className={styles.brand} href="/" aria-label="Bữa cơm nhà — trang chủ">
          <span className={styles.brandMark} aria-hidden="true">
            Q
          </span>
          <span>
            Bữa cơm nhà
            <small>meal system for real families</small>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Điều hướng chính">
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#du-lieu">Dữ liệu</a>
          <Link href="/sign-in">Đăng nhập</Link>
        </nav>

        <Link className={styles.navCta} href="/sign-up">
          Bắt đầu một tuần
          <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroOrbital} aria-hidden="true">
          <span>7 ngày</span>
          <span>49 món nền</span>
          <span>1 danh sách chợ</span>
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span>01</span>
            Meal planning, nhưng dành cho nhà mình
          </p>

          <h1 id="hero-title" className={styles.heroTitle}>
            <span className={styles.heroSoft}>Mỗi bữa cơm</span>
            <span className={styles.heroStrong}>đều có</span>
            <span className={styles.heroAccent}>một lý do.</span>
          </h1>

          <div className={styles.heroIntro}>
            <p>
              Một hệ thống lập bữa cho gia đình Việt, biết xoay món, cân lượng, gộp chợ và nói thật độ chắc của từng con số.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/sign-up">
                Lập tuần đầu tiên
                <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.textCta} href="/overview">
                Mở ứng dụng
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div
            className={styles.heroPhoto}
            role="img"
            aria-label="Một gia đình châu Á đang ăn cơm cùng nhau"
          />
          <div className={styles.mediaTopline}>
            <span>Family table / 19:12</span>
            <span>Hồ sơ nhà Quỳnh</span>
          </div>
          <div className={styles.mediaCaption}>
            <span className={styles.liveDot} aria-hidden="true" />
            Kế hoạch đang thích nghi theo tuần này
          </div>
          <div className={styles.proofBadge}>
            <span className={styles.proofNumber}>92</span>
            <span>
              % độ phủ
              <small>dữ liệu có căn cứ</small>
            </span>
          </div>
          <div className={styles.mediaIndex} aria-hidden="true">
            01 — 05
          </div>
        </div>

        <div className={styles.heroRail} aria-hidden="true">
          <span>SCROLL TO SET THE TABLE</span>
          <i />
        </div>
      </section>

      <div className={styles.ticker} aria-label="Điểm nổi bật của sản phẩm">
        <div className={styles.tickerTrack}>
          <span>XOAY MÓN THÔNG MINH</span>
          <b>✦</b>
          <span>ĐỊNH LƯỢNG CÓ NGUỒN</span>
          <b>✦</b>
          <span>ĐI CHỢ MỘT LẦN, DÙNG CẢ TUẦN</span>
          <b>✦</b>
          <span>KHÔNG PHÁN SỐ CHÍNH XÁC GIẢ</span>
          <b>✦</b>
          <span>XOAY MÓN THÔNG MINH</span>
          <b>✦</b>
          <span>ĐỊNH LƯỢNG CÓ NGUỒN</span>
          <b>✦</b>
          <span>ĐI CHỢ MỘT LẦN, DÙNG CẢ TUẦN</span>
          <b>✦</b>
          <span>KHÔNG PHÁN SỐ CHÍNH XÁC GIẢ</span>
          <b>✦</b>
        </div>
      </div>

      <section id="cach-hoat-dong" className={styles.manifesto}>
        <div className={styles.sectionLabel}>
          <span>02</span>
          Quan điểm thiết kế
        </div>
        <div className={styles.manifestoBody}>
          <p className={styles.manifestoLead}>Không phải thêm một app đếm calo.</p>
          <h2>
            Chúng tôi thiết kế
            <em> một tuần có thể sống được.</em>
          </h2>
          <div className={styles.manifestoFoot}>
            <p>
              Bữa cơm nhà bắt đầu từ câu hỏi giản dị hơn: tuần này gia đình có bao nhiêu thời gian, ai cần ăn gì và làm sao để người nấu không phải suy nghĩ lại từ đầu mỗi chiều.
            </p>
            <span className={styles.rotatingSeal} aria-hidden="true">
              <span>PLAN • COOK • REMEMBER • REPEAT •</span>
              <b>Q</b>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.productStage} aria-labelledby="product-title">
        <div className={styles.stagePhotoWrap}>
          <div
            className={styles.stagePhoto}
            role="img"
            aria-label="Bàn ăn Việt với nhiều món ăn gia đình"
          />
          <div className={styles.stageNote}>
            <span>Thứ tư / 18:30</span>
            Canh khổ qua · thịt kho · rau luộc
          </div>
          <small className={styles.photoCredit}>Ảnh: Toan Le / Unsplash</small>
        </div>

        <div className={styles.interfaceFrame}>
          <div className={styles.interfaceChrome}>
            <span>Tuần của nhà mình</span>
            <b>21 — 27.07</b>
            <i aria-hidden="true">•••</i>
          </div>

          <div className={styles.dayTabs} aria-hidden="true">
            <span>T2</span>
            <span>T3</span>
            <span className={styles.activeDay}>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          <div className={styles.mealHero}>
            <div>
              <small>Bữa tối · 4 người</small>
              <h3 id="product-title">Một mâm cơm vừa sức.</h3>
            </div>
            <span className={styles.coveragePill}>Độ phủ 92%</span>
          </div>

          <div className={styles.mealRows}>
            <article>
              <span className={styles.mealIndex}>01</span>
              <div>
                <h4>Canh khổ qua nhồi thịt</h4>
                <p>650 g · đã tính phần hao hụt</p>
              </div>
              <b>≈ 28′</b>
            </article>
            <article>
              <span className={styles.mealIndex}>02</span>
              <div>
                <h4>Thịt kho trứng</h4>
                <p>720 g · món nền gia đình</p>
              </div>
              <b>có sẵn</b>
            </article>
            <article>
              <span className={styles.mealIndex}>03</span>
              <div>
                <h4>Rau luộc theo mùa</h4>
                <p>480 g · đổi theo chợ gần nhà</p>
              </div>
              <b>≈ 12′</b>
            </article>
          </div>

          <div className={styles.interfaceFooter}>
            <span>Nhẹ hơn 18 phút so với kế hoạch gốc</span>
            <button type="button" tabIndex={-1} aria-hidden="true">
              Xem danh sách chợ
            </button>
          </div>
        </div>

        <div className={styles.stageCopy}>
          <span className={styles.stageKicker}>A living meal system</span>
          <h2>Kế hoạch không đứng yên sau khi được tạo.</h2>
          <p>
            Đổi một món, thiếu một nguyên liệu hay có thêm người ăn — cả định lượng, dinh dưỡng và danh sách chợ được nối lại thành một hệ thống nhất quán.
          </p>
          <Link href="/sign-up">Tạo hồ sơ gia đình →</Link>
        </div>
      </section>

      <section className={styles.memorySection} aria-labelledby="memory-title">
        <div className={styles.memoryHeading}>
          <div className={styles.sectionLabelLight}>
            <span>03</span>
            Trí nhớ gia đình
          </div>
          <h2 id="memory-title">
            Một hệ thống biết
            <em> nhà mình là ai.</em>
          </h2>
        </div>

        <div className={styles.memoryRows}>
          {householdMemory.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>

      <section id="du-lieu" className={styles.truthSection} aria-labelledby="truth-title">
        <div className={styles.truthTopline}>
          <span>04 / Provenance as a product feature</span>
          <span>Không trang trí bằng sự chắc chắn giả</span>
        </div>

        <div className={styles.truthGrid}>
          <div>
            <p className={styles.truthEyebrow}>Dữ liệu biết tự nghi ngờ</p>
            <h2 id="truth-title">
              Con số nào cũng phải biết
              <em> mình chắc đến đâu.</em>
            </h2>
          </div>
          <p className={styles.truthIntro}>
            Thay vì dán một con số đẹp lên món ăn, Bữa cơm nhà đo độ phủ theo khối lượng nguyên liệu đã được đối chiếu. Giao diện thay đổi theo mức tin cậy, để người dùng nhìn thấy cả kết quả lẫn giới hạn của nó.
          </p>
        </div>

        <div className={styles.trustScale}>
          {trustLevels.map((level, index) => (
            <article key={level.label}>
              <span className={styles.trustIndex}>0{index + 1}</span>
              <div>
                <small>{level.label}</small>
                <h3>{level.value}</h3>
              </div>
              <p>{level.note}</p>
            </article>
          ))}
        </div>

        <div className={styles.dataRibbon}>
          <span>corroborated</span>
          <i />
          <span>anchored range</span>
          <i />
          <span>honest estimate</span>
          <i />
          <strong>single source of truth</strong>
        </div>
      </section>

      <section className={styles.quoteSection}>
        <p className={styles.quoteMark} aria-hidden="true">
          “
        </p>
        <blockquote>
          Ăn ngon không bắt đầu từ ý chí. Nó bắt đầu từ một kế hoạch đủ thực tế để cả nhà cùng theo.
        </blockquote>
        <div className={styles.quoteMeta}>
          <span>Q&apos;s Kitchen principle</span>
          <span>Made for Vietnamese homes</span>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalHalo} aria-hidden="true" />
        <p>Tuần mới bắt đầu từ một câu hỏi cũ.</p>
        <h2>
          Tối nay
          <em> ăn gì?</em>
        </h2>
        <div className={styles.finalActions}>
          <Link className={styles.finalButton} href="/sign-up">
            Để Bữa cơm nhà lên tuần đầu tiên
            <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/sign-in">Tôi đã có tài khoản</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <span className={styles.footerMark}>Q</span>
          <p>
            Bữa cơm nhà
            <small>Kế hoạch bữa cơm gia đình Việt.</small>
          </p>
        </div>
        <p>© 2026 Q&apos;s Kitchen. Built around real family life.</p>
        <div>
          <a href="#cach-hoat-dong">Sản phẩm</a>
          <a href="#du-lieu">Dữ liệu</a>
          <Link href="/sign-in">Đăng nhập</Link>
        </div>
      </footer>
    </main>
  );
}
