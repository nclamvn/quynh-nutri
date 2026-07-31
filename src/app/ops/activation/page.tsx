import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  buildOpsMetrics,
  OPS_INTERACTIVE_WINDOWS,
  parseInteractiveWindow,
  type OpsHealthState,
  type OpsMetricsDto,
  type SuppressedNumber,
} from "@/domain/ops/metrics-contract";
import { getOpsMetrics } from "@/data/repo/ops-metrics";
import {
  OperatorAccessDenied,
  requireOperatorUserId,
} from "@/lib/operator-auth";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nhịp kích hoạt",
  description: "Bảng kiểm chứng kích hoạt và chất lượng đo lường nội bộ.",
  robots: { index: false, follow: false, nocache: true },
};

const MILESTONE_LABELS: Record<
  OpsMetricsDto["milestones"][number]["key"],
  { short: string; title: string }
> = {
  started: { short: "01", title: "Bắt đầu thiết lập" },
  setup_completed: { short: "02", title: "Thiết lập xong" },
  plan_participated: { short: "03", title: "Tham gia kế hoạch" },
  shopping_received: { short: "04", title: "Đã nhận hàng chợ" },
  kitchen_started: { short: "05", title: "Đã vào bếp" },
  meal_completed: { short: "06", title: "Đã khép bữa" },
  learning_loop: { short: "07", title: "Đã phản hồi vòng lặp" },
};

const OCCASION_LABELS: Record<
  OpsMetricsDto["occasions"][number]["occasion"],
  string
> = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  snack: "Bữa phụ",
};

const HEALTH_LABELS: Record<OpsHealthState, string> = {
  healthy: "Đủ bằng chứng",
  attention: "Cần kiểm tra",
  insufficient_traffic: "Chưa đủ lưu lượng",
  unavailable: "Tạm chưa đọc được",
};

function formatPeriod(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "Chưa có sự kiện";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function metricText(metric: SuppressedNumber, suffix = ""): string {
  if (metric.state !== "available" || metric.value === null) {
    return metric.reason ?? "Chưa đọc được";
  }
  return `${metric.value}${suffix}`;
}

function deltaText(value: number | null): string {
  if (value === null) return "Chưa có kỳ so sánh";
  if (value === 0) return "Không đổi so với kỳ trước";
  return `${value > 0 ? "+" : ""}${value} điểm % so với kỳ trước`;
}

function unavailableMetrics(windowDays: 7 | 28 | 90, now: Date): OpsMetricsDto {
  return buildOpsMetrics({
    events: [],
    firstOnboardingStarts: [],
    canonicalCompletions: null,
    now,
    windowDays,
    queryDurationMs: 0,
  });
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.kicker}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricDetail}>{detail}</p>
    </article>
  );
}

function OperatorActivationFallback() {
  return (
    <main className={styles.shell} aria-busy="true">
      <div className={styles.frame}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.brand}>
              <span aria-hidden>✿</span>
              Ăn Ngon
            </Link>
            <p className={styles.eyebrow}>Phòng điều hành · KE-031</p>
            <h1>Nhịp kích hoạt</h1>
            <p className={styles.lead}>Đang đọc bằng chứng vận hành đã xác nhận.</p>
          </div>
          <div className={styles.loadingMeta} role="status" aria-live="polite">
            <span className={styles.loadingDot} aria-hidden />
            Đang tổng hợp
          </div>
        </header>
        <div className={styles.loadingGrid} aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}

