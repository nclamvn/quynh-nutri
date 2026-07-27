"use client";

import { useEffect, useState } from "react";

// TIP-P2-0 SPIKE — verify on a REAL phone (with Zalo) that navigator.share opens a
// sheet with Zalo as a target AND the order text arrives intact. This is a probe,
// not a claim: the verdict comes from the device test, screenshotted. Public route.

const ORDER_LINES = [
  { name: "Ghẹ", qty: "800g" },
  { name: "Rau muống", qty: "300g" },
  { name: "Cà chua", qty: "200g" },
  { name: "Đậu hũ", qty: "2 bìa" },
];

const SAMPLE_ORDER = [
  "Chào shop, Quỳnh đặt giúp:",
  ...ORDER_LINES.map((l) => `• ${l.name}: ${l.qty}`),
  "",
  "Giao chiều nay giúp em nhé, cảm ơn shop ạ!",
].join("\n");

const ZALO_PHONE = "0900000000"; // sample — replace with a real shop when testing

export default function ShareSpike() {
  const [supported, setSupported] = useState<null | boolean>(null);
  const [log, setLog] = useState<string[]>([]);
  const add = (m: string) =>
    setLog((xs) => [`${new Date().toLocaleTimeString("vi-VN")} · ${m}`, ...xs]);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const tryShare = async () => {
    if (!navigator.share) {
      add("❌ navigator.share KHÔNG hỗ trợ trên thiết bị này");
      return;
    }
    try {
      const canText = !navigator.canShare || navigator.canShare({ text: SAMPLE_ORDER });
      add(`canShare({text}) = ${canText}`);
      await navigator.share({ text: SAMPLE_ORDER });
      add("✅ share() resolved — bạn có thấy Zalo trong sheet không? Text tới nguyên vẹn không?");
    } catch (e) {
      add(`share() bị huỷ/lỗi: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const tryFallback = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_ORDER);
      add("📋 đã copy đơn vào clipboard");
    } catch {
      add("❌ clipboard.writeText thất bại");
    }
    window.open(`https://zalo.me/${ZALO_PHONE}`, "_blank");
    add(`↗ mở zalo.me/${ZALO_PHONE} — thử dán đơn vào khung chat`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-7">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink/70">
          Spike · P2-0
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-tight text-ink">
          Web Share → Zalo
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Mở trang này trên điện thoại có Zalo. Bấm nút, chọn Zalo, kiểm tra text đơn có tới
          nguyên vẹn không.
        </p>
      </header>

      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[13px] text-muted">navigator.share</span>
        <span
          className={`text-[13px] font-semibold ${
            supported === null ? "text-tertiary" : supported ? "text-accent" : "text-danger"
          }`}
        >
          {supported === null ? "đang kiểm tra…" : supported ? "Có hỗ trợ" : "Không hỗ trợ"}
        </span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-hairline bg-surface/50 px-4 py-2.5">
          <span className="text-[12px] font-medium text-muted">Đơn mẫu gửi shop</span>
        </div>
        <div className="space-y-2.5 px-4 py-4">
          <p className="text-[14px] text-ink">Chào shop, Quỳnh đặt giúp:</p>
          <ul className="space-y-1.5">
            {ORDER_LINES.map((l) => (
              <li key={l.name} className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="text-ink">{l.name}</span>
                <span className="font-medium tabular-nums text-brand-ink">{l.qty}</span>
              </li>
            ))}
          </ul>
          <p className="pt-1 text-[13px] italic leading-relaxed text-muted">
            Giao chiều nay giúp em nhé, cảm ơn shop ạ!
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={tryShare}
          className="cta-primary rounded-full py-3.5 text-[15px] font-medium text-white"
        >
          ① Thử navigator.share
        </button>
        <button
          onClick={tryFallback}
          className="rounded-full border border-hairline bg-raised py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-surface"
        >
          ② Fallback: copy + mở zalo.me
        </button>
      </div>

      <section className="mt-1">
        <p className="mb-2 text-[12px] font-medium text-muted">
          Nhật ký <span className="text-tertiary">(chụp màn này gửi lại)</span>
        </p>
        <ul className="space-y-1.5 text-[12px] text-ink">
          {log.length === 0 && <li className="text-tertiary">— chưa có —</li>}
          {log.map((l, i) => (
            <li key={i} className="rounded-lg border border-hairline bg-surface/40 px-3 py-2">
              {l}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
