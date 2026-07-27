"use client";

import { useEffect, useState } from "react";

// TIP-P2-0 SPIKE — verify on a REAL phone (with Zalo) that navigator.share opens a
// sheet with Zalo as a target AND the order text arrives intact. This is a probe,
// not a claim: the verdict comes from the device test, screenshotted. Public route.

const SAMPLE_ORDER = `Chào shop, Quỳnh đặt giúp:
- Ghẹ: 800g
- Rau muống: 300g
- Cà chua: 200g
- Đậu hũ: 2 bìa

Giao chiều nay giúp em nhé, cảm ơn shop ạ!`;

const ZALO_PHONE = "0900000000"; // sample — replace with a real shop when testing

export default function ShareSpike() {
  const [supported, setSupported] = useState<null | boolean>(null);
  const [log, setLog] = useState<string[]>([]);
  const add = (m: string) => setLog((xs) => [`${new Date().toLocaleTimeString()} · ${m}`, ...xs]);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const tryShare = async () => {
    if (!navigator.share) { add("❌ navigator.share KHÔNG hỗ trợ trên thiết bị này"); return; }
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
    } catch { add("❌ clipboard.writeText thất bại"); }
    window.open(`https://zalo.me/${ZALO_PHONE}`, "_blank");
    add(`↗ mở zalo.me/${ZALO_PHONE} — thử dán đơn vào khung chat`);
  };

  return (
    <main className="mx-auto max-w-md p-5">
      <h1 className="text-lg font-semibold">Spike · Web Share → Zalo</h1>
      <p className="mt-1 text-sm text-muted">
        Mở trang này trên điện thoại có Zalo. Bấm nút, chọn Zalo, kiểm tra text đơn có tới nguyên vẹn.
      </p>

      <div className="mt-3 rounded-[12px] border border-hairline bg-surface/40 p-3 text-sm">
        navigator.share: <b className={supported ? "text-accent" : "text-danger"}>{supported === null ? "…" : supported ? "CÓ hỗ trợ" : "KHÔNG hỗ trợ"}</b>
      </div>

      <pre className="mt-3 whitespace-pre-wrap rounded-[12px] border border-hairline bg-surface/40 p-3 text-[13px]">{SAMPLE_ORDER}</pre>

      <div className="mt-3 flex flex-col gap-2">
        <button onClick={tryShare} className="cta-primary rounded-full py-3 text-sm font-medium text-white">
          ① Thử navigator.share(&#123;text&#125;)
        </button>
        <button onClick={tryFallback} className="rounded-full border border-hairline py-3 text-sm">
          ② Fallback: copy + mở zalo.me
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-muted">Nhật ký (chụp màn này gửi lại):</p>
        <ul className="space-y-1 text-[12px] text-ink">
          {log.length === 0 && <li className="text-tertiary">— chưa có —</li>}
          {log.map((l, i) => <li key={i} className="rounded bg-surface/40 px-2 py-1">{l}</li>)}
        </ul>
      </div>
    </main>
  );
}