async function OperatorActivationReport({
  searchParams,
}: {
  searchParams: Promise<{ window?: string | string[] }>;
}) {
  const params = await searchParams;
  const windowDays = parseInteractiveWindow(params.window);
  const now = new Date();
  let metrics: OpsMetricsDto;
  try {
    metrics = await getOpsMetrics(windowDays, now);
  } catch (error) {
    if (error instanceof OperatorAccessDenied) notFound();
    console.error("OPS_METRICS_READ_FAILED", {
      error: error instanceof Error ? error.message : "unknown",
    });
    metrics = unavailableMetrics(windowDays, now);
  }

  const actionTtv = metrics.timeToValue.firstOperationalAction;
  const mealTtv = metrics.timeToValue.firstClosedMeal;

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.brand}>
              <span aria-hidden>✿</span>
              Ăn Ngon
            </Link>
            <p className={styles.eyebrow}>Phòng điều hành · KE-031</p>
            <h1>Nhịp kích hoạt</h1>
            <p className={styles.lead}>
              Đọc bằng chứng thật từ thiết lập, kế hoạch, chợ và căn bếp.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={`${styles.healthBadge} ${styles[metrics.health.state]}`}>
              <span aria-hidden className={styles.statusDot} />
              {HEALTH_LABELS[metrics.health.state]}
            </span>
            <p>
              Làm mới {formatTimestamp(metrics.generatedAt)}
            </p>
            <p>Contract {metrics.contractVersion}</p>
          </div>
        </header>

        <section className={styles.controlBar} aria-label="Khoảng thời gian báo cáo">
          <div>
            <p className={styles.kicker}>Cửa sổ báo cáo</p>
            <p className={styles.periodText}>
              {formatPeriod(metrics.period.startUtc)} –{" "}
              {formatPeriod(new Date(
                new Date(metrics.period.endUtc).getTime() - 1,
              ).toISOString())}
            </p>
          </div>
          <nav className={styles.windowNav}>
            {OPS_INTERACTIVE_WINDOWS.map((days) => (
              <Link
                key={days}
                href={`/ops/activation?window=${days}`}
                aria-current={windowDays === days ? "page" : undefined}
                className={windowDays === days ? styles.windowActive : undefined}
              >
                {days} ngày
              </Link>
            ))}
          </nav>
        </section>

        <section className={styles.section} aria-labelledby="milestone-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Thang bằng chứng</p>
              <h2 id="milestone-title">Gia đình đã đi đến đâu?</h2>
            </div>
            <p>
              Mỗi mốc đứng độc lập. Đi thẳng tới mốc sau không bị gọi là bỏ cuộc.
            </p>
          </div>
          <div className={styles.milestoneRail}>
            {metrics.milestones.map((milestone) => {
              const label = MILESTONE_LABELS[milestone.key];
              const width = milestone.conversionPct ?? 0;
              return (
                <article key={milestone.key} className={styles.milestone}>
                  <span className={styles.milestoneIndex}>{label.short}</span>
                  <div className={styles.milestoneBody}>
                    <div className={styles.milestoneTopline}>
                      <h3>{label.title}</h3>
                      <p>
                        <strong>{milestone.households}</strong>
                        <span>
                          {milestone.conversionPct === null
                            ? "Chưa có mẫu"
                            : `${milestone.conversionPct}%`}
                        </span>
                      </p>
                    </div>
                    <div className={styles.bar} aria-hidden>
                      <span style={{ width: `${width}%` }} />
                    </div>
                    <p className={styles.delta}>
                      {deltaText(milestone.deltaPercentagePoints)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.section} aria-labelledby="journey-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Trật tự hành trình</p>
                <h2 id="journey-title">Tuyến chuẩn và đường đi thẳng</h2>
              </div>
            </div>
            <div className={styles.metricGrid}>
              <MetricCard
                label="Đủ tuyến chuẩn"
                value={String(metrics.journey.strictCompletedHouseholds)}
                detail="Hộ đã đi tuần tự tới khép bữa"
              />
              <MetricCard
                label="Đường đi thẳng"
                value={String(metrics.journey.directPathHouseholds)}
                detail="Hộ đạt mốc sau mà không qua mọi mốc tùy chọn"
              />
              <MetricCard
                label="Thứ tự bất thường"
                value={String(metrics.journey.impossibleOrderingHouseholds)}
                detail="Hộ có bằng chứng thời gian cần kiểm tra"
              />
            </div>
          </section>

          <section className={styles.section} aria-labelledby="ttv-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Thời gian tới giá trị</p>
                <h2 id="ttv-title">Từ thiết lập đến hành động thật</h2>
              </div>
            </div>
            <div className={styles.ttvList}>
              <div>
                <p>Hành động vận hành đầu tiên</p>
                <strong>{metricText(actionTtv.medianHours, " giờ")}</strong>
                <span>
                  Trung vị · p75 {metricText(actionTtv.p75Hours, " giờ")} ·{" "}
                  {actionTtv.matureHouseholds} hộ trưởng thành
                </span>
              </div>
              <div>
                <p>Bữa đầu tiên được khép</p>
                <strong>{metricText(mealTtv.medianHours, " giờ")}</strong>
                <span>
                  Trung vị · p75 {metricText(mealTtv.p75Hours, " giờ")} ·{" "}
                  {mealTtv.matureHouseholds} hộ trưởng thành
                </span>
              </div>
            </div>
          </section>
        </div>

        <section className={styles.section} aria-labelledby="return-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Quay lại có ý nghĩa</p>
              <h2 id="return-title">Có tiếp tục quán xuyến căn bếp?</h2>
            </div>
            <p>Đăng nhập và xem trang không được tính là giá trị.</p>
          </div>
          <div className={styles.metricGridFour}>
            <MetricCard
              label="Hộ có hoạt động"
              value={String(metrics.returnBehavior.activeHouseholds)}
              detail="Có ít nhất một hành động vận hành"
            />
            <MetricCard
              label="Quay lại ≥ 2 ngày"
              value={String(metrics.returnBehavior.twoDayHouseholds)}
              detail="Hoạt động trên hai ngày địa phương"
            />
            <MetricCard
              label="Quay lại ≥ 2 tuần"
              value={String(metrics.returnBehavior.twoWeekHouseholds)}
              detail="Hoạt động trong hai tuần địa phương"
            />
            <MetricCard
              label="Giữ chân 7 ngày"
              value={metricText(metrics.returnBehavior.sevenDayReturnPct, "%")}
              detail="Chỉ tính cohort đã đủ thời gian quan sát"
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="occasion-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Nhịp ăn cả ngày</p>
              <h2 id="occasion-title">Bữa nào đang được dùng thật?</h2>
            </div>
            <p>Ô dưới 5 hộ được ẩn để bảo vệ riêng tư.</p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.occasionTable}>
              <thead>
                <tr>
                  <th>Bữa</th>
                  <th>Đã sửa kế hoạch</th>
                  <th>Đã bắt đầu nấu</th>
                  <th>Đã hoàn tất</th>
                </tr>
              </thead>
              <tbody>
                {metrics.occasions.map((occasion) => (
                  <tr key={occasion.occasion}>
                    <th>{OCCASION_LABELS[occasion.occasion]}</th>
                    <td>{metricText(occasion.editedHouseholds)}</td>
                    <td>{metricText(occasion.startedHouseholds)}</td>
                    <td>{metricText(occasion.completedHouseholds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.healthSection} aria-labelledby="health-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Chất lượng bằng chứng</p>
              <h2 id="health-title">Số liệu này đáng tin đến đâu?</h2>
            </div>
            <p>Truy vấn {metrics.health.queryDurationMs} ms · Asia/Ho_Chi_Minh</p>
          </div>
          <div className={styles.healthGrid}>
            <dl>
              <div>
                <dt>Sự kiện gần nhất</dt>
                <dd>{formatTimestamp(metrics.health.latestEventAt)}</dd>
              </div>
              <div>
                <dt>24 giờ gần nhất</dt>
                <dd>{metrics.health.eventsLast24Hours}</dd>
              </div>
              <div>
                <dt>24 giờ trước đó</dt>
                <dd>{metrics.health.eventsPrevious24Hours}</dd>
              </div>
              <div>
                <dt>Độ phủ hoàn tất bữa</dt>
                <dd>
                  {metrics.health.completionCoveragePct === null
                    ? "Chưa đọc được"
                    : `${metrics.health.completionCoveragePct}%`}
                </dd>
              </div>
              <div>
                <dt>Schema ngoài contract</dt>
                <dd>
                  {metrics.health.unknownEventNames
                    + metrics.health.unsupportedSchemaVersions
                    + metrics.health.malformedProperties}
                </dd>
              </div>
              <div>
                <dt>Dấu thời gian bất thường</dt>
                <dd>
                  {metrics.health.futureTimestamps
                    + metrics.health.negativeDurations}
                </dd>
              </div>
            </dl>
            <div className={styles.healthNotes}>
              {metrics.health.guardrails.length > 0 && (
                <div className={styles.guardrails}>
                  {metrics.health.guardrails.map((guardrail) => (
                    <p key={guardrail.code}>
                      <span aria-hidden>!</span>
                      {guardrail.message}
                    </p>
                  ))}
                </div>
              )}
              <ul>
                {metrics.health.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            Chỉ dữ liệu tổng hợp · Không có danh sách hộ · Không có nội dung bữa ăn
          </p>
          <p>
            Kỳ trước {formatPeriod(metrics.previousPeriod.startUtc)} –{" "}
            {formatPeriod(new Date(
              new Date(metrics.previousPeriod.endUtc).getTime() - 1,
            ).toISOString())}
          </p>
        </footer>
      </div>
    </main>
  );
}

export default async function OperatorActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string | string[] }>;
}) {
  try {
    await requireOperatorUserId();
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={<OperatorActivationFallback />}>
      <OperatorActivationReport searchParams={searchParams} />
    </Suspense>
  );
}
