"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CaptureCandidate,
  CaptureKind,
  CaptureProposal,
} from "@/domain/capture/proposal";
import { matchCandidateToShopping } from "@/domain/capture/proposal";
import type { ShoppingItem } from "@/domain/shopping";
import { useStore } from "@/ui/store";
import { BottomSheet } from "./BottomSheet";
import { ReceiveShoppingItemSheet } from "./ReceiveShoppingItemSheet";
import { fmt } from "@/ui/format";

type ReviewDraft = {
  item: ShoppingItem;
  candidate: CaptureCandidate;
  kind: CaptureKind;
  compatibleQuantity?: number;
};

type SpeechResultEvent = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const SOURCE_LABEL: Record<CaptureKind, string> = {
  receipt: "Hóa đơn",
  label: "Nhãn hàng",
  voice: "Giọng nói",
};

const shoppingKey = (item: ShoppingItem) => `${item.commodityId}|${item.vendor}`;

export function CaptureHub() {
  const {
    shopping,
    commodity,
    plan,
    receiveShoppingItem,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [captureSession, setCaptureSession] = useState(0);
  const [review, setReview] = useState<ReviewDraft | null>(null);

  useEffect(() => {
    const show = () => {
      setReview(null);
      setCaptureSession((current) => current + 1);
      setOpen(true);
    };
    window.addEventListener("open-capture", show);
    return () => window.removeEventListener("open-capture", show);
  }, []);

  const name = useCallback(
    (commodityId: string) => commodity(commodityId)?.canonicalVn ?? commodityId,
    [commodity],
  );

  return (
    <>
      <CaptureSheet
        key={captureSession}
        open={open}
        shopping={shopping}
        commodityName={name}
        onClose={() => setOpen(false)}
        onReview={(item, candidate, kind) => {
          const unitsMatch = !candidate.unit
            || candidate.unit.toLocaleLowerCase("vi") === item.unit.toLocaleLowerCase("vi");
          setOpen(false);
          setReview({
            item,
            candidate,
            kind,
            compatibleQuantity: unitsMatch ? candidate.quantity : undefined,
          });
        }}
      />
      {review && (
        <ReceiveShoppingItemSheet
          item={review.item}
          weekRef={plan.weekStart}
          commodity={commodity(review.item.commodityId)}
          initialDraft={{
            actualQty: review.compatibleQuantity,
            pricePaid: review.candidate.pricePaid,
            bestBefore: review.candidate.printedDate,
          }}
          captureSource={{
            kind: review.kind,
            rawName: review.candidate.rawName,
            capturedUnit: review.candidate.unit,
          }}
          onClose={() => setReview(null)}
          onReceive={receiveShoppingItem}
        />
      )}
    </>
  );
}

function CaptureSheet({
  open,
  shopping,
  commodityName,
  onClose,
  onReview,
}: {
  open: boolean;
  shopping: ShoppingItem[];
  commodityName: (commodityId: string) => string;
  onClose: () => void;
  onReview: (item: ShoppingItem, candidate: CaptureCandidate, kind: CaptureKind) => void;
}) {
  const [kind, setKind] = useState<CaptureKind>("receipt");
  const [image, setImage] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [proposal, setProposal] = useState<CaptureProposal | null>(null);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    if (!open) {
      recognition.current?.stop();
    }
  }, [open]);

  const resetSource = (next: CaptureKind) => {
    recognition.current?.stop();
    setKind(next);
    setImage(null);
    setTranscript("");
    setProposal(null);
    setMapping({});
    setError("");
    setListening(false);
  };

  const startListening = () => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) return;
    const next = new Constructor();
    next.lang = "vi-VN";
    next.interimResults = false;
    next.continuous = false;
    next.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (heard) setTranscript((current) => `${current} ${heard}`.trim());
    };
    next.onerror = () => {
      setError("Chưa nghe rõ. Bạn có thể nhập lại nội dung bằng bàn phím.");
      setListening(false);
    };
    next.onend = () => setListening(false);
    recognition.current = next;
    setError("");
    setListening(true);
    next.start();
  };

  const extract = async () => {
    setLoading(true);
    setError("");
    setProposal(null);
    setMapping({});
    try {
      let response: Response;
      if (kind === "voice") {
        response = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, transcript: transcript.trim() }),
        });
      } else {
        const body = new FormData();
        body.set("kind", kind);
        body.set("image", image as File);
        response = await fetch("/api/capture", { method: "POST", body });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Chưa đọc được nguồn này.");
      const next = result.proposal as CaptureProposal;
      setProposal(next);
      const defaults: Record<number, string> = {};
      next.candidates.forEach((candidate, index) => {
        const matched = matchCandidateToShopping(candidate.rawName, shopping, commodityName);
        if (matched) defaults[index] = shoppingKey(matched);
      });
      setMapping(defaults);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chưa đọc được nguồn này.");
    } finally {
      setLoading(false);
    }
  };

  const updateCandidate = (index: number, patch: Partial<CaptureCandidate>) => {
    setProposal((current) => current
      ? {
          ...current,
          candidates: current.candidates.map((candidate, candidateIndex) =>
            candidateIndex === index ? { ...candidate, ...patch } : candidate),
        }
      : current);
  };

  const canExtract = kind === "voice" ? transcript.trim().length >= 2 : Boolean(image);

  return (
    <BottomSheet open={open} onClose={onClose} title="Ghi nhanh cho bà quản gia">
      <div className="space-y-4" data-testid="capture-sheet">
        <p className="text-xs leading-relaxed text-muted">
          Ảnh và lời nói chỉ tạo bản nháp. Không có gì được ghi vào danh sách chợ hay kho trước khi bạn xem diff và xác nhận.
        </p>

        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Nguồn ghi nhanh">
          {(["receipt", "label", "voice"] as CaptureKind[]).map((source) => (
            <button
              key={source}
              type="button"
              role="tab"
              aria-selected={kind === source}
              onClick={() => resetSource(source)}
              className={`min-h-10 rounded-full border px-2 text-xs font-medium ${
                kind === source
                  ? "border-brand bg-brand-weak text-brand-ink"
                  : "border-hairline text-muted"
              }`}
            >
              {source === "receipt" ? "🧾 " : source === "label" ? "🏷️ " : "🎙️ "}
              {SOURCE_LABEL[source]}
            </button>
          ))}
        </div>

        {kind === "voice" ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="capture-transcript">
              Nội dung đã nói
            </label>
            <textarea
              id="capture-transcript"
              value={transcript}
              maxLength={2_000}
              rows={3}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Ví dụ: mua bí xanh 310 g hết 18 nghìn"
              className="w-full resize-none rounded-[14px] border border-hairline bg-surface/45 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            {speechSupported ? (
              <button
                type="button"
                onClick={listening ? () => recognition.current?.stop() : startListening}
                className="min-h-10 w-full rounded-full border border-hairline text-sm font-medium text-brand"
              >
                {listening ? "Dừng nghe" : "🎙️ Bắt đầu nói"}
              </button>
            ) : (
              <p className="text-[11px] text-muted">
                Trình duyệt này chưa hỗ trợ nhận giọng nói; bạn vẫn có thể nhập nội dung.
              </p>
            )}
          </div>
        ) : (
          <label className="block rounded-[16px] border border-dashed border-brand/35 bg-brand-weak/25 p-4 text-center">
            <span className="block text-sm font-semibold text-brand-ink">
              {kind === "receipt" ? "Chụp hoặc chọn ảnh hóa đơn" : "Chụp hoặc chọn ảnh nhãn"}
            </span>
            <span className="mt-1 block text-[11px] text-muted">JPEG, PNG, WebP · tối đa 5 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => {
                setImage(event.target.files?.[0] ?? null);
                setProposal(null);
                setError("");
              }}
              className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
            {image && <span className="mt-2 block truncate text-xs text-accent">{image.name}</span>}
          </label>
        )}

        <button
          type="button"
          disabled={!canExtract || loading}
          onClick={extract}
          className="cta-primary min-h-11 w-full rounded-full px-4 text-sm font-semibold text-white disabled:opacity-45"
        >
          {loading ? "Đang đọc bản nháp…" : kind === "voice" ? "Tạo bản nháp từ lời nói" : "Đọc ảnh thành bản nháp"}
        </button>

        {error && (
          <p role="alert" className="rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {proposal && (
          <section aria-label="Bản nháp cần xác nhận" className="space-y-3">
            <div className="rounded-[14px] border border-amber/30 bg-amber/8 px-3 py-2.5">
              <p className="text-xs font-semibold text-amber">Bản nháp · chưa áp dụng</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Mỗi trường đều cần bạn kiểm tra. Trường trống là trường ứng dụng không đọc chắc chắn.
              </p>
            </div>

            {proposal.candidates.length === 0 && (
              <p className="rounded-[14px] border border-hairline p-3 text-sm text-muted">
                Không đọc được dòng hàng rõ ràng. Dữ liệu thật không thay đổi.
              </p>
            )}

            {proposal.candidates.map((candidate, index) => {
              const selected = shopping.find((item) => shoppingKey(item) === mapping[index]);
              return (
                <article key={`${candidate.rawName}-${index}`} className="rounded-[16px] border border-hairline p-3">
                  <label className="block text-xs font-medium text-muted">
                    Chữ đọc được
                    <input
                      value={candidate.rawName}
                      maxLength={160}
                      onChange={(event) => updateCandidate(index, { rawName: event.target.value })}
                      className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    />
                  </label>

                  <label className="mt-2 block text-xs font-medium text-muted">
                    Ghép với dòng chợ
                    <select
                      aria-label={`Ghép dòng ${index + 1} với danh sách chợ`}
                      value={mapping[index] ?? ""}
                      onChange={(event) => setMapping((current) => ({ ...current, [index]: event.target.value }))}
                      className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    >
                      <option value="">Chưa ghép – không thể áp dụng</option>
                      {shopping.map((item) => (
                        <option key={shoppingKey(item)} value={shoppingKey(item)}>
                          {commodityName(item.commodityId)} · {item.vendor}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <label className="text-[11px] text-muted">
                      Lượng
                      <input
                        type="number"
                        min="0.01"
                        value={candidate.quantity ?? ""}
                        onChange={(event) => updateCandidate(index, {
                          quantity: event.target.value ? Number(event.target.value) : undefined,
                        })}
                        className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-2 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="text-[11px] text-muted">
                      Đơn vị
                      <input
                        value={candidate.unit ?? ""}
                        maxLength={20}
                        onChange={(event) => updateCandidate(index, { unit: event.target.value || undefined })}
                        className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-2 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="text-[11px] text-muted">
                      Giá (₫)
                      <input
                        type="number"
                        min="1"
                        value={candidate.pricePaid ?? ""}
                        onChange={(event) => updateCandidate(index, {
                          pricePaid: event.target.value ? Number(event.target.value) : undefined,
                        })}
                        className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-2 py-2 text-sm text-ink"
                      />
                    </label>
                  </div>

                  {kind === "label" && (
                    <label className="mt-2 block text-[11px] text-muted">
                      Ngày đọc trên nhãn
                      <input
                        type="date"
                        value={candidate.printedDate ?? ""}
                        onChange={(event) => updateCandidate(index, { printedDate: event.target.value || undefined })}
                        className="mt-1 w-full rounded-[10px] border border-hairline bg-surface/45 px-3 py-2 text-sm text-ink"
                      />
                    </label>
                  )}

                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                    <span className="rounded-lg bg-surface/65 px-2 py-2 text-muted">
                      {selected ? `${fmt(selected.qtyTotal)} ${selected.unit}` : "Chưa có đích"}
                    </span>
                    <span aria-hidden className="text-brand">→</span>
                    <span className="rounded-lg bg-brand-weak/50 px-2 py-2 font-medium text-brand-ink">
                      {candidate.quantity ? `${fmt(candidate.quantity)} ${candidate.unit ?? "?"}` : "Chưa đọc lượng"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!selected || !candidate.rawName.trim()}
                    onClick={() => selected && onReview(selected, candidate, kind)}
                    className="mt-3 min-h-10 w-full rounded-full border border-brand bg-brand-weak px-3 text-sm font-semibold text-brand-ink disabled:border-hairline disabled:bg-transparent disabled:text-muted disabled:opacity-50"
                  >
                    Kiểm tra &amp; xác nhận →
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </BottomSheet>
  );
}
